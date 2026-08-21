import React from 'react';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const tabs = [
  { key: 'Home', label: 'Inicio', icon: 'home' },
  { key: 'Navigation', label: 'Mapa', icon: 'map-outline' },
  { key: 'RouteHistory', label: 'Historico', icon: 'history' },
  { key: 'Profile', label: 'Perfil', icon: 'account' },
];

export default function BottomTabs({ active = 'Home', navigate, dark = false }) {
  const insets = useSafeAreaInsets();
  const { isDark, appColors } = useApp();
  const themedDark = dark || isDark;
  const bottomPadding = Math.max(insets.bottom, 14);
  const tabHeight = 60 + bottomPadding;

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPadding, height: tabHeight, backgroundColor: appColors.surface, borderTopColor: appColors.border }, themedDark && styles.darkWrap, shadows.card]}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => navigate(tab.key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={23}
              color={isActive ? appColors.primary : themedDark ? '#A9ABB8' : colors.lightText}
            />

            <Text
              style={[
                styles.label,
                isActive && styles.activeText,
                themedDark && !isActive && styles.darkMuted,
                { color: isActive ? appColors.primary : appColors.muted },
              ]}
            >
              {tab.label}
            </Text>

            {isActive ? <View style={[styles.activeLine, { backgroundColor: appColors.primary }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE2E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 6,
    zIndex: 100,
    ...Platform.select({
      android: { elevation: 14 },
      default: {},
    }),
  },

  darkWrap: {
    backgroundColor: 'rgba(28,30,39,0.96)',
    borderColor: 'rgba(255,255,255,0.1)',
  },

  tab: {
    height: 50,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  activeText: {
    color: colors.primary,
  },

  darkMuted: {
    color: '#A9ABB8',
  },

  activeLine: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 34,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
