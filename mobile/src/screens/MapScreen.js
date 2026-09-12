import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, PanResponder, View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { deriveNavigationProgress, normalizeRouteCoordinates } from '../services/navigationAdapter';

const logo = require('../../assets/images/navora_symbol.png');

const NAV_COLORS = {
  burgundy: '#980027',
  burgundyDark: '#7D001F',
  burgundyLight: '#FFF5F7',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  text: '#111827',
  secondary: '#667085',
  border: '#E7E9EE',
};

export default function MapScreen({ navigate, goBack, activeRoute: selectedRoute, navigationProgress: selectedProgress, onEndRoute }) {
  const { activeRoute: fallbackRoute, appColors, isDark } = useApp();
  const { width, height } = useWindowDimensions();
  const activeRoute = selectedRoute || fallbackRoute;
  const pan = useRef(new Animated.ValueXY()).current;
  const [zoom, setZoom] = useState(1);
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
    : currentStep?.instruction || nextStep?.instruction || (activeRoute?.source === 'api' ? 'Sem orientação disponível para esta rota.' : 'Continue pelo corredor principal e vire à direita.');
  const compact = height < 720 || width < 380;
  const mapViewportHeight = Math.max(compact ? 330 : 360, Math.min(500, Math.round(height * (compact ? 0.48 : 0.54))));
  const remainingDistance = arrived ? '0 m' : activeRoute.distance || 'Distância indisponível';
  const remainingTime = arrived ? '0 min' : activeRoute.eta || activeRoute.time || 'Tempo indisponível';
  const stepDistance = arrived ? '0 m' : currentStep?.distance ? `${Math.round(currentStep.distance)} m` : remainingDistance;
  const progressPercent = getProgressPercent(navigationProgress);

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

  const zoomIn = () => setZoom((current) => Math.min(current + 0.12, 1.28));
  const zoomOut = () => setZoom((current) => Math.max(current - 0.12, 0.9));
  const resetMap = () => {
    setZoom(1);
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const confirmEndRoute = () => {
    Alert.alert(
      'Encerrar navegação?',
      'Sua rota atual será finalizada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar rota', style: 'destructive', onPress: () => onEndRoute?.() },
      ]
    );
  };

  if (!activeRoute) {
    return (
      <Screen withBottomTabs>
        <Header title="Navegar" subtitle="Escolha um destino para iniciar" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
        <View style={[styles.emptyRouteState, styles.emptyRouteCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
          <MaterialCommunityIcons name="map-search-outline" size={38} color={appColors.primary} />
          <Text style={[styles.emptyRouteTitle, { color: appColors.text }]}>Nenhuma rota ativa</Text>
          <Text style={[styles.emptyRouteText, { color: appColors.muted }]}>Busque um setor, servico ou destino para visualizar a rota 2D.</Text>
          <Pressable onPress={() => navigate('Search')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, shadows.soft]}>
            <MaterialCommunityIcons name="magnify" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Buscar destino</Text>
          </Pressable>
        </View>
        <BottomTabs active="Navigate" navigate={navigate} />
      </Screen>
    );
  }

  return (
    <Screen withBottomTabs>
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => goBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [styles.headerButton, { backgroundColor: appColors.surface, borderColor: appColors.border }, pressed && styles.pressed, shadows.card]}
        >
          <MaterialCommunityIcons name="chevron-left" size={25} color={appColors.primary} />
        </Pressable>
        <View style={styles.headerBrand}>
          <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
          <Text style={[styles.headerBrandText, { color: appColors.primary }]}>NAVORA</Text>
        </View>
        <Pressable
          onPress={() => navigate('Menu')}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          style={({ pressed }) => [styles.headerButton, { backgroundColor: appColors.surface, borderColor: appColors.border }, pressed && styles.pressed, shadows.card]}
        >
          <MaterialCommunityIcons name="menu" size={22} color={appColors.text} />
        </Pressable>
      </View>

      <View style={[styles.routeCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <View style={styles.routeCopy}>
          <Text style={[styles.label, { color: appColors.muted }]}>Rota para</Text>
          <Text style={[styles.routeTitle, { color: appColors.text }]} numberOfLines={1}>{activeRoute.destination}</Text>
          <Text style={[styles.routePath, { color: appColors.text }]} numberOfLines={1}>
            {activeRoute.origin} -> {activeRoute.destination}
          </Text>
          <Text style={[styles.routeMetaText, { color: appColors.muted }]} numberOfLines={1}>
            {remainingDistance} - aproximadamente {remainingTime}
          </Text>
        </View>
      </View>

      <View style={[
        styles.mapViewport,
        { height: mapViewportHeight },
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
            <Text style={[styles.emptyRouteTitle, { color: appColors.text }]}>Rota indisponível</Text>
            <Text style={[styles.emptyRouteText, { color: appColors.muted }]}>
              {activeRoute?.reason || 'Não foi possível montar uma rota segura para este destino.'}
            </Text>
          </View>
        ) : (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.mapContent,
              {
                width: Math.round(520 * zoom),
                height: Math.round(460 * zoom),
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                ],
              },
            ]}
          >
            <Room style={styles.roomReception} label="Recepção" appColors={appColors} isDark={isDark} />
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
            <View style={styles.currentLabel}>
              <Text style={styles.currentLabelText}>Você está aqui</Text>
            </View>
            <View style={styles.pinDestination}>
              <MaterialCommunityIcons name="map-marker" size={34} color={appColors.primary} />
              <View style={styles.destinationLabel}>
                <Text style={styles.destinationLabelText} numberOfLines={1}>{activeRoute.destination}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={[styles.floorPill, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
          <MaterialCommunityIcons name="layers-outline" size={15} color={appColors.primary} />
          <Text style={[styles.floorPillText, { color: appColors.text }]}>{shortFloor(activeFloor || 'Piso Terreo')}</Text>
        </View>

        <View style={styles.controls}>
          <Control icon="plus" label="Aproximar" onPress={zoomIn} appColors={appColors} />
          <Control icon="minus" label="Afastar" onPress={zoomOut} appColors={appColors} />
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
            {arrived ? 'Você chegou' : 'Próxima orientação'}
          </Text>
          <Text style={[styles.instructionText, { color: appColors.muted }]}>
            {arrived ? activeRoute.destination : instructionText}
          </Text>
        </View>
        {!arrived ? (
          <View style={styles.nextDistance}>
            <Text style={[styles.distance, { color: appColors.primary }]}>{stepDistance}</Text>
            <Text style={[styles.distanceCaption, { color: appColors.muted }]}>até a próxima orientação</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.progressCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: appColors.muted }]}>Progresso da rota</Text>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressDistance, { color: appColors.text }]}>{remainingDistance} restantes</Text>
            <Text style={[styles.progressTime, { color: appColors.muted }]}>aprox. {remainingTime}</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: appColors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: appColors.primary, width: `${progressPercent}%` }]} />
        </View>
      </View>

      {arrived ? (
        <Pressable
          onPress={confirmEndRoute}
          style={({ pressed }) => [styles.finishButton, pressed && styles.pressed, shadows.soft]}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={19} color="#FFFFFF" />
          <Text style={styles.finishText}>Finalizar navegação</Text>
        </Pressable>
      ) : (
        <>
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => navigate('Lost')}
          style={({ pressed }) => [
            styles.softButton,
            { backgroundColor: appColors.primarySoft, borderColor: appColors.border },
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="lifebuoy" size={18} color={appColors.primary} />
          <Text style={[styles.softButtonText, { color: appColors.primary }]}>Estou perdido</Text>
        </Pressable>
        <Pressable
          onPress={() => navigate('Search')}
          style={({ pressed }) => [
            styles.softButton,
            { backgroundColor: appColors.surface, borderColor: appColors.border },
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="swap-horizontal" size={18} color={appColors.text} />
          <Text style={[styles.softButtonText, { color: appColors.text }]}>Trocar destino</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={confirmEndRoute}
        style={({ pressed }) => [styles.endButton, { borderColor: appColors.primary }, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="close" size={18} color={appColors.primary} />
        <Text style={[styles.endButtonText, { color: appColors.primary }]}>Encerrar rota</Text>
      </Pressable>
        </>
      )}

      <BottomTabs active="Navigate" navigate={navigate} />
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
          <Text style={styles.arrivalBannerText}>Você chegou ao destino</Text>
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
      ? NAV_COLORS.burgundy
      : '#D6D8DE';
  const opacity = line.status === 'remaining' ? 0.78 : 0.95;
  const height = line.status === 'current' ? 7 : 5;

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
    ? { backgroundColor: NAV_COLORS.burgundy, borderColor: '#FFFFFF' }
    : node.visualRole === 'destination'
      ? { backgroundColor: NAV_COLORS.burgundy, borderColor: '#FFFFFF' }
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
          {node.visualRole === 'origin' ? 'Você está aqui' : node.visualRole === 'destination' ? node.label : node.label}
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
  if (activeRoute?.source === 'api') return 'Você chegou ao destino.';
  return 'Destino alcançado. Ative o modo espera quando estiver pronto.';
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

function Control({ icon, label, onPress, appColors }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.controlButton,
        {
          backgroundColor: appColors.surface,
          borderColor: appColors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={appColors.text} />
    </Pressable>
  );
}

function getProgressPercent(navigationProgress) {
  if (!navigationProgress?.progressKnown) return 18;
  const current = Number(navigationProgress.currentNodeIndex || 0);
  const remaining = Number(navigationProgress.remainingNodeCodes?.length || 0);
  const total = current + remaining + 1;
  if (!total || total <= 1) return 100;
  return Math.max(12, Math.min(100, Math.round((current / (total - 1)) * 100)));
}

const styles = StyleSheet.create({
  topHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: NAV_COLORS.surface,
    borderWidth: 1,
    borderColor: NAV_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  headerBrandText: {
    color: NAV_COLORS.burgundy,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    letterSpacing: 4,
  },
  routeCard: {
    minHeight: 76,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  routeIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
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
    fontWeight: '700',
  },
  routeTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  routePath: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  routeMetaText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  toLabel: {
    marginTop: 8,
  },
  place: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  routeStats: {
    minWidth: 76,
    alignItems: 'flex-end',
  },
  statValue: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  mapViewport: {
    height: 500,
    marginTop: 10,
    borderRadius: radii.xl,
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
    padding: spacing.md,
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
    fontWeight: '700',
  },
  mapFloorTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  floorTabs: {
    minHeight: 38,
    borderRadius: radii.md,
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
    fontWeight: '800',
  },
  floorTabBadge: {
    fontSize: 9,
    fontWeight: '800',
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
    fontWeight: '800',
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
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyRouteState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRouteCard: {
    minHeight: 260,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
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
    backgroundColor: 'rgba(152,0,39,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: NAV_COLORS.burgundy,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  currentLabel: {
    position: 'absolute',
    left: 132,
    bottom: 114,
    minHeight: 26,
    borderRadius: 13,
    backgroundColor: NAV_COLORS.burgundy,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
  pinDestination: {
    position: 'absolute',
    right: 116,
    top: 132,
    alignItems: 'center',
  },
  destinationLabel: {
    maxWidth: 112,
    minHeight: 24,
    borderRadius: 12,
    backgroundColor: NAV_COLORS.burgundy,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -3,
  },
  destinationLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
  controls: {
    position: 'absolute',
    right: 12,
    top: 56,
    gap: 8,
  },
  floorPill: {
    position: 'absolute',
    left: 12,
    top: 12,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    ...shadows.card,
  },
  floorPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  legend: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    minHeight: 36,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    minHeight: 76,
    marginTop: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCopy: {
    flex: 1,
  },
  instructionTitle: {
    color: colors.text,
    ...typography.subtitle,
    fontWeight: '800',
  },
  instructionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 3,
  },
  distance: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  distanceCaption: {
    maxWidth: 80,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 2,
  },
  nextDistance: {
    alignItems: 'flex-end',
  },
  progressCard: {
    minHeight: 58,
    marginTop: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  progressMeta: {
    alignItems: 'flex-end',
  },
  progressDistance: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  progressTime: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  softButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  softButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: radii.md,
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
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  arrivedButton: {
    minHeight: 58,
    borderRadius: radii.lg,
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
  },
  endButton: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  endButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  finishButton: {
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
});
