import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { buttons, colors, radii, shadows, spacing, states, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export function PrimaryButton({ title, icon = 'arrow-right', onPress, disabled, loading, style }) {
  const { appColors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: appColors.primary },
        (disabled || loading) && states.disabled,
        pressed && states.pressed,
        shadows.soft,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text style={styles.primaryText}>{title}</Text>
          {icon ? <MaterialCommunityIcons name={icon} size={19} color="#FFFFFF" /> : null}
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, icon, onPress, disabled, style, danger = false }) {
  const { appColors } = useApp();
  const color = danger ? appColors.danger : appColors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryButton,
        { backgroundColor: appColors.surface, borderColor: danger ? appColors.danger : appColors.borderStrong },
        disabled && states.disabled,
        pressed && states.pressed,
        style,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.secondaryText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function FormField({ label, error, icon, style, inputStyle, ...props }) {
  const { appColors } = useApp();
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={[styles.fieldLabel, { color: appColors.text }]}>{label}</Text> : null}
      <View style={[styles.inputBox, { backgroundColor: appColors.surface, borderColor: error ? appColors.danger : appColors.border }]}>
        {icon ? <MaterialCommunityIcons name={icon} size={20} color={error ? appColors.danger : appColors.muted} /> : null}
        <TextInput
          placeholderTextColor={appColors.lightText}
          style={[styles.input, { color: appColors.text }, inputStyle]}
          {...props}
        />
      </View>
      {error ? <Text style={[styles.errorText, { color: appColors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function ChoiceCard({ icon, title, subtitle, onPress, selected, rightIcon = 'chevron-right', style }) {
  const { appColors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceCard,
        {
          backgroundColor: selected ? appColors.surfaceAlt : appColors.surface,
          borderColor: selected ? appColors.primary : appColors.border,
        },
        pressed && states.pressed,
        shadows.card,
        style,
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: appColors.iconBg }]}>
        <MaterialCommunityIcons name={icon} size={24} color={appColors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.choiceTitle, { color: appColors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.choiceSubtitle, { color: appColors.muted }]}>{subtitle}</Text> : null}
      </View>
      <MaterialCommunityIcons name={selected ? 'check-circle' : rightIcon} size={21} color={appColors.primary} />
    </Pressable>
  );
}

export function SectionTitle({ title, subtitle }) {
  const { appColors } = useApp();
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, { color: appColors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: appColors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatusPill({ label, tone = 'neutral', icon }) {
  const { appColors, isDark } = useApp();
  const toneColor =
    tone === 'success' ? appColors.success :
      tone === 'warning' ? appColors.warning :
        tone === 'danger' ? appColors.danger :
          appColors.primary;
  return (
    <View style={[styles.statusPill, { backgroundColor: isDark ? appColors.surfaceAlt : appColors.primarySoft, borderColor: appColors.border }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={15} color={toneColor} /> : null}
      <Text style={[styles.statusText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'information-outline', title, text, action }) {
  const { appColors } = useApp();
  return (
    <View style={[styles.empty, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
      <View style={[styles.emptyIcon, { backgroundColor: appColors.iconBg }]}>
        <MaterialCommunityIcons name={icon} size={30} color={appColors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: appColors.text }]}>{title}</Text>
      {text ? <Text style={[styles.emptyText, { color: appColors.muted }]}>{text}</Text> : null}
      {action || null}
    </View>
  );
}

export function LoadingState({ title = 'Carregando', text }) {
  const { appColors } = useApp();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={appColors.primary} />
      <Text style={[styles.loadingTitle, { color: appColors.text }]}>{title}</Text>
      {text ? <Text style={[styles.loadingText, { color: appColors.muted }]}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: buttons.height,
    borderRadius: buttons.radius,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: buttons.smallHeight,
    borderRadius: buttons.radius,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  field: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  inputBox: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  choiceCard: {
    minHeight: 86,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  choiceTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  choiceSubtitle: {
    ...typography.caption,
    marginTop: 4,
  },
  sectionTitleWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...typography.caption,
    marginTop: 3,
  },
  statusPill: {
    minHeight: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
