import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { buttons, colors, shadows, states } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function NavoraButton({ title, onPress, variant = 'primary', style, icon }) {
  const { appColors } = useApp();
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const color = isGhost || isSecondary ? appColors.primary : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: appColors.primary },
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        isSecondary && { backgroundColor: appColors.surface, borderColor: appColors.borderStrong },
        !isGhost && shadows.soft,
        pressed && states.pressed,
        style
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.text, { color }, isGhost && styles.ghostText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: buttons.height,
    borderRadius: buttons.radius,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 8,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowOpacity: 0.04
  },
  ghost: {
    backgroundColor: 'transparent',
    minHeight: 44
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  ghostText: {
    fontSize: 14
  }
});
