import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import { getAreaById, getReceptionDestination } from '../data/routes';

export default function PatientHomeScreen({ navigate, userProfile = {}, onStartRoute, navigationData }) {
  const area = getAreaById(userProfile.area || 'private');
  const name = userProfile.name || 'Mariana';
  const destination = userProfile.lastDestination || 'Consultorio 501 - Cardiologia';
  const reception =
    navigationData?.destinations?.find((item) => item.code === `${area.id}-reception` || item.id === `${area.id}-reception`) ||
    getReceptionDestination(area.id);

  const goReception = () => onStartRoute?.(reception);

  return (
    <Screen scroll={false} padded={false}>
      <ImageBackground source={require('../../assets/images/segundaTela.png')} resizeMode="cover" style={styles.stage} imageStyle={styles.bg}>
        <AppHeader navigate={navigate} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, shadows.card]}>
            <View style={styles.chips}>
              <Chip text={area.name} />
              <Chip text={area.entranceName} />
              <Chip text="Paciente" />
            </View>
            <Text style={styles.title}>Ola, {name}!</Text>
            <Text style={styles.subtitle}>Seja bem-vinda de volta.</Text>
            <View style={styles.aiLine}>
              <View style={styles.aiIcon}><MaterialCommunityIcons name="microphone" size={20} color="#FFFFFF" /></View>
              <Text style={styles.aiText}>IA Navora pronta para orientar sua chegada.</Text>
            </View>
          </View>

          <View style={[styles.destinationCard, shadows.card]}>
            <Text style={styles.label}>Destino atual</Text>
            <Text style={styles.destination}>{destination}</Text>
            <View style={styles.routeMeta}>
              <MaterialCommunityIcons name="walk" size={16} color={colors.primary} />
              <Text style={styles.routeText}>12 min - 850 m</Text>
              <View style={styles.dot} />
              <Text style={styles.routeText}>Rota acessivel ativa</Text>
            </View>
          </View>

          <View style={styles.shortcuts}>
            <Shortcut icon="magnify" title="Para onde vamos?" onPress={() => navigate('Search')} />
            <Shortcut icon="flask-outline" title="Exames" onPress={() => navigate('Search', { category: 'Exames' })} />
            <Shortcut icon="desk" title="Recepcao" onPress={goReception} />
            <Shortcut icon="toilet" title="Banheiro" onPress={() => navigate('Search', { query: 'Banheiro' })} />
            <Shortcut icon="alarm-light-outline" title="Ajuda / SOS" onPress={() => navigate('Help', { type: 'help' })} />
            <Shortcut icon="dots-horizontal-circle-outline" title="Mais servicos" onPress={() => navigate('Search')} />
          </View>

          <View style={[styles.summary, shadows.card]}>
            <Text style={styles.summaryTitle}>Resumo da rota</Text>
            <Text style={styles.summaryText}>Siga em frente por 60 m, vire a direita e siga as placas.</Text>
            <Pressable onPress={() => navigate('Navigation', { destination })} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
              <Text style={styles.primaryText}>Abrir mapa</Text>
            </Pressable>
          </View>
        </ScrollView>
        <BottomTabs active="Home" navigate={navigate} />
      </ImageBackground>
    </Screen>
  );
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
  bg: { opacity: 0.22 },
  content: { paddingHorizontal: 20, paddingTop: 92, paddingBottom: 112 },
  hero: { borderRadius: 30, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.96)', padding: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 28, borderRadius: 14, backgroundColor: '#FFF1F3', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  chipText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 18 },
  subtitle: { color: colors.muted, fontSize: 15, fontWeight: '800', marginTop: 4 },
  aiLine: { minHeight: 54, borderRadius: 22, backgroundColor: '#FFF7F8', borderWidth: 1, borderColor: '#FFD2D7', padding: 10, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  aiText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '800' },
  destinationCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginTop: 14 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  destination: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 8 },
  routeMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  routeText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  shortcut: { width: '31.5%', minHeight: 86, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 8 },
  shortcutIcon: { width: 38, height: 38, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shortcutText: { color: colors.text, fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  summary: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginTop: 14 },
  summaryTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  summaryText: { color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: 6 },
  primary: { height: 52, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
