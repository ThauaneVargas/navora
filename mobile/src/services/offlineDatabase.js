import * as SQLite from 'expo-sqlite';

// Banco local (SQLite) para quando o celular fica sem Wi-Fi/dados.
//
// Toda vez que a API responde, o app guarda aqui o mapa do hospital (áreas,
// entradas, destinos) e as rotas calculadas. Sem internet, o api.js lê daqui
// em vez de cair direto nos dados fixos de data/routes.js — que continuam
// como última opção (fallback do navigationAdapter.js, não remover).
//
// Só guarda dado do HOSPITAL, nunca dado pessoal (nome, e-mail, SOS...).
// Por isso o "Sair" não precisa apagar. Histórico e favoritos continuam no
// SecureStore (routeHistoryStorage.js / favoritesStorage.js).
//
// Funciona no Expo Go (expo-sqlite vem embutido). Na web usa o
// offlineDatabase.web.js (sem banco).

const DB_NAME = 'navora-offline.db';
const SCHEMA_VERSION = 1;
const MAX_ROUTES_PER_HOSPITAL = 50;

let dbPromise = null;
const listeners = new Set();

async function migrate(db) {
  const row = await db.getFirstAsync('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sync_info (
      hospital TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (hospital, key)
    );
    CREATE TABLE IF NOT EXISTS areas (
      hospital TEXT NOT NULL,
      code TEXT NOT NULL,
      position INTEGER NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (hospital, code)
    );
    CREATE TABLE IF NOT EXISTS entrances (
      hospital TEXT NOT NULL,
      position INTEGER NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (hospital, position)
    );
    CREATE TABLE IF NOT EXISTS destinations (
      hospital TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT,
      category TEXT,
      area_code TEXT,
      position INTEGER NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (hospital, code)
    );
    CREATE TABLE IF NOT EXISTS route_cache (
      hospital TEXT NOT NULL,
      route_key TEXT NOT NULL,
      destination_code TEXT,
      data TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      PRIMARY KEY (hospital, route_key)
    );
    PRAGMA user_version = ${SCHEMA_VERSION};
  `);
}

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME)
      .then(async (db) => {
        await migrate(db);
        return db;
      })
      .catch((error) => {
        dbPromise = null; // tenta abrir de novo na próxima chamada
        throw error;
      });
  }
  return dbPromise;
}

const itemCode = (item, index) => String(item?.code || item?.id || `item-${index}`);
const areaCodeOf = (destination) =>
  destination?.area?.code || (typeof destination?.area === 'string' ? destination.area : null) || destination?.areaCode || null;

const notify = (hospital) => listeners.forEach((listener) => listener(hospital));

// Mesma rota = mesmo hospital, perfil, origem, destino, acessibilidade e
// pedido de visita. Origem diferente dá passos diferentes, então não reaproveita.
export function routeCacheKey(payload = {}) {
  return JSON.stringify({
    s: payload.subject || null,
    o: payload.origin_node_code || null,
    d: payload.destination_code || null,
    a: payload.accessibility || null,
    v: payload.visitor_access_request_id || null,
  });
}

// bootstrap: resposta CRUA de GET /navigation/bootstrap (antes de normalizar).
export async function saveNavigationSnapshot(hospital, bootstrap = {}) {
  const areas = Array.isArray(bootstrap.areas) ? bootstrap.areas : [];
  const destinations = Array.isArray(bootstrap.destinations) ? bootstrap.destinations : [];
  const entrances = Array.isArray(bootstrap.entrances) ? bootstrap.entrances : [];
  // Resposta vazia não apaga um mapa bom que já estava salvo.
  if (!areas.length && !destinations.length) return false;

  try {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('DELETE FROM areas WHERE hospital = ?', hospital);
      await txn.runAsync('DELETE FROM entrances WHERE hospital = ?', hospital);
      await txn.runAsync('DELETE FROM destinations WHERE hospital = ?', hospital);

      for (const [index, area] of areas.entries()) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO areas (hospital, code, position, data) VALUES (?, ?, ?, ?)',
          hospital, itemCode(area, index), index, JSON.stringify(area)
        );
      }
      for (const [index, entrance] of entrances.entries()) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO entrances (hospital, position, data) VALUES (?, ?, ?)',
          hospital, index, JSON.stringify(entrance)
        );
      }
      for (const [index, destination] of destinations.entries()) {
        await txn.runAsync(
          `INSERT OR REPLACE INTO destinations
             (hospital, code, name, category, area_code, position, data)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          hospital,
          itemCode(destination, index),
          destination?.name || null,
          destination?.category || null,
          areaCodeOf(destination),
          index,
          JSON.stringify(destination)
        );
      }
      await txn.runAsync(
        'INSERT OR REPLACE INTO sync_info (hospital, key, value) VALUES (?, ?, ?)',
        hospital, 'navigation_synced_at', new Date().toISOString()
      );
    });
    notify(hospital);
    return true;
  } catch (error) {
    console.warn('[offlineDatabase] não salvou o mapa:', error?.message);
    return false;
  }
}

// Devolve { areas, destinations, entrances, syncedAt } no formato cru da API,
// ou null se este hospital nunca foi baixado.
export async function loadNavigationSnapshot(hospital) {
  try {
    const db = await getDb();
    const parse = (rows) => rows.map((row) => JSON.parse(row.data));
    const [areas, entrances, destinations, synced] = await Promise.all([
      db.getAllAsync('SELECT data FROM areas WHERE hospital = ? ORDER BY position', hospital),
      db.getAllAsync('SELECT data FROM entrances WHERE hospital = ? ORDER BY position', hospital),
      db.getAllAsync('SELECT data FROM destinations WHERE hospital = ? ORDER BY position', hospital),
      db.getFirstAsync(
        "SELECT value FROM sync_info WHERE hospital = ? AND key = 'navigation_synced_at'",
        hospital
      ),
    ]);
    if (!areas.length && !destinations.length) return null;
    return {
      areas: parse(areas),
      entrances: parse(entrances),
      destinations: parse(destinations),
      syncedAt: synced?.value || null,
    };
  } catch (error) {
    console.warn('[offlineDatabase] não leu o mapa:', error?.message);
    return null;
  }
}

// preview: resposta CRUA de POST /navigation/route-preview. Só guarda rota
// liberada e encontrada — bloqueio/rota inexistente sempre vem do servidor.
export async function saveRoutePreview(hospital, payload, preview) {
  if (!preview || preview.route_found === false || (preview.decision && preview.decision !== 'ALLOW')) {
    return false;
  }
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO route_cache (hospital, route_key, destination_code, data, saved_at)
       VALUES (?, ?, ?, ?, ?)`,
      hospital,
      routeCacheKey(payload),
      payload?.destination_code || null,
      JSON.stringify(preview),
      new Date().toISOString()
    );
    // Guarda só as mais recentes.
    await db.runAsync(
      `DELETE FROM route_cache WHERE hospital = ? AND route_key NOT IN (
         SELECT route_key FROM route_cache WHERE hospital = ? ORDER BY saved_at DESC LIMIT ?
       )`,
      hospital, hospital, MAX_ROUTES_PER_HOSPITAL
    );
    notify(hospital);
    return true;
  } catch (error) {
    console.warn('[offlineDatabase] não salvou a rota:', error?.message);
    return false;
  }
}

export async function loadRoutePreview(hospital, payload) {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      'SELECT data, saved_at FROM route_cache WHERE hospital = ? AND route_key = ?',
      hospital, routeCacheKey(payload)
    );
    return row ? { preview: JSON.parse(row.data), savedAt: row.saved_at } : null;
  } catch (error) {
    console.warn('[offlineDatabase] não leu a rota:', error?.message);
    return null;
  }
}

// Resumo para a tela de Configurações: o que já está salvo no celular.
export async function getOfflineDatabaseInfo(hospital) {
  try {
    const db = await getDb();
    const count = async (table) =>
      (await db.getFirstAsync(`SELECT COUNT(*) AS total FROM ${table} WHERE hospital = ?`, hospital))?.total ?? 0;
    const [areas, destinations, routes, synced] = await Promise.all([
      count('areas'),
      count('destinations'),
      count('route_cache'),
      db.getFirstAsync(
        "SELECT value FROM sync_info WHERE hospital = ? AND key = 'navigation_synced_at'",
        hospital
      ),
    ]);
    return { available: true, areas, destinations, routes, syncedAt: synced?.value || null };
  } catch {
    return { available: false, areas: 0, destinations: 0, routes: 0, syncedAt: null };
  }
}

export function subscribeOfflineDatabase(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
