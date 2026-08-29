import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';
import { arrivalLocationService } from '../services/arrivalLocationService';
import { getEntranceByAreaId, hospitalName } from '../data/routes';

const initialStatus = {
  location: 'checking',
  beacon: 'waiting',
};

export default function ArrivalPreparationScreen({
  navigate,
  goBack,
  routeParams = {},
  userProfile,
  hospitalDetection,
  onMarkNearHospital,
  onAreaDetected,
}) {
  const userType = routeParams.userType || userProfile?.type || 'patient';
  const area = routeParams.area || userProfile?.area || 'private';
  const isIndoor = hospitalDetection?.arrivalStatus === 'INDOOR' || userProfile?.arrivalStatus === 'INDOOR';
  const [status, setStatus] = useState(initialStatus);
  const [locationIssue, setLocationIssue] = useState(null);
  const markNearRef = useRef(onMarkNearHospital);

  useEffect(() => {
    markNearRef.current = onMarkNearHospital;
  }, [onMarkNearHospital]);

  const checkLocation = useCallback(async () => {
    setStatus((current) => ({ ...current, location: 'checking' }));
    setLocationIssue(null);

    const result = await arrivalLocationService.requestNearHospital();
    if (result.granted) {
      markNearRef.current?.(area);
      setStatus((current) => ({ ...current, location: 'near' }));
      return;
    }

    setStatus((current) => ({ ...current, location: result.reason || 'blocked' }));
    setLocationIssue(result.reason || 'location-error');
  }, [area]);

  useEffect(() => {
    checkLocation();
  }, [checkLocation]);

  const locationLabel = useMemo(() => {
    if (status.location === 'checking') return 'Procurando hospital proximo...';
    if (status.location === 'near') return `${hospitalName} proximo`;
    if (status.location === 'permission-denied') return 'Permissao negada';
    if (status.location === 'location-unavailable') return 'Localizacao indisponivel';
    return 'Nao foi possivel confirmar';
  }, [status.location]);

  const simulateEntrance = (targetArea, beaconCode) => {
    const entrance = getEntranceByAreaId(targetArea);
    setStatus((current) => ({ ...current, beacon: 'detected' }));
    const arrivalState = onAreaDetected?.(targetArea, {
      beacon_code: beaconCode,
      source: 'dev-simulation',
      confidence: 'high',
      detectedEntrance: entrance,
    });
    navigate('ArrivalConfirmed', {
      userType,
      detectedEntrance: arrivalState?.detectedEntrance || entrance,
    });
  };

  const simulateUnknownBeacon = () => {
    setStatus((current) => ({ ...current, beacon: 'not-found' }));
  };

  return (
    <Screen>
      <Header
        title="Chegada"
        subtitle={hospitalName}
        onBack={() => goBack?.('HomeStart')}
        onMenu={() => navigate('Menu')}
      />

      <View style={[styles.card, shadows.card]}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={38} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Estamos aguardando sua chegada</Text>
        <Text style={styles.text}>
          Quando voce entrar no hospital, o Navora ativara automaticamente a navegacao interna.
        </Text>

        <View style={styles.statusBox}>
          <Status icon="crosshairs-gps" label="Localizacao" value={status.location === 'near' ? 'Ativa' : locationLabel} loading={status.location === 'checking'} strong={status.location === 'near'} />
          <Status icon="door-open" label="Entrada" value={status.beacon === 'detected' ? 'Identificada' : status.beacon === 'not-found' ? 'Nao identificada' : 'Aguardando'} />
          <Status icon="hospital-building" label="Modo interno" value={isIndoor ? 'Ativado' : 'Ainda nao ativado'} strong={isIndoor} />
        </View>

        {locationIssue ? (
          <Pressable onPress={checkLocation} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>

      {__DEV__ ? (
        <View style={[styles.devCard, shadows.card]}>
          <Text style={styles.devTitle}>Modo desenvolvimento</Text>
          <View style={styles.devButtons}>
            <DevButton label="Simular chegada Private" onPress={() => simulateEntrance('private', 'MBM04-01')} />
            <DevButton label="Simular chegada SUS" onPress={() => simulateEntrance('sus', 'MBM04-10')} />
            <DevButton label="Beacon desconhecido" secondary onPress={simulateUnknownBeacon} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function Status({ icon, label, value, loading, strong }) {
  return (
    <View style={styles.statusRow}>
      <MaterialCommunityIcons name={icon} size={18} color={strong ? colors.primary : colors.muted} />
      <View style={styles.statusCopy}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={[styles.statusValue, strong && styles.statusStrong]}>{value}</Text>
      </View>
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
    </View>
  );
}

function DevButton({ label, onPress, secondary }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.devButton, secondary && styles.devButtonSecondary, pressed && styles.pressed]}>
      <Text style={[styles.devButtonText, secondary && styles.devButtonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, marginTop: spacing.md, alignItems: 'center' },
  icon: { width: 68, height: 68, borderRadius: radii.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.text, textAlign: 'center' },
  text: { ...typography.body, color: colors.muted, marginTop: spacing.sm, textAlign: 'center' },
  statusBox: { alignSelf: 'stretch', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, padding: spacing.md, gap: spacing.sm, marginTop: spacing.xl },
  statusRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusCopy: { flex: 1, minWidth: 0 },
  statusLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  statusValue: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  statusStrong: { color: colors.primary },
  retry: { minHeight: 46, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: spacing.md, marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  devCard: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, marginTop: spacing.md },
  devTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  devButtons: { gap: spacing.sm, marginTop: spacing.md },
  devButton: { minHeight: 46, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  devButtonSecondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  devButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  devButtonTextSecondary: { color: colors.text },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
