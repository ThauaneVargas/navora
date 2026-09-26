import React from 'react';
import { Alert, View, Text, StyleSheet, Pressable, Image, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

const hospitalImage = require('../../assets/images/hmc_hospital.jpg');
const address = 'Rua Ronaldo Fiuza Manhaes, no 1, Centro, Vassouras - RJ';
const encodedAddress = encodeURIComponent(address);

export default function HowToGetScreen({ navigate, goBack }) {
  const openMap = (provider) => {
    const urls = {
      google: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      apple: `http://maps.apple.com/?q=${encodedAddress}`,
      waze: `https://waze.com/ul?q=${encodedAddress}&navigate=yes`,
    };

    const url = provider === 'auto' && Platform.OS === 'ios' ? urls.apple : urls[provider === 'auto' ? 'google' : provider];
    Linking.openURL(url).catch(() => {
      // Sem app de mapas/navegador capaz de abrir o link: tenta o Google Maps na web
      // e, se tambem falhar, mostra o endereco para o usuario seguir manualmente.
      const openFallback = url === urls.google ? Promise.reject() : Linking.openURL(urls.google);
      openFallback.catch(() => {
        Alert.alert('Nao foi possivel abrir o mapa', `Endereco do hospital:\n${address}`);
      });
    });
  };

  return (
    <Screen>
      <Header title="Como chegar ao hospital" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <Image source={hospitalImage} resizeMode="cover" style={styles.heroImage} />

      <View style={[styles.addressCard, shadows.card]}>
        <Text style={styles.kicker}>Abra a rota ate a entrada principal.</Text>
        <Text style={styles.address}>Rua Ronaldo Fiuza Manhaes, no 1</Text>
        <Text style={styles.city}>Centro, Vassouras - RJ</Text>
      </View>

      <Text style={styles.sectionTitle}>Abrir no seu mapa favorito</Text>
      <View style={[styles.options, shadows.card]}>
        <MapOption icon="google-maps" title="Google Maps" onPress={() => openMap('google')} />
        <MapOption icon="apple" title="Apple Maps" onPress={() => openMap('apple')} />
        <MapOption icon="waze" title="Waze" onPress={() => openMap('waze')} last />
      </View>

      <View style={[styles.infoCard, shadows.card]}>
        <MaterialCommunityIcons name="bluetooth-connect" size={22} color={colors.primary} />
        <Text style={styles.infoText}>
          Ao chegar no hospital, o Navora ira detectar os beacons MBM04 e a navegacao interna sera ativada.
        </Text>
      </View>
    </Screen>
  );
}

function MapOption({ icon, title, onPress, last }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, !last && styles.optionBorder, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={icon} size={23} color={colors.primary} />
      <Text style={styles.optionText}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={21} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 188,
    borderRadius: 24,
    marginTop: 14,
    backgroundColor: colors.surfaceSoft,
  },
  addressCard: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginTop: 12,
  },
  kicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  address: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  city: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10,
  },
  options: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  option: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  infoCard: {
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
