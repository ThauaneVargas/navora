import React, { useState } from 'react';
import {
  Linking,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  burgundy: '#980027',
  burgundyDark: '#7D001F',
  burgundyLight: '#FFF6F8',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  text: '#202124',
  secondary: '#696B70',
  border: '#E4E4E6',
};

const cardShadow = {
  shadowColor: '#121316',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.07,
  shadowRadius: 24,
  elevation: 3,
};

const softShadow = {
  shadowColor: COLORS.burgundyDark,
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
    googleMapsUrl: 'https://maps.app.goo.gl/DetdpQ3aXDnCGHqm7',
    coordinates: {
      latitude: -22.40921,
      longitude: -43.66402,
    },
  },
  private: {
    id: 'private',
    label: 'Entrada Particular',
    shortName: 'Particular',
    hospitalName: 'HMC Private',
    address: 'Rua Ronaldo Fiuza Manhães, 1, Centro, Vassouras - RJ, CEP 27700-000',
    mapQuery: 'HMC Private, Rua Ronaldo Fiuza Manhães, 1, Centro, Vassouras - RJ, 27700-000',
    googleMapsUrl: 'https://maps.app.goo.gl/VEsdFiPiorHj5UR99',
    // Nominatim currently resolves the street, not the exact number. Replace with entrance-level GPS when available.
    coordinates: {
      latitude: -22.4065817,
      longitude: -43.6558581,
    },
  },
};

const MAP_TILE_SIZE = 256;
const MAP_HEIGHT = 196;
const MAP_ZOOM = 14;

export default function ExternalRouteScreen({ navigate, goBack, routeParams = {}, activeHospital }) {
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
            <Text style={styles.kicker}>COMO CHEGAR</Text>
            <Text style={styles.title}>
              Como chegar{'\n'}
              <Text style={styles.titleAccent}>ao hospital</Text>
            </Text>
            <Text style={styles.subtitle}>
              Escolha sua entrada e seu app de navegação.{'\n'}
              Ao chegar, o Navora continua sua rota dentro do hospital.
            </Text>
          </View>

          <Text style={styles.selectorTitle}>Escolha a entrada</Text>
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
              <MaterialCommunityIcons name="map-marker" size={25} color={COLORS.burgundy} />
            </View>
            <View style={styles.addressCopy}>
              <Text style={styles.addressLabel}>ENDEREÇO</Text>
              <Text style={styles.hospitalName}>{entrance.hospitalName}</Text>
              <Text style={styles.address}>{entrance.address}</Text>
              <View style={styles.confirmedRow}>
                <Text style={styles.confirmedText}>{entrance.label}</Text>
                <MaterialCommunityIcons name="information-outline" size={14} color={COLORS.burgundy} />
              </View>
            </View>
          </View>

          <RouteButton
            icon="google-maps"
            iconBackground="#FFF6F8"
            title="Abrir no Google Maps"
            subtitle="Traçar rota até o hospital"
            onPress={() => Linking.openURL(mapsUrl)}
          />

          <RouteButton
            icon="waze"
            iconBackground="#EAF7FF"
            title="Abrir no Waze"
            subtitle="Traçar rota até o hospital"
            onPress={() => Linking.openURL(wazeUrl)}
          />

          <Pressable
            onPress={() => navigate('ArrivalPreparation', arrivalParams)}
            style={({ pressed }) => [styles.arrivalButton, pressed && styles.pressed, softShadow]}
          >
            <MaterialCommunityIcons name="map-marker" size={28} color="#FFFFFF" />
            <View style={styles.arrivalCopy}>
              <Text style={styles.arrivalTitle}>Cheguei ao hospital</Text>
              <Text style={styles.arrivalSubtitle}>Confirmar minha localização</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EntranceCard({ entrance, selected, onPress }) {
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
        color={selected ? COLORS.burgundy : COLORS.secondary}
      />
      <View style={styles.entranceCopy}>
        <Text style={[styles.entranceText, selected && styles.entranceTextSelected]}>{entrance.shortName}</Text>
        <Text style={styles.entranceSubtitle} numberOfLines={1}>{entrance.hospitalName}</Text>
      </View>
      <MaterialCommunityIcons
        name={selected ? 'check-circle' : 'circle-outline'}
        size={20}
        color={selected ? COLORS.burgundy : '#B5BAC2'}
      />
    </Pressable>
  );
}

function IconButton({ icon, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, cardShadow]}>
      <MaterialCommunityIcons name={icon} size={24} color={COLORS.text} />
    </Pressable>
  );
}

function getMapTile({ latitude, longitude }, zoom) {
  const latitudeRadians = latitude * Math.PI / 180;
  const scale = 2 ** zoom;
  const x = (longitude + 180) / 360 * scale;
  const y = (1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2 * scale;

  return {
    x: Math.floor(x),
    y: Math.floor(y),
    offsetX: x - Math.floor(x),
    offsetY: y - Math.floor(y),
  };
}

function MapPreview({ entrance }) {
  const { width } = useWindowDimensions();
  const { coordinates } = entrance;
  const mapWidth = Math.max(260, Math.min(width, 430) - 48);
  const tile = coordinates ? getMapTile(coordinates, MAP_ZOOM) : null;
  const tileOffsets = [-1, 0, 1];
  const tileSource = (x, y) => `https://tile.openstreetmap.org/${MAP_ZOOM}/${x}/${y}.png`;
  const tilePosition = tile
    ? {
        left: mapWidth / 2 - (1 + tile.offsetX) * MAP_TILE_SIZE,
        top: MAP_HEIGHT / 2 - (1 + tile.offsetY) * MAP_TILE_SIZE,
      }
    : null;
  const mapUrl = entrance.googleMapsUrl
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entrance.mapQuery || entrance.address)}`;

  return (
    <Pressable onPress={() => Linking.openURL(mapUrl)} style={({ pressed }) => [styles.mapSurface, pressed && styles.pressed]}>
      {tile ? (
        <View style={[styles.tileMap, tilePosition]}>
          {tileOffsets.map((rowOffset) => (
            <View key={rowOffset} style={styles.tileRow}>
              {tileOffsets.map((columnOffset) => (
                <Image
                  key={`${columnOffset}-${rowOffset}`}
                  source={{ uri: tileSource(tile.x + columnOffset, tile.y + rowOffset) }}
                  style={styles.mapTile}
                  resizeMode="cover"
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.centerMapPin}>
        <MaterialCommunityIcons name="map-marker" size={36} color="#E94235" />
      </View>

      <View style={styles.mapLabel}>
        <MaterialCommunityIcons name="hospital-building" size={15} color={COLORS.text} />
        <View style={styles.mapLabelCopy}>
          <Text style={styles.mapLabelText} numberOfLines={1}>{entrance.hospitalName}</Text>
          <Text style={styles.mapLabelMeta} numberOfLines={1}>{entrance.label}</Text>
        </View>
      </View>

      <View style={styles.entranceMapTag}>
        <Text style={styles.entranceMapText} numberOfLines={1}>{entrance.label}</Text>
      </View>

      <View style={styles.locateButton}>
        <MaterialCommunityIcons name="crosshairs-gps" size={18} color={COLORS.text} />
      </View>

      <View style={styles.mapFooter}>
        <Text style={styles.mapFooterText}>Dados cartograficos OpenStreetMap</Text>
      </View>
    </Pressable>
  );
}

function RouteButton({ icon, iconBackground, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.routeButton, pressed && styles.pressed, cardShadow]}>
      <View style={[styles.routeIconBox, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons name={icon} size={30} color={icon === 'waze' ? '#202124' : '#4285F4'} />
      </View>
      <View style={styles.routeCopy}>
        <Text style={styles.routeTitle}>{title}</Text>
        <Text style={styles.routeSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="open-in-new" size={21} color={COLORS.burgundy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: COLORS.background,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    position: 'relative',
    paddingBottom: 16,
    overflow: 'hidden',
  },

  kicker: {
    color: COLORS.burgundy,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },

  title: {
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '800',
  },

  titleAccent: {
    color: COLORS.burgundy,
  },

  subtitle: {
    width: '100%',
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 8,
  },

  selectorTitle: {
    color: COLORS.text,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  entranceCardSelected: {
    borderColor: COLORS.burgundy,
    backgroundColor: COLORS.burgundyLight,
  },

  entranceCopy: {
    flex: 1,
    minWidth: 0,
  },

  entranceText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
  },

  entranceTextSelected: {
    color: COLORS.burgundy,
  },

  entranceSubtitle: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 1,
  },

  mapCard: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    padding: 6,
    marginTop: 0,
    marginBottom: 10,
  },

  mapSurface: {
    height: MAP_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#E7EDF2',
    overflow: 'hidden',
    position: 'relative',
  },

  tileMap: {
    position: 'absolute',
    width: MAP_TILE_SIZE * 3,
    height: MAP_TILE_SIZE * 3,
    zIndex: 0,
  },

  tileRow: {
    flexDirection: 'row',
  },

  mapTile: {
    width: MAP_TILE_SIZE,
    height: MAP_TILE_SIZE,
  },

  centerMapPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -18,
    marginTop: -32,
    zIndex: 2,
  },

  mapLabel: {
    position: 'absolute',
    right: 22,
    top: 60,
    zIndex: 3,
    maxWidth: 172,
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...cardShadow,
  },

  mapLabelCopy: {
    flex: 1,
    minWidth: 0,
  },

  mapLabelText: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },

  mapLabelMeta: {
    color: COLORS.burgundy,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
  },

  entranceMapTag: {
    position: 'absolute',
    left: 12,
    bottom: 18,
    zIndex: 3,
    minHeight: 28,
    maxWidth: 156,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    justifyContent: 'center',
    ...cardShadow,
  },

  entranceMapText: {
    color: COLORS.burgundy,
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
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },

  mapFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    minHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  mapFooterText: {
    color: COLORS.text,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
  },

  addressCard: {
    borderRadius: 16,
    backgroundColor: COLORS.burgundyLight,
    borderWidth: 1,
    borderColor: '#F4DDE4',
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
    backgroundColor: '#FFE8EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addressCopy: {
    flex: 1,
    minWidth: 0,
  },

  addressLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  hospitalName: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 3,
  },

  address: {
    color: COLORS.secondary,
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
    color: COLORS.burgundy,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },

  routeButton: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },

  routeSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 2,
  },

  arrivalButton: {
    height: 66,
    borderRadius: 18,
    backgroundColor: COLORS.burgundy,
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
