import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { isNetworkError, navoraApi } from '../services/api';
import { localeFor } from '../i18n';

// Antes, sem notificação real, a tela mostrava 3 notificações de exemplo como
// se fossem do usuário ("Rota recalculada até Tomografia" etc.). Agora mostra o
// estado vazio. Título e texto de cada notificação vêm do servidor (português).

// O servidor manda a categoria como texto ("Navegacao", "Acesso", "Ajuda-SOS"),
// sem acento — o filtro antigo procurava "Navegação" e nunca achava.
const normalize = (value) =>
  String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function categoryId(category) {
  const value = normalize(category);
  if (value.startsWith('naveg')) return 'navigation';
  if (value.startsWith('acess')) return 'access';
  if (value.startsWith('ajuda') || value.includes('sos')) return 'help';
  return 'other';
}

const FILTERS = ['all', 'access', 'navigation', 'help'];

function formatTime(isoString, t, language) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return t('notifications.now');
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return date.toLocaleDateString(localeFor(language), { day: '2-digit', month: '2-digit' });
}

export default function NotificationsScreen({ navigate, goBack }) {
  const { appColors, t, language } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await navoraApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filtered = useMemo(
    () => (activeFilter === 'all' ? notifications : notifications.filter((n) => categoryId(n.category) === activeFilter)),
    [activeFilter, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
    try {
      await navoraApi.markAllNotificationsRead();
    } catch (err) {
      if (!isNetworkError(err)) setNotifications(prev);
    }
  }, [notifications]);

  const handleDelete = useCallback(async (id) => {
    const prev = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id && n.id !== String(id)));
    try {
      await navoraApi.deleteNotification(id);
    } catch (err) {
      if (!isNetworkError(err)) setNotifications(prev);
    }
  }, [notifications]);

  const confirmClear = () => {
    if (!notifications.length) return;
    Alert.alert(
      t('notifications.clearTitle'),
      t('notifications.clearConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notifications.clear'), style: 'destructive', onPress: async () => {
            const prev = notifications;
            setNotifications([]);
            try {
              await Promise.all(prev.map((n) => navoraApi.deleteNotification(n.id)));
            } catch {
              // best-effort
            }
          }
        },
      ]
    );
  };

  return (
    <Screen>
      <Header title={t('notifications.title')} centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>{t('notifications.headerTitle')}</Text>
          <Text style={styles.sub}>{t('notifications.headerSub')}</Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{unreadCount}</Text>
          <Text style={styles.counterLabel}>{t('notifications.unread')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={markAllAsRead}
          disabled={!unreadCount}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, !unreadCount && styles.disabled, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="check-all" size={17} color={appColors.primary} />
          <Text style={styles.actionText}>{t('notifications.markAllRead')}</Text>
        </Pressable>
        <Pressable
          onPress={confirmClear}
          disabled={!notifications.length}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, styles.actionDanger, !notifications.length && styles.disabled, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={17} color={appColors.danger} />
          <Text style={styles.actionDangerText}>{t('notifications.clearTitle')}</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            accessibilityRole="button"
            accessibilityState={{ selected: activeFilter === filter }}
            style={({ pressed }) => [styles.filter, activeFilter === filter && styles.filterActive, pressed && styles.pressed]}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {t(`notifications.filter_${filter}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <SkeletonList appColors={appColors} />
      ) : filtered.length ? (
        <View style={styles.list}>
          {filtered.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onDelete={() => handleDelete(item.id)}
              appColors={appColors}
              styles={styles}
              t={t}
              language={language}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyCard, shadows.card]}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="bell-check-outline" size={34} color={appColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('notifications.emptyText')}</Text>
        </View>
      )}
    </Screen>
  );
}

function SkeletonPulse({ style, appColors }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[style, { opacity: anim, backgroundColor: appColors.border }]} />;
}

function SkeletonCard({ appColors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, marginBottom: 8 }}>
      <SkeletonPulse style={{ width: 44, height: 44, borderRadius: 22 }} appColors={appColors} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonPulse style={{ height: 10, borderRadius: 6, width: '40%' }} appColors={appColors} />
        <SkeletonPulse style={{ height: 13, borderRadius: 6, width: '75%' }} appColors={appColors} />
        <SkeletonPulse style={{ height: 10, borderRadius: 6, width: '90%' }} appColors={appColors} />
      </View>
    </View>
  );
}

function SkeletonList({ appColors }) {
  return (
    <View style={{ marginTop: 8, gap: 0 }}>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} appColors={appColors} />)}
    </View>
  );
}

function NotificationCard({ item, onDelete, appColors, styles, t, language }) {
  return (
    <View style={[styles.card, !item.read && styles.unreadCard, shadows.card]}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={item.icon} size={24} color={appColors.primary} />
      </View>
      <View style={styles.copy}>
        <View style={styles.topLine}>
          <Text style={styles.type}>{t(`notifications.filter_${categoryId(item.category)}`)}</Text>
          <View style={styles.statusRow}>
            {!item.read ? <View style={styles.unreadDot} /> : null}
            <Text style={[styles.readStatus, !item.read && styles.unreadStatus]}>
              {item.read ? t('notifications.read') : t('notifications.notRead')}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt, t, language)}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={t('notifications.deleteA11y', { title: item.title })}
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
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
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
