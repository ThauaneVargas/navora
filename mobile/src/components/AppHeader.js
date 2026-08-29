import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const logo = require('../../assets/images/navora_symbol.png');

export default function AppHeader({ navigate }) {
  const insets = useSafeAreaInsets();
  const { appColors, isDark } = useApp();
  const topPadding = insets.top;
  const headerBaseHeight = 58;

  return (
    <View style={[styles.header, { paddingTop: topPadding, height: headerBaseHeight + topPadding, backgroundColor: appColors.bg, borderBottomColor: appColors.border }]}>
      <Pressable
        onPress={() => navigate('Menu')}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: appColors.surface, borderColor: appColors.border },
          pressed && styles.pressed,
        ]}
      >
            <MaterialCommunityIcons name="menu" size={24} color={appColors.text} />
      </Pressable>

      <View style={styles.brand}>
        <View style={[styles.logoPill, isDark && styles.logoPillDark]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={[styles.brandName, { color: appColors.text }]}>Navora</Text>
      </View>

      <Pressable
        onPress={() => navigate('Notifications')}
        accessibilityRole="button"
        accessibilityLabel="Abrir notificacoes"
        style={({ pressed }) => [
          styles.iconButton,
          { backgroundColor: appColors.surface, borderColor: appColors.border },
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="bell-outline" size={24} color={appColors.text} />
        <View style={[styles.badge, { backgroundColor: appColors.primary }]}>
          <Text style={styles.badgeText}>2</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 120,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1E4E6',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.card,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logoPill: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPillDark: {
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 24,
    height: 24,
  },
  brandName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
