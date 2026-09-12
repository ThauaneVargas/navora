import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import { horizontalPaddingFor } from '../theme/layout';
import { useApp } from '../context/AppContext';
import { getAreaById } from '../data/routes';

const patientShortcuts = [
  { icon: 'flask-outline', title: 'Exames', screen: 'Search', params: { category: 'Exames' } },
  { icon: 'desk', title: 'Recepção', screen: 'Search', params: { query: 'Recepção' } },
  { icon: 'toilet', title: 'Banheiro', screen: 'Search', params: { query: 'Banheiro' } },
  { icon: 'map-marker-question-outline', title: 'Estou perdido', screen: 'Lost' },
  { icon: 'alarm-light-outline', title: 'Ajuda/SOS', screen: 'Help', params: { type: 'help' } },
];

const visitorShortcuts = [
  { icon: 'desk', title: 'Recepção', screen: 'Search', params: { query: 'Recepção' } },
  { icon: 'toilet', title: 'Banheiro', screen: 'Search', params: { query: 'Banheiro' } },
  { icon: 'account-heart-outline', title: 'Visita', screen: 'Search', params: { category: 'Visita' } },
  { icon: 'map-marker-question-outline', title: 'Estou perdido', screen: 'Lost' },
  { icon: 'alarm-light-outline', title: 'Ajuda/SOS', screen: 'Help', params: { type: 'help' } },
];

const destinationCards = [
  {
    icon: 'navigation-variant',
    title: 'Para onde vamos?',
    subtitle: 'Navegação interna',
    screen: 'Search',
  },
  {
    icon: 'map-marker-radius-outline',
    title: 'Como chegar ao hospital',
    subtitle: 'Navegação externa',
    screen: 'HowToGet',
  },
];

export default function HomeScreen({ navigate, userProfile = { type: 'patient', area: 'private', entryLabel: 'Fundos' } }) {
  const insets = useSafeAreaInsets();
  const { appColors, isDark } = useApp();
  const area = getAreaById(userProfile.area);
  const profileLabel = userProfile.type === 'visitor' ? 'Visitante' : 'Paciente';
  const shortcuts = userProfile.type === 'visitor' ? visitorShortcuts : patientShortcuts;
  const headerHeight = 56 + insets.top;
  const tabHeight = 60 + Math.max(insets.bottom, 14);

  return (
    <Screen scroll={false} padded={false}>
      <View style={[styles.screen, { backgroundColor: appColors.bg }]}>
        <AppHeader navigate={navigate} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: headerHeight + 12,
              paddingHorizontal: horizontalPaddingFor(),
              paddingBottom: tabHeight + 18,
            },
          ]}
        >
          <View style={styles.hero}>
            <BackgroundPattern />
            <View style={styles.greeting}>
              <Text style={[styles.title, { color: appColors.text }]}>Ola!</Text>
              <Text style={[styles.title, { color: appColors.text }]}>Como posso</Text>
              <Text style={[styles.title, { color: appColors.text }]}>
                <Text style={[styles.titleRed, { color: appColors.primary }]}>te ajudar</Text> hoje?
              </Text>
              <Text style={[styles.description, { color: appColors.muted }]}>
                Fale comigo e eu te levo ate onde precisa.
              </Text>
            </View>

            <View style={styles.micArea}>
              <View style={styles.micPulseOuter} />
              <View style={[styles.micPulseInner, { backgroundColor: appColors.surface, borderColor: appColors.border }]} />
              <Pressable
                onPress={() => navigate('Assistant', { voice: true })}
                style={({ pressed }) => [
                  styles.micButton,
                  { backgroundColor: appColors.primary, borderColor: isDark ? '#3A1D23' : '#FDECEF' },
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons name="microphone" size={38} color="#FFFFFF" />
              </Pressable>
              <View style={styles.micWaveLeft}>
                <View style={[styles.micWaveBar, { height: 8 }]} />
                <View style={[styles.micWaveBar, { height: 14 }]} />
                <View style={[styles.micWaveBar, { height: 10 }]} />
              </View>
              <View style={styles.micWaveRight}>
                <View style={[styles.micWaveBar, { height: 10 }]} />
                <View style={[styles.micWaveBar, { height: 16 }]} />
                <View style={[styles.micWaveBar, { height: 8 }]} />
              </View>
            </View>

            <Pressable
              onPress={() => navigate('Assistant', { focusAssistant: true })}
              style={({ pressed }) => [
                styles.aiBubble,
                { backgroundColor: appColors.surface, borderColor: appColors.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.aiWave, { backgroundColor: appColors.iconBg }]}>
                <View style={[styles.aiWaveBar, { height: 8 }]} />
                <View style={[styles.aiWaveBar, { height: 14 }]} />
                <View style={[styles.aiWaveBar, { height: 10 }]} />
              </View>
              <View style={styles.aiTextBox}>
                <Text style={[styles.aiTitle, { color: appColors.primary }]}>Assistente Navora</Text>
                <Text style={[styles.aiText, { color: appColors.muted }]}>Orientacao guiada</Text>
              </View>
            </Pressable>
          </View>

          <View style={[styles.areaStatusCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
            <View style={[styles.areaStatusIcon, { backgroundColor: appColors.iconBg }]}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={appColors.primary} />
            </View>
            <View style={styles.routeCopy}>
              <Text style={[styles.routeLabel, { color: appColors.muted }]}>Area atual</Text>
              <Text style={[styles.routeTitle, { color: appColors.text }]}>{area.name}</Text>
              <Text style={[styles.routeMeta, { color: appColors.muted }]}>Entrada: {area.entryLabel} - Perfil: {profileLabel}</Text>
            </View>
          </View>

          {userProfile.type === 'visitor' ? (
            <View style={[styles.visitorNotice, { borderColor: isDark ? '#4A252C' : '#FFD2D7' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={appColors.primary} />
              <Text style={[styles.visitorNoticeText, { color: appColors.primary }]}>
                Áreas sensíveis precisam de liberação da recepção.
              </Text>
            </View>
          ) : null}

          <View style={styles.destinationGrid}>
            {destinationCards.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => navigate(item.screen, item.title === 'Exames' ? { category: 'Exames' } : item.title === 'Banheiro' ? { query: 'Banheiro' } : {})}
                style={({ pressed }) => [
                  styles.destinationCard,
                  { backgroundColor: appColors.surface, borderColor: appColors.border },
                  pressed && styles.pressed,
                  shadows.card,
                ]}
              >
                <View style={[styles.destinationIcon, { backgroundColor: appColors.iconBg }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={appColors.primary} />
                </View>
                <Text style={[styles.destinationTitle, { color: appColors.text }]}>{item.title}</Text>
                <View style={styles.destinationFooter}>
                  <Text style={[styles.destinationSubtitle, { color: appColors.muted }]}>{item.subtitle}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={appColors.primary} />
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: appColors.text }]}>Servicos rapidos</Text>

          <View style={styles.shortcutGrid}>
            {shortcuts.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => navigate(item.screen, item.params || {})}
                style={({ pressed }) => [
                  styles.shortcut,
                  { backgroundColor: appColors.surface, borderColor: appColors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: appColors.iconBg }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={appColors.primary} />
                </View>
                <Text numberOfLines={1} style={[styles.shortcutText, { color: appColors.text }]}>{item.title}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => navigate('Navigation')}
            style={({ pressed }) => [
              styles.routeCard,
              { backgroundColor: appColors.surface, borderColor: appColors.border },
              pressed && styles.pressed,
              shadows.card,
            ]}
          >
            <View style={styles.routePanels}>
              <View style={styles.routePanel}>
                <View style={styles.routeIconWrap}>
                  <MaterialCommunityIcons name="map-marker" size={24} color={appColors.primary} />
                </View>
                <View style={styles.routeCopy}>
                  <Text style={[styles.routeLabel, { color: appColors.muted }]}>Sua localização atual</Text>
                  <Text style={[styles.routeTitle, { color: appColors.text }]}>Recepção Principal</Text>
                  <Text style={[styles.routeMeta, { color: appColors.muted }]}>Corredor A - Piso Térreo</Text>
                </View>
              </View>

              <View style={[styles.routeSeparator, { backgroundColor: appColors.border }]} />

              <View style={styles.routePanel}>
                <View style={styles.routeCopy}>
                  <View style={[styles.activeChip, { backgroundColor: isDark ? '#183224' : '#F1FBF5' }]}>
                    <View style={[styles.statusDot, { backgroundColor: appColors.success }]} />
                    <Text style={[styles.activeChipText, { color: appColors.success }]}>Navegação ativa</Text>
                  </View>
                  <Text style={[styles.routeTitle, { color: appColors.text }]}>Tomografia</Text>
                  <Text style={[styles.routeMeta, { color: appColors.muted }]}>120 m - 2 min</Text>
                </View>
                <View style={[styles.routeArrow, { backgroundColor: appColors.iconBg }]}>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={appColors.primary} />
                </View>
              </View>
            </View>
            <View style={[styles.beaconRow, { backgroundColor: isDark ? '#13271D' : '#F0FBF4', borderTopColor: isDark ? '#21452F' : '#DDF2E6' }]}>
              <MaterialCommunityIcons name="map-marker-check-outline" size={14} color={appColors.success} />
              <Text style={[styles.beaconText, { color: appColors.success }]}>Entrada confirmada manualmente</Text>
            </View>
          </Pressable>

          <View style={[
            styles.helpPanel,
            { backgroundColor: appColors.surfaceAlt, borderColor: isDark ? '#3A252B' : '#FFD7DC' },
            shadows.card,
          ]}>
            <Text style={[styles.helpTitle, { color: appColors.primary }]}>Precisa de ajuda?</Text>
            <Text style={[styles.helpSub, { color: appColors.muted }]}>Escolha o tipo de atendimento.</Text>

            <View style={styles.helpActions}>
              <HelpAction
                icon="phone"
                title="Chamar ajuda"
                subtitle="Apoio da equipe"
                onPress={() => navigate('Help', { type: 'help' })}
                appColors={appColors}
                isDark={isDark}
              />
              {userProfile.type === 'patient' ? (
                <HelpAction
                  icon="stethoscope"
                  title="Solicitar medico"
                  subtitle="Avaliação clínica"
                  onPress={() => navigate('Help', { type: 'doctor' })}
                  appColors={appColors}
                  isDark={isDark}
                />
              ) : (
                <HelpAction
                  icon="desk"
                  title="Recepção"
                  subtitle="Apoio presencial"
                  onPress={() => navigate('Search', { query: 'Recepção' })}
                  appColors={appColors}
                  isDark={isDark}
                />
              )}
            </View>
            <View style={styles.sosActionWrap}>
              <HelpAction
                icon="alarm-light-outline"
                title="SOS Emergencia"
                subtitle="Atendimento urgente"
                danger
                wide
                onPress={() => navigate('Help', { type: 'sos' })}
                appColors={appColors}
                isDark={isDark}
              />
            </View>
          </View>
        </ScrollView>

        <BottomTabs active="Home" navigate={navigate} />
      </View>
    </Screen>
  );
}

function BackgroundPattern() {
  return (
    <View pointerEvents="none" style={styles.pattern}>
      <View style={styles.hospitalMark}>
        <View style={styles.hospitalRoof} />
        <View style={styles.hospitalBody}>
          <View style={styles.hospitalDoor} />
          <View style={[styles.hospitalWindow, { left: 18 }]} />
          <View style={[styles.hospitalWindow, { right: 18 }]} />
        </View>
      </View>
      <View style={[styles.routeDash, styles.routeDashOne]} />
      <View style={[styles.routeDash, styles.routeDashTwo]} />
      <View style={[styles.routeDash, styles.routeDashThree]} />
      <View style={[styles.routeDash, styles.routeDashFour]} />
      <View style={[styles.patternPin, styles.patternPinOne]} />
      <View style={[styles.patternPin, styles.patternPinTwo]} />
      <View style={[styles.patternPin, styles.patternPinThree]} />
    </View>
  );
}

function HelpAction({ icon, title, subtitle, danger, wide, onPress, appColors, isDark }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.helpAction,
        {
          backgroundColor: danger ? appColors.primary : appColors.surface,
          borderColor: danger ? appColors.primary : isDark ? '#3A252B' : '#FFD7DC',
        },
        wide && styles.helpActionWide,
        danger && styles.helpActionDanger,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.helpActionIcon, { backgroundColor: danger ? 'rgba(255,255,255,0.14)' : appColors.iconBg }]}>
        <MaterialCommunityIcons name={icon} size={21} color={danger ? '#FFFFFF' : appColors.primary} />
      </View>
      <View style={styles.helpActionCopy}>
        <Text
          numberOfLines={1}
          style={[styles.helpActionTitle, { color: danger ? '#FFFFFF' : appColors.text }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.helpActionSubtitle, { color: danger ? '#FFE5E9' : appColors.muted }]}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    position: 'relative',
  },
  pattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  hospitalMark: {
    position: 'absolute',
    right: 14,
    top: 38,
    width: 122,
    height: 104,
    opacity: 0.42,
  },
  hospitalRoof: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#F5D8DC',
  },
  hospitalBody: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 16,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F5D8DC',
  },
  hospitalDoor: {
    position: 'absolute',
    bottom: 0,
    left: 43,
    width: 20,
    height: 42,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#F5D8DC',
  },
  hospitalWindow: {
    position: 'absolute',
    top: 28,
    width: 18,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#F5D8DC',
  },
  routeDash: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
    backgroundColor: '#F2B8C0',
    opacity: 0.55,
  },
  routeDashOne: {
    left: 44,
    top: 176,
    width: 54,
    transform: [{ rotate: '-10deg' }],
  },
  routeDashTwo: {
    left: 108,
    top: 164,
    width: 48,
    transform: [{ rotate: '-6deg' }],
  },
  routeDashThree: {
    right: 98,
    top: 168,
    width: 56,
    transform: [{ rotate: '8deg' }],
  },
  routeDashFour: {
    right: 38,
    top: 158,
    width: 42,
    transform: [{ rotate: '-18deg' }],
  },
  patternPin: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(176,0,24,0.20)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  patternPinOne: {
    right: 42,
    top: 148,
  },
  patternPinTwo: {
    left: 62,
    top: 166,
  },
  patternPinThree: {
    left: 132,
    top: 156,
  },
  hero: {
    minHeight: 292,
    position: 'relative',
  },
  greeting: {
    paddingTop: 6,
    width: '56%',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  titleRed: {
    color: colors.primary,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 9,
  },
  micArea: {
    position: 'absolute',
    left: '50%',
    marginLeft: -74,
    top: 110,
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPulseOuter: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(176,0,24,0.08)',
  },
  micPulseInner: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F4D8DD',
    shadowColor: '#B00018',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 9,
  },
  micButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#FDECEF',
    shadowColor: colors.primary,
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
  micWaveLeft: {
    position: 'absolute',
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  micWaveRight: {
    position: 'absolute',
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  micWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#E9A1AA',
  },
  aiBubble: {
    position: 'absolute',
    left: '50%',
    marginLeft: -58,
    top: 234,
    width: 132,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  aiWave: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  aiWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  aiTextBox: {
    minWidth: 0,
  },
  aiTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  aiText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 9,
  },
  destinationGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -4,
  },
  areaStatusCard: {
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  areaStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorNotice: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFF7F8',
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitorNoticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  destinationCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  destinationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF6F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  destinationTitle: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  destinationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  destinationSubtitle: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  shortcut: {
    flex: 1,
    minWidth: '22%',
    minHeight: 78,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  shortcutIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF6F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shortcutText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  routeCard: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    overflow: 'hidden',
  },
  routePanels: {
    flexDirection: 'row',
    minHeight: 118,
  },
  routePanel: {
    flex: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeSeparator: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  routeIconWrap: {
    width: 34,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCopy: {
    flex: 1,
    minWidth: 0,
  },
  routeLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  routeMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  activeChip: {
    alignSelf: 'flex-start',
    height: 22,
    borderRadius: 12,
    backgroundColor: '#F1FBF5',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  activeChipText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '900',
  },
  routeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconRow: {
    minHeight: 38,
    backgroundColor: '#F0FBF4',
    borderTopWidth: 1,
    borderTopColor: '#DDF2E6',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  beaconText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
  },
  helpPanel: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: '#FFF1F3',
    borderWidth: 1,
    borderColor: '#FFD7DC',
    padding: 15,
  },
  helpTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  helpSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  helpActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  sosActionWrap: {
    marginTop: 10,
  },
  helpAction: {
    flex: 1,
    minHeight: 66,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#FFD7DC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  helpActionDanger: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 4,
  },
  helpActionWide: {
    minHeight: 58,
  },
  helpActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpActionIconDanger: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  helpActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  helpActionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  helpActionTitleDanger: {
    color: '#FFFFFF',
  },
  helpActionSubtitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  helpActionSubtitleDanger: {
    color: '#FFE5E9',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
