import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { deriveNavigationProgress, normalizeRouteCoordinates } from '../services/navigationAdapter';

export default function MapScreen({ navigate, goBack, activeRoute: selectedRoute, navigationProgress: selectedProgress }) {
  const { activeRoute: fallbackRoute, appColors, isDark } = useApp();
  const activeRoute = selectedRoute || fallbackRoute;
  const pan = useRef(new Animated.ValueXY()).current;
  const [scale, setScale] = useState(1);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const routeNodes = Array.isArray(activeRoute?.nodes) ? activeRoute.nodes : [];
  const routeEdges = Array.isArray(activeRoute?.edges) ? activeRoute.edges : [];
  const useDynamicRoute = activeRoute?.source === 'api' && activeRoute?.routeFound !== false && routeNodes.length > 0;
  const blockedApiRoute = activeRoute?.source === 'api' && activeRoute?.routeFound === false;
  const fallbackProgress = useMemo(
    () => deriveNavigationProgress(activeRoute),
    [activeRoute]
  );
  const navigationProgress = selectedProgress || fallbackProgress;
  const routeMap = useMemo(
    () => buildRouteMap(activeRoute, routeNodes, routeEdges, navigationProgress),
    [activeRoute, navigationProgress, routeEdges, routeNodes]
  );
  const activeFloor = selectedFloor && routeMap.floors.includes(selectedFloor)
    ? selectedFloor
    : navigationProgress.currentFloor || routeMap.originFloor || routeMap.floors[0];
  const currentStep = navigationProgress.currentStep;
  const nextStep = navigationProgress.nextStep;
  const arrived = navigationProgress.arrived;
  const instructionText = arrived
    ? getArrivalInstruction(activeRoute, currentStep)
    : currentStep?.instruction || nextStep?.instruction || (activeRoute?.source === 'api' ? 'Sem orientacao disponivel para esta rota.' : 'Continue pelo corredor principal e vire a direita.');

  useEffect(() => {
    setSelectedFloor(null);
  }, [navigationProgress.currentNodeCode, activeRoute?.destination, activeRoute?.totalDistance]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const zoomIn = () => setScale((current) => Math.min(current + 0.12, 1.45));
  const zoomOut = () => setScale((current) => Math.max(current - 0.12, 0.82));
  const resetMap = () => {
    setScale(1);
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  return (
    <Screen withBottomTabs>
      <Header title="Navegacao" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.routeCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <View style={[styles.routeIcon, { backgroundColor: appColors.iconBg }]}>
          <MaterialCommunityIcons name="map-marker-path" size={24} color={appColors.primary} />
        </View>
        <View style={styles.routeCopy}>
          <Text style={[styles.label, { color: appColors.muted }]}>De</Text>
          <Text style={[styles.place, { color: appColors.text }]}>{activeRoute.origin}</Text>
          <Text style={[styles.label, styles.toLabel, { color: appColors.muted }]}>Para</Text>
          <Text style={[styles.place, { color: appColors.text }]}>{activeRoute.destination}</Text>
        </View>
        <View style={styles.routeStats}>
          <Text style={[styles.statValue, { color: appColors.primary }]}>{activeRoute.distance}</Text>
          <Text style={[styles.statLabel, { color: appColors.muted }]}>Distancia</Text>
          <Text style={[styles.statValue, { color: appColors.primary }]}>{activeRoute.eta}</Text>
          <Text style={[styles.statLabel, { color: appColors.muted }]}>Tempo</Text>
        </View>
      </View>

      <View style={[
        styles.mapViewport,
        { backgroundColor: isDark ? '#15151B' : '#F7F5F5', borderColor: appColors.border },
        shadows.card,
      ]}
      >
        {useDynamicRoute ? (
          <DynamicRouteMap
            activeFloor={activeFloor}
            arrived={arrived}
            appColors={appColors}
            floors={routeMap.floors}
            isDark={isDark}
            onFloorChange={setSelectedFloor}
            routeMap={routeMap}
          />
        ) : blockedApiRoute ? (
          <View style={styles.emptyRouteState}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={34} color={appColors.primary} />
            <Text style={[styles.emptyRouteTitle, { color: appColors.text }]}>Rota indisponivel</Text>
            <Text style={[styles.emptyRouteText, { color: appColors.muted }]}>
              {activeRoute?.reason || 'Nao foi possivel montar uma rota segura para este destino.'}
            </Text>
          </View>
        ) : (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.mapContent,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale },
                ],
              },
            ]}
          >
            <Room style={styles.roomReception} label="Recepcao" appColors={appColors} isDark={isDark} />
            <Room style={styles.roomLab} label="Laboratorio" appColors={appColors} isDark={isDark} />
            <Room style={styles.roomBathroom} label="Banheiro" appColors={appColors} isDark={isDark} />
            <Room style={styles.roomExam} label="Imagem" appColors={appColors} isDark={isDark} />
            <Room style={styles.roomTomography} label="Tomografia" appColors={appColors} isDark={isDark} />
            <Room style={styles.roomElevator} label="Elevador" appColors={appColors} isDark={isDark} />

            <View style={[styles.corridorHorizontal, { backgroundColor: isDark ? '#23232B' : '#FFFFFF' }]} />
            <View style={[styles.corridorVertical, { backgroundColor: isDark ? '#23232B' : '#FFFFFF' }]} />
            <View style={styles.routeA} />
            <View style={styles.routeB} />
            <View style={styles.routeC} />

            <View style={styles.currentPoint}>
              <View style={styles.blueDot} />
            </View>
            <View style={styles.pinDestination}>
              <MaterialCommunityIcons name="map-marker" size={34} color={appColors.primary} />
            </View>
          </Animated.View>
        )}

        <View style={styles.controls}>
          <Control label="2D" active appColors={appColors} />
          <Control label="3D" onPress={() => navigate('Mode3D')} appColors={appColors} />
          <Control label="+" onPress={zoomIn} appColors={appColors} />
          <Control label="-" onPress={zoomOut} appColors={appColors} />
          <Pressable
            onPress={resetMap}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: appColors.surface, borderColor: appColors.border },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={appColors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.instructionCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <View style={[styles.instructionIcon, { backgroundColor: appColors.iconBg }]}>
          <MaterialCommunityIcons name={arrived ? 'check-circle' : 'arrow-up'} size={24} color={appColors.primary} />
        </View>
        <View style={styles.instructionCopy}>
          <Text style={[styles.instructionTitle, { color: appColors.text }]}>
            {arrived ? 'Destino alcancado' : 'Proxima orientacao'}
          </Text>
          <Text style={[styles.instructionText, { color: appColors.muted }]}>
            {instructionText}
          </Text>
        </View>
        <Text style={[styles.distance, { color: appColors.primary }]}>
          {arrived ? '0 m' : currentStep?.distance ? `${Math.round(currentStep.distance)} m` : activeRoute.distance}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => navigate('Home')}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: appColors.surface, borderColor: appColors.borderStrong || appColors.border },
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="close" size={18} color={appColors.primary} />
          <Text style={[styles.secondaryText, { color: appColors.primary }]}>Encerrar rota</Text>
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
        onPress={() => navigate('WaitingMode', { destination: activeRoute.destination })}
        style={({ pressed }) => [styles.arrivedButton, pressed && styles.pressed, shadows.soft]}
      >
        <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
        <View style={styles.arrivedCopy}>
          <Text style={styles.arrivedTitle}>Cheguei ao destino</Text>
          <Text style={styles.arrivedText}>Ativar modo espera</Text>
        </View>
      </Pressable>

      <BottomTabs active="Navigation" navigate={navigate} />
    </Screen>
  );
}

function DynamicRouteMap({ activeFloor, arrived, appColors, floors, isDark, onFloorChange, routeMap }) {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const visibleNodes = routeMap.nodesByFloor.get(activeFloor) || [];
  const visibleLines = routeMap.lines.filter((line) => line.floor === activeFloor);
  const floorTransfers = routeMap.floorTransfers.filter((transfer) => transfer.fromFloor === activeFloor || transfer.toFloor === activeFloor);
  const destinationFloor = routeMap.destinationFloor;
  const originFloor = routeMap.originFloor;

  return (
    <View style={styles.dynamicMap}>
      <View style={styles.mapHeader}>
        <View>
          <Text style={[styles.mapKicker, { color: appColors.primary }]}>Rota esquematica</Text>
          <Text style={[styles.mapFloorTitle, { color: appColors.text }]}>{activeFloor}</Text>
        </View>
        {floors.length > 1 ? (
          <View style={[styles.floorTabs, { backgroundColor: isDark ? '#23232B' : '#FFFFFF', borderColor: appColors.border }]}>
            {floors.map((floor) => (
              <Pressable
                key={floor}
                onPress={() => onFloorChange(floor)}
                style={[
                  styles.floorTab,
                  floor === activeFloor && { backgroundColor: appColors.primary },
                ]}
              >
                <Text style={[styles.floorTabText, { color: floor === activeFloor ? '#FFFFFF' : appColors.text }]} numberOfLines={1}>
                  {shortFloor(floor)}
                </Text>
                {floor === originFloor || floor === destinationFloor ? (
                  <Text style={[styles.floorTabBadge, { color: floor === activeFloor ? '#FFFFFF' : appColors.primary }]}>
                    {floor === originFloor ? 'O' : 'D'}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {routeMap.redirected ? (
        <View style={[styles.redirectPill, { backgroundColor: isDark ? '#2A2430' : '#FFF6F7', borderColor: appColors.border }]}>
          <MaterialCommunityIcons name="call-split" size={15} color={appColors.primary} />
          <Text style={[styles.redirectText, { color: appColors.primary }]} numberOfLines={1}>
            Orientacao ajustada para {routeMap.destinationLabel}
          </Text>
        </View>
      ) : null}

      {arrived ? (
        <View style={[styles.arrivalBanner, { backgroundColor: appColors.primary }]}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
          <Text style={styles.arrivalBannerText}>Voce chegou ao destino</Text>
        </View>
      ) : null}

      <View
        style={[styles.dynamicCanvas, { borderColor: appColors.border }]}
        onLayout={(event) => setCanvasSize(event.nativeEvent.layout)}
      >
        {visibleLines.map((line) => (
          <RouteLine key={line.key} line={line} mapSize={canvasSize} appColors={appColors} />
        ))}

        {visibleNodes.map((node) => (
          <RouteNode
            key={node.code || node.id}
            appColors={appColors}
            isDark={isDark}
            node={node}
          />
        ))}
      </View>

      {floorTransfers.length ? (
        <View style={[styles.transferBox, { backgroundColor: isDark ? '#202029' : '#FFFFFF', borderColor: appColors.border }]}>
          <MaterialCommunityIcons name="swap-vertical" size={18} color={appColors.primary} />
          <View style={styles.transferCopy}>
            <Text style={[styles.transferTitle, { color: appColors.text }]}>
              {floorTransfers[0].fromFloor} -> {floorTransfers[0].toFloor}
            </Text>
            <Text style={[styles.transferText, { color: appColors.muted }]} numberOfLines={2}>
              {floorTransfers[0].instruction || `Continua em ${floorTransfers[0].toFloor}.`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RouteLine({ line, mapSize, appColors }) {
  if (!mapSize.width || !mapSize.height) return null;

  const x1 = (line.from.normalizedX / 100) * mapSize.width;
  const y1 = (line.from.normalizedY / 100) * mapSize.height;
  const x2 = (line.to.normalizedX / 100) * mapSize.width;
  const y2 = (line.to.normalizedY / 100) * mapSize.height;
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = `${Math.atan2(y2 - y1, x2 - x1)}rad`;

  const backgroundColor = line.status === 'traversed'
    ? '#9CA3AF'
    : line.status === 'current'
      ? appColors.primary
      : '#D6D8DE';
  const opacity = line.status === 'remaining' ? 0.78 : 0.95;
  const height = line.status === 'current' ? 6 : 4;

  return (
    <View
      style={[
        styles.routeLine,
        {
          left: (x1 + x2) / 2 - length / 2,
          top: (y1 + y2) / 2 - height / 2,
          width: length,
          height,
          backgroundColor,
          opacity,
          transform: [{ rotate: angle }],
        },
      ]}
    />
  );
}

function RouteNode({ appColors, isDark, node }) {
  const roleStyle = node.visualRole === 'origin'
    ? { backgroundColor: '#2F80ED', borderColor: '#FFFFFF' }
    : node.visualRole === 'destination'
      ? { backgroundColor: appColors.primary, borderColor: '#FFFFFF' }
      : { backgroundColor: isDark ? '#2A2A34' : '#FFFFFF', borderColor: appColors.border };
  const icon = node.visualRole === 'origin'
    ? 'crosshairs-gps'
    : node.visualRole === 'destination'
      ? 'map-marker'
      : iconForNodeType(node.type);
  const iconColor = node.visualRole === 'origin' || node.visualRole === 'destination' ? '#FFFFFF' : appColors.primary;

  const showLabel =
    node.visualRole === 'origin' ||
    node.visualRole === 'destination' ||
    node.visualRole === 'current' ||
    node.type === 'RECEPTION' ||
    node.type === 'ENTRANCE';

  return (
    <View
      style={[
        styles.dynamicNode,
        {
          left: `${node.normalizedX}%`,
          top: `${node.normalizedY}%`,
        },
      ]}
    >
      <View style={[styles.dynamicNodeDot, roleStyle]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      {showLabel ? (
        <Text
          numberOfLines={2}
          style={[
            styles.dynamicNodeLabel,
            {
              color: appColors.text,
              backgroundColor: isDark ? 'rgba(21,21,27,0.88)' : 'rgba(255,255,255,0.9)',
            },
          ]}
        >
          {node.visualRole === 'origin' ? `Origem: ${node.label}` : node.visualRole === 'destination' ? `Destino: ${node.label}` : node.label}
        </Text>
      ) : null}
    </View>
  );
}

function buildRouteMap(activeRoute, nodes, edges, navigationProgress) {
  const normalizedNodes = normalizeRouteCoordinates(nodes, { padding: 12 });
  const originCode = navigationProgress?.currentNodeCode || activeRoute?.originNodeCode;
  const destinationCode = navigationProgress?.destinationNodeCode || normalizedNodes[normalizedNodes.length - 1]?.code;
  const enrichedNodes = normalizedNodes.map((node, index) => ({
    ...node,
    visualRole: node.code === originCode
      ? 'origin'
      : node.code === destinationCode || (!destinationCode && index === normalizedNodes.length - 1)
        ? 'destination'
        : 'intermediate',
    routeIndex: index,
  }));
  const originNode = enrichedNodes.find((node) => node.code === originCode);
  const destinationNode = enrichedNodes.find((node) => node.code === destinationCode) || enrichedNodes[enrichedNodes.length - 1];
  const originFloor = originNode ? originNode.floor || `Z ${originNode.z ?? 0}` : null;
  const destinationFloor = destinationNode ? destinationNode.floor || `Z ${destinationNode.z ?? 0}` : null;
  const nodeById = new Map(enrichedNodes.map((node) => [node.id, node]));
  const floors = [...new Set(enrichedNodes.map((node) => node.floor || `Z ${node.z ?? 0}`))];
  const nodesByFloor = new Map(floors.map((floor) => [floor, enrichedNodes.filter((node) => (node.floor || `Z ${node.z ?? 0}`) === floor)]));
  const lines = [];
  const floorTransfers = [];

  edges.forEach((edge, index) => {
    const edgeKey = edge.id || `${edge.from_node_id ?? edge.fromNodeId}-${edge.to_node_id ?? edge.toNodeId}-${index}`;
    const from = nodeById.get(edge.from_node_id ?? edge.fromNodeId);
    const to = nodeById.get(edge.to_node_id ?? edge.toNodeId);
    if (!from || !to) return;

    const fromFloor = from.floor || `Z ${from.z ?? 0}`;
    const toFloor = to.floor || `Z ${to.z ?? 0}`;
    if (fromFloor === toFloor) {
      lines.push({
        key: edgeKey,
        floor: fromFloor,
        from,
        to,
        status: navigationProgress?.edgeStatusByKey?.[edgeKey] || 'remaining',
      });
      return;
    }

    floorTransfers.push({
      key: edgeKey,
      fromFloor,
      toFloor,
      instruction: edge.instruction || activeRoute?.steps?.find((step) => step.type === 'FLOOR_CHANGE')?.instruction,
    });
  });

  return {
    currentIndex: navigationProgress?.currentNodeIndex,
    destinationCode,
    destinationFloor,
    destinationLabel: activeRoute?.effectiveDestination?.name || activeRoute?.destination || destinationNode?.label || 'destino',
    originCode,
    originFloor,
    progressKnown: Boolean(navigationProgress?.progressKnown),
    redirected: Boolean(activeRoute?.redirected),
    floorTransfers,
    floors,
    lines,
    nodesByFloor,
  };
}

function getArrivalInstruction(activeRoute, currentStep) {
  if (currentStep?.type === 'ARRIVAL' && currentStep.instruction) return currentStep.instruction;
  if (activeRoute?.source === 'api') return 'Voce chegou ao destino.';
  return 'Destino alcancado. Ative o modo espera quando estiver pronto.';
}

function iconForNodeType(type) {
  if (type === 'ENTRANCE') return 'door-open';
  if (type === 'RECEPTION') return 'desk';
  if (type === 'CORRIDOR') return 'walk';
  if (type === 'BATHROOM') return 'toilet';
  if (type === 'EXIT') return 'exit-run';
  return 'map-marker-outline';
}

function shortFloor(floor) {
  if (floor === 'Piso Terreo') return 'Terreo';
  return floor;
}

function Room({ style, label, appColors, isDark }) {
  return (
    <View
      style={[
        styles.room,
        {
          backgroundColor: isDark ? '#202029' : '#E9E4E5',
          borderColor: isDark ? appColors.border : '#DDD1D4',
        },
        style,
      ]}
    >
      <Text style={[styles.roomText, { color: isDark ? appColors.muted : '#55545B' }]}>{label}</Text>
    </View>
  );
}

function Control({ label, active, onPress, appColors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        {
          backgroundColor: active ? appColors.primary : appColors.surface,
          borderColor: active ? appColors.primary : appColors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.controlText, { color: active ? '#FFFFFF' : appColors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    minHeight: 104,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 8,
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCopy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  toLabel: {
    marginTop: 8,
  },
  place: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  routeStats: {
    minWidth: 76,
    alignItems: 'flex-end',
  },
  statValue: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  mapViewport: {
    height: 390,
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: '#F7F5F5',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  mapContent: {
    width: 520,
    height: 460,
    position: 'absolute',
    left: -70,
    top: -36,
  },
  dynamicMap: {
    flex: 1,
    padding: 14,
  },
  mapHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mapKicker: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mapFloorTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  floorTabs: {
    minHeight: 38,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  floorTab: {
    minWidth: 70,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 4,
  },
  floorTabText: {
    fontSize: 10,
    fontWeight: '900',
  },
  floorTabBadge: {
    fontSize: 9,
    fontWeight: '900',
  },
  redirectPill: {
    minHeight: 34,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  redirectText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
  },
  arrivalBanner: {
    minHeight: 36,
    borderRadius: 15,
    paddingHorizontal: 11,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrivalBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  dynamicCanvas: {
    flex: 1,
    marginTop: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyRouteState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRouteTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyRouteText: {
    maxWidth: 260,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  routeLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 4,
    opacity: 0.9,
  },
  dynamicNode: {
    position: 'absolute',
    width: 94,
    minHeight: 54,
    marginLeft: -47,
    marginTop: -19,
    alignItems: 'center',
  },
  dynamicNodeDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  dynamicNodeLabel: {
    maxWidth: 94,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    overflow: 'hidden',
  },
  transferBox: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  transferCopy: {
    flex: 1,
    minWidth: 0,
  },
  transferTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  transferText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  corridorHorizontal: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 206,
    height: 58,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  corridorVertical: {
    position: 'absolute',
    top: 66,
    bottom: 62,
    left: 258,
    width: 58,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  room: {
    position: 'absolute',
    borderRadius: 14,
    backgroundColor: '#E9E4E5',
    borderWidth: 1,
    borderColor: '#DDD1D4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  roomText: {
    color: '#55545B',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  roomReception: { left: 76, bottom: 58, width: 132, height: 82 },
  roomLab: { left: 72, top: 166, width: 112, height: 56 },
  roomBathroom: { left: 74, top: 70, width: 116, height: 82 },
  roomExam: { right: 74, top: 68, width: 132, height: 96 },
  roomTomography: { right: 76, bottom: 68, width: 132, height: 90 },
  roomElevator: { left: 228, top: 76, width: 82, height: 82 },
  routeA: {
    position: 'absolute',
    left: 164,
    bottom: 150,
    width: 136,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  routeB: {
    position: 'absolute',
    left: 294,
    top: 154,
    width: 7,
    height: 96,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  routeC: {
    position: 'absolute',
    left: 294,
    top: 154,
    width: 92,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  currentPoint: {
    position: 'absolute',
    left: 154,
    bottom: 142,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(47,128,237,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pinDestination: {
    position: 'absolute',
    right: 116,
    top: 132,
  },
  controls: {
    position: 'absolute',
    right: 12,
    top: 70,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  controlText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  controlTextActive: {
    color: '#FFFFFF',
  },
  instructionCard: {
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
  instructionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCopy: {
    flex: 1,
  },
  instructionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  instructionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  distance: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  actionRow: {
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
  arrivedButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrivedCopy: {
    flex: 1,
  },
  arrivedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  arrivedText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
