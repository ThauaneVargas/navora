import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const contentByScreen = {
  RouteHistory: {
    title: 'Histórico de rotas',
    icon: 'history',
    text: 'Aqui ficarão as rotas usadas recentemente pelo paciente.',
  },
  Settings: {
    title: 'Configurações',
    icon: 'cog-outline',
    text: 'Preferências do app, notificações e ajustes de navegação ficarão nesta área.',
  },
  Privacy: {
    title: 'Privacidade',
    icon: 'shield-lock-outline',
    text: 'Informações sobre dados, localização e consentimentos do paciente.',
  },
};

export default function PlaceholderScreen({ navigate, currentScreen }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const content = contentByScreen[currentScreen] || contentByScreen.Settings;

  return (
    <Screen>
      <Header title={content.title} centerTitle onBack={() => navigate('Menu')} />

      <View style={[styles.card, shadows.card]}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={content.icon} size={52} color={appColors.primary} />
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

const createStyles = (colors) => StyleSheet.create({
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
