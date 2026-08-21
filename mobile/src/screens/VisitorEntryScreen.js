import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';
import { destinations, getAreaById, visitorReasons } from '../data/routes';

export default function VisitorEntryScreen({
  navigate,
  goBack,
  routeParams = {},
  userProfile,
  onStartRoute,
  onResolveNavigationAccess,
  onCreateVisitorAccessRequest,
  navigationData,
  navigationSource = 'fallback',
}) {
  const area = getAreaById(routeParams.area || userProfile?.area);
  const [visitorName, setVisitorName] = useState('');
  const [reason, setReason] = useState(visitorReasons[0]);
  const [destinationId, setDestinationId] = useState('');
  const [accessibility, setAccessibility] = useState('Nao');
  const sourceDestinations = navigationSource === 'api' ? navigationData?.destinations || destinations : destinations;

  const areaDestinations = useMemo(
    () =>
      sourceDestinations.filter(
        (destination) =>
          destination.area === area.id &&
          (navigationSource === 'api' || ['public', 'visitor_allowed', 'visitor_authorization'].includes(destination.accessLevel))
      ),
    [area.id, navigationSource, sourceDestinations]
  );

  const selectedDestination = areaDestinations.find((destination) => destination.id === destinationId);

  const continueFlow = () => {
    if (!visitorName.trim()) {
      Alert.alert('Nome completo', 'Informe seu nome completo para continuar.');
      return;
    }

    if (!selectedDestination) {
      Alert.alert('Destino desejado', 'Escolha um destino para continuar.');
      return;
    }

    if (navigationSource === 'api') {
      onResolveNavigationAccess?.(selectedDestination, {
        visitorName: visitorName.trim(),
        reason,
        accessibility,
      });
      return;
    }

    if (selectedDestination.accessLevel === 'visitor_authorization') {
      onCreateVisitorAccessRequest?.({
        visitorName: visitorName.trim(),
        destination: selectedDestination,
        destinationCode: selectedDestination.code || selectedDestination.id,
        requestedDestination: selectedDestination.name,
        reason,
        accessibility,
      });
      return;
    }

    onStartRoute?.(selectedDestination);
  };

  return (
    <Screen scroll={false} padded={false}>
      <Header title="Entrada do visitante" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.areaChip, shadows.card]}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={21} color={colors.primary} />
          <View style={styles.copy}>
            <Text style={styles.chipTitle}>{area.name}</Text>
            <Text style={styles.chipText}>Entrada: {area.entryLabel}</Text>
          </View>
        </View>

        <View style={[styles.formCard, shadows.card]}>
          <Field label="Nome completo *">
            <TextInput
              value={visitorName}
              onChangeText={setVisitorName}
              placeholder="Informe seu nome completo"
              placeholderTextColor="#8B8D96"
              style={styles.input}
            />
          </Field>

          <Field label="Motivo da visita">
            <View style={styles.pillWrap}>
              {visitorReasons.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setReason(item)}
                  style={[styles.pill, reason === item && styles.pillActive]}
                >
                  <Text style={[styles.pillText, reason === item && styles.pillTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Destino desejado">
            <View style={styles.destinationList}>
              {areaDestinations.map((destination) => (
                <Pressable
                  key={destination.id}
                  onPress={() => setDestinationId(destination.id)}
                  style={[styles.destinationRow, destinationId === destination.id && styles.destinationActive]}
                >
                  <MaterialCommunityIcons name={destination.icon} size={19} color={colors.primary} />
                  <View style={styles.copy}>
                    <Text style={styles.destinationName}>{destination.name}</Text>
                    <Text style={styles.destinationMeta}>
                      {destination.floor} - {destination.accessLevel === 'visitor_authorization' ? 'Precisa autorizacao' : 'Liberado'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={destinationId === destination.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={19}
                    color={colors.primary}
                  />
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Precisa de acessibilidade?">
            <View style={styles.binaryRow}>
              {['Sim', 'Nao'].map((item) => (
                <Pressable key={item} onPress={() => setAccessibility(item)} style={[styles.binaryButton, accessibility === item && styles.binaryActive]}>
                  <Text style={[styles.binaryText, accessibility === item && styles.binaryTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Pressable onPress={continueFlow} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>Continuar</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  areaChip: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  chipTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 14,
    gap: 16,
  },
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 13, fontWeight: '900' },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  pillTextActive: { color: '#FFFFFF' },
  destinationList: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  destinationRow: {
    minHeight: 62,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  destinationActive: { backgroundColor: '#FFF7F8' },
  destinationName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  destinationMeta: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 2 },
  copy: { flex: 1, minWidth: 0 },
  binaryRow: { flexDirection: 'row', gap: 10 },
  binaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binaryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  binaryText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  binaryTextActive: { color: '#FFFFFF' },
  continueButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
