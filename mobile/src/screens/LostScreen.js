import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import NavoraButton from '../components/NavoraButton';
import InfoCard from '../components/InfoCard';
import { colors, shadows } from '../theme/colors';

export default function LostScreen({ navigate, goBack }) {
  return (
    <Screen>
      <Header title="Estou perdido" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
      <InfoCard
        icon="pin"
        title="Voce esta em"
        value="Recepcao"
        note="Corredor Principal - beacon MBM04-ENTRADA"
      />

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.icon}>IA</Text>
        <Text style={styles.title}>Sem problemas, eu te oriento.</Text>
        <Text style={styles.text}>
          Posso recalcular sua rota, abrir o mapa ou acionar a IA para guiar voce passo a passo.
        </Text>
      </View>

      <View style={[styles.nearbyCard, shadows.card]}>
        <Text style={styles.nearbyTitle}>Destinos próximos</Text>
        <Text style={styles.nearbyItem}>Recepção principal - 18 m</Text>
        <Text style={styles.nearbyItem}>Elevador A - 24 m</Text>
        <Text style={styles.nearbyItem}>Setor de Imagem - 42 m</Text>
      </View>

      <NavoraButton title="Recalcular rota" onPress={() => navigate('Navigation')} style={styles.button} />
      <NavoraButton title="Falar com a IA" variant="secondary" onPress={() => navigate('Assistant')} style={styles.button2} />
      <NavoraButton title="Ver destinos próximos" variant="ghost" onPress={() => navigate('Search')} style={styles.button2} />
      <NavoraButton title="Chamar ajuda se necessário" variant="ghost" onPress={() => navigate('Help')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },
  text: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '700',
  },
  button: {
    marginTop: 24,
  },
  button2: {
    marginTop: 12,
  },
  nearbyCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  nearbyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  nearbyItem: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '800',
  },
});
