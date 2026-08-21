const TOKEN_KEY = 'navora.admin.access_token';

export function saveAdminToken(token) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function getAdminToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function removeAdminToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}
