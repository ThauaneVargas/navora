import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

// Destinos favoritos: só neste celular (SecureStore), como o histórico de
// rotas — o destino pode revelar algo de saúde, por isso o "Sair" apaga.
// Guarda só a chave de cada destino (id/código/nome).

const KEY = 'navora.favorites';
const MAX_ITEMS = 30;

let memory = [];
let loaded = false;
const listeners = new Set();

export const favoriteKey = (destination) =>
  String(destination?.id || destination?.code || destination?.name || '');

async function available() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function loadFavorites() {
  if (loaded) return memory;
  try {
    if (await available()) {
      const raw = await SecureStore.getItemAsync(KEY);
      memory = raw ? JSON.parse(raw) : [];
    }
  } catch {
    // Valor corrompido: começa de novo em vez de quebrar a tela.
    memory = [];
  }
  loaded = true;
  return memory;
}

async function persist(items) {
  memory = items;
  loaded = true;
  listeners.forEach((listener) => listener(items));
  try {
    if (!(await available())) return;
    if (items.length) await SecureStore.setItemAsync(KEY, JSON.stringify(items));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Sem cofre: fica só na memória desta sessão.
  }
}

export async function toggleFavorite(destination) {
  const key = favoriteKey(destination);
  if (!key) return;
  const items = await loadFavorites();
  const next = items.includes(key)
    ? items.filter((item) => item !== key)
    : [key, ...items].slice(0, MAX_ITEMS);
  await persist(next);
}

export const clearFavorites = () => persist([]);

// Lista atual + funções prontas pra tela.
export function useFavorites() {
  const [items, setItems] = useState(memory);

  useEffect(() => {
    let active = true;
    loadFavorites().then((list) => active && setItems(list));
    listeners.add(setItems);
    return () => {
      active = false;
      listeners.delete(setItems);
    };
  }, []);

  const isFavorite = useCallback(
    (destination) => items.includes(favoriteKey(destination)),
    [items]
  );

  return { favorites: items, isFavorite, toggleFavorite };
}
