import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { BellIcon, MenuIcon } from './NavIcons';

// Botão do cabeçalho (☰, 🔔, voltar) — o mesmo em todas as telas:
// tile branco sobre o rosado do cabeçalho (bar) + ícone bordô. 42 px
// visíveis; o hitSlop leva a área de toque a 50 px (mínimo 44).
export default function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  badge = 0,
  disabled = false,
}) {
  const { appColors } = useApp();
  const badgeLabel = badge > 9 ? '9+' : String(badge);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: appColors.surface },
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon === 'menu' ? <MenuIcon color={appColors.primary} /> : null}
      {icon === 'bell' ? <BellIcon color={appColors.primary} /> : null}
      {icon === 'back' ? <MaterialCommunityIcons name="chevron-left" size={26} color={appColors.primary} /> : null}

      {badge > 0 ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: appColors.primaryStrong,
              // Borda na cor do cabeçalho: separa o número do botão.
              borderColor: appColors.bar,
            },
          ]}
        >
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
            {badgeLabel}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
