import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { PrimaryButton, SecondaryButton, StatusPill } from '../components/PremiumUI';
import { radii, shadows, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { entrances } from '../data/routes';
import { BLE_BLOCKED_STATES, indoorLocationService } from '../services/indoorLocationService';

// Sem BLE, a escolha manual aparece logo. Com BLE, dá um tempo pra ouvir os beacons.
const MANUAL_CHOICE_AFTER_MS = 1800;
const MANUAL_CHOICE_AFTER_BLE_MS = 12000;

export default function ArrivalPreparationScreen({
  navigate,
  goBack,
  hospitalDetection,
  onAreaDetected,
}) {
  const { appColors } = useApp();
  const pulse = useRef(new Animated.Value(0)).current;
  const [status, setStatus] = useState('searching');
  const detectedEntrance = hospitalDetection?.detectedEntrance;
  const hasConfirmedLocation = hospitalDetection?.status === 'confirmed' && detectedEntrance;
  const bleEnabled = indoorLocationService.isRealBleEnabled();
  const [bleStatus, setBleStatus] = useState(() => indoorLocationService.getStatus());
  // Bluetooth desligado, sem permissão, Expo Go, iPhone...: vai direto pra escolha manual.
  const bleBlocked = bleEnabled && BLE_BLOCKED_STATES.includes(bleStatus.state);
  const showManualChoice = status === 'needsReception' || bleBlocked;

  // A leitura dos beacons começa aqui (é onde o pedido de permissão faz sentido)
  // e continua depois, pra acompanhar a rota; pausa sozinha em segundo plano.
  useEffect(() => {
    if (!bleEnabled) return undefined;
    indoorLocationService.start().then(setBleStatus);
    const timer = setInterval(() => setBleStatus(indoorLocationService.getStatus()), 1000);
    return () => clearInterval(timer);
  }, [bleEnabled]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    animation.start();
    const timeout = setTimeout(() => {
      if (!hasConfirmedLocation) setStatus('needsReception');
    }, bleEnabled ? MANUAL_CHOICE_AFTER_BLE_MS : MANUAL_CHOICE_AFTER_MS);
    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [bleEnabled, hasConfirmedLocation, pulse]);

  const notFoundMessage = bleEnabled
    ? bleBlocked
      ? bleStatus.message
      : 'Não encontrei nenhum ponto de referência do hospital por perto.'
    : 'Não foi possível identificar sua localização automaticamente neste aparelho.';
  const chooseEntrance = (entrance) => onAreaDetected?.(entrance.areaId, { source: 'manual-entrance', detectedEntrance: entrance });

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.16] }) }],
  };

  const continueAfterLocation = () => navigate('Search');
  const useReception = () => {
    onAreaDetected?.('private', { source: 'reception-pending' });
    navigate('Search', { query: 'Recepção' });
  };

  return (
    <Screen>
      <Header
        title="Localização inicial"
        subtitle="Vamos localizar o melhor ponto de partida."
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />

      <View style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <View style={styles.radarWrap}>
          <Animated.View style={[styles.pulse, { backgroundColor: appColors.primary }, pulseStyle]} />
          <View style={[styles.radar, { backgroundColor: appColors.iconBg }]}>
            <MaterialCommunityIcons
              name={hasConfirmedLocation ? 'map-marker-check-outline' : status === 'needsReception' ? 'desk' : 'map-marker-radius-outline'}
              size={40}
              color={appColors.primary}
            />
          </View>
        </View>

        {hasConfirmedLocation ? (
          <>
            <StatusPill label="Localização identificada" tone="success" icon="check-circle-outline" />
            <Text style={[styles.title, { color: appColors.text }]}>Localização identificada</Text>
            <View style={[styles.locationBox, { backgroundColor: appColors.surfaceAlt, borderColor: appColors.border }]}>
              <Info label="Hospital" value="Hospital Marco Capute" />
              <Info label="Area" value={detectedEntrance.hospitalArea || 'Area identificada'} />
              <Info label="Entrada" value={detectedEntrance.fullName || detectedEntrance.name || 'Entrada identificada'} />
            </View>
            <Text style={[styles.text, { color: appColors.muted }]}>Esta localização está correta?</Text>
            <PrimaryButton title="Sim, continuar" onPress={continueAfterLocation} />
            <SecondaryButton title="Pedir correção na recepção" icon="desk" onPress={useReception} />
          </>
        ) : showManualChoice ? (
          <>
            <StatusPill label="Escolha manual" tone="warning" icon="alert-circle-outline" />
            <Text style={[styles.title, { color: appColors.text }]}>Por onde você entrou?</Text>
            <Text accessibilityLiveRegion="polite" style={[styles.text, { color: appColors.muted }]}>
              {notFoundMessage} Escolha sua entrada abaixo, ou procure a recepção.
            </Text>
            {entrances.map((entrance) => (
              <PrimaryButton
                key={entrance.code}
                title={`Estou na ${entrance.fullName}`}
                icon="door-open"
                onPress={() => chooseEntrance(entrance)}
              />
            ))}
            <SecondaryButton title="Ver rota até a recepção" icon="desk" onPress={useReception} />
          </>
        ) : (
          <>
            <StatusPill label="Identificando" icon="radar" />
            <Text style={[styles.title, { color: appColors.text }]}>Buscando localização</Text>
            <Text accessibilityLiveRegion="polite" style={[styles.text, { color: appColors.muted }]}>
              {bleEnabled && bleStatus.state === 'scanning' ? `${bleStatus.message} ` : ''}
              Mantenha o aplicativo aberto por alguns instantes. Se a localização não aparecer, você poderá escolher sua entrada.
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

function Info({ label, value }) {
  const { appColors } = useApp();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: appColors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: appColors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  radarWrap: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 122,
    height: 122,
    borderRadius: 61,
  },
  radar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
  },
  text: {
    ...typography.body,
  },
  locationBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    gap: 3,
  },
  infoLabel: {
    ...typography.caption,
  },
  infoValue: {
    ...typography.subtitle,
  },
});
