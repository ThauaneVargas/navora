import React from 'react';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const tabs = [
  { key: 'Home', screen: 'Home', label: 'Inicio', icon: 'home' },
  { key: 'Navigate', screen: 'Search', label: 'Navegar', icon: 'map-search-outline' },
  { key: 'Assistant', screen: 'Assistant', label: 'Navora IA', icon: 'message-processing-outline' },
  { key: 'Help', screen: 'Help', label: 'Ajuda', icon: 'hand-heart-outline' },
  { key: 'Profile', screen: 'Profile', label: 'Perfil', icon: 'account' },
];

export default function BottomTabs({ active = 'Home', navigate, dark = false }) {
  const insets = useSafeAreaInsets();
  const { isDark, appColors } = useApp();
  const themedDark = dark || isDark;
  const bottomPadding = Math.max(insets.bottom, 14);
  const tabHeight = 62 + bottomPadding;

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPadding, height: tabHeight, backgroundColor: appColors.surface, borderTopColor: appColors.border }, themedDark && styles.darkWrap, shadows.card]}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <Pressable
            key={tab.key}
            onPress={() => navigate(tab.screen)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${tab.label}`}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, isActive && { backgroundColor: appColors.primarySoft }]}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isActive ? appColors.primary : themedDark ? '#A9ABB8' : colors.lightText}
              />
            </View>

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

            {isActive ? <View style={[styles.activeDot, { backgroundColor: appColors.primary }]} /> : null}
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
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE2E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 7,
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
    height: 52,
    flex: 1,
    minWidth: 0,
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
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  activeText: {
    color: colors.primary,
  },

  darkMuted: {
    color: '#A9ABB8',
  },

  iconWrap: {
    width: 34,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeDot: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
