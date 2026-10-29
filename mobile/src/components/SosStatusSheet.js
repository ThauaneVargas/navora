import React, { useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';

// Depois do SOS enviado: 1) mostra o andamento (a recepção recebeu? a equipe
// está indo?), 2) deixa a pessoa dizer o que está acontecendo com um toque —
// o SOS já saiu antes, então informar nunca atrasa o pedido, 3) oferece ligar
// para a recepção. Códigos dos problemas: backend-nest/src/calls/call-codes.ts.
export const SOS_PROBLEMS = [
  { code: 'chest_pain', icon: 'heart-pulse' },
  { code: 'breathing', icon: 'lungs' },
  { code: 'fainting', icon: 'head-alert-outline' },
  { code: 'fall', icon: 'human-handsdown' },
  { code: 'bleeding', icon: 'water-alert-outline' },
  { code: 'seizure', icon: 'flash-alert-outline' },
  { code: 'unwell', icon: 'emoticon-sick-outline' },
  { code: 'other', icon: 'dots-horizontal-circle-outline' },
];

const STEPS = ['sent', 'received', 'dispatched', 'inService'];
const STEP_BY_STATUS = { PENDING: 0, ACCEPTED: 1, TEAM_DISPATCHED: 2, IN_PROGRESS: 3 };

export default function SosStatusSheet({
  visible,
  call,
  problems = [],
  savingProblems,
  problemsError,
  receptionPhone,
  onToggleProblem,
  onClose,
}) {
  const { appColors, t } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const insets = useSafeAreaInsets();

  if (!visible || !call) return null;

  const isSos = call.kind === 'sos';
  const closed = call.status === 'CLOSED' || call.status === 'CANCELED';
  const currentStep = STEP_BY_STATUS[call.status] ?? 0;

  const callReception = () => {
    if (receptionPhone) Linking.openURL(`tel:${receptionPhone}`).catch(() => {});
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headRow}>
            <View style={[styles.headIcon, isSos && styles.headIconSos]}>
              <MaterialCommunityIcons name={isSos ? 'alarm-light-outline' : 'headphones'} size={24} color={isSos ? '#FFFFFF' : appColors.primary} />
            </View>
            <View style={styles.headCopy}>
              <Text style={styles.title}>{isSos ? t('help.sheetSosTitle') : t('help.sheetHelpTitle')}</Text>
              <Text style={styles.subtitle}>{t('help.protocol', { id: call.id })}</Text>
            </View>
          </View>

          {closed ? (
            <View style={styles.closedBox}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color={appColors.success} />
              <Text style={styles.closedText}>{t(call.status === 'CANCELED' ? 'help.step_canceled' : 'help.step_closed')}</Text>
            </View>
          ) : (
            <View style={styles.steps} accessibilityRole="progressbar" accessibilityLabel={t(`help.step_${STEPS[currentStep]}`)}>
              {STEPS.map((step, index) => {
                const done = index <= currentStep;
                const current = index === currentStep;
                return (
                  <View key={step} style={styles.stepRow}>
                    <View style={[styles.stepDot, done && styles.stepDotDone]}>
                      {done ? <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={[styles.stepText, done && styles.stepTextDone, current && styles.stepTextCurrent]}>
                      {t(`help.step_${step}`)}
                    </Text>
                    {current && index < STEPS.length - 1 ? <ActivityIndicator size="small" color={appColors.primary} /> : null}
                  </View>
                );
              })}
            </View>
          )}

          {isSos && !closed ? (
            <>
              <Text style={styles.sectionTitle}>{t('help.whatIsHappening')}</Text>
              <Text style={styles.sectionText}>{t('help.whatIsHappeningSub')}</Text>
              <View style={styles.chips}>
                {SOS_PROBLEMS.map((item) => {
                  const active = problems.includes(item.code);
                  return (
                    <Pressable
                      key={item.code}
                      onPress={() => onToggleProblem?.(item.code)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                    >
                      <MaterialCommunityIcons name={item.icon} size={20} color={appColors.primary} />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`help.problem_${item.code}`)}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.saveState, problemsError && styles.saveStateError]}>
                {savingProblems
                  ? t('help.problemsSaving')
                  : problemsError
                    ? t('help.problemsFailed')
                    : problems.length
                      ? t('help.problemsSaved')
                      : ''}
              </Text>
            </>
          ) : null}

          {receptionPhone ? (
            <Pressable onPress={callReception} accessibilityRole="button" style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="phone" size={20} color={appColors.primary} />
              <Text style={styles.callText}>{t('help.callReception')}</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>{t('common.close')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 300, elevation: 30 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 22,
    },
    headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    headIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center' },
    headIconSos: { backgroundColor: colors.primaryStrong },
    headCopy: { flex: 1 },
    title: { color: colors.text, fontSize: 20, fontWeight: '900' },
    subtitle: { color: colors.muted, fontSize: 14, fontWeight: '600', marginTop: 2 },
    steps: { gap: 12, marginBottom: 18, padding: 14, borderRadius: 16, backgroundColor: colors.surfaceAlt },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepText: { flex: 1, color: colors.muted, fontSize: 16, fontWeight: '600' },
    stepTextDone: { color: colors.text },
    stepTextCurrent: { fontWeight: '900' },
    closedBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      marginBottom: 18,
    },
    closedText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
    sectionText: { color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 4, marginBottom: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      minHeight: 52,
      flexGrow: 1,
      flexBasis: '45%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.iconBg },
    chipText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
    chipTextActive: { fontWeight: '900' },
    saveState: { minHeight: 20, color: colors.success, fontSize: 13, fontWeight: '700', marginTop: 8 },
    saveStateError: { color: colors.danger },
    callButton: {
      minHeight: 56,
      marginTop: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    callText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
    secondary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    secondaryText: { color: colors.muted, fontSize: 16, fontWeight: '800' },
    pressed: { opacity: 0.75 },
  });
