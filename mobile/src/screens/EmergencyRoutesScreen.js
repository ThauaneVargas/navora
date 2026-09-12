import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

export default function EmergencyRoutesScreen({ navigate, goBack }) {
  return (
    <Screen>
      <Header title="Rotas de emergência" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.exitIcon}>
          <MaterialCommunityIcons name="exit-run" size={54} color={colors.primary} />
        </View>
        <Text style={styles.title}>Saída mais próxima</Text>
        <Text style={styles.safeRoute}>Rota segura pelo corredor principal</Text>
        <Text style={styles.distance}>Distância aproximada: 68 m</Text>
        <Text style={styles.distance}>Tempo estimado: 1 min</Text>
      </View>

      <View style={[styles.mapCard, shadows.card]}>
        <View style={styles.mapRoomA} />
        <View style={styles.mapRoomB} />
        <View style={styles.mapCorridor} />
        <View style={styles.escapeRoute} />
        <View style={styles.currentDot} />
        <View style={styles.exitDoor}>
          <MaterialCommunityIcons name="door-open" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.mapLabelStart}>Você</Text>
        <Text style={styles.mapLabelExit}>Saída</Text>
      </View>

      <View style={[styles.routeCard, shadows.card]}>
        <View style={styles.pathLine} />
        <Step icon="map-marker" title="Você está aqui" desc="Recepção / entrada principal" />
        <Step icon="arrow-right-top" title="Siga a sinalização verde" desc="Corredor principal por 32 m" />
        <Step icon="door-open" title="Saída de emergência" desc="Porta lateral próxima ao estacionamento" />
      </View>

      <Pressable
        onPress={() => navigate('Navigation')}
        style={({ pressed }) => [styles.mainButton, pressed && styles.pressed, shadows.soft]}
      >
        <MaterialCommunityIcons name="navigation-variant" size={20} color="#FFFFFF" />
        <Text style={styles.mainButtonText}>Iniciar rota de emergência</Text>
      </Pressable>

      <Pressable
        onPress={() => navigate('Help')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="hand-heart-outline" size={20} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>Avisar equipe</Text>
      </Pressable>
    </Screen>
  );
}

function Step({ icon, title, desc }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 16,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  exitIcon: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 18,
    textAlign: 'center',
  },
  safeRoute: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  distance: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  routeCard: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    position: 'relative',
  },
  mapCard: {
    height: 170,
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: '#F7F4F4',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  mapRoomA: {
    position: 'absolute',
    left: 18,
    top: 18,
    width: 96,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#E8E1E3',
  },
  mapRoomB: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 106,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#E8E1E3',
  },
  mapCorridor: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: 78,
    height: 34,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  escapeRoute: {
    position: 'absolute',
    left: 66,
    right: 62,
    top: 92,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  currentDot: {
    position: 'absolute',
    left: 60,
    top: 84,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  exitDoor: {
    position: 'absolute',
    right: 50,
    top: 74,
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabelStart: {
    position: 'absolute',
    left: 50,
    top: 110,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  mapLabelExit: {
    position: 'absolute',
    right: 48,
    top: 116,
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
  },
  pathLine: {
    position: 'absolute',
    left: 38,
    top: 44,
    bottom: 44,
    width: 3,
    borderRadius: 3,
    backgroundColor: colors.primarySoft,
  },
  step: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  stepDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 3,
  },
  mainButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
