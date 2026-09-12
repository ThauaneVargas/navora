import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { colors, shadows } from '../theme/colors';
import { hospitalAreas, getAreaById, getReceptionDestination } from '../data/routes';

export default function AreaEntryScreen({ navigate, onAreaProfileSelect, onStartRoute, navigationData, navigationSource = 'fallback' }) {
  const areas = navigationSource === 'api' ? navigationData?.areas || hospitalAreas : hospitalAreas;
  const chooseProfile = (area, type) => onAreaProfileSelect?.({ area, type });
  const goReception = () => {
    const reception =
      navigationData?.destinations?.find((destination) => destination.code === 'private-reception' || destination.id === 'private-reception') ||
      getReceptionDestination('private');
    onStartRoute?.(reception);
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="navigation-variant" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Por onde você entrou?</Text>
        <Text style={styles.subtitle}>
          Se você não souber, o Navora irá orientar você até a recepção para confirmação.
        </Text>
      </View>

      {areas.filter((area) => ['private', 'sus'].includes(area.id || area.code)).map((area) => (
        <AreaCard key={area.id || area.code} area={area} onChoose={chooseProfile} />
      ))}

      <Pressable onPress={goReception} style={({ pressed }) => [styles.unknownButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.primary} />
        <View style={styles.copy}>
          <Text style={styles.unknownTitle}>Não sei</Text>
          <Text style={styles.unknownText}>Levar até a recepção mais próxima</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
      </Pressable>

      <Pressable onPress={() => navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginText}>Já tenho conta</Text>
      </Pressable>
    </Screen>
  );
}

function AreaCard({ area: sourceArea, onChoose }) {
  const area = sourceArea || getAreaById('private');
  const welcome = `Bem-vindo à ${area.name}`;
  const routing = 'Suas rotas serão direcionadas apenas para o ambiente hospitalar confirmado.';

  return (
    <View style={[styles.areaCard, shadows.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.areaIcon}>
          <MaterialCommunityIcons name={area.id === 'private' ? 'door-sliding' : 'hospital-building'} size={22} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.areaTitle}>{welcome}</Text>
          <Text style={styles.areaMeta}>Você entrou pela {area.entranceName}.</Text>
        </View>
      </View>
      <Text style={styles.routingText}>{routing}</Text>

      <View style={styles.actions}>
        <Pressable onPress={() => onChoose(area.id, 'patient')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Sou paciente</Text>
        </Pressable>
        <Pressable onPress={() => onChoose(area.id, 'visitor')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Sou visitante</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 12, marginBottom: 14 },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: 8 },
  areaCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  areaIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  areaTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  areaMeta: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 3 },
  routingText: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondaryText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  unknownButton: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFF7F8',
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unknownTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  unknownText: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  loginLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  loginText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
