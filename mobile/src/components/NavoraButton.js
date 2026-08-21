import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '../theme/colors';

export default function NavoraButton({ title, onPress, variant = 'primary', style, icon }) {
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        !isGhost && shadows.soft,
        pressed && styles.pressed,
        style
      ]}
    >
      <Text style={[styles.text, isSecondary && styles.secondaryText, isGhost && styles.ghostText]}>
        {icon ? `${icon}  ` : ''}{title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.4,
    borderColor: colors.borderStrong,
    shadowOpacity: 0.04
  },
  ghost: {
    backgroundColor: 'transparent',
    minHeight: 44
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }]
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900'
  },
  secondaryText: {
    color: colors.primary
  },
  ghostText: {
    color: colors.primary,
    fontSize: 15
  }
});
