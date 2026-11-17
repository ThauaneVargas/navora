import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useFavorites } from '../services/favoritesStorage';
import {
  canAccessDestination,
  destinations,
  getExternalExamAccessStatus,
  getAreaById,
  getReceptionDestination,
} from '../data/routes';

const filters = ['Todos', 'Exames', 'Atendimento', 'Servicos', 'Alimentacao', 'Visita'];

const normalize = (value = '') =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function SearchScreen({
  navigate,
  goBack,
  routeParams = {},
  userProfile = { type: 'patient', area: 'private' },
  visitorAccessRequest,
  onStartRoute,
  onResolveNavigationAccess,
  onCreateVisitorAccessRequest,
  navigationData,
  navigationSource = 'fallback',
}) {
  const { appColors, t } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [query, setQuery] = useState(routeParams.query || '');
  const [filter, setFilter] = useState(routeParams.category || 'Todos');
  // O ícone de filtro da busca era só desenho: agora mostra/esconde os filtros.
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState(null);
  // "Destinos favoritos" do Perfil abre já filtrando; a ★ de cada linha
  // favorita/desfavorita.
  const [onlyFavorites, setOnlyFavorites] = useState(Boolean(routeParams.favoritesOnly));
  const { isFavorite, toggleFavorite } = useFavorites();
  const area = getAreaById(userProfile.area);
  const userArea = userProfile.area || 'private';
  const profileLabel = userProfile.type === 'visitor' ? t('common.visitor') : t('common.patient');
  const sourceDestinations = navigationSource === 'api' ? navigationData?.destinations || destinations : destinations;
  const isVisitor = userProfile.type === 'visitor';
  const visitorApproved = isVisitor && ['APPROVED', 'AUTHORIZED'].includes(visitorAccessRequest?.status);
  const visitorAllowedNames = new Set(
    [
      visitorAccessRequest?.requestedDestination,
      visitorAccessRequest?.destinationName,
      'Recepção',
      'Banheiro',
      'Sala de espera',
      'Saida',
    ]
      .filter(Boolean)
      .map(normalize)
  );

  const visitorCanSeeDestination = (destination) => {
    if (!isVisitor) return true;
    if (destination.accessLevel === 'public' || destination.accessLevel === 'visitor_allowed') return true;
    if (!visitorApproved) return false;
    const destinationText = normalize(`${destination.name} ${destination.category}`);
    return [...visitorAllowedNames].some((allowed) => allowed && destinationText.includes(allowed));
  };

  const visibleDestinations = useMemo(() => {
    const q = normalize(query);
    return sourceDestinations.filter((destination) => {
      // Só destinos da unidade em que a pessoa está (+ áreas comuns). Com a API
      // online a lista vem das duas unidades: antes o paciente do SUS via o
      // banheiro do Private. Offline o canAccessDestination já filtrava.
      const inUserArea = destination.area === userArea || destination.area === 'shared';
      const baseAccess = navigationSource === 'api' ? true : canAccessDestination(destination, userProfile);
      const matchesAccess = inUserArea && baseAccess && visitorCanSeeDestination(destination);
      const matchesFilter = filter === 'Todos' || destination.category === filter;
      const matchesQuery = !q || normalize(`${destination.name} ${destination.category}`).includes(q);
      const matchesFavorite = !onlyFavorites || isFavorite(destination);
      return matchesAccess && matchesFilter && matchesQuery && matchesFavorite;
    });
  }, [filter, isFavorite, navigationSource, onlyFavorites, query, sourceDestinations, userArea, userProfile, visitorApproved, visitorAccessRequest]);

  const wrongAreaDestination = useMemo(() => {
    if (navigationSource === 'api') return null;
    const q = normalize(query);
    if (!q) return null;
    return sourceDestinations.find(
      (destination) =>
        destination.area !== userProfile.area &&
        destination.area !== 'shared' &&
        destination.area !== 'restricted' &&
        normalize(destination.name).includes(q)
    );
  }, [navigationSource, query, sourceDestinations, userProfile.area]);

  const openWrongAreaAlert = (destination = wrongAreaDestination) => {
    if (!destination) return;
    const currentReception = getReceptionDestination(userProfile.area);
    const destinationArea = getAreaById(destination.area);
    const message = t('search.otherAreaMessage', { area: area.name });

    Alert.alert(destinationArea.name, message, [
      { text: `Levar ate ${currentReception?.name}`, onPress: () => onStartRoute?.(currentReception) },
      { text: t('search.openAssistant'), onPress: () => navigate('Assistant') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const openExternalExamAccessAlert = (destination) => {
    const reception = getReceptionDestination(userProfile.area);
    const status = getExternalExamAccessStatus(destination);

    Alert.alert(
      t('search.externalTitle'),
      t('search.externalMessage', { name: destination.name, hours: status.label.replace('Atendimento externo: ', '') }),
      [
        { text: `Levar ate ${reception?.name}`, onPress: () => onStartRoute?.(reception) },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const startSelectedDestination = (destination) => {
    if (navigationSource === 'api') {
      onResolveNavigationAccess?.(destination);
      return;
    }

    if (destination.area !== userProfile.area && destination.area !== 'shared') {
      openWrongAreaAlert(destination);
      return;
    }

    const externalAccess = getExternalExamAccessStatus(destination);
    if (userProfile.type !== 'visitor' && externalAccess.controlled && !externalAccess.allowed) {
      openExternalExamAccessAlert(destination);
      return;
    }

    if (userProfile.type === 'patient') {
      Alert.alert(t('common.restrictedAccess'), t('search.notReleased'));
      return;
    }

    if (userProfile.type === 'visitor' && destination.accessLevel === 'visitor_authorization') {
      onCreateVisitorAccessRequest?.({
        visitorName: userProfile.fullName || userProfile.name || 'Visitante Navora',
        destination,
        destinationCode: destination.code || destination.id,
        requestedDestination: destination.name,
        reason: 'Visita',
        accessibility: 'Nao',
      });
      return;
    }

    onStartRoute?.(destination);
  };

  const selectDestination = (destination) => {
    setSelectedDestination(destination);
    startSelectedDestination(destination);
  };

  return (
    <Screen withBottomTabs>
      <Header title={t('search.title')} subtitle={t('search.subtitle')} centerTitle tabRoot onMenu={() => navigate('Menu')} onNotifications={() => navigate('Notifications')} />

      <View style={[styles.areaCard, shadows.card]}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={appColors.primary} />
        <View style={styles.copy}>
          <Text style={styles.areaTitle}>{t('search.currentArea', { name: area.name })}</Text>
          <Text style={styles.areaMeta}>{t('search.areaMeta', { entry: area.entryLabel, profile: profileLabel })}</Text>
        </View>
      </View>

      <View style={[styles.searchBox, shadows.card]}>
        <MaterialCommunityIcons name="magnify" size={22} color={appColors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => wrongAreaDestination && openWrongAreaAlert()}
          placeholder={t('search.placeholder')}
          placeholderTextColor={appColors.lightText}
          style={styles.input}
          accessibilityLabel={t('search.searchLabel')}
        />
        {query ? (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel={t('search.clear')}
            hitSlop={10}
            style={styles.searchAction}
          >
            <MaterialCommunityIcons name="close-circle" size={21} color={appColors.muted} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={showFilters ? t('search.hideFilters') : t('search.showFilters')}
          accessibilityState={{ expanded: showFilters }}
          hitSlop={10}
          style={[styles.searchAction, filter !== 'Todos' && styles.searchActionActive]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={21}
            color={filter !== 'Todos' ? '#FFFFFF' : appColors.primary}
          />
        </Pressable>
      </View>

      {wrongAreaDestination ? (
        <Pressable onPress={() => openWrongAreaAlert()} style={styles.warningBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={appColors.primary} />
          <Text style={styles.warningText}>{t('search.otherArea')}</Text>
        </Pressable>
      ) : null}

      {isVisitor ? (
        <View style={styles.accessNotice}>
          <MaterialCommunityIcons name="shield-check-outline" size={17} color={appColors.primary} />
          <Text style={styles.accessNoticeText}>
            {visitorApproved
              ? t('search.visitorApproved')
              : t('search.visitorPending')}
          </Text>
        </View>
      ) : null}

      {showFilters ? (
        <View style={styles.filters}>
          <Pressable
            onPress={() => setOnlyFavorites((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ selected: onlyFavorites }}
            style={[styles.filter, styles.favoriteFilter, onlyFavorites && styles.filterActive]}
          >
            <MaterialCommunityIcons
              name={onlyFavorites ? 'star' : 'star-outline'}
              size={16}
              color={onlyFavorites ? '#FFFFFF' : appColors.primary}
            />
            <Text style={[styles.filterText, onlyFavorites && styles.filterTextActive]}>
              {t('search.favorites')}
            </Text>
          </Pressable>
          {filters.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              style={[styles.filter, filter === item && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {t(`search.filters.${item}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.resultCount} accessibilityLiveRegion="polite">
        {visibleDestinations.length === 1 ? t('search.countOne') : t('search.countMany', { n: visibleDestinations.length })}
        {filter !== 'Todos' ? t('search.inCategory', { category: t(`search.filters.${filter}`) }) : ''}
      </Text>

      <View style={styles.list}>
        {visibleDestinations.map((item) => {
          const externalAccess = getExternalExamAccessStatus(item);
          const outsideExternalHours =
            navigationSource !== 'api' && userProfile.type !== 'visitor' && externalAccess.controlled && !externalAccess.allowed;
          const accessLabel = item.accessLevel === 'visitor_authorization'
            ? t('search.needsAuthorization')
            : item.accessLevel === 'restricted'
              ? t('common.restrictedAccess')
              : outsideExternalHours
                ? t('search.outsideHours')
                : t('search.routeAvailable');

          return (
            <Pressable
              key={item.id}
              onPress={() => selectDestination(item)}
              accessibilityRole="button"
              accessibilityLabel={`Destino ${item.name}`}
              accessibilityHint={accessLabel}
              style={({ pressed }) => [styles.row, outsideExternalHours && styles.rowMuted, pressed && styles.pressed]}
            >
              <View style={styles.iconBox}>
                <MaterialCommunityIcons
                  name={outsideExternalHours ? 'clock-alert-outline' : item.icon}
                  size={21}
                  color={outsideExternalHours ? appColors.muted : appColors.primary}
                />
              </View>
              <View style={styles.copy}>
                <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.type}>{item.category} - {(typeof item.sector === 'object' ? item.sector?.name : item.sector) || t('search.sectorFallback')}</Text>
                <Text numberOfLines={1} style={styles.floor}>{item.floor || t('search.floorUnknown')}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text numberOfLines={1} style={[styles.meta, outsideExternalHours && styles.metaMuted]}>{item.distance}</Text>
                <Text numberOfLines={1} style={styles.time}>{item.time || t('search.timeUnknown')}</Text>
                <Text numberOfLines={1} style={[styles.auth, outsideExternalHours && styles.metaMuted]}>{accessLabel}</Text>
              </View>
              <Pressable
                onPress={() => toggleFavorite(item)}
                accessibilityRole="button"
                accessibilityLabel={isFavorite(item) ? t('search.unfavoriteA11y', { name: item.name }) : t('search.favoriteA11y', { name: item.name })}
                accessibilityState={{ selected: isFavorite(item) }}
                hitSlop={6}
                style={({ pressed }) => [styles.starButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons
                  name={isFavorite(item) ? 'star' : 'star-outline'}
                  size={24}
                  color={isFavorite(item) ? appColors.warning : appColors.muted}
                />
              </Pressable>
            </Pressable>
          );
        })}
        {!visibleDestinations.length ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name={onlyFavorites ? 'star-outline' : 'map-search-outline'} size={32} color={appColors.primary} />
            <Text style={styles.emptyTitle}>{onlyFavorites ? t('search.noFavorites') : t('search.notFound')}</Text>
            <Text style={styles.emptyText}>{onlyFavorites ? t('search.noFavoritesSub') : t('search.notFoundSub')}</Text>
          </View>
        ) : null}
      </View>

      {selectedDestination ? (
        <View style={[styles.previewCard, shadows.card]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIcon}>
              <MaterialCommunityIcons name="routes" size={22} color={appColors.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.previewKicker}>{t('search.preRoute')}</Text>
              <Text style={styles.previewTitle}>{selectedDestination.name}</Text>
            </View>
            <Pressable onPress={() => setSelectedDestination(null)} style={styles.closePreview}>
              <MaterialCommunityIcons name="close" size={18} color={appColors.muted} />
            </Pressable>
          </View>
          <View style={styles.previewGrid}>
            <PreviewInfo label={t('search.origin')} value={userProfile.currentLocation || area.entryLabel || t('search.currentEntrance')} />
            <PreviewInfo label={t('search.destination')} value={selectedDestination.name} />
            <PreviewInfo label={t('search.floor')} value={selectedDestination.floor || t('common.notInformed')} />
            <PreviewInfo label={t('search.estimate')} value={[selectedDestination.distance, selectedDestination.time].filter(Boolean).join(' - ') || t('common.unavailable')} />
          </View>
          <View style={styles.accessRow}>
            <MaterialCommunityIcons name="wheelchair-accessibility" size={17} color={appColors.primary} />
            <Text style={styles.accessText}>
              {userProfile?.accessibility?.avoidStairs || userProfile?.accessibility?.wheelchair
                ? t('search.accessibleConsidered')
                : t('search.accessibleAdjust')}
            </Text>
          </View>
          <Pressable onPress={() => startSelectedDestination(selectedDestination)} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
            <Text style={styles.startText}>{t('search.startNavigation')}</Text>
            <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      <BottomTabs active="Navigate" navigate={navigate} />
    </Screen>
  );
}

function PreviewInfo({ label, value }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <View style={styles.previewInfo}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  areaCard: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 10,
    marginTop: 14,
  },
  areaTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  areaMeta: { color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 2 },
  searchBox: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 9,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  warningBox: {
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  warningText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  accessNotice: {
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  accessNoticeText: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 8 },
  searchAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionActive: { backgroundColor: colors.primary },
  resultCount: { color: colors.muted, fontSize: 13, fontWeight: '800', marginTop: 4, marginBottom: 2 },
  filter: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteFilter: { flexDirection: 'row', gap: 6 },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  // ★ do tamanho de um botão (44 px de toque com o hitSlop).
  starButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  filterText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  filterTextActive: { color: '#FFFFFF' },
  list: {
    marginTop: 6,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    minHeight: 74,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMuted: { backgroundColor: colors.backgroundSoft },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 15, fontWeight: '900' },
  floor: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 1 },
  type: { color: colors.text, fontSize: 10, fontWeight: '700', marginTop: 2 },
  metaBox: { maxWidth: 86, alignItems: 'flex-end' },
  meta: { color: colors.primary, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  metaMuted: { color: colors.muted },
  time: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 1 },
  auth: { color: colors.primary, fontSize: 9, fontWeight: '900', marginTop: 2 },
  emptyState: { minHeight: 160, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  previewKicker: { color: colors.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  previewTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  closePreview: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  previewInfo: { width: '48%', minHeight: 58, borderRadius: 15, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, padding: 10 },
  previewLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  previewValue: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '900', marginTop: 4 },
  accessRow: { minHeight: 38, borderRadius: 15, backgroundColor: colors.primarySoft, paddingHorizontal: 11, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  accessText: { flex: 1, color: colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900' },
  startButton: { minHeight: 52, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  startText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
