import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const initialNotifications = [
  {
    id: 'route-recalculated',
    category: 'Navegacao',
    icon: 'routes',
    title: 'Rota recalculada',
    description: 'Encontramos um caminho mais curto ate Tomografia.',
    time: 'Agora',
    read: false,
  },
  {
    id: 'reception-busy',
    category: 'Acesso',
    icon: 'account-group-outline',
    title: 'Local movimentado',
    description: 'A recepcao esta com maior movimento neste momento.',
    time: '3 min',
    read: false,
  },
  {
    id: 'help-received',
    category: 'Ajuda-SOS',
    icon: 'hand-heart-outline',
    title: 'Ajuda recebida',
    description: 'Seu pedido de apoio foi recebido pela equipe.',
    time: '7 min',
    read: true,
  },
  {
    id: 'sos-sent',
    category: 'Ajuda-SOS',
    icon: 'alarm-light-outline',
    title: 'SOS enviado',
    description: 'O alerta urgente foi encaminhado para a recepcao.',
    time: '12 min',
    read: true,
  },
  {
    id: 'appointment-soon',
    category: 'Acesso',
    icon: 'calendar-clock',
    title: 'Consulta/exame proximo',
    description: 'Seu exame esta previsto para iniciar em breve.',
    time: '20 min',
    read: true,
  },
  {
    id: 'accessible-route',
    category: 'Navegacao',
    icon: 'elevator-passenger',
    title: 'Rota com elevador',
    description: 'A rota acessivel prioriza elevador e evita escadas.',
    time: 'Hoje',
    read: true,
  },
];

const filters = ['Todas', 'Acesso', 'Navegacao', 'Ajuda-SOS'];

export default function NotificationsScreen({ navigate, goBack }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('Todas');

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );
  const filteredNotifications = useMemo(
    () => activeFilter === 'Todas'
      ? notifications
      : notifications.filter((item) => item.category === activeFilter),
    [activeFilter, notifications]
  );

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const confirmClear = () => {
    if (!notifications.length) return;
    Alert.alert(
      'Limpar notificacoes',
      'Tem certeza que deseja remover todas as notificacoes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => setNotifications([]) },
      ]
    );
  };

  return (
    <Screen>
      <Header title="Notificacoes" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>Atualizacoes do Navora</Text>
          <Text style={styles.sub}>Alertas de rota, apoio, agenda e acessibilidade.</Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{unreadCount}</Text>
          <Text style={styles.counterLabel}>nao lidas</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={markAllAsRead}
          disabled={!unreadCount}
          style={({ pressed }) => [styles.actionButton, !unreadCount && styles.disabled, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="check-all" size={17} color={appColors.primary} />
          <Text style={styles.actionText}>Marcar todas como lidas</Text>
        </Pressable>
        <Pressable
          onPress={confirmClear}
          disabled={!notifications.length}
          style={({ pressed }) => [styles.actionButton, styles.actionDanger, !notifications.length && styles.disabled, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={17} color={appColors.danger} />
          <Text style={styles.actionDangerText}>Limpar notificacoes</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {filters.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={({ pressed }) => [styles.filter, activeFilter === filter && styles.filterActive, pressed && styles.pressed]}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      {filteredNotifications.length ? (
        <View style={styles.list}>
          {filteredNotifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onDelete={() => deleteNotification(item.id)}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyCard, shadows.card]}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="bell-check-outline" size={34} color={appColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma notificacao</Text>
          <Text style={styles.emptyText}>Quando houver novidades, elas aparecerao aqui.</Text>
        </View>
      )}
    </Screen>
  );
}

function NotificationCard({ item, onDelete }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <View style={[styles.card, !item.read && styles.unreadCard, shadows.card]}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={item.icon} size={24} color={appColors.primary} />
      </View>
      <View style={styles.copy}>
        <View style={styles.topLine}>
          <Text style={styles.type}>{item.category}</Text>
          <View style={styles.statusRow}>
            {!item.read ? <View style={styles.unreadDot} /> : null}
            <Text style={[styles.readStatus, !item.read && styles.unreadStatus]}>
              {item.read ? 'Lida' : 'Nao lida'}
            </Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${item.title}`}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="close" size={18} color={appColors.muted} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 14,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 6,
  },
  counter: {
    minWidth: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  counterValue: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  counterLabel: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  actions: {
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionDanger: {
    borderColor: colors.border,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  actionDangerText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  filter: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
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
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
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
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  emptyCard: {
    minHeight: 210,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.86,
  },
});
