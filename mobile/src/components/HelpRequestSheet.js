import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { useKeyboardHeight } from './KeyboardAwareScrollView';

// "Preciso de ajuda": antes enviava o chamado direto, sem dizer o quê.
// Agora: 1) escolher o motivo (ou escrever) → 2) conferir motivo e local → enviar.
// O motivo vai em português pra recepção (id em pt, texto na tela via t()).
const REASONS = [
  { id: 'Estou passando mal', key: 'unwell', icon: 'emoticon-sick-outline' },
  { id: 'Preciso de cadeira de rodas', key: 'wheelchair', icon: 'wheelchair-accessibility' },
  { id: 'Não encontro o local', key: 'lost', icon: 'compass-outline' },
  { id: 'Outro', key: 'other', icon: 'dots-horizontal-circle-outline' },
];

export default function HelpRequestSheet({ visible, locationName, onClose, onSend }) {
  const { appColors, t } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [step, setStep] = useState('reason');
  const [reason, setReason] = useState(null);
  const [otherText, setOtherText] = useState('');

  if (!visible) return null;

  const close = () => {
    setStep('reason');
    setReason(null);
    setOtherText('');
    onClose?.();
  };

  const isOther = reason?.key === 'other';
  const canContinue = Boolean(reason) && (!isOther || otherText.trim().length >= 3);
  const reasonForReception = isOther ? `Outro: ${otherText.trim()}` : reason?.id;
  const reasonLabel = isOther ? otherText.trim() : reason ? t(`help.reason_${reason.key}`) : '';

  const send = () => {
    onSend?.(reasonForReception);
    close();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('common.close')} />

      <View
        style={[
          styles.sheet,
          { bottom: keyboardHeight, paddingBottom: (keyboardHeight ? 0 : insets.bottom) + 18 },
        ]}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 'reason' ? (
            <>
              <Text style={styles.title}>{t('help.reasonTitle')}</Text>
              <Text style={styles.text}>{t('help.reasonSub')}</Text>

              {REASONS.map((item) => {
                const active = reason?.key === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setReason(item)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
                  >
                    <View style={styles.optionIcon}>
                      <MaterialCommunityIcons name={item.icon} size={24} color={appColors.primary} />
                    </View>
                    <Text style={styles.optionText}>{t(`help.reason_${item.key}`)}</Text>
                    <MaterialCommunityIcons
                      name={active ? 'radiobox-marked' : 'radiobox-blank'}
                      size={22}
                      color={active ? appColors.primary : appColors.muted}
                    />
                  </Pressable>
                );
              })}

              {isOther ? (
                <TextInput
                  value={otherText}
                  onChangeText={setOtherText}
                  placeholder={t('help.reasonOtherPlaceholder')}
                  placeholderTextColor={appColors.lightText}
                  maxLength={200}
                  multiline
                  autoFocus
                  style={styles.input}
                />
              ) : null}

              <Pressable
                onPress={() => setStep('confirm')}
                disabled={!canContinue}
                style={({ pressed }) => [styles.primary, !canContinue && styles.disabled, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>{t('help.continue')}</Text>
              </Pressable>
              <Pressable onPress={close} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>{t('common.cancel')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('help.confirmTitle')}</Text>
              <Text style={styles.text}>{t('help.confirmSub')}</Text>

              <View style={styles.summary}>
                <Text style={styles.summaryLabel}>{t('help.summaryReason')}</Text>
                <Text style={styles.summaryValue}>{reasonLabel}</Text>
                <Text style={[styles.summaryLabel, styles.summaryGap]}>{t('help.summaryPlace')}</Text>
                <Text style={styles.summaryValue}>{locationName}</Text>
              </View>

              <Pressable onPress={send} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText}>{t('help.sendRequest')}</Text>
              </Pressable>
              <Pressable onPress={() => setStep('reason')} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>{t('header.back')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 300,
      elevation: 30,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      maxHeight: '88%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 22,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
    },
    text: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      marginTop: 4,
      marginBottom: 14,
    },
    option: {
      minHeight: 60,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    optionActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      backgroundColor: colors.surfaceAlt,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionText: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    input: {
      minHeight: 72,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      color: colors.text,
      fontSize: 16,
      padding: 12,
      textAlignVertical: 'top',
      marginBottom: 10,
    },
    summary: {
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '800',
    },
    summaryGap: {
      marginTop: 10,
    },
    summaryValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
      marginTop: 2,
    },
    primary: {
      minHeight: 54,
      borderRadius: 16,
      backgroundColor: colors.primaryStrong,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    primaryText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
    },
    secondary: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    secondaryText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.85,
    },
  });
