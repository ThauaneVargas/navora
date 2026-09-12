import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';

export default function HomeStartScreen({ navigate, onProfileDraft }) {
  const chooseProfile = (type) => {
    onProfileDraft?.({ type, area: 'private' });
    navigate(type === 'patient' ? 'PatientAccessChoice' : 'VisitorEntry', {
      userType: type,
    });
  };

  return (
    <Screen padded={false}>
      <View style={styles.stage}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Image source={require('../../assets/images/navora_symbol.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>NAVORA</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Seu guia inteligente no hospital</Text>
          <Text style={styles.subtitle}>Escolha como deseja continuar. O Navora adapta a jornada para você.</Text>
        </View>

        <View style={styles.cards}>
          <ChoiceCard
            icon="account-heart-outline"
            title="Sou Paciente"
            subtitle="Acesse sua jornada, preferências e rotas."
            onPress={() => chooseProfile('patient')}
          />
          <ChoiceCard
            icon="account-arrow-right-outline"
            title="Sou Visitante"
            subtitle="Cadastre sua visita e acompanhe a autorizacao."
            onPress={() => chooseProfile('visitor')}
          />
        </View>

        <Pressable onPress={() => navigate('ExternalRoute', { area: 'unknown' })} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="directions" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>Como chegar ao hospital</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ChoiceCard({ icon, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choiceCard, pressed && styles.pressed, shadows.card]}>
      <View style={styles.choiceIcon}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceText}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { minHeight: '100%', backgroundColor: colors.bg, paddingHorizontal: spacing.xxl, paddingTop: 52, paddingBottom: spacing.xxl },
  top: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoMark: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  logo: { width: 28, height: 28 },
  brandName: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: 0 },
  hero: { marginTop: 54, alignItems: 'center' },
  title: { ...typography.headline, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.muted, marginTop: spacing.md, textAlign: 'center' },
  cards: { gap: spacing.md, marginTop: spacing.xxxl },
  choiceCard: { minHeight: 104, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  choiceIcon: { width: 52, height: 52, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  choiceTitle: { ...typography.subtitle, color: colors.text, fontWeight: '800' },
  choiceText: { ...typography.caption, color: colors.muted, marginTop: 4 },
  secondary: { height: 52, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
