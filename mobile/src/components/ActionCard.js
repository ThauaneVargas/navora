import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, states, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function ActionCard({ icon, title, subtitle, onPress, wide = false, tint = false }) {
  const { appColors } = useApp();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: tint ? appColors.surfaceAlt : appColors.surface,
          borderColor: tint ? appColors.borderStrong || appColors.border : appColors.border,
        },
        wide && styles.wide,
        pressed && states.pressed,
        shadows.card,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: appColors.iconBg }]}>
        <MaterialCommunityIcons name={icon || 'shape-outline'} size={24} color={appColors.primary} />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.title, { color: appColors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: appColors.muted }]}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 118,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between'
  },
  wide: {
    width: '100%',
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textBox: {
    flex: 1
  },
  title: {
    color: colors.text,
    ...typography.subtitle,
  },
  subtitle: {
    color: colors.muted,
    ...typography.caption,
    marginTop: spacing.xs
  }
});
