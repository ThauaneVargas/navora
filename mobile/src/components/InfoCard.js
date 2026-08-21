import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function InfoCard({ icon, title, value, note, right }) {
  const { appColors } = useApp();

  return (
    <View style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
      <View style={[styles.iconCircle, { backgroundColor: appColors.iconBg }]}><Text style={styles.icon}>{icon}</Text></View>
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
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: { fontSize: 30 },
  content: { flex: 1 },
  title: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800'
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4
  },
  right: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 13
  }
});
