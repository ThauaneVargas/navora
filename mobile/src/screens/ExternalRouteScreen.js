import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';


const cardShadow = {
  shadowColor: '#121316',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.07,
  shadowRadius: 24,
  elevation: 3,
};

const softShadow = {
  shadowColor: '#7D001F',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.14,
  shadowRadius: 20,
  elevation: 4,
};

const HOSPITAL_ENTRANCES = {
  sus: {
    id: 'sus',
    label: 'Entrada SUS',
    shortName: 'SUS',
    hospitalName: 'Hospital Marco Capute',
    address: 'Av. Expedicionário Oswaldo de Almeida Ramos, 280, Centro, Vassouras - RJ, CEP 27700-000',
    mapQuery: 'Hospital Marco Capute, Av. Expedicionário Oswaldo de Almeida Ramos, 280, Centro, Vassouras - RJ, 27700-000',
    googleMapsUrl: 'https://maps.app.goo.gl/M6xeehqrGhLXTyE79',
    // Pin marcado pelo usuário na entrada real (frente, ao lado do corpo de bombeiros).
    coordinates: {
      latitude: -22.4013901,
      longitude: -43.6555672,
    },
  },
  private: {
    id: 'private',
    label: 'Entrada Particular',
    shortName: 'Particular',
    hospitalName: 'HMC Private',
    address: 'Rua Ronaldo Fiuza Manhães, 1, Centro, Vassouras - RJ, CEP 27700-000',
    mapQuery: 'HMC Private, Rua Ronaldo Fiuza Manhães, 1, Centro, Vassouras - RJ, 27700-000',
    googleMapsUrl: 'https://maps.app.goo.gl/ZQs94Mjs3b6N36RH7',
    // Pin marcado pelo usuário na entrada real (fundos, Rua da Betânia com Rua da CEDAE).
    coordinates: {
      latitude: -22.4030702,
      longitude: -43.6530921,
    },
  },
};

const MAP_HEIGHT = 196;

export default function ExternalRouteScreen({ navigate, goBack, routeParams = {}, activeHospital }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentMaxWidth = Math.min(width, 430);
  const initialEntrance = HOSPITAL_ENTRANCES[routeParams.area] ? routeParams.area : 'sus';
  const [selectedEntrance, setSelectedEntrance] = useState(initialEntrance);
  const entrance = HOSPITAL_ENTRANCES[selectedEntrance];
  const { latitude, longitude } = entrance.coordinates;
  // Navigation URLs: use coordinates so the app routes FROM user's current location TO the hospital
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  const arrivalParams = {
    userType: routeParams.userType,
    area: entrance.id,
    selectedEntrance: entrance.id,
    entranceId: entrance.id,
    entranceLabel: entrance.label,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 32) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View style={styles.topBar}>
            <IconButton icon="chevron-left" onPress={() => goBack?.()} />
            <IconButton icon="menu" onPress={() => navigate('Menu')} />
          </View>

          <View style={styles.hero}>
            <Text style={styles.kicker}>{t('externalRoute.kicker')}</Text>
            <Text style={styles.title}>
              {t('externalRoute.titleA')}{'\n'}
              <Text style={styles.titleAccent}>{t('externalRoute.titleB')}</Text>
            </Text>
            <Text style={styles.subtitle}>
              {t('externalRoute.subtitleA')}{'\n'}
              {t('externalRoute.subtitleB')}
            </Text>
          </View>

          <Text style={styles.selectorTitle}>{t('externalRoute.chooseEntrance')}</Text>
          <View style={styles.entranceSelector}>
            {Object.values(HOSPITAL_ENTRANCES).map((option) => (
              <EntranceCard
                key={option.id}
                entrance={option}
                selected={selectedEntrance === option.id}
                onPress={() => setSelectedEntrance(option.id)}
              />
            ))}
          </View>

          <View style={[styles.mapCard, cardShadow]}>
            <MapPreview entrance={entrance} />
          </View>

          <View style={[styles.addressCard, cardShadow]}>
            <View style={styles.addressIconBox}>
              <MaterialCommunityIcons name="map-marker" size={25} color={colors.primary} />
            </View>
            <View style={styles.addressCopy}>
              <Text style={styles.addressLabel}>{t('externalRoute.address')}</Text>
              <Text style={styles.hospitalName}>{entrance.hospitalName}</Text>
              <Text style={styles.address}>{entrance.address}</Text>
              <View style={styles.confirmedRow}>
                <Text style={styles.confirmedText}>{t(`externalRoute.entrance_${entrance.id}`)}</Text>
                <MaterialCommunityIcons name="information-outline" size={14} color={colors.primary} />
              </View>
            </View>
          </View>

          <RouteButton
            icon="google-maps"
            iconBackground={colors.surfaceAlt}
            title={t('externalRoute.openGoogle')}
            subtitle={t('externalRoute.routeToHospital')}
            onPress={() => Linking.openURL(mapsUrl)}
          />

          <RouteButton
            icon="waze"
            iconBackground="#EAF7FF"
            title={t('externalRoute.openWaze')}
            subtitle={t('externalRoute.routeToHospital')}
            onPress={() => Linking.openURL(wazeUrl)}
          />

          <Pressable
            onPress={() => navigate('ArrivalPreparation', arrivalParams)}
            style={({ pressed }) => [styles.arrivalButton, pressed && styles.pressed, softShadow]}
          >
            <MaterialCommunityIcons name="map-marker" size={28} color="#FFFFFF" />
            <View style={styles.arrivalCopy}>
              <Text style={styles.arrivalTitle}>{t('externalRoute.arrived')}</Text>
              <Text style={styles.arrivalSubtitle}>{t('externalRoute.confirmLocation')}</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EntranceCard({ entrance, selected, onPress }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.entranceCard,
        selected && styles.entranceCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons
        name={entrance.id === 'sus' ? 'hospital-building' : 'office-building-marker-outline'}
        size={24}
        color={selected ? colors.primary : colors.muted}
      />
      <View style={styles.entranceCopy}>
        <Text style={[styles.entranceText, selected && styles.entranceTextSelected]}>{t(`externalRoute.short_${entrance.id}`)}</Text>
        <Text style={styles.entranceSubtitle} numberOfLines={1}>{entrance.hospitalName}</Text>
      </View>
      <MaterialCommunityIcons
        name={selected ? 'check-circle' : 'circle-outline'}
        size={20}
        color={selected ? colors.primary : '#B5BAC2'}
      />
    </Pressable>
  );
}

function IconButton({ icon, onPress }) {
  const { appColors: colors } = useApp();
  const styles = useThemeStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, cardShadow]}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.text} />
    </Pressable>
  );
}

function MapPreview({ entrance }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  const { coordinates } = entrance;
  const mapRef = useRef(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => setHasLocationPermission(status === 'granted'))
      .catch(() => setHasLocationPermission(false));
  }, []);

  const recenter = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      300
    );
  };

  return (
    <View style={styles.mapSurface}>
      <MapView
        key={entrance.id}
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        <Marker coordinate={coordinates} title={entrance.hospitalName} description={t(`externalRoute.entrance_${entrance.id}`)} />
      </MapView>

      <View style={styles.entranceMapTag}>
        <Text style={styles.entranceMapText} numberOfLines={1}>{t(`externalRoute.entrance_${entrance.id}`)}</Text>
      </View>

      <Pressable onPress={recenter} style={({ pressed }) => [styles.locateButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

function RouteButton({ icon, iconBackground, title, subtitle, onPress }) {
  const { appColors: colors } = useApp();
  const styles = useThemeStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.routeButton, pressed && styles.pressed, cardShadow]}>
      <View style={[styles.routeIconBox, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={30} color={icon === 'waze' ? colors.text : '#4285F4'} />
      </View>
      <View style={styles.routeCopy}>
        <Text style={styles.routeTitle}>{title}</Text>
        <Text style={styles.routeSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="open-in-new" size={21} color={colors.primary} />
    </Pressable>
  );
}

// Estilos acompanham o tema (claro/escuro); antes usavam a paleta fixa do
// tema claro e não mudavam no modo noturno.
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: colors.background,
  },

  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 18,
  },

  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    position: 'relative',
    paddingBottom: 16,
    overflow: 'hidden',
  },

  kicker: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '800',
  },

  titleAccent: {
    color: colors.primary,
  },

  subtitle: {
    width: '100%',
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 8,
  },

  selectorTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 10,
  },

  entranceSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  entranceCard: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  entranceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },

  entranceCopy: {
    flex: 1,
    minWidth: 0,
  },

  entranceText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
  },

  entranceTextSelected: {
    color: colors.primary,
  },

  entranceSubtitle: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 1,
  },

  mapCard: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 6,
    marginTop: 0,
    marginBottom: 10,
  },

  mapSurface: {
    height: MAP_HEIGHT,
    borderRadius: 18,
    backgroundColor: colors.backgroundSoft,
    overflow: 'hidden',
    position: 'relative',
  },

  entranceMapTag: {
    position: 'absolute',
    left: 12,
    bottom: 18,
    zIndex: 3,
    minHeight: 28,
    maxWidth: 156,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    justifyContent: 'center',
    ...cardShadow,
  },

  entranceMapText: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },

  locateButton: {
    position: 'absolute',
    right: 12,
    bottom: 22,
    zIndex: 3,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },

  addressCard: {
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  addressIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addressCopy: {
    flex: 1,
    minWidth: 0,
  },

  addressLabel: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  hospitalName: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 3,
  },

  address: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },

  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },

  confirmedText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },

  routeButton: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  routeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  routeCopy: {
    flex: 1,
    minWidth: 0,
  },

  routeTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },

  routeSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 2,
  },

  arrivalButton: {
    height: 66,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  arrivalCopy: {
    minWidth: 0,
  },

  arrivalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },

  arrivalSubtitle: {
    color: '#FDE7ED',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 2,
  },

  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
