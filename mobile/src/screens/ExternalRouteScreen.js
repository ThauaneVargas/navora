import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

const address = 'Rua Ronaldo Fiuza Manhaes, no 1 - Centro, Vassouras - RJ';

const areaCopy = {
  private: { title: 'Rota ate o HMC Private', subtitle: 'Entrada pelos fundos' },
  sus: { title: 'Rota ate o Hospital Marco Capute', subtitle: 'Entrada pela frente' },
  unknown: { title: 'Vamos te levar ate a recepcao', subtitle: 'A recepcao ira confirmar seu atendimento.' },
};

export default function ExternalRouteScreen({ navigate, goBack, routeParams = {} }) {
  const area = routeParams.area || 'unknown';
  const copy = areaCopy[area] || areaCopy.unknown;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

  return (
    <Screen>
      <Header title={copy.title} subtitle={copy.subtitle} onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.pin}>
          <MaterialCommunityIcons name="map-marker-radius" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Entrada correta selecionada</Text>
        <Text style={styles.subtitle}>Abra sua rota favorita ou simule a chegada para continuar por dentro do hospital.</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressLabel}>Endereco</Text>
          <Text style={styles.address}>{address}</Text>
        </View>
      </View>

      <RouteButton icon="google-maps" title="Abrir no Google Maps" onPress={() => Linking.openURL(mapsUrl)} />
      <RouteButton icon="navigation-variant" title="Abrir no Waze" onPress={() => Linking.openURL(wazeUrl)} />
      <RouteButton icon="format-list-checks" title="Ver instrucoes" onPress={() => navigate('HowToGet', { area })} />
      <Pressable onPress={() => navigate('ArrivalDetected', { area })} style={({ pressed }) => [styles.arrivalButton, pressed && styles.pressed, shadows.soft]}>
        <MaterialCommunityIcons name="bluetooth-connect" size={20} color="#FFFFFF" />
        <Text style={styles.arrivalText}>Simular chegada ao hospital</Text>
      </Pressable>
    </Screen>
  );
}

function RouteButton({ icon, title, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed, shadows.card]}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <Text style={styles.buttonText}>{title}</Text>
      <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderRadius: 30, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 20, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  pin: { width: 82, height: 82, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadows.soft },
  title: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  addressBox: { alignSelf: 'stretch', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF7F8', padding: 14, marginTop: 18 },
  addressLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  address: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '800', marginTop: 5 },
  button: { minHeight: 60, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  buttonText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' },
  arrivalButton: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 16 },
  arrivalText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
