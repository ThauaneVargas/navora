const TOKEN_KEY = 'navora.admin.access_token';
const USER_KEY = 'navora.admin.user';

export function saveAdminToken(token) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function getAdminToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function removeAdminToken() {
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export function saveAdminUser(user) {
  const safeUser = {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    role: user?.role,
    active: user?.active,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };

  window.sessionStorage.setItem(USER_KEY, JSON.stringify(safeUser));
}

export function getAdminUser() {
  try {
    const stored = window.sessionStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    window.sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function removeAdminUser() {
  window.sessionStorage.removeItem(USER_KEY);
}

export function storeAdminSession({ accessToken, user }) {
  saveAdminToken(accessToken);
  saveAdminUser(user);
}

export function clearAdminSession() {
  removeAdminToken();
  removeAdminUser();
}
