import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

const notifications = [
  {
    type: 'Rota',
    icon: 'routes',
    title: 'Rota recalculada',
    description: 'Encontramos um caminho mais curto ate Tomografia.',
    time: 'Agora',
    read: false,
  },
  {
    type: 'Fluxo',
    icon: 'account-group-outline',
    title: 'Local movimentado',
    description: 'A recepcao esta com maior movimento neste momento.',
    time: '3 min',
    read: false,
  },
  {
    type: 'Apoio',
    icon: 'hand-heart-outline',
    title: 'Ajuda recebida',
    description: 'Seu pedido de apoio foi recebido pela equipe.',
    time: '7 min',
    read: true,
  },
  {
    type: 'SOS',
    icon: 'alarm-light-outline',
    title: 'SOS enviado',
    description: 'O alerta urgente foi encaminhado para a recepcao.',
    time: '12 min',
    read: true,
  },
  {
    type: 'Agenda',
    icon: 'calendar-clock',
    title: 'Consulta/exame proximo',
    description: 'Seu exame esta previsto para iniciar em breve.',
    time: '20 min',
    read: true,
  },
  {
    type: 'Acessibilidade',
    icon: 'elevator-passenger',
    title: 'Rota com elevador',
    description: 'A rota acessivel prioriza elevador e evita escadas.',
    time: 'Hoje',
    read: true,
  },
];

export default function NotificationsScreen({ navigate, goBack }) {
  return (
    <Screen>
      <Header title="Notificacoes" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <Text style={styles.title}>Atualizacoes do Navora</Text>
      <Text style={styles.sub}>Alertas de rota, apoio, agenda e acessibilidade.</Text>

      <View style={styles.list}>
        {notifications.map((item) => (
          <View key={`${item.type}-${item.title}`} style={[styles.card, shadows.card]}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <View style={styles.topLine}>
                <Text style={styles.type}>{item.type}</Text>
                <View style={styles.statusRow}>
                  <Text style={[styles.readStatus, !item.read && styles.unreadStatus]}>
                    {item.read ? 'Lida' : 'Não lida'}
                  </Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 14,
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 6,
  },
  list: {
    gap: 12,
    marginTop: 20,
  },
  card: {
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readStatus: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  unreadStatus: {
    color: colors.primary,
  },
  type: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 4,
  },
});
