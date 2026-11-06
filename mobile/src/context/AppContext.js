import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getColors } from '../theme/colors';
import { DEFAULT_LANGUAGE, isSupportedLanguage, translate } from '../i18n';

// Preferências do aparelho (idioma e modo noturno): guardadas no celular pra
// não voltarem ao padrão toda vez que o app abre.
const PREFS_KEY = 'navora.preferences';

async function loadPreferences() {
  try {
    if (!(await SecureStore.isAvailableAsync())) return null;
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Traducao fora dos componentes (ex.: avisos do App.js, que fica fora do
// AppProvider): usa o idioma salvo nas preferencias.
export async function translateWithSavedLanguage(key, params) {
  const saved = await loadPreferences();
  return translate(isSupportedLanguage(saved?.language) ? saved.language : DEFAULT_LANGUAGE, key, params);
}

async function savePreferences(preferences) {
  try {
    if (!(await SecureStore.isAvailableAsync())) return;
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(preferences));
  } catch {
    // Sem cofre (web): vale só nesta sessão.
  }
}

const AppContext = createContext(null);

const defaultUserProfile = {
  type: null,
  name: '',
  area: 'unknown',
  hasAccount: false,
  accessibility: {},
  currentLocation: '',
  currentBeacon: '',
  activeRoute: null,
};

const defaultCurrentLocation = {
  name: 'Recepcao Principal',
  floor: 'Piso Terreo',
  corridor: 'Corredor A',
  beacon: 'FSC-01',
  indoorStatus: 'Indoor pronto',
};

const defaultUserPreferences = {
  accessibleRoute: true,
  avoidStairs: true,
  preferElevator: true,
  voiceGuidance: true,
  largerText: false,
  highContrast: false,
  needsStretcher: false,
};

const defaultActiveRoute = {
  origin: 'Recepcao Principal',
  destination: 'Tomografia',
  requestedDestination: null,
  effectiveDestination: null,
  nodes: [],
  edges: [],
  steps: [],
  totalDistance: null,
  estimatedTime: null,
  distance: '120 m',
  time: '2 min',
  eta: '2 min',
  status: 'active',
  source: 'fallback',
};

// liveRoute: a rota REAL em andamento (estado do App.js), ou null. Diferente
// de activeRoute abaixo, que é um exemplo usado como reserva pelas telas de mapa.
export function AppProvider({ children, liveRoute = null }) {
  const [themeMode, setThemeMode] = useState('light');
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadPreferences().then((saved) => {
      if (!active) return;
      if (saved?.themeMode === 'dark' || saved?.themeMode === 'light') setThemeMode(saved.themeMode);
      if (isSupportedLanguage(saved?.language)) setLanguageState(saved.language);
      setPreferencesLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (preferencesLoaded) savePreferences({ themeMode, language });
  }, [preferencesLoaded, themeMode, language]);

  const setLanguage = useCallback((code) => {
    if (isSupportedLanguage(code)) setLanguageState(code);
  }, []);

  const t = useCallback((key, params) => translate(language, key, params), [language]);
  const [userProfile, setUserProfileState] = useState(defaultUserProfile);
  const [currentLocation, setCurrentLocation] = useState(defaultCurrentLocation);
  const [activeRoute, setActiveRoute] = useState(defaultActiveRoute);
  const isDark = themeMode === 'dark';
  const userPreferences = useMemo(
    () => ({
      ...defaultUserPreferences,
      ...(userProfile.accessibility || {}),
      accessibleRoute: Boolean(userProfile.accessibility?.wheelchair || userProfile.accessibility?.avoidStairs || defaultUserPreferences.accessibleRoute),
    }),
    [userProfile.accessibility]
  );

  const setUserProfile = (data) => {
    setUserProfileState((current) => ({ ...current, ...data }));
  };

  const setArea = (area) => setUserProfile({ area });
  const setProfileType = (type) => setUserProfile({ type });
  const toggleAccessibility = (key) => {
    setUserProfileState((current) => ({
      ...current,
      accessibility: {
        ...(current.accessibility || {}),
        [key]: !current.accessibility?.[key],
      },
    }));
  };
  const startRoute = (destination) => {
    const nextRoute = {
      origin: currentLocation.name,
      destination: destination?.name || destination || 'Recepcao',
      distance: destination?.distance || '120 m',
      time: destination?.time || '2 min',
      eta: destination?.time || '2 min',
      status: 'active',
      area: destination?.area || userProfile.area,
    };
    setActiveRoute(nextRoute);
    setUserProfileState((current) => ({ ...current, activeRoute: nextRoute }));
    return nextRoute;
  };
  const resetSession = () => {
    setUserProfileState(defaultUserProfile);
    setCurrentLocation(defaultCurrentLocation);
    setActiveRoute(defaultActiveRoute);
  };

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      appColors: getColors(isDark),
      toggleTheme: () => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark')),
      language,
      setLanguage,
      t,
      liveRoute,
      userProfile,
      setArea,
      setProfileType,
      setUserProfile,
      toggleAccessibility,
      startRoute,
      resetSession,
      currentLocation,
      setCurrentLocation,
      userPreferences,
      activeRoute,
    }),
    [themeMode, isDark, language, setLanguage, t, liveRoute, userProfile, currentLocation, userPreferences, activeRoute]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    return {
      themeMode: 'light',
      isDark: false,
      appColors: getColors(false),
      toggleTheme: () => {},
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
      liveRoute: null,
      userProfile: defaultUserProfile,
      setArea: () => {},
      setProfileType: () => {},
      setUserProfile: () => {},
      toggleAccessibility: () => {},
      startRoute: () => {},
      resetSession: () => {},
      currentLocation: defaultCurrentLocation,
      setCurrentLocation: () => {},
      userPreferences: defaultUserPreferences,
      activeRoute: defaultActiveRoute,
    };
  }
  return value;
}
