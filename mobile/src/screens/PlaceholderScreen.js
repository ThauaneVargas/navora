import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

const contentByScreen = {
  RouteHistory: {
    title: 'Historico de rotas',
    icon: 'history',
    text: 'Aqui ficarao as rotas usadas recentemente pelo paciente.',
  },
  Settings: {
    title: 'Configuracoes',
    icon: 'cog-outline',
    text: 'Preferencias do app, notificacoes e ajustes de navegacao ficarao nesta area.',
  },
  Privacy: {
    title: 'Privacidade',
    icon: 'shield-lock-outline',
    text: 'Informacoes sobre dados, localizacao e consentimentos do paciente.',
  },
};

export default function PlaceholderScreen({ navigate, currentScreen }) {
  const content = contentByScreen[currentScreen] || contentByScreen.Settings;

  return (
    <Screen>
      <Header title={content.title} centerTitle onBack={() => navigate('Menu')} />

      <View style={[styles.card, shadows.card]}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={content.icon} size={52} color={colors.primary} />
        </View>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.text}>{content.text}</Text>
      </View>

      <Pressable
        onPress={() => navigate('Menu')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, shadows.soft]}
      >
        <Text style={styles.buttonText}>Voltar ao menu</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 28,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 26,
    alignItems: 'center',
  },
  iconBox: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  button: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
