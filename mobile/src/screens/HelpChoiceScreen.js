import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { ChoiceCard, PrimaryButton } from '../components/PremiumUI';
import { radii, shadows, spacing, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function HelpChoiceScreen({ navigate, goBack, userProfile }) {
  const { appColors } = useApp();
  const name = userProfile?.name || (userProfile?.type === 'visitor' ? 'visitante' : 'paciente');

  return (
    <Screen>
      <Header title="Como podemos ajudar agora?" subtitle="Escolha o melhor ponto de partida." onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.hero, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <View style={[styles.heroIcon, { backgroundColor: appColors.iconBg }]}>
          <MaterialCommunityIcons name="hospital-marker" size={30} color={appColors.primary} />
        </View>
        <Text style={[styles.title, { color: appColors.text }]}>Olá, {name}</Text>
        <Text style={[styles.text, { color: appColors.muted }]}>
          O Navora guia você por rotas públicas, atendimento e ajuda presencial quando necessário.
        </Text>
      </View>

      <View style={styles.options}>
        <ChoiceCard
          icon="map-marker-check-outline"
          title="Já estou no hospital"
          subtitle="Identificar sua localização inicial."
          onPress={() => navigate('ArrivalPreparation')}
        />
        <ChoiceCard
          icon="directions"
          title="Como chegar ao hospital"
          subtitle="Abrir rota externa até o endereço."
          onPress={() => navigate('ExternalRoute', { fromHelpChoice: true })}
        />
        <ChoiceCard
          icon="hand-heart-outline"
          title="Preciso de ajuda"
          subtitle="Pedir apoio da equipe."
          onPress={() => navigate('Help', { type: 'help' })}
        />
      </View>

      <PrimaryButton title="Ir para Home" icon="home-outline" onPress={() => navigate('Home')} style={styles.homeButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  text: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  options: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  homeButton: {
    marginTop: spacing.xl,
  },
});
