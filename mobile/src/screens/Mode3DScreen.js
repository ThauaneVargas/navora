import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function Mode3DScreen({ navigate, goBack, activeRoute: selectedRoute, navigationProgress }) {
  const { activeRoute: fallbackRoute } = useApp();
  const activeRoute = selectedRoute || fallbackRoute;
  const routeSteps = Array.isArray(activeRoute?.steps) ? activeRoute.steps : [];
  const hasKnownProgress = Boolean(navigationProgress?.progressKnown);
  const arrived = Boolean(navigationProgress?.arrived);
  const blockedApiRoute = activeRoute?.source === 'api' && activeRoute?.routeFound === false;
  const fallbackStep = routeSteps.find((step) => step?.type !== 'ARRIVAL') || null;
  const currentStep = hasKnownProgress && navigationProgress?.currentStep
    ? navigationProgress.currentStep
    : fallbackStep;
  const nextNode = navigationProgress?.nextNode || null;
  const currentFloor = navigationProgress?.currentFloor || null;
  const destinationLabel = (navigationProgress?.redirected || activeRoute?.redirected)
    ? activeRoute?.effectiveDestination?.name || activeRoute?.destination
    : activeRoute?.destination;
  const distanceLabel = activeRoute?.distance || (
    activeRoute?.totalDistance !== null && activeRoute?.totalDistance !== undefined
      ? `${Math.round(activeRoute.totalDistance)} m`
      : '---'
  );
  const etaLabel = activeRoute?.eta || activeRoute?.time || (
    activeRoute?.estimatedTime
      ? `${Math.max(1, Math.ceil(Number(activeRoute.estimatedTime) / 60))} min`
      : '---'
  );
  const sceneTitle = blockedApiRoute
    ? 'Rota indisponivel'
    : arrived
      ? 'Destino'
      : currentStep?.type === 'ARRIVAL'
        ? 'Destino'
        : 'Siga em frente';
  const sceneLabel = blockedApiRoute
    ? 'Sem rota'
    : arrived
      ? 'Chegada'
      : 'Proximo passo';
  const distanceTitle = arrived
    ? '0 m'
    : currentStep?.distance
      ? `${Math.round(currentStep.distance)} m`
      : distanceLabel;
  const distanceContext = currentFloor || nextNode?.label || nextNode?.code || currentStep?.node_code || 'Restante';
  const guidanceTitle = blockedApiRoute
    ? 'Rota indisponivel'
    : arrived
      ? 'Destino alcancado'
      : 'Orientacao por voz ativa';
  const guidanceText = blockedApiRoute
    ? activeRoute?.reason || 'Nao foi possivel montar uma rota segura para este destino.'
    : arrived
      ? getArrivalInstruction(activeRoute, routeSteps)
      : currentStep?.instruction || (hasKnownProgress ? 'Sem orientacao disponivel para esta rota.' : 'Continue pelo corredor principal. A proxima curva sera a direita.');
  const waitingDestination = destinationLabel || activeRoute?.destination;

  return (
    <Screen withBottomTabs>
      <Header title="Navegacao 3D" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.routeCard, shadows.card]}>
        <Info icon="map-marker" label="Destino" value={destinationLabel || 'Destino'} />
        <View style={styles.divider} />
        <Info icon="walk" label={currentFloor ? currentFloor : 'Restante'} value={`${distanceLabel} - ${etaLabel}`} />
      </View>

      {(navigationProgress?.redirected || activeRoute?.redirected) && destinationLabel ? (
        <View style={[styles.noticeCard, shadows.card]}>
          <MaterialCommunityIcons name="call-split" size={16} color={colors.primary} />
          <Text style={styles.noticeText}>Orientacao ajustada para {destinationLabel}</Text>
        </View>
      ) : null}

      <View style={[styles.scene, shadows.card]}>
        <View style={styles.ceiling}>
          <View style={styles.lightStrip} />
          <View style={[styles.lightStrip, styles.lightStripSmall]} />
        </View>
        <View style={styles.leftWall}>
          <View style={styles.wallLine} />
          <Text style={styles.wallLabel}>Corredor A</Text>
        </View>
        <View style={styles.rightWall}>
          <View style={styles.door} />
          <Text style={styles.doorLabel}>Consultorios</Text>
        </View>
        <View style={styles.floor}>
          <View style={styles.centerLine} />
        </View>

        {!arrived && !blockedApiRoute ? (
          <View style={styles.arrowHalo}>
            <MaterialCommunityIcons name="navigation-variant" size={82} color="#FFFFFF" />
          </View>
        ) : null}

        <View style={[styles.floatingStep, shadows.card]}>
          <View style={[styles.stepIcon, arrived && styles.arrivedStepIcon]}>
            <MaterialCommunityIcons name={arrived ? 'check' : blockedApiRoute ? 'map-marker-off-outline' : 'arrow-up-bold'} size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.floatLabel}>{sceneLabel}</Text>
            <Text style={styles.floatTitle}>{sceneTitle}</Text>
          </View>
        </View>

        <View style={[styles.distanceCard, shadows.card]}>
          <Text style={styles.floatLabel}>{distanceContext}</Text>
          <Text style={styles.floatTitle}>{distanceTitle}</Text>
        </View>
      </View>

      <View style={[styles.guidanceCard, shadows.card]}>
        <View style={styles.guidanceIcon}>
          <MaterialCommunityIcons name="volume-high" size={22} color={colors.primary} />
        </View>
        <View style={styles.guidanceCopy}>
          <Text style={styles.guidanceTitle}>{guidanceTitle}</Text>
          <Text style={styles.guidanceText}>{guidanceText}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => navigate('Navigation')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="map-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>Voltar para 2D</Text>
        </Pressable>

        <Pressable
          onPress={() => navigate('Assistant')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, shadows.soft]}
        >
          <MaterialCommunityIcons name="microphone" size={18} color="#FFFFFF" />
          <Text style={styles.primaryText}>Central IA</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => navigate('WaitingMode', { destination: waitingDestination })}
        style={({ pressed }) => [styles.arrivedButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.arrivedText}>Cheguei ao destino</Text>
      </Pressable>

      <Pressable
        onPress={() => navigate('Home')}
        style={({ pressed }) => [styles.endButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="close" size={18} color={colors.danger} />
        <Text style={styles.endText}>Encerrar rota</Text>
      </Pressable>

      <BottomTabs active="Navigation" navigate={navigate} />
    </Screen>
  );
}

function getArrivalInstruction(activeRoute, routeSteps) {
  const arrivalStep = routeSteps.find((step) => step?.type === 'ARRIVAL' && step.instruction);
  if (arrivalStep?.instruction) return arrivalStep.instruction;
  if (activeRoute?.source === 'api') return 'Voce chegou ao destino.';
  return 'Destino alcancado. Ative o modo espera quando estiver pronto.';
}

function Info({ icon, label, value }) {
  return (
    <View style={styles.infoBlock}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    minHeight: 86,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  noticeCard: {
    minHeight: 38,
    borderRadius: 16,
    backgroundColor: '#FFF6F7',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  scene: {
    height: 410,
    borderRadius: 26,
    backgroundColor: '#F5F1F2',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  ceiling: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightStrip: {
    width: 150,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#F7D9DE',
  },
  lightStripSmall: {
    width: 92,
    marginTop: 12,
    opacity: 0.7,
  },
  leftWall: {
    position: 'absolute',
    left: -42,
    top: 82,
    bottom: 0,
    width: 176,
    backgroundColor: '#E9E0E3',
    transform: [{ skewX: '-10deg' }],
    paddingTop: 78,
    alignItems: 'center',
  },
  rightWall: {
    position: 'absolute',
    right: -42,
    top: 82,
    bottom: 0,
    width: 176,
    backgroundColor: '#DED3D7',
    transform: [{ skewX: '10deg' }],
    paddingTop: 92,
    alignItems: 'center',
  },
  wallLine: {
    width: 70,
    height: 7,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  wallLabel: {
    color: '#686068',
    fontSize: 11,
    fontWeight: '900',
  },
  door: {
    width: 64,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#F8F6F7',
    borderWidth: 1,
    borderColor: '#D2C4C9',
  },
  doorLabel: {
    color: '#686068',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 8,
  },
  floor: {
    position: 'absolute',
    left: 68,
    right: 68,
    bottom: -38,
    height: 276,
    backgroundColor: '#FFFFFF',
    transform: [{ perspective: 520 }, { rotateX: '58deg' }],
    borderTopWidth: 4,
    borderTopColor: '#D9C9CE',
    alignItems: 'center',
  },
  centerLine: {
    width: 8,
    height: 250,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  arrowHalo: {
    position: 'absolute',
    left: '50%',
    bottom: 108,
    width: 116,
    height: 116,
    marginLeft: -58,
    borderRadius: 58,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 5,
  },
  floatingStep: {
    position: 'absolute',
    left: 18,
    top: 18,
    minWidth: 188,
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedStepIcon: {
    backgroundColor: colors.success || colors.primary,
  },
  distanceCard: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    minWidth: 126,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
  },
  floatLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  floatTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  guidanceCard: {
    minHeight: 82,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guidanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceCopy: {
    flex: 1,
  },
  guidanceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  guidanceText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  arrivedButton: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  endButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFF6F7',
    borderWidth: 1,
    borderColor: '#FFD2D7',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  arrivedText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  endText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
