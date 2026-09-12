import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { useApp } from '../context/AppContext';
import { getAreaById, hospitalAreas } from '../data/routes';

export default function ArrivalDetectedScreen({ navigate, goBack, routeParams = {}, userProfile, onAreaDetected }) {
  const { appColors, isDark } = useApp();
  const styles = createStyles(appColors, isDark);

  const area = routeParams.area || 'unknown';
  const knownArea = area !== 'unknown';
  const areaData = knownArea ? getAreaById(area) : null;
  const selectedType = routeParams.userType || userProfile?.type;

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(iconScaleAnim, { toValue: 1, friction: 6, tension: 70, delay: 120, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const nextScreenForType = (nextArea) => {
    if (selectedType === 'visitor') return navigate('VisitorEntry', { area: nextArea });
    if (selectedType === 'patient') return navigate('PatientIdentification', { area: nextArea });
    return navigate('ProfileChoice', { area: nextArea });
  };

  const continueKnown = () => {
    onAreaDetected?.(area);
    nextScreenForType(area);
  };

  const chooseUnknown = (nextArea) => {
    onAreaDetected?.(nextArea === 'unknown' ? 'private' : nextArea);
    nextScreenForType(nextArea === 'unknown' ? 'private' : nextArea);
  };

  return (
    <Screen>
      <Header
        title={knownArea ? 'Voce chegou ao hospital' : 'Escolha sua entrada'}
        subtitle={knownArea ? 'Entrada confirmada para esta jornada.' : 'Confirme manualmente por onde voce entrou.'}
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />

      <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.iconRing, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[styles.iconInner, { transform: [{ scale: iconScaleAnim }] }]}>
            <MaterialCommunityIcons
              name={knownArea ? 'map-marker-check' : 'map-marker-question'}
              size={36}
              color="#FFFFFF"
            />
          </Animated.View>
        </Animated.View>

        <Text style={styles.kicker}>{knownArea ? 'Chegada confirmada' : 'Entrada manual'}</Text>
        <Text style={styles.title}>
          {knownArea ? 'Bem-vindo ao hospital' : 'Selecione sua entrada'}
        </Text>

        {knownArea ? (
          <>
            <View style={styles.areaRow}>
              <MaterialCommunityIcons name="hospital-building" size={18} color={appColors.primary} />
              <View style={styles.areaInfo}>
                <Text style={styles.areaName}>{areaData?.name}</Text>
                <Text style={styles.areaEntry}>{areaData?.entranceName}</Text>
              </View>
            </View>

            <Text style={styles.hint}>
              O Navora carregou o mapa a partir da sua entrada. Toque em continuar para iniciar.
            </Text>

            <Pressable
              onPress={continueKnown}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="navigation" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Continuar no Navora</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.hint}>
              Selecione uma das entradas disponiveis para que o Navora carregue o mapa correto.
            </Text>

            <View style={styles.choices}>
              {hospitalAreas.map((option) => (
                <AreaButton
                  key={option.id}
                  title={option.name}
                  subtitle={option.entranceName}
                  onPress={() => chooseUnknown(option.id)}
                  appColors={appColors}
                  styles={styles}
                />
              ))}
              <Pressable
                onPress={() => chooseUnknown('unknown')}
                style={({ pressed }) => [styles.unknownButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={18} color={appColors.muted} />
                <Text style={styles.unknownButtonText}>Nao sei, levar ate a recepcao</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </Screen>
  );
}

function AreaButton({ title, subtitle, onPress, appColors, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.areaButton, pressed && styles.pressed]}
    >
      <View style={styles.areaButtonIcon}>
        <MaterialCommunityIcons name="door-open" size={20} color={appColors.primary} />
      </View>
      <View style={styles.areaButtonText}>
        <Text style={styles.areaButtonTitle}>{title}</Text>
        {subtitle ? <Text style={styles.areaButtonSub}>{subtitle}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={appColors.muted} />
    </Pressable>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    card: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 24,
      alignItems: 'center',
      marginTop: 6,
      shadowColor: isDark ? '#000' : c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    iconRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: c.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    iconInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 6,
    },
    kicker: {
      color: c.primary,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      color: c.text,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '900',
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
    },
    areaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      alignSelf: 'stretch',
      backgroundColor: c.surfaceSoft || c.bg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.primary + '40',
      padding: 14,
      marginBottom: 16,
    },
    areaInfo: {
      flex: 1,
    },
    areaName: {
      color: c.primary,
      fontSize: 16,
      fontWeight: '900',
    },
    areaEntry: {
      color: c.muted,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    hint: {
      color: c.muted,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 20,
    },
    primaryButton: {
      height: 54,
      alignSelf: 'stretch',
      borderRadius: 18,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },
    choices: {
      alignSelf: 'stretch',
      gap: 8,
    },
    areaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 60,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.primary + '50',
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    areaButtonIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    areaButtonText: {
      flex: 1,
    },
    areaButtonTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: '900',
    },
    areaButtonSub: {
      color: c.muted,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 2,
    },
    unknownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      justifyContent: 'center',
    },
    unknownButtonText: {
      color: c.muted,
      fontSize: 13,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.982 }],
    },
  });
}
