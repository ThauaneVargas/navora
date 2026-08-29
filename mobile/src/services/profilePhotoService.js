import * as SecureStore from 'expo-secure-store';

const PHOTO_KEY = 'navora.patient.profile_photo_uri';
let memoryPhotoUri = null;

const canUseWebStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

async function secureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    return false;
  }
}

export async function saveProfilePhotoUri(uri) {
  memoryPhotoUri = uri || null;
  if (await secureStoreAvailable()) {
    if (uri) await SecureStore.setItemAsync(PHOTO_KEY, uri);
    else await SecureStore.deleteItemAsync(PHOTO_KEY);
    return;
  }
  if (canUseWebStorage()) {
    if (uri) window.localStorage.setItem(PHOTO_KEY, uri);
    else window.localStorage.removeItem(PHOTO_KEY);
  }
}

export async function getProfilePhotoUri() {
  if (await secureStoreAvailable()) {
    const uri = await SecureStore.getItemAsync(PHOTO_KEY);
    memoryPhotoUri = uri || null;
    return uri;
  }
  if (canUseWebStorage()) {
    const uri = window.localStorage.getItem(PHOTO_KEY);
    memoryPhotoUri = uri || null;
    return uri;
  }
  return memoryPhotoUri;
}

export async function removeProfilePhotoUri() {
  await saveProfilePhotoUri(null);
}
