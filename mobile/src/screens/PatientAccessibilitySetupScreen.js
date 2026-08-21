import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';
import { isAuthError, navoraApi } from '../services/api';

const options = [
  ['wheelchair', 'Uso cadeira de rodas', 'wheelchair-accessibility'],
  ['avoidStairs', 'Evitar escadas', 'stairs'],
  ['needsRamp', 'Precisa de rampa', 'slope-uphill'],
  ['preferElevator', 'Priorizar elevador', 'elevator-passenger'],
  ['mobilityDifficulty', 'Dificuldade de locomocao', 'walk'],
  ['voiceGuidance', 'Orientacao por voz', 'volume-high'],
  ['largerText', 'Letra maior', 'format-size'],
  ['companionNeeded', 'Precisa de acompanhante', 'account-multiple-outline'],
];

const allowedAccessibilityKeys = new Set([
  'wheelchair',
  'avoidStairs',
  'preferElevator',
  'voiceGuidance',
  'largerText',
  'highContrast',
  'needsStretcher',
  'mobilityDifficulty',
]);

const toBackendAccessibility = (value = {}) =>
  Object.fromEntries(
    Object.entries(value).filter(([key, enabled]) => allowedAccessibilityKeys.has(key) && typeof enabled === 'boolean')
  );

export default function PatientAccessibilitySetupScreen({ navigate, goBack, routeParams = {}, onPatientReady, userProfile }) {
  const area = routeParams.area || userProfile?.area || 'private';
  const patientDraft = routeParams.patient || userProfile || {};
  const [selected, setSelected] = useState(patientDraft.accessibility || {});
  const [loading, setLoading] = useState(false);
  const toggle = (key) => setSelected((current) => ({ ...current, [key]: !current[key] }));

  const save = async () => {
    setLoading(true);
    const localPatient = {
      ...patientDraft,
      type: 'patient',
      area,
      accessibility: selected,
      name: patientDraft.name || 'Paciente',
      fullName: patientDraft.fullName || 'Paciente Navora',
    };

    try {
      if (patientDraft.authSource === 'api' && patientDraft.role === 'PATIENT') {
        const patient = await navoraApi.updateAccessibility(toBackendAccessibility(selected));
        onPatientReady?.({ ...patient, apiUser: patient.user || patientDraft.apiUser, authSource: 'api', hasAccount: true });
      } else {
        onPatientReady?.(localPatient);
      }
      navigate('PatientHome', { area });
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Sessao expirada', 'Entre novamente para salvar suas preferencias.');
        return;
      }
      onPatientReady?.({ ...localPatient, authSource: patientDraft.authSource || 'fallback' });
      navigate('PatientHome', { area });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Suas necessidades de acessibilidade"
        subtitle="Selecione as opcoes que se aplicam a voce."
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="wheelchair-accessibility" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.heroText}>Essas preferencias deixam a rota mais confortavel e segura.</Text>
      </View>
      <View style={[styles.card, shadows.card]}>
        {options.map(([key, label, icon]) => {
          const active = Boolean(selected[key]);
          return (
            <Pressable key={key} onPress={() => toggle(key)} style={[styles.row, active && styles.rowActive]}>
              <View style={styles.icon}><MaterialCommunityIcons name={icon} size={20} color={colors.primary} /></View>
              <Text style={styles.rowText}>{label}</Text>
              <MaterialCommunityIcons name={active ? 'toggle-switch' : 'toggle-switch-off-outline'} size={34} color={active ? colors.primary : colors.muted} />
            </Pressable>
          );
        })}
      </View>
      <Pressable disabled={loading} onPress={save} style={({ pressed }) => [styles.primary, pressed && styles.pressed, loading && styles.disabled, shadows.soft]}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Salvar e continuar</Text>}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 78, borderRadius: 26, borderWidth: 1, borderColor: '#FFD2D7', backgroundColor: '#FFF7F8', padding: 14, marginTop: 4, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadows.card },
  heroIcon: { width: 50, height: 50, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  heroText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  card: { borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  row: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowActive: { backgroundColor: '#FFF7F8' },
  icon: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '900' },
  primary: { height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.7 },
});
