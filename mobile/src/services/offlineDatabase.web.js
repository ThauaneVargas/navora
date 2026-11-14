// Versão web (expo start --web): sem banco local. O app cai direto no
// fallback fixo do navigationAdapter.js, como antes. Mesma interface do
// offlineDatabase.js (nativo, SQLite).

export const routeCacheKey = (payload = {}) =>
  JSON.stringify({
    s: payload.subject || null,
    o: payload.origin_node_code || null,
    d: payload.destination_code || null,
    a: payload.accessibility || null,
    v: payload.visitor_access_request_id || null,
  });

export const saveNavigationSnapshot = async () => false;
export const loadNavigationSnapshot = async () => null;
export const saveRoutePreview = async () => false;
export const loadRoutePreview = async () => null;
export const getOfflineDatabaseInfo = async () => ({
  available: false,
  areas: 0,
  destinations: 0,
  routes: 0,
  syncedAt: null,
});
export const subscribeOfflineDatabase = () => () => {};
