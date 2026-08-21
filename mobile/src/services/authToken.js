import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'navora.patient.access_token';
let memoryToken = null;

const canUseWebStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

async function secureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    return false;
  }
}

export async function saveAuthToken(token) {
  memoryToken = token || null;
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }
  if (canUseWebStorage()) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getAuthToken() {
  if (await secureStoreAvailable()) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    memoryToken = token || null;
    return token;
  }
  if (canUseWebStorage()) {
    const token = window.localStorage.getItem(TOKEN_KEY);
    memoryToken = token || null;
    return token;
  }
  return memoryToken;
}

export async function removeAuthToken() {
  memoryToken = null;
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
  if (canUseWebStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}
