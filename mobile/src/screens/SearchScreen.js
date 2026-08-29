import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import {
  canAccessDestination,
  destinations,
  getExternalExamAccessStatus,
  getAreaById,
  getReceptionDestination,
} from '../data/routes';

const filters = ['Todos', 'Exames', 'Atendimento', 'Servicos', 'Visita'];

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
  const [query, setQuery] = useState(routeParams.query || '');
  const [filter, setFilter] = useState(routeParams.category || 'Todos');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const area = getAreaById(userProfile.area);
  const profileLabel = userProfile.type === 'visitor' ? 'Visitante' : 'Paciente';
  const sourceDestinations = navigationSource === 'api' ? navigationData?.destinations || destinations : destinations;
  const isVisitor = userProfile.type === 'visitor';
  const visitorApproved = isVisitor && ['APPROVED', 'AUTHORIZED'].includes(visitorAccessRequest?.status);
  const visitorAllowedNames = new Set(
    [
      visitorAccessRequest?.requestedDestination,
      visitorAccessRequest?.destinationName,
      'Recepcao',
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
      const baseAccess = navigationSource === 'api' ? true : canAccessDestination(destination, userProfile);
      const matchesAccess = baseAccess && visitorCanSeeDestination(destination);
      const matchesFilter = filter === 'Todos' || destination.category === filter;
      const matchesQuery = !q || normalize(`${destination.name} ${destination.category}`).includes(q);
      return matchesAccess && matchesFilter && matchesQuery;
    });
  }, [filter, navigationSource, query, sourceDestinations, userProfile, visitorApproved, visitorAccessRequest]);

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
    const message = `Este destino pertence a outro ambiente do hospital ativo.\nVoce esta em ${area.name}.\nProcure a recepcao para orientacao segura.`;

    Alert.alert(destinationArea.name, message, [
      { text: `Levar ate ${currentReception?.name}`, onPress: () => onStartRoute?.(currentReception) },
      { text: 'Abrir assistente', onPress: () => navigate('Assistant') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const openExternalExamAccessAlert = (destination) => {
    const reception = getReceptionDestination(userProfile.area);
    const status = getExternalExamAccessStatus(destination);

    Alert.alert(
      'Atendimento externo',
      `${destination.name} recebe pacientes externos das ${status.label.replace('Atendimento externo: ', '')}.\nProcure a recepcao para orientacao ou aguarde o horario permitido.`,
      [
        { text: `Levar ate ${reception?.name}`, onPress: () => onStartRoute?.(reception) },
        { text: 'Cancelar', style: 'cancel' },
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

    if (userProfile.type === 'visitor' && destination.accessLevel === 'visitor_authorization') {
      onCreateVisitorAccessRequest?.({
        visitorName: 'Visitante Navora',
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
  };

  return (
    <Screen withBottomTabs>
      <Header title="Navegar" subtitle="Buscar destino, revisar rota e iniciar" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.areaCard, shadows.card]}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={colors.primary} />
        <View style={styles.copy}>
          <Text style={styles.areaTitle}>Area atual: {area.name}</Text>
          <Text style={styles.areaMeta}>Entrada: {area.entryLabel} - Perfil: {profileLabel}</Text>
        </View>
      </View>

      <View style={[styles.searchBox, shadows.card]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => wrongAreaDestination && openWrongAreaAlert()}
          placeholder="Buscar setor, servico ou destino"
          placeholderTextColor="#8B8D96"
          style={styles.input}
          accessibilityLabel="Buscar destino"
        />
        <MaterialCommunityIcons name="tune-variant" size={21} color={colors.primary} />
      </View>

      {wrongAreaDestination ? (
        <Pressable onPress={() => openWrongAreaAlert()} style={styles.warningBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.warningText}>Destino de outra area. Toque para orientacao.</Text>
        </Pressable>
      ) : null}

      {isVisitor ? (
        <View style={styles.accessNotice}>
          <MaterialCommunityIcons name="shield-check-outline" size={17} color={colors.primary} />
          <Text style={styles.accessNoticeText}>
            {visitorApproved
              ? 'Apenas areas autorizadas estao disponiveis para navegacao.'
              : 'Antes da liberacao, apenas recepcao, banheiro e areas publicas aparecem aqui.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {visibleDestinations.map((item) => {
          const externalAccess = getExternalExamAccessStatus(item);
          const outsideExternalHours =
            navigationSource !== 'api' && userProfile.type !== 'visitor' && externalAccess.controlled && !externalAccess.allowed;
          const accessLabel = item.accessLevel === 'visitor_authorization'
            ? 'Precisa autorizacao'
            : item.accessLevel === 'restricted'
              ? 'Acesso restrito'
              : outsideExternalHours
                ? 'Fora do horario'
                : 'Rota disponivel';

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
                  color={outsideExternalHours ? colors.muted : colors.primary}
                />
              </View>
              <View style={styles.copy}>
                <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.type}>{item.category} - {item.sector || 'Setor informado pela rota'}</Text>
                <Text numberOfLines={1} style={styles.floor}>{item.floor || 'Andar nao informado'}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text numberOfLines={1} style={[styles.meta, outsideExternalHours && styles.metaMuted]}>{item.distance}</Text>
                <Text numberOfLines={1} style={styles.time}>{item.time || 'Tempo indisponivel'}</Text>
                <Text numberOfLines={1} style={[styles.auth, outsideExternalHours && styles.metaMuted]}>{accessLabel}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          );
        })}
        {!visibleDestinations.length ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-search-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>Destino nao encontrado</Text>
            <Text style={styles.emptyText}>Tente outro termo ou procure a recepcao para orientacao.</Text>
          </View>
        ) : null}
      </View>

      {selectedDestination ? (
        <View style={[styles.previewCard, shadows.card]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIcon}>
              <MaterialCommunityIcons name="routes" size={22} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.previewKicker}>Pre-rota</Text>
              <Text style={styles.previewTitle}>{selectedDestination.name}</Text>
            </View>
            <Pressable onPress={() => setSelectedDestination(null)} style={styles.closePreview}>
              <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.previewGrid}>
            <PreviewInfo label="Origem" value={userProfile.currentLocation || area.entryLabel || 'Entrada atual'} />
            <PreviewInfo label="Destino" value={selectedDestination.name} />
            <PreviewInfo label="Andar" value={selectedDestination.floor || 'Nao informado'} />
            <PreviewInfo label="Estimativa" value={[selectedDestination.distance, selectedDestination.time].filter(Boolean).join(' - ') || 'Indisponivel'} />
          </View>
          <View style={styles.accessRow}>
            <MaterialCommunityIcons name="wheelchair-accessibility" size={17} color={colors.primary} />
            <Text style={styles.accessText}>
              {userProfile?.accessibility?.avoidStairs || userProfile?.accessibility?.wheelchair
                ? 'Preferencias acessiveis consideradas quando a rota suporta.'
                : 'Acessibilidade pode ser ajustada no Perfil ou durante a rota.'}
            </Text>
          </View>
          <Pressable onPress={() => startSelectedDestination(selectedDestination)} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
            <Text style={styles.startText}>Iniciar navegacao</Text>
            <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      <BottomTabs active="Navigate" navigate={navigate} />
    </Screen>
  );
}

function PreviewInfo({ label, value }) {
  return (
    <View style={styles.previewInfo}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 54,
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
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FFD2D7',
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
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FFD2D7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  accessNoticeText: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 8 },
  filter: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
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
  rowMuted: { backgroundColor: '#FAFAFB' },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFF6F7',
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
  previewInfo: { width: '48%', minHeight: 58, borderRadius: 15, backgroundColor: '#FFF7F8', borderWidth: 1, borderColor: colors.border, padding: 10 },
  previewLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  previewValue: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '900', marginTop: 4 },
  accessRow: { minHeight: 38, borderRadius: 15, backgroundColor: colors.primarySoft, paddingHorizontal: 11, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  accessText: { flex: 1, color: colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900' },
  startButton: { height: 52, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  startText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
