import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { TabIcon } from './NavIcons';

// Barra "Rota em andamento", fixa acima das abas, em toda tela com abas.
// Usa SÓ dado real da rota (liveRoute do App.js): destino, distância e tempo.
// Distância/tempo que o adapter preencheu com padrão ('80 m', '2 min') vêm
// marcados como *IsFallback e não aparecem.

export const ROUTE_BAR_HEIGHT = 62;
// Altura da barra + respiro; quanto as telas somam no fim da rolagem.
export const ROUTE_BAR_SPACE = ROUTE_BAR_HEIGHT + 10;

const INACTIVE_STATUSES = new Set(['arrived', 'not_found', 'finished', 'canceled']);

// destino sempre como texto ("Objects are not valid as a React child").
export function routeDestinationLabel(route) {
  const value = route?.destination ?? route?.effectiveDestination ?? route?.requestedDestination;
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') return String(value.name || value.label || '').trim();
  return '';
}

// Prévia: a pessoa escolheu o destino só pra ver distância/tempo e ainda não
// tocou em "Iniciar rota" no mapa. Não conta como rota em andamento.
export function isRoutePreview(route) {
  return route?.confirmed === false;
}

export function isRouteBarVisible(route) {
  if (!route || isRoutePreview(route) || INACTIVE_STATUSES.has(route.status)) return false;
  return Boolean(routeDestinationLabel(route));
}

// Espaço extra que a tela deve deixar embaixo quando a barra aparece.
export function useRouteBarSpace() {
  const { liveRoute } = useApp();
  return isRouteBarVisible(liveRoute) ? ROUTE_BAR_SPACE : 0;
}

export default function ActiveRouteBar({ navigate, bottom }) {
  const { appColors, liveRoute, t } = useApp();
  if (!isRouteBarVisible(liveRoute)) return null;

  const destination = routeDestinationLabel(liveRoute);
  const distance = liveRoute.distanceIsFallback ? null : liveRoute.distance;
  const time = liveRoute.timeIsFallback ? null : liveRoute.time || liveRoute.eta;
  const meta = [distance, time].filter((item) => typeof item === 'string' && item.trim()).join(' · ');

  const goToRoute = () => navigate?.('Navigation', { destination });

  return (
    <View
      style={[
        styles.bar,
        {
          bottom,
          backgroundColor: appColors.surface,
          borderColor: appColors.accentBorder,
        },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: appColors.iconBg }]}>
        <TabIcon name="navigate" color={appColors.primary} active size={20} />
      </View>

      <View style={styles.copy} accessible accessibilityLabel={t('routeBar.a11y', { destination })}>
        <Text style={[styles.label, { color: appColors.primary }]} numberOfLines={1}>
          {t('routeBar.label')}
        </Text>
        <Text style={[styles.destination, { color: appColors.text }]} numberOfLines={1}>
          {destination}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: appColors.muted }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={goToRoute}
        accessibilityRole="button"
        accessibilityLabel={t('routeBar.continueA11y', { destination })}
        hitSlop={6}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: appColors.primaryStrong },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {t('routeBar.continue')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: ROUTE_BAR_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 8,
    paddingLeft: 9,
    paddingRight: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 210,
    elevation: 11,
  },
  tile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  destination: { fontSize: 15, fontWeight: '900', marginTop: 1 },
  meta: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  button: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.82 },
});
