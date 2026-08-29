import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomTabs from '../components/BottomTabs';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';
import { getAreaById, getReceptionDestination } from '../data/routes';

export default function PatientHomeScreen({
  navigate,
  userProfile = {},
  activeRoute,
  navigationProgress,
  visitorAccessRequest,
  onStartRoute,
  navigationData,
  activeHospital,
  hospitalDetection,
}) {
  const area = getAreaById(userProfile.area || 'private');
  const isVisitor = userProfile.type === 'visitor';
  const name = userProfile.name || (isVisitor ? 'Visitante' : 'Paciente');
  const destination = activeRoute?.destination || userProfile.lastDestination || 'Escolha um destino';
  const hasActiveRoute = Boolean(activeRoute?.status === 'active' || activeRoute?.destination);
  const visitStatus = visitorAccessRequest?.status;
  const visitApproved = isVisitor && ['APPROVED', 'AUTHORIZED'].includes(visitStatus);
  const [now, setNow] = useState(Date.now());
  const journey = getJourneyState({ activeRoute, hospitalDetection, isVisitor, visitorAccessRequest });
  const reception =
    navigationData?.destinations?.find((item) => item.code === `${area.id}-reception` || item.id === `${area.id}-reception`) ||
    getReceptionDestination(area.id);

  const goReception = () => onStartRoute?.(reception);
  const remaining = useMemo(() => getRemainingTime(visitorAccessRequest, now), [now, visitorAccessRequest]);
  const visitExpired = isVisitor && (visitStatus === 'EXPIRED' || remaining.expired);

  useEffect(() => {
    if (!visitApproved || !visitorAccessRequest?.expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visitApproved, visitorAccessRequest?.expiresAt]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.stage}>
        <AppHeader navigate={navigate} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.currentPill}>
              <MaterialCommunityIcons name="hospital-building" size={15} color={colors.primary} />
              <Text style={styles.currentPillText}>{activeHospital?.name || area.name}</Text>
            </View>
            <Text style={styles.title}>Ola, {name}!</Text>
            <Text style={styles.subtitle}>Para onde vamos hoje?</Text>
          </View>

          {visitApproved && !visitExpired ? (
            <View style={[styles.visitCard, remaining.warning && styles.visitWarning, shadows.card]}>
              <View style={styles.visitHeader}>
                <View style={styles.visitIcon}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.searchCopy}>
                  <Text style={styles.label}>Visita ativa</Text>
                  <Text style={styles.visitTitle}>Acesso liberado</Text>
                </View>
              </View>
              <Text style={styles.visitDestination}>{visitorAccessRequest?.requestedDestination || 'Destino definido pela recepcao'}</Text>
              <Text style={styles.visitMeta}>
                {[visitorAccessRequest?.floor || visitorAccessRequest?.destinationFloor, visitorAccessRequest?.sector].filter(Boolean).join(' | ') || visitorAccessRequest?.allowedRoute || 'Rota definida pela recepcao'}
              </Text>
              <View style={styles.visitTimer}>
                <MaterialCommunityIcons name={remaining.expired ? 'timer-alert-outline' : 'timer-outline'} size={17} color={remaining.warning ? colors.danger : colors.primary} />
                <Text style={[styles.visitTimerText, remaining.warning && styles.visitTimerDanger]}>
                  {remaining.expired ? 'Seu acesso de visitante expirou.' : `Tempo restante: ${remaining.label}`}
                </Text>
              </View>
              <Pressable onPress={() => navigate('VisitorAccessStatus', { request: visitorAccessRequest })} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.primary} />
                <Text style={styles.secondaryText}>Continuar rota</Text>
              </Pressable>
            </View>
          ) : null}

          {visitExpired ? (
            <View style={[styles.expiredCard, shadows.card]}>
              <Text style={styles.expiredTitle}>Seu acesso de visitante expirou.</Text>
              <Text style={styles.expiredText}>A navegacao restrita foi desabilitada. Voce ainda pode ir para a recepcao ou para a saida.</Text>
              <Pressable onPress={goReception} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>Ir para recepcao</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.journeyCard, shadows.card]}>
            <View style={[styles.journeyIcon, { backgroundColor: journey.color }]}>
              <MaterialCommunityIcons name={journey.icon} size={25} color="#FFFFFF" />
            </View>
            <View style={styles.searchCopy}>
              <Text style={styles.label}>Minha Jornada</Text>
              <Text style={styles.journeyTitle}>{journey.title}</Text>
              <Text style={styles.journeyText}>{journey.text}</Text>
            </View>
            <Pressable onPress={() => navigate(journey.screen, journey.params)} style={({ pressed }) => [styles.journeyAction, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
            </Pressable>
          </View>

          <View style={[styles.aiPanel, shadows.card]}>
            <View style={styles.aiTop}>
              <View style={styles.aiIcon}>
                <MaterialCommunityIcons name="microphone" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.searchCopy}>
                <Text style={styles.searchLabel}>Navora IA</Text>
                <Text style={styles.searchText}>{isVisitor ? 'Responde respeitando as areas autorizadas.' : 'Pergunte por rotas, ajuda, acessibilidade ou SOS.'}</Text>
              </View>
            </View>
            <Pressable onPress={() => navigate('Assistant', { voice: true })} style={({ pressed }) => [styles.micButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="microphone" size={22} color="#FFFFFF" />
              <Text style={styles.primaryText}>Falar com a Navora</Text>
            </Pressable>
            <Pressable onPress={() => navigate('Assistant')} style={({ pressed }) => [styles.textAiButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="keyboard-outline" size={18} color={colors.primary} />
              <Text style={styles.secondaryText}>Digitar mensagem</Text>
            </Pressable>
            <View style={styles.quickSuggestions}>
              {['Como chegar ao exame?', 'Onde fica a recepcao?', 'Preciso de ajuda'].map((item) => (
                <Pressable key={item} onPress={() => navigate('Assistant', { prompt: item })} style={styles.quickChip}>
                  <Text style={styles.quickChipText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.categories}>
            <Text style={styles.sectionTitle}>Para onde vamos?</Text>
            <View style={styles.shortcuts}>
              {destinationCategories(isVisitor, visitApproved).map((item) => (
                <Shortcut key={item.title} icon={item.icon} title={item.title} onPress={() => navigate('Search', item.params)} />
              ))}
            </View>
            {isVisitor ? <Text style={styles.accessNotice}>Apenas areas autorizadas estao disponiveis para navegacao.</Text> : null}
          </View>

          <View style={[styles.locationCard, shadows.card]}>
            <View style={styles.locationIcon}>
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primary} />
            </View>
            <View style={styles.searchCopy}>
              <Text style={styles.label}>Localizacao indoor</Text>
              <Text style={styles.locationText}>{userProfile.currentLocation || area.entryLabel || 'Entrada identificada'}</Text>
              <Text style={styles.locationMeta}>{userProfile.currentBeacon ? `Beacon simulado ${userProfile.currentBeacon}` : 'Localizacao indoor simulada no Expo Go'}</Text>
            </View>
          </View>

          {hasActiveRoute ? (
            <View style={[styles.destinationCard, shadows.card]}>
              <Text style={styles.label}>Rota em andamento</Text>
              <Text style={styles.destination}>{destination}</Text>
              <View style={styles.routeMeta}>
                <MaterialCommunityIcons name="walk" size={16} color={colors.primary} />
                <Text style={styles.routeText}>{activeRoute?.distance || 'Distancia indisponivel'}</Text>
                <View style={styles.dot} />
                <Text style={styles.routeText}>{navigationProgress?.currentFloor || activeRoute?.eta || 'Orientacao ativa'}</Text>
              </View>
              <Pressable onPress={() => navigate('Navigation', { destination })} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText}>Continuar navegacao</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.shortcuts}>
            {hasActiveRoute ? <Shortcut icon="navigation-variant" title="Continuar rota" onPress={() => navigate('Navigation', { destination })} /> : null}
            <Shortcut icon="map-marker-question-outline" title="Estou perdido" onPress={() => navigate('Lost')} />
            <Shortcut icon="alarm-light-outline" title="Ajuda / SOS" onPress={() => navigate('Help', { type: 'help' })} />
            <Shortcut icon="wheelchair-accessibility" title="Acessibilidade" onPress={() => navigate('Accessibility')} />
          </View>
        </ScrollView>
        <BottomTabs active="Home" navigate={navigate} />
      </View>
    </Screen>
  );
}

function getJourneyState({ activeRoute, hospitalDetection, isVisitor, visitorAccessRequest }) {
  if (activeRoute?.status === 'arrived') {
    return {
      icon: 'check-circle-outline',
      color: colors.success,
      title: 'Voce chegou ao destino',
      text: 'A rota foi concluida. Voce pode voltar ao inicio ou pedir ajuda.',
      screen: 'Home',
    };
  }

  if (activeRoute?.destination) {
    return {
      icon: 'navigation-variant',
      color: colors.blue,
      title: 'Navegacao em andamento',
      text: activeRoute.destination,
      screen: 'Navigation',
      params: { destination: activeRoute.destination },
    };
  }

  if (isVisitor && visitorAccessRequest) {
    const status = visitorAccessRequest.status;
    if (['APPROVED', 'AUTHORIZED'].includes(status)) {
      return {
        icon: 'check-decagram-outline',
        color: colors.success,
        title: 'Acesso autorizado',
        text: 'Siga apenas pela rota permitida pela recepcao.',
        screen: 'VisitorAccessStatus',
        params: { request: visitorAccessRequest },
      };
    }
    return {
      icon: 'clock-alert-outline',
      color: '#C78100',
      title: 'Aguardando validacao',
      text: 'A recepcao ainda precisa validar sua visita.',
      screen: 'VisitorAccessStatus',
      params: { request: visitorAccessRequest },
    };
  }

  if (isVisitor) {
    return {
      icon: 'desk',
      color: '#C78100',
      title: 'Vamos ate a recepcao',
      text: 'Somente a rota publica fica liberada antes da validacao presencial.',
      screen: 'VisitorReceptionRoute',
    };
  }

  if (hospitalDetection?.status !== 'confirmed') {
    return {
      icon: 'map-marker-distance',
      color: colors.blue,
      title: 'Como chegar ao hospital',
      text: 'Abra uma rota externa e continue no Navora ao chegar.',
      screen: 'ExternalRoute',
      params: { area: 'unknown', userType: 'patient' },
    };
  }

  return {
    icon: 'map-search-outline',
    color: colors.primary,
    title: 'Para onde vamos?',
    text: 'Busque um setor, servico ou destino.',
    screen: 'Search',
  };
}

function getRemainingTime(request, now) {
  if (!request?.expiresAt && !request?.validUntil) {
    return { label: request?.allowedTime || 'definido pela recepcao', warning: false, expired: false };
  }
  const expires = new Date(request.expiresAt || request.validUntil).getTime();
  const remainingMs = expires - now;
  if (!Number.isFinite(expires) || remainingMs <= 0) {
    return { label: '00:00:00', warning: true, expired: true };
  }
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return {
    label: `${hours}:${minutes}:${seconds}`,
    warning: totalSeconds <= 10 * 60,
    expired: false,
  };
}

function destinationCategories(isVisitor, visitApproved) {
  if (isVisitor && !visitApproved) {
    return [
      { icon: 'desk', title: 'Recepcao', params: { query: 'Recepcao' } },
      { icon: 'toilet', title: 'Banheiros', params: { query: 'Banheiro' } },
      { icon: 'seat-outline', title: 'Areas comuns', params: { category: 'Servicos' } },
    ];
  }

  if (isVisitor) {
    return [
      { icon: 'toilet', title: 'Banheiros', params: { query: 'Banheiro' } },
      { icon: 'desk', title: 'Recepcao', params: { query: 'Recepcao' } },
      { icon: 'seat-outline', title: 'Areas comuns', params: { category: 'Servicos' } },
    ];
  }

  return [
    { icon: 'domain', title: 'Setores', params: { category: 'Atendimento' } },
    { icon: 'flask-outline', title: 'Exames', params: { category: 'Exames' } },
    { icon: 'toilet', title: 'Banheiros', params: { query: 'Banheiro' } },
    { icon: 'desk', title: 'Recepcao', params: { query: 'Recepcao' } },
  ];
}

function Chip({ text }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Shortcut({ icon, title, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
      <View style={styles.shortcutIcon}><MaterialCommunityIcons name={icon} size={21} color={colors.primary} /></View>
      <Text style={styles.shortcutText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: 92, paddingBottom: 112 },
  hero: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 28, borderRadius: 14, backgroundColor: '#FFF1F3', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  currentPill: { alignSelf: 'flex-start', minHeight: 30, borderRadius: radii.md, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currentPillText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  title: { ...typography.headline, color: colors.text, marginTop: spacing.lg },
  subtitle: { ...typography.subtitle, color: colors.muted, marginTop: spacing.xs, fontWeight: '500' },
  searchCopy: { flex: 1, minWidth: 0 },
  searchLabel: { color: colors.text, fontSize: 17, fontWeight: '800' },
  searchText: { ...typography.caption, color: colors.muted, marginTop: 3 },
  locationCard: { minHeight: 72, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  locationIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  locationText: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 },
  locationMeta: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  journeyCard: { minHeight: 86, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  journeyIcon: { width: 48, height: 48, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  journeyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  journeyText: { ...typography.caption, color: colors.muted, marginTop: 3 },
  journeyAction: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  destinationCard: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, marginTop: spacing.lg },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  destination: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: spacing.sm },
  routeMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: spacing.md },
  routeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  visitCard: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, marginTop: spacing.lg },
  visitWarning: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt },
  visitHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  visitIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  visitTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  visitDestination: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: spacing.md },
  visitMeta: { ...typography.caption, color: colors.muted, marginTop: 4 },
  visitTimer: { minHeight: 38, borderRadius: radii.md, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  visitTimerText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  visitTimerDanger: { color: colors.danger },
  expiredCard: { borderRadius: radii.xl, borderWidth: 1, borderColor: '#F0C7CC', backgroundColor: '#FFF6F6', padding: spacing.lg, marginTop: spacing.lg },
  expiredTitle: { color: colors.danger, fontSize: 16, fontWeight: '800' },
  expiredText: { ...typography.caption, color: colors.muted, marginTop: 5 },
  aiPanel: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, marginTop: spacing.lg },
  aiTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aiIcon: { width: 50, height: 50, borderRadius: radii.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  micButton: { height: 52, borderRadius: radii.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  textAiButton: { height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickSuggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  quickChip: { minHeight: 32, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  quickChipText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  categories: { marginTop: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  accessNotice: { ...typography.caption, color: colors.muted, marginTop: spacing.sm },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  shortcut: { width: '48%', minHeight: 88, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  shortcutIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  shortcutText: { color: colors.text, fontSize: 12, lineHeight: 15, fontWeight: '800', textAlign: 'center' },
  summary: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginTop: 14 },
  summaryTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  summaryText: { color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: 6 },
  primary: { height: 52, borderRadius: radii.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondary: { height: 50, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
