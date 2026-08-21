import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function WaitingModeScreen({ navigate, goBack, routeParams = {}, activeRoute: selectedRoute, userProfile }) {
  const { currentLocation: fallbackLocation, activeRoute: fallbackRoute } = useApp();
  const activeRoute = selectedRoute || fallbackRoute;
  const currentLocation = {
    ...fallbackLocation,
    name: userProfile?.currentLocation || fallbackLocation.name,
    beacon: userProfile?.currentBeacon || fallbackLocation.beacon,
  };
  const destination = routeParams.destination || activeRoute.destination;
  const startedAt = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <Screen withBottomTabs>
      <Header title="Modo espera" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.hero, shadows.card]}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="timer-sand" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Voce chegou em {destination}</Text>
        <Text style={styles.heroText}>
          O Navora continua acompanhando sua localizacao e pode chamar ajuda se voce precisar.
        </Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Aguardando atendimento</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Metric icon="clock-outline" label="Modo iniciado" value={startedAt} />
        <Metric icon="map-marker-radius" label="Local atual" value={destination} />
      </View>

      <View style={[styles.infoCard, shadows.card]}>
        <Text style={styles.sectionTitle}>Informacoes para a equipe</Text>
        <InfoRow icon="map-marker" label="Ultima posicao" value={`${currentLocation.name} - ${currentLocation.floor}`} />
        <InfoRow icon="bluetooth" label="Beacon detectado" value={currentLocation.beacon} />
        <InfoRow icon="walk" label="Preferencia de rota" value="Acessivel, com elevador e voz" />
      </View>

      <View style={[styles.helpPanel, shadows.card]}>
        <Text style={styles.helpTitle}>Precisa de ajuda?</Text>
        <Text style={styles.helpText}>Escolha o atendimento sem sair do modo espera.</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigate('Help', { type: 'help' })}
            style={({ pressed }) => [styles.lightAction, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="hand-heart-outline" size={21} color={colors.primary} />
            <Text style={styles.lightActionText}>Chamar ajuda</Text>
          </Pressable>

          <Pressable
            onPress={() => navigate('Help', { type: 'doctor' })}
            style={({ pressed }) => [styles.lightAction, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="doctor" size={21} color={colors.primary} />
            <Text style={styles.lightActionText}>Solicitar medico</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigate('Help', { type: 'sos' })}
          style={({ pressed }) => [styles.sosButton, pressed && styles.pressed, shadows.soft]}
        >
          <MaterialCommunityIcons name="alarm-light-outline" size={22} color="#FFFFFF" />
          <Text style={styles.sosText}>SOS emergencia</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => navigate('Home')}
        style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.finishText}>Finalizar atendimento</Text>
      </Pressable>

      <BottomTabs active="Home" navigate={navigate} />
    </Screen>
  );
}

function Metric({ icon, label, value }) {
  return (
    <View style={[styles.metric, shadows.card]}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
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

const styles = StyleSheet.create({
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
    backgroundColor: '#FFF1F3',
    borderWidth: 1,
    borderColor: '#FFD2D7',
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
