import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { PrimaryButton, SecondaryButton, StatusPill } from '../components/PremiumUI';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function ArrivalPreparationScreen({
  navigate,
  goBack,
  hospitalDetection,
  onAreaDetected,
}) {
  const { appColors, isDark } = useApp();
  const pulse = useRef(new Animated.Value(0)).current;
  const [status, setStatus] = useState('searching');
  const detectedEntrance = hospitalDetection?.detectedEntrance;
  const hasConfirmedLocation = hospitalDetection?.status === 'confirmed' && detectedEntrance;

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
    }, 1800);
    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [hasConfirmedLocation, pulse]);

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
        ) : status === 'needsReception' ? (
          <>
            <StatusPill label="Confirmação presencial" tone="warning" icon="alert-circle-outline" />
            <Text style={[styles.title, { color: appColors.text }]}>Precisamos da recepção</Text>
            <Text style={[styles.text, { color: appColors.muted }]}>
              Não foi possível identificar sua localização automaticamente neste aparelho. Procure a recepção para confirmar ou corrigir seu ponto inicial.
            </Text>
            <PrimaryButton title="Ver rota até a recepção" icon="desk" onPress={useReception} />
            {__DEV__ ? (
              <Pressable
                onPress={() => {
                  onAreaDetected?.('private', { source: 'dev-only-location' });
                  setStatus('confirmed');
                }}
                style={({ pressed }) => [styles.devButton, { borderColor: appColors.border }, pressed && styles.pressed]}
              >
                <Text style={[styles.devText, { color: appColors.muted }]}>Dev: marcar localização recebida</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <StatusPill label="Identificando" icon="radar" />
            <Text style={[styles.title, { color: appColors.text }]}>Buscando localização</Text>
            <Text style={[styles.text, { color: appColors.muted }]}>
              Mantenha o aplicativo aberto por alguns instantes. Se a localização não aparecer, a recepção pode confirmar para você.
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
  devButton: {
    minHeight: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devText: {
    ...typography.caption,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
  },
});
