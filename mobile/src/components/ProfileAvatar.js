import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, states, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

function initialsFromName(name = 'Paciente Navora') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PN';
}

export default function ProfileAvatar({ name, uri, onPress, onRemove }) {
  const { appColors } = useApp();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Alterar foto de perfil"
        accessibilityHint="Abre a galeria para escolher uma foto local"
        style={({ pressed }) => [styles.avatar, { backgroundColor: appColors.primary }, pressed && states.pressed, shadows.soft]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <Text style={styles.initials}>{initialsFromName(name)}</Text>
        )}
        <View style={[styles.cameraBadge, { backgroundColor: appColors.primaryDark, borderColor: appColors.surface }]}>
          <MaterialCommunityIcons name="camera" size={15} color="#FFFFFF" />
        </View>
      </Pressable>
      {uri ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel="Remover foto de perfil"
          style={({ pressed }) => [styles.removeButton, { backgroundColor: appColors.surfaceAlt }, pressed && states.pressed]}
        >
          <Text style={[styles.removeText, { color: appColors.danger }]}>Remover</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photo: {
    width: 78,
    height: 78,
    borderRadius: radii.pill,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  removeText: {
    color: colors.danger,
    ...typography.caption,
    fontWeight: '700',
  },
});
