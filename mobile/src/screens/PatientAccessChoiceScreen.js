import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

export default function PatientAccessChoiceScreen({ navigate, goBack, routeParams = {} }) {
  const area = routeParams.area || 'private';

  return (
    <Screen>
      <Header title="Acesse sua conta" subtitle="Entre mais rapido com seus dados salvos." onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="shield-account-outline" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.heroText}>Escolha como quer continuar. Seus dados ajudam o Navora a recuperar rotas e preferencias.</Text>
      </View>
      <AccessCard icon="account-check-outline" title="Ja tenho cadastro" subtitle="Acessar minha conta" onPress={() => navigate('PatientLogin', { area })} />
      <AccessCard icon="account-plus-outline" title="Primeiro acesso" subtitle="Criar minha conta" onPress={() => navigate('PatientQuickRegister', { area })} />
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
        <Text style={styles.infoText}>Seus dados estao seguros e serao usados para navegacao, acessibilidade e assistencia.</Text>
      </View>
      <Pressable onPress={() => navigate('PatientQuickAccess', { area, quick: true })} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>Continuar sem cadastro</Text>
      </Pressable>
    </Screen>
  );
}

function AccessCard({ icon, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, shadows.card]}>
      <View style={styles.icon}><MaterialCommunityIcons name={icon} size={25} color={colors.primary} /></View>
      <View style={styles.copy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 78, borderRadius: 26, borderWidth: 1, borderColor: '#FFD2D7', backgroundColor: '#FFF7F8', padding: 14, marginTop: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadows.card },
  heroIcon: { width: 50, height: 50, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  heroText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  card: { minHeight: 90, borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 15, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  cardText: { color: colors.muted, fontSize: 13, fontWeight: '800', marginTop: 3 },
  infoCard: { minHeight: 66, borderRadius: 20, borderWidth: 1, borderColor: '#FFD2D7', backgroundColor: '#FFF7F8', padding: 14, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  secondary: { height: 52, borderRadius: 17, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
