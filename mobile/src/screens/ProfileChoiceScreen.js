import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { getAreaById } from '../data/routes';
import { useApp } from '../context/AppContext';

export default function ProfileChoiceScreen({ navigate, goBack, routeParams = {}, onProfileDraft }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const area = routeParams.area || 'private';
  const areaData = getAreaById(area);

  const choose = (type) => {
    onProfileDraft?.({ type, area });
    navigate(type === 'patient' ? 'PatientIdentification' : 'VisitorEntry', { area, userType: type });
  };

  return (
    <Screen>
      <Header
        title="Como deseja continuar?"
        subtitle="Isso nos ajuda a mostrar o conteudo certo para voce."
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />
      <View style={styles.hero}>
        <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={appColors.primary} />
        <Text style={styles.area}>{areaData.name} - {areaData.entranceName}</Text>
      </View>
      <ProfileCard icon="account-heart-outline" title="Sou Paciente" subtitle="Tenho exame, atendimento ou procedimento." onPress={() => choose('patient')} />
      <ProfileCard icon="account-arrow-right-outline" title="Sou Visitante" subtitle="Vou acompanhar ou visitar alguem." onPress={() => choose('visitor')} />
    </Screen>
  );
}

function ProfileCard({ icon, title, subtitle, onPress }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, shadows.card]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name={icon} size={28} color={appColors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={appColors.primary} />
    </Pressable>
  );
}

const createStyles = (colors) => StyleSheet.create({
  hero: { minHeight: 48, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt, paddingHorizontal: 14, marginTop: 4, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  area: { color: colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  card: { minHeight: 108, borderRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 62, height: 62, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  cardText: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '800', marginTop: 4 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
