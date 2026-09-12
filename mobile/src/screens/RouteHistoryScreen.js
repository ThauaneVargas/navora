import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const history = [
  {
    id: '1',
    destination: 'Tomografia',
    sector: 'Setor de Imagem',
    floor: 'Piso Terreo',
    date: 'Hoje',
    time: '14:32',
    distance: '124 m',
    duration: '2 min',
    icon: 'radioactive-circle-outline',
    status: 'concluida',
  },
  {
    id: '2',
    destination: 'Recepção Principal',
    sector: 'Ala Principal',
    floor: 'Piso Terreo',
    date: 'Hoje',
    time: '13:10',
    distance: '68 m',
    duration: '1 min',
    icon: 'account-tie-outline',
    status: 'concluida',
  },
  {
    id: '3',
    destination: 'Ultrassonografia 01',
    sector: 'Ala B',
    floor: 'Piso Terreo',
    date: 'Ontem',
    time: '09:45',
    distance: '212 m',
    duration: '4 min',
    icon: 'sine-wave',
    status: 'concluida',
  },
  {
    id: '4',
    destination: 'Elevador A',
    sector: 'Corredor Principal',
    floor: 'Piso Terreo',
    date: 'Ontem',
    time: '09:41',
    distance: '88 m',
    duration: '1 min',
    icon: 'elevator-passenger-outline',
    status: 'concluida',
  },
  {
    id: '5',
    destination: 'Laboratorio de Analises',
    sector: 'Ala Clinica',
    floor: '1o Andar',
    date: '07/09',
    time: '08:20',
    distance: '178 m',
    duration: '3 min',
    icon: 'flask-outline',
    status: 'concluida',
  },
];

export default function RouteHistoryScreen({ navigate, goBack }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  const grouped = useMemo(() => {
    const groups = {};
    history.forEach((item) => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return Object.entries(groups);
  }, []);

  return (
    <Screen>
      <Header title="Histórico de rotas" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.statsRow, shadows.card]}>
        <StatItem label="Rotas" value={history.length} icon="routes" styles={styles} appColors={appColors} />
        <View style={styles.statDivider} />
        <StatItem label="Distancia total" value="670 m" icon="map-marker-distance" styles={styles} appColors={appColors} />
        <View style={styles.statDivider} />
        <StatItem label="Tempo total" value="11 min" icon="clock-outline" styles={styles} appColors={appColors} />
      </View>

      {grouped.map(([date, items]) => (
        <View key={date}>
          <Text style={styles.dateLabel}>{date}</Text>
          <View style={[styles.group, shadows.card]}>
            {items.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => navigate('Navigation')}
                style={({ pressed }) => [
                  styles.row,
                  index < items.length - 1 && styles.rowBorder,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons name={item.icon} size={19} color={appColors.primary} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.destination}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.sector} · {item.floor}
                  </Text>
                  <View style={styles.rowMeta}>
                    <MaterialCommunityIcons name="clock-outline" size={11} color={appColors.muted} />
                    <Text style={styles.rowMetaText}>{item.time}</Text>
                    <Text style={styles.rowMetaDot}>·</Text>
                    <Text style={styles.rowMetaText}>{item.distance}</Text>
                    <Text style={styles.rowMetaDot}>·</Text>
                    <Text style={styles.rowMetaText}>{item.duration}</Text>
                  </View>
                </View>
                <View style={styles.checkBadge}>
                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={[styles.infoCard, shadows.card]}>
        <MaterialCommunityIcons name="information-outline" size={16} color={appColors.muted} />
        <Text style={styles.infoText}>
          O histórico exibe as últimas rotas concluídas. Rotas canceladas não são salvas.
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
    fontSize: 11,
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
