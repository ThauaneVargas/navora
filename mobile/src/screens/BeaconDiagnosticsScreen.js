import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { PrimaryButton, SecondaryButton } from '../components/PremiumUI';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { NAVORA_IBEACON_UUID } from '../services/ibeacon';
import { indoorLocationService } from '../services/indoorLocationService';

// Tela SÓ DE TESTE (registrada em App.js e no menu só com isBeaconDiagnosticsEnabled):
// lista os beacons do Navora que o celular está ouvindo, pra testar em casa e
// calibrar no hospital. Ver docs/beacons-configuracao.md, "Calibração".
const ble = indoorLocationService.realBleProvider;

export default function BeaconDiagnosticsScreen({ goBack, navigate }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [status, setStatus] = useState(() => ble.getStatus());
  const [beacons, setBeacons] = useState(() => ble.getDetectedBeacons());

  useEffect(() => {
    const refresh = () => {
      setStatus(ble.getStatus());
      setBeacons(ble.getDetectedBeacons());
    };
    const timer = setInterval(refresh, 1000);
    return () => clearInterval(timer);
  }, []);

  const scanning = status.state === 'scanning';
  const startScan = () => ble.start().then(setStatus);
  const stopScan = () => setStatus(ble.stop());

  return (
    <Screen>
      <Header title="Diagnóstico de beacons" subtitle="Versão de teste" onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.label}>Situação</Text>
        <Text accessibilityLiveRegion="polite" style={styles.value}>{status.message || status.state}</Text>
        <Text style={styles.meta}>Estado: {status.state} · flag EXPO_PUBLIC_BLE_ENABLED: {indoorLocationService.isRealBleEnabled() ? 'ligada' : 'desligada'}</Text>
        <Text style={styles.meta}>Filtrando o UUID: {NAVORA_IBEACON_UUID}</Text>
        {scanning ? (
          <SecondaryButton title="Parar leitura" icon="stop-circle-outline" onPress={stopScan} />
        ) : (
          <PrimaryButton title="Iniciar leitura" icon="bluetooth" onPress={startScan} />
        )}
      </View>

      <Text style={styles.sectionTitle}>Beacons ouvidos ({beacons.length})</Text>
      {beacons.length === 0 ? (
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.meta}>
            Nenhum beacon do Navora ouvido ainda. Chegue perto de um aparelho e espere alguns segundos.
          </Text>
        </View>
      ) : (
        beacons.map((item) => (
          <View
            key={item.key}
            accessible
            accessibilityLabel={`${item.beacon?.label || 'Beacon não cadastrado'}, major ${item.major}, minor ${item.minor}, sinal médio ${Math.round(item.averageRssi)} dBm${item.isCurrent ? ', beacon atual' : ''}`}
            style={[styles.card, item.isCurrent && styles.currentCard, shadows.card]}
          >
            <Text style={styles.value}>
              {item.beacon?.label || 'Beacon do Navora não cadastrado no app'}
              {item.isCurrent ? '  · ATUAL' : ''}
            </Text>
            <Text style={styles.meta}>
              {item.beacon?.code || '—'} · Major {item.major} · Minor {item.minor} · MAC {item.deviceId || '—'}
            </Text>
            <Text style={styles.rssi}>
              RSSI médio {Math.round(item.averageRssi)} dBm (mediana {Math.round(item.medianRssi)}) · {item.count} leituras
            </Text>
            <Text style={styles.meta}>TX power anunciado {item.txPower} dBm · ouvido há {item.secondsAgo}s</Text>
          </View>
        ))
      )}

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.label}>Para calibrar</Text>
        <Text style={styles.meta}>
          Fique a 1 m do beacon, parado, por uns 30 segundos, e anote o RSSI médio: esse valor vai para o measuredPower do beacon. Faça no hospital, não em casa.
        </Text>
      </View>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginTop: 12, gap: 6 },
  currentCard: { borderColor: colors.primary, borderWidth: 2 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 20 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  value: { color: colors.text, fontSize: 15, fontWeight: '900' },
  rssi: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '600' },
});
