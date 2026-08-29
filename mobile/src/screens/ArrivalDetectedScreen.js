import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';
import { getAreaById } from '../data/routes';
import { indoorLocationService } from '../services/indoorLocationService';

export default function ArrivalDetectedScreen({ navigate, goBack, routeParams = {}, userProfile, onAreaDetected, onBeaconDetected }) {
  const area = routeParams.area || 'unknown';
  const knownArea = area !== 'unknown';
  const areaData = knownArea ? getAreaById(area) : null;
  const selectedType = routeParams.userType || userProfile?.type;
  const showDevControls = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

  const nextScreenForType = (nextArea) => {
    if (selectedType === 'visitor') return navigate('VisitorEntry', { area: nextArea });
    if (selectedType === 'patient') return navigate('PatientAccessChoice', { area: nextArea });
    return navigate('ProfileChoice', { area: nextArea });
  };

  const continueKnown = () => {
    onAreaDetected?.(area);
    nextScreenForType(area);
  };

  const simulateBeacon = async (beaconCode) => {
    const [result] = await indoorLocationService.emitSimulatedDetection({
      identifier: beaconCode,
      rssi: -58,
    });
    const detected = result?.detection;
    if (!result?.detected || !detected) {
      return;
    }
    const nextArea = detected?.area || 'private';
    const detection = { ...detected, beacon_code: beaconCode };
    const recalculation = result?.recalculation;

    if (recalculation?.reason && recalculation.reason !== 'no-active-route') {
      return;
    }

    onAreaDetected?.(nextArea, detection);
    nextScreenForType(nextArea);
  };

  const chooseUnknown = (nextArea) => {
    onAreaDetected?.(nextArea === 'unknown' ? 'private' : nextArea);
    nextScreenForType(nextArea === 'unknown' ? 'private' : nextArea);
  };

  return (
    <Screen>
      <Header
        title={knownArea ? 'Voce chegou ao hospital' : 'Vamos confirmar seu atendimento'}
        subtitle={knownArea ? 'Entrada confirmada no ambiente atual.' : 'No Expo Go, a confirmacao usa simulacao/fallback.'}
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />
      <View style={[styles.card, shadows.card]}>
        <View style={styles.beacon}>
          <MaterialCommunityIcons name="bluetooth-connect" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.kicker}>{knownArea ? 'Chegada confirmada' : 'Deteccao simulada'}</Text>
        <Text style={styles.title}>Voce chegou ao hospital</Text>
        {knownArea ? (
          <>
            <Text style={styles.label}>Entrada detectada:</Text>
            <Text style={styles.area}>{areaData.name}</Text>
            <Text style={styles.entry}>{areaData.entranceName}</Text>
            <Text style={styles.text}>Hospital ativo carregado. BLE fisico ainda nao esta habilitado neste app Expo Go.</Text>
            <Pressable onPress={continueKnown} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Continuar no Navora</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.text}>Use a simulacao de entrada para desenvolvimento ou siga pela recepcao quando nao souber a unidade.</Text>
            <View style={styles.choices}>
              <MiniButton title="Simular entrada A" onPress={() => simulateBeacon('MBM04-01')} />
              <MiniButton title="Simular entrada B" onPress={() => simulateBeacon('MBM04-10')} />
              {showDevControls ? (
                <MiniButton title="Dev: simular beacon desconhecido" onPress={() => simulateBeacon('UNKNOWN-BEACON')} />
              ) : null}
              <MiniButton title="Nao sei, levar ate recepcao" onPress={() => chooseUnknown('unknown')} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function MiniButton({ title, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mini, pressed && styles.pressed]}>
      <Text style={styles.miniText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 30, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 22, alignItems: 'center', marginTop: 4 },
  beacon: { width: 82, height: 82, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadows.soft },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '900', textAlign: 'center', marginTop: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900', marginTop: 22 },
  area: { color: colors.primary, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  entry: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 4 },
  text: { color: colors.muted, fontSize: 14, lineHeight: 21, fontWeight: '800', textAlign: 'center', marginTop: 16 },
  primary: { height: 54, alignSelf: 'stretch', borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 22 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  choices: { alignSelf: 'stretch', gap: 10, marginTop: 22 },
  mini: { minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: colors.primary, backgroundColor: '#FFF7F8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  miniText: { color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
