import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const nearbyPlaces = [
  { icon: 'account-tie-outline', label: 'Recepcao principal', distance: '18 m', screen: 'Navigation' },
  { icon: 'elevator-passenger-outline', label: 'Elevador A', distance: '24 m', screen: 'Navigation' },
  { icon: 'radioactive-circle-outline', label: 'Setor de Imagem', distance: '42 m', screen: 'Search' },
];

const actions = [
  {
    icon: 'map-marker-path',
    label: 'Recalcular minha rota',
    subtitle: 'Tracar nova rota a partir daqui',
    screen: 'Navigation',
    variant: 'primary',
  },
  {
    icon: 'robot-happy-outline',
    label: 'Falar com a IA',
    subtitle: 'Orientacao passo a passo',
    screen: 'Assistant',
    variant: 'secondary',
  },
  {
    icon: 'magnify',
    label: 'Ver outros destinos',
    subtitle: 'Buscar outro local no hospital',
    screen: 'Search',
    variant: 'ghost',
  },
  {
    icon: 'bell-ring-outline',
    label: 'Chamar ajuda',
    subtitle: 'Acionar suporte humano',
    screen: 'Help',
    variant: 'danger',
  },
];

export default function LostScreen({ navigate, goBack }) {
  const { appColors, isDark } = useApp();
  const styles = useMemo(() => createStyles(appColors, isDark), [appColors, isDark]);
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Screen>
      <Header title="Estou perdido" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.locationRow, shadows.soft]}>
        <View style={styles.pingContainer}>
          <Animated.View style={[styles.pingRing, { transform: [{ scale: pulse }], opacity: pulseOpacity }]} />
          <View style={styles.pingDot}>
            <MaterialCommunityIcons name="crosshairs-gps" size={17} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationLabel}>Voce esta em</Text>
          <Text style={styles.locationName}>Recepcao Principal</Text>
          <Text style={styles.locationSub}>Corredor Principal · entrada confirmada</Text>
        </View>
        <View style={styles.liveChip}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={[styles.aiCard, shadows.card]}>
        <View style={styles.aiIconWrap}>
          <MaterialCommunityIcons name="robot-happy-outline" size={27} color="#FFFFFF" />
        </View>
        <View style={styles.aiCopy}>
          <Text style={styles.aiTitle}>Sem problema, eu te oriento.</Text>
          <Text style={styles.aiText}>
            Posso recalcular sua rota, abrir o mapa ou guiar voce passo a passo.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Destinos proximos</Text>
      <View style={[styles.nearbyCard, shadows.card]}>
        {nearbyPlaces.map((place, index) => (
          <Pressable
            key={place.label}
            onPress={() => navigate(place.screen)}
            style={({ pressed }) => [
              styles.nearbyItem,
              index < nearbyPlaces.length - 1 && styles.nearbyBorder,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.nearbyIconWrap}>
              <MaterialCommunityIcons name={place.icon} size={19} color={appColors.primary} />
            </View>
            <Text style={styles.nearbyLabel} numberOfLines={1}>{place.label}</Text>
            <Text style={styles.nearbyDistance}>{place.distance}</Text>
            <MaterialCommunityIcons name="chevron-right" size={17} color={appColors.muted} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>O que deseja fazer?</Text>
      {actions.map((action) => (
        <ActionCard
          key={action.label}
          action={action}
          navigate={navigate}
          styles={styles}
          appColors={appColors}
        />
      ))}
    </Screen>
  );
}

function ActionCard({ action, navigate, styles, appColors }) {
  const isPrimary = action.variant === 'primary';
  const isDanger = action.variant === 'danger';

  return (
    <Pressable
      onPress={() => navigate(action.screen)}
      style={({ pressed }) => [
        styles.actionCard,
        isPrimary && styles.actionCardPrimary,
        isDanger && styles.actionCardDanger,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          isPrimary && styles.actionIconPrimary,
          isDanger && styles.actionIconDanger,
        ]}
      >
        <MaterialCommunityIcons
          name={action.icon}
          size={22}
          color={isPrimary || isDanger ? '#FFFFFF' : appColors.primary}
        />
      </View>
      <View style={styles.actionCopy}>
        <Text
          style={[
            styles.actionLabel,
            isPrimary && styles.actionLabelPrimary,
            isDanger && styles.actionLabelDanger,
          ]}
        >
          {action.label}
        </Text>
        <Text style={[styles.actionSub, isPrimary && styles.actionSubPrimary]}>
          {action.subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={isPrimary || isDanger ? 'rgba(255,255,255,0.65)' : appColors.muted}
      />
    </Pressable>
  );
}

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    locationRow: {
      marginTop: 16,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    pingContainer: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pingRing: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
    },
    pingDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 4,
    },
    locationCopy: {
      flex: 1,
      minWidth: 0,
    },
    locationLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    locationName: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
      marginTop: 2,
    },
    locationSub: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    liveChip: {
      backgroundColor: colors.success ?? '#168A4A',
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    liveText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
    },
    aiCard: {
      marginTop: 14,
      borderRadius: 22,
      backgroundColor: isDark ? colors.surfaceAlt : colors.primarySoft,
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.borderStrong,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    aiIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 4,
    },
    aiCopy: {
      flex: 1,
      minWidth: 0,
    },
    aiTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
    },
    aiText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
      lineHeight: 19,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
      marginTop: 20,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    nearbyCard: {
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    nearbyItem: {
      minHeight: 56,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    nearbyBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    nearbyIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nearbyLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    nearbyDistance: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '900',
      marginRight: 2,
    },
    actionCard: {
      minHeight: 70,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionCardPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryDark,
    },
    actionCardDanger: {
      backgroundColor: isDark ? '#2A171B' : '#FFF2F4',
      borderColor: isDark ? '#4A252C' : '#F4C8CE',
    },
    actionIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionIconPrimary: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    actionIconDanger: {
      backgroundColor: isDark ? '#3A1A20' : '#FFE4E8',
    },
    actionCopy: {
      flex: 1,
      minWidth: 0,
    },
    actionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
    },
    actionLabelPrimary: {
      color: '#FFFFFF',
    },
    actionLabelDanger: {
      color: colors.danger,
    },
    actionSub: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 3,
    },
    actionSubPrimary: {
      color: 'rgba(255,255,255,0.75)',
    },
    pressed: {
      opacity: 0.86,
      transform: [{ scale: 0.985 }],
    },
  });
