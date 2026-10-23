import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { EmptyState, PrimaryButton } from '../components/PremiumUI';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { loadRouteHistory, subscribeRouteHistory } from '../services/routeHistoryStorage';

// Antes esta tela mostrava uma lista fixa de exemplo. Agora lê as rotas que
// a pessoa iniciou neste celular (routeHistoryStorage), que somem ao sair.

const dayLabel = (iso) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const timeLabel = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function RouteHistoryScreen({ navigate, goBack }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    loadRouteHistory().then((items) => active && setHistory(items));
    const unsubscribe = subscribeRouteHistory((items) => active && setHistory(items));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map();
    history.forEach((item) => {
      const label = dayLabel(item.t);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });
    return [...groups.entries()];
  }, [history]);

  const arrivedCount = history.filter((item) => item.a).length;

  return (
    <Screen>
      <Header title="Histórico de rotas" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      {history.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="map-marker-path"
            title="Nenhuma rota ainda"
            text="Quando você iniciar uma rota pelo app, ela aparece aqui para você repetir com um toque."
            action={<PrimaryButton title="Buscar um destino" icon="magnify" onPress={() => navigate('Search')} />}
          />
        </View>
      ) : (
        <>
          <View style={[styles.statsRow, shadows.card]}>
            <StatItem label="Rotas" value={history.length} icon="routes" styles={styles} appColors={appColors} />
            <View style={styles.statDivider} />
            <StatItem label="Concluídas" value={arrivedCount} icon="flag-checkered" styles={styles} appColors={appColors} />
          </View>

          {grouped.map(([date, items]) => (
            <View key={date}>
              <Text style={styles.dateLabel}>{date}</Text>
              <View style={[styles.group, shadows.card]}>
                {items.map((item, index) => (
                  <Pressable
                    key={item.t}
                    onPress={() => navigate('Search', { query: item.n })}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.n}, ${item.a ? 'concluída' : 'iniciada'} às ${timeLabel(item.t)}`}
                    accessibilityHint="Abre a busca para fazer esta rota de novo"
                    style={({ pressed }) => [
                      styles.row,
                      index < items.length - 1 && styles.rowBorder,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.rowIcon}>
                      <MaterialCommunityIcons name={item.i || 'map-marker-outline'} size={19} color={appColors.primary} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.n}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {[item.c === 'Servicos' ? 'Serviços' : item.c, item.f].filter(Boolean).join(' · ') || 'Destino'}
                      </Text>
                      <View style={styles.rowMeta}>
                        <MaterialCommunityIcons name="clock-outline" size={13} color={appColors.muted} />
                        <Text style={styles.rowMetaText}>{timeLabel(item.t)}</Text>
                        <Text style={styles.rowMetaDot}>·</Text>
                        <Text style={styles.rowMetaText}>{item.a ? 'Concluída' : 'Iniciada'}</Text>
                      </View>
                    </View>
                    {item.a ? (
                      <View style={styles.checkBadge}>
                        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <MaterialCommunityIcons name="replay" size={20} color={appColors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      <View style={[styles.infoCard, shadows.card]}>
        <MaterialCommunityIcons name="shield-lock-outline" size={16} color={appColors.muted} />
        <Text style={styles.infoText}>
          O histórico fica só neste celular e é apagado quando você toca em Sair. Toque numa rota para fazê-la de novo.
        </Text>
      </View>
    </Screen>
  );
}

function StatItem({ label, value, icon, styles, appColors }) {
  return (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon} size={18} color={appColors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  emptyWrap: {
    marginTop: 24,
  },
  statsRow: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  rowSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rowMetaText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  rowMetaDot: {
    color: colors.border,
    fontSize: 11,
    fontWeight: '900',
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.success ?? '#168A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
