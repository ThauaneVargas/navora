import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
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
  onStartRoute,
  onResolveNavigationAccess,
  onCreateVisitorAccessRequest,
  navigationData,
  navigationSource = 'fallback',
}) {
  const [query, setQuery] = useState(routeParams.query || '');
  const [filter, setFilter] = useState(routeParams.category || 'Todos');
  const area = getAreaById(userProfile.area);
  const profileLabel = userProfile.type === 'visitor' ? 'Visitante' : 'Paciente';
  const sourceDestinations = navigationSource === 'api' ? navigationData?.destinations || destinations : destinations;

  const visibleDestinations = useMemo(() => {
    const q = normalize(query);
    return sourceDestinations.filter((destination) => {
      const matchesAccess = navigationSource === 'api' ? true : canAccessDestination(destination, userProfile);
      const matchesFilter = filter === 'Todos' || destination.category === filter;
      const matchesQuery = !q || normalize(`${destination.name} ${destination.category}`).includes(q);
      return matchesAccess && matchesFilter && matchesQuery;
    });
  }, [filter, navigationSource, query, sourceDestinations, userProfile]);

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
    const message =
      userProfile.area === 'private'
        ? 'Este destino pertence ao Hospital Marco Capute.\nVoce esta na area HMC Private.\nProcure a recepcao para orientacao.'
        : 'Este destino pertence ao HMC Private.\nVoce esta no Hospital Marco Capute.\nProcure a recepcao para orientacao.';

    Alert.alert(destinationArea.name, message, [
      { text: `Levar ate ${currentReception?.name}`, onPress: () => onStartRoute?.(currentReception) },
      { text: 'Falar com IA', onPress: () => navigate('Assistant') },
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

  const selectDestination = (destination) => {
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

  return (
    <Screen>
      <Header title="Para onde vamos?" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

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
          placeholder="Buscar destino"
          placeholderTextColor="#8B8D96"
          style={styles.input}
        />
        <MaterialCommunityIcons name="tune-variant" size={21} color={colors.primary} />
      </View>

      {wrongAreaDestination ? (
        <Pressable onPress={() => openWrongAreaAlert()} style={styles.warningBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.warningText}>Destino de outra area. Toque para orientacao.</Text>
        </Pressable>
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

          return (
            <Pressable
              key={item.id}
              onPress={() => selectDestination(item)}
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
                <Text numberOfLines={1} style={styles.type}>{externalAccess.label || item.category}</Text>
                <Text numberOfLines={1} style={styles.floor}>{item.floor}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text numberOfLines={1} style={[styles.meta, outsideExternalHours && styles.metaMuted]}>{item.distance}</Text>
                <Text numberOfLines={1} style={styles.time}>{outsideExternalHours ? 'Fora do horario' : item.time}</Text>
                {item.accessLevel === 'visitor_authorization' ? <Text style={styles.auth}>Autorizar</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
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
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
