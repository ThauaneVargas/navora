import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';
import { entrances, hospitalName } from '../data/routes';

export default function ArrivalConfirmedScreen({
  navigate,
  goBack,
  routeParams = {},
  userProfile,
  hospitalDetection,
  onManualEntranceCorrection,
  onArrivalContinue,
}) {
  const detectedEntrance = routeParams.detectedEntrance || userProfile?.detectedEntrance || hospitalDetection?.detectedEntrance;
  const correcting = Boolean(routeParams.correcting);
  const profile = routeParams.userType || userProfile?.type || 'patient';
  const area = routeParams.area || detectedEntrance?.areaId || userProfile?.area || 'private';

  const chooseEntrance = (entrance) => {
    onManualEntranceCorrection?.(entrance);
    navigate('ArrivalConfirmed', { area: entrance.areaId, userType: profile, detectedEntrance: entrance });
  };

  if (correcting) {
    return (
      <Screen>
        <Header
          title="Alterar entrada"
          subtitle="Escolha a entrada correta para esta jornada."
          onBack={() => goBack?.('ArrivalConfirmed')}
          onMenu={() => navigate('Menu')}
        />
        <View style={styles.list}>
          {entrances.map((entrance) => (
            <Pressable key={entrance.code} onPress={() => chooseEntrance(entrance)} style={({ pressed }) => [styles.option, pressed && styles.pressed, shadows.card]}>
              <View style={styles.optionIcon}>
                <MaterialCommunityIcons name="door-open" size={22} color={colors.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.optionTitle}>{entrance.fullName}</Text>
                <Text style={styles.optionText}>{entrance.hospitalArea}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={21} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Você chegou" centerTitle onBack={() => goBack?.('ArrivalPreparation')} onMenu={() => navigate('Menu')} />
      <View style={[styles.card, shadows.card]}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="map-marker-check-outline" size={42} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Você chegou</Text>
        <Text style={styles.hospital}>{hospitalName}</Text>
        <Text style={styles.label}>Entrada escolhida</Text>
        <Text style={styles.entrance}>{detectedEntrance?.fullName || detectedEntrance?.name || 'Entrada escolhida'}</Text>
        <View style={styles.statusPill}>
          <MaterialCommunityIcons name="check-circle-outline" size={17} color={colors.primary} />
          <Text style={styles.statusText}>Entrada confirmada</Text>
        </View>
        <Pressable onPress={() => onArrivalContinue?.(profile, area)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Continuar</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={() => navigate('ArrivalConfirmed', { area, userType: profile, correcting: true, detectedEntrance })} style={styles.discreet}>
          <Text style={styles.discreetText}>Não é esta entrada?</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, marginTop: spacing.md, alignItems: 'center' },
  icon: { width: 72, height: 72, borderRadius: radii.xl, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.text },
  hospital: { color: colors.primary, fontSize: 15, fontWeight: '800', marginTop: spacing.sm, textAlign: 'center' },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: spacing.xl },
  entrance: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: 5, textAlign: 'center' },
  statusPill: { minHeight: 38, borderRadius: radii.md, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  statusText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  primary: { alignSelf: 'stretch', height: 54, borderRadius: radii.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  discreet: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  discreetText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  list: { gap: spacing.md, marginTop: spacing.md },
  option: { minHeight: 76, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionIcon: { width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  optionText: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },
  copy: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
