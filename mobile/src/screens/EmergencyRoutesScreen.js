import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

// Rotas de emergência. Antes mostrava distância e tempo fixos ("68 m", "1 min"),
// um mapa desenhado sempre igual e passos inventados ("corredor principal por
// 32 m", "porta lateral perto do estacionamento") — dado falso numa emergência.
// Agora: orientação geral de segurança, verdadeira em qualquer lugar do
// hospital, + busca das saídas cadastradas + chamar a equipe.

const STEPS = [
  { icon: 'sign-direction', titleKey: 'emergency.step1', descKey: 'emergency.step1Desc' },
  { icon: 'stairs-down', titleKey: 'emergency.step2', descKey: 'emergency.step2Desc' },
  { icon: 'account-group-outline', titleKey: 'emergency.step3', descKey: 'emergency.step3Desc' },
];

export default function EmergencyRoutesScreen({ navigate, goBack }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  return (
    <Screen>
      <Header title={t('emergency.title')} centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.exitIcon}>
          <MaterialCommunityIcons name="exit-run" size={54} color={colors.primary} />
        </View>
        <Text style={styles.title} accessibilityRole="header">{t('emergency.heroTitle')}</Text>
        <Text style={styles.safeRoute}>{t('emergency.heroText')}</Text>
      </View>

      <View style={[styles.routeCard, shadows.card]}>
        <View style={styles.pathLine} />
        {STEPS.map((step) => (
          <Step key={step.titleKey} icon={step.icon} title={t(step.titleKey)} desc={t(step.descKey)} />
        ))}
      </View>

      <Pressable
        onPress={() => navigate('Search', { query: 'Saída' })}
        accessibilityRole="button"
        accessibilityLabel={t('emergency.findExit')}
        style={({ pressed }) => [styles.mainButton, pressed && styles.pressed, shadows.soft]}
      >
        <MaterialCommunityIcons name="exit-run" size={20} color="#FFFFFF" />
        <Text style={styles.mainButtonText}>{t('emergency.findExit')}</Text>
      </Pressable>

      <Pressable
        onPress={() => navigate('Help')}
        accessibilityRole="button"
        accessibilityLabel={t('emergency.callStaff')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="hand-heart-outline" size={20} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>{t('emergency.callStaff')}</Text>
      </Pressable>
    </Screen>
  );
}

function Step({ icon, title, desc }) {
  const { appColors: colors } = useApp();
  const styles = useThemeStyles();
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// Estilos acompanham o tema (claro/escuro); antes usavam a paleta fixa do
// tema claro e não mudavam no modo noturno.
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}

const createStyles = (colors) => StyleSheet.create({
  heroCard: {
    marginTop: 16,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  exitIcon: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 18,
    textAlign: 'center',
  },
  safeRoute: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  distance: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  routeCard: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    position: 'relative',
  },
  mapCard: {
    height: 170,
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  mapRoomA: {
    position: 'absolute',
    left: 18,
    top: 18,
    width: 96,
    height: 58,
    borderRadius: 12,
    backgroundColor: colors.borderStrong,
  },
  mapRoomB: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 106,
    height: 62,
    borderRadius: 12,
    backgroundColor: colors.borderStrong,
  },
  mapCorridor: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: 78,
    height: 34,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  escapeRoute: {
    position: 'absolute',
    left: 66,
    right: 62,
    top: 92,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  currentDot: {
    position: 'absolute',
    left: 60,
    top: 84,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  exitDoor: {
    position: 'absolute',
    right: 50,
    top: 74,
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabelStart: {
    position: 'absolute',
    left: 50,
    top: 110,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  mapLabelExit: {
    position: 'absolute',
    right: 48,
    top: 116,
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
  },
  pathLine: {
    position: 'absolute',
    left: 38,
    top: 44,
    bottom: 44,
    width: 3,
    borderRadius: 3,
    backgroundColor: colors.primarySoft,
  },
  step: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  stepDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 3,
  },
  mainButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
