import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

const hospitalImage = require('../../assets/images/hmc_hospital.jpg');
const address = 'Rua Ronaldo Fiuza Manhaes, no 1, Centro, Vassouras - RJ';
const encodedAddress = encodeURIComponent(address);

export default function HowToGetScreen({ navigate, goBack }) {
  const [locating, setLocating] = useState(false);

  const openMap = async (provider) => {
    setLocating(true);
    let origin = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        origin = `${pos.coords.latitude},${pos.coords.longitude}`;
      } else {
        Alert.alert(
          'Localização não disponível',
          'Não foi possível obter sua localização atual. O mapa vai abrir com o destino do hospital, mas sem rota a partir da sua posição.',
          [{ text: 'Entendi', style: 'default' }]
        );
      }
    } catch {
      // silent — fallback para URL sem origem
    } finally {
      setLocating(false);
    }

    let url;
    if (provider === 'google') {
      url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodedAddress}`
        : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    } else if (provider === 'apple') {
      url = origin
        ? `http://maps.apple.com/?saddr=${origin}&daddr=${encodedAddress}`
        : `http://maps.apple.com/?q=${encodedAddress}`;
    } else {
      url = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
    }

    Linking.openURL(url);
  };

  return (
    <Screen>
      <Header title="Como chegar ao hospital" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <Image source={hospitalImage} resizeMode="cover" style={styles.heroImage} />

      <View style={[styles.addressCard, shadows.card]}>
        <Text style={styles.kicker}>Abra a rota até a entrada principal.</Text>
        <Text style={styles.address}>Rua Ronaldo Fiuza Manhaes, no 1</Text>
        <Text style={styles.city}>Centro, Vassouras - RJ</Text>
      </View>

      <Text style={styles.sectionTitle}>Abrir no seu mapa favorito</Text>
      <View style={[styles.options, shadows.card]}>
        <MapOption icon="google-maps" title="Google Maps" onPress={() => openMap('google')} loading={locating} />
        <MapOption icon="apple" title="Apple Maps" onPress={() => openMap('apple')} loading={locating} />
        <MapOption icon="waze" title="Waze" onPress={() => openMap('waze')} last loading={locating} />
      </View>

      <View style={[styles.infoCard, shadows.card]}>
        <MaterialCommunityIcons name="map-marker-check-outline" size={22} color={colors.primary} />
        <Text style={styles.infoText}>
          Ao chegar no hospital, confirme sua entrada no Navora para liberar a navegação interna.
        </Text>
      </View>
    </Screen>
  );
}

function MapOption({ icon, title, onPress, last, loading }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.option, !last && styles.optionBorder, (pressed || loading) && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={23} color={colors.primary} />
      <Text style={styles.optionText}>{title}</Text>
      {loading
        ? <ActivityIndicator size="small" color={colors.muted} />
        : <MaterialCommunityIcons name="chevron-right" size={21} color={colors.muted} />}
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
