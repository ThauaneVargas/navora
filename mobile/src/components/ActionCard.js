import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, shadows } from '../theme/colors';
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
        pressed && styles.pressed,
        shadows.card,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: appColors.iconBg }]}>
        <Text style={styles.icon}>{icon}</Text>
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
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between'
  },
  wide: {
    width: '100%',
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }]
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 26
  },
  textBox: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 20
  },
  subtitle: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4
  }
});
