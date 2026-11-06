import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { localeFor } from '../i18n';

export default function WaitingModeScreen({ navigate, goBack, routeParams = {}, activeRoute: selectedRoute, userProfile }) {
  const { appColors: colors, t, language } = useApp();
  const styles = useThemeStyles();
  const rawDestination = routeParams.destination || selectedRoute?.destination;
  const destination = typeof rawDestination === 'string' ? rawDestination : rawDestination?.name || '';
  const lastPosition = userProfile?.currentLocation || null;
  const entrance = userProfile?.entryLabel || null;
  const accessibility = userProfile?.accessibility || {};
  const preferences = ['wheelchair', 'avoidStairs', 'preferElevator', 'voiceGuidance']
    .filter((key) => accessibility[key])
    .map((key) => t(`waiting.pref_${key}`));
  const preferenceText = preferences.length ? preferences.join(', ') : t('waiting.prefStandard');
  const startedAt = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString(localeFor(language), { hour: '2-digit', minute: '2-digit' });
  }, [language]);

  return (
    <Screen withBottomTabs>
      <Header title={t('waiting.title')} centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.hero, shadows.card]}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="timer-sand" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>
          {destination ? t('waiting.arrivedAt', { destination }) : t('waiting.arrived')}
        </Text>
        <Text style={styles.heroText}>
          {t('waiting.heroText')}
        </Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{t('waiting.waitingCare')}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Metric icon="clock-outline" label={t('waiting.startedAt')} value={startedAt} />
        {destination ? <Metric icon="map-marker-radius" label={t('waiting.currentPlace')} value={destination} /> : null}
      </View>

      <View style={[styles.infoCard, shadows.card]}>
        <Text style={styles.sectionTitle}>{t('waiting.forStaff')}</Text>
        {lastPosition ? <InfoRow icon="map-marker" label={t('waiting.lastPosition')} value={lastPosition} /> : null}
        {entrance ? <InfoRow icon="map-marker-check-outline" label={t('waiting.entrance')} value={entrance} /> : null}
        <InfoRow icon="walk" label={t('waiting.routePreference')} value={preferenceText} />
      </View>

      <View style={[styles.helpPanel, shadows.card]}>
        <Text style={styles.helpTitle}>{t('waiting.needHelp')}</Text>
        <Text style={styles.helpText}>{t('waiting.needHelpSub')}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigate('Help', { type: 'help' })}
            style={({ pressed }) => [styles.lightAction, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="hand-heart-outline" size={21} color={colors.primary} />
            <Text style={styles.lightActionText}>{t('waiting.callHelp')}</Text>
          </Pressable>

          <Pressable
            onPress={() => navigate('Help', { type: 'doctor' })}
            style={({ pressed }) => [styles.lightAction, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="doctor" size={21} color={colors.primary} />
            <Text style={styles.lightActionText}>{t('waiting.requestDoctor')}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigate('Help', { type: 'sos' })}
          style={({ pressed }) => [styles.sosButton, pressed && styles.pressed, shadows.soft]}
        >
          <MaterialCommunityIcons name="alarm-light-outline" size={22} color="#FFFFFF" />
          <Text style={styles.sosText}>{t('waiting.sos')}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => navigate('Home')}
        style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.finishText}>{t('waiting.finish')}</Text>
      </Pressable>

      <BottomTabs active="Home" navigate={navigate} hideRouteBar />
    </Screen>
  );
}

function Metric({ icon, label, value }) {
  const { appColors: colors } = useApp();
  const styles = useThemeStyles();
  return (
    <View style={[styles.metric, shadows.card]}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  const { appColors: colors } = useApp();
  const styles = useThemeStyles();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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
  hero: {
    borderRadius: 26,
    backgroundColor: colors.primary,
    padding: 22,
    marginTop: 12,
    alignItems: 'center',
  },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 28,
  },
  heroText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  statusPill: {
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#53E083',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  metric: {
    flex: 1,
    minHeight: 108,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 12,
  },
  metricValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 14,
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  helpPanel: {
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 16,
    marginTop: 14,
  },
  helpTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  helpText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  lightAction: {
    flex: 1,
    minHeight: 58,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  lightActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  sosButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  finishButton: {
    height: 52,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  finishText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
