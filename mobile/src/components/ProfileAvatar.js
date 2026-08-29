import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';

function initialsFromName(name = 'Paciente Navora') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PN';
}

export default function ProfileAvatar({ name, uri, onPress, onRemove }) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Alterar foto de perfil"
        accessibilityHint="Abre a galeria para escolher uma foto local"
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed, shadows.soft]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <Text style={styles.initials}>{initialsFromName(name)}</Text>
        )}
        <View style={styles.cameraBadge}>
          <MaterialCommunityIcons name="camera" size={15} color="#FFFFFF" />
        </View>
      </Pressable>
      {uri ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel="Remover foto de perfil"
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Text style={styles.removeText}>Remover</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photo: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
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
    backgroundColor: '#FFF6F7',
  },
  removeText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
