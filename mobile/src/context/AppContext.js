import React, { createContext, useContext, useMemo, useState } from 'react';
import { getColors } from '../theme/colors';

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
  beacon: 'MBM04-01',
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

export function AppProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');
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
    [themeMode, isDark, userProfile, currentLocation, userPreferences, activeRoute]
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
