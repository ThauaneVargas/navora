import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function InfoCard({ icon, title, value, note, right }) {
  const { appColors } = useApp();

  return (
    <View style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
      <View style={[styles.iconCircle, { backgroundColor: appColors.iconBg }]}>
        <MaterialCommunityIcons name={icon || 'information-outline'} size={26} color={appColors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: appColors.muted }]}>{title}</Text>
        <Text style={[styles.value, { color: appColors.text }]}>{value}</Text>
        {note ? <Text style={[styles.note, { color: appColors.muted }]}>{note}</Text> : null}
      </View>
      {right ? <Text style={[styles.right, { color: appColors.primary }]}>{right}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: radii.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: { flex: 1 },
  title: {
    color: colors.muted,
    ...typography.caption,
  },
  value: {
    color: colors.text,
    ...typography.title,
    marginTop: 2
  },
  note: {
    color: colors.muted,
    ...typography.caption,
    marginTop: 4
  },
  right: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: '700'
  }
});
