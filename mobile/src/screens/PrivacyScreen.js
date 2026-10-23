import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { FormField, SecondaryButton } from '../components/PremiumUI';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { PRIVACY_POLICY_UPDATED_LABEL, PRIVACY_SECTIONS } from '../data/privacyPolicy';
import { isAuthError, isNetworkError, navoraApi } from '../services/api';

export default function PrivacyScreen({ navigate, goBack, userProfile, onLogout }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const hasAccount = Boolean(userProfile?.hasAccount);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await navoraApi.deleteMyAccount(password);
      setPassword('');
      Alert.alert('Conta excluída', 'Seu cadastro e seus dados de saúde foram apagados.', [
        { text: 'OK', onPress: () => onLogout?.() },
      ]);
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert('Senha incorreta', 'Confira a senha e tente de novo.');
      } else if (isNetworkError(error)) {
        Alert.alert('Sem conexão', 'Não foi possível falar com o servidor. Nada foi apagado. Tente de novo.');
      } else {
        Alert.alert('Não foi possível excluir', 'Nada foi apagado. Tente de novo em instantes.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!password) {
      Alert.alert('Digite sua senha', 'Para sua segurança, confirme com a senha da conta.');
      return;
    }
    Alert.alert(
      'Excluir sua conta?',
      'Isso apaga seu cadastro, acessibilidade, observações e contato de emergência. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  return (
    <Screen>
      <Header title="Privacidade" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-lock-outline" size={30} color={appColors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Seus dados, sua privacidade</Text>
          <Text style={styles.headerSub}>
            O que o Navora guarda, para quê, e como você controla isso.
          </Text>
        </View>
      </View>

      {PRIVACY_SECTIONS.map((section) => (
        <View key={section.title} style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name={section.icon} size={20} color={appColors.primary} />
            </View>
            <Text style={styles.cardTitle}>{section.title}</Text>
          </View>
          <Text style={styles.cardBody}>{section.body}</Text>
        </View>
      ))}

      {hasAccount ? (
        <View style={[styles.card, styles.dangerCard, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.dangerIcon]}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={appColors.danger} />
            </View>
            <Text style={styles.cardTitle}>Excluir minha conta</Text>
          </View>
          <Text style={styles.cardBody}>
            Apaga seu cadastro e seus dados de saúde e retira o seu consentimento. Confirme com a sua senha.
          </Text>
          <FormField
            label="Senha"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Sua senha"
            accessibilityLabel="Senha para excluir a conta"
            style={styles.passwordField}
          />
          <SecondaryButton
            title={deleting ? 'Excluindo…' : 'Excluir minha conta'}
            icon="delete-outline"
            danger
            disabled={deleting}
            onPress={confirmDelete}
          />
        </View>
      ) : null}

      <View style={[styles.footerCard, shadows.card]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={appColors.muted} />
        <Text style={styles.footerText}>
          Política atualizada em {PRIVACY_POLICY_UPDATED_LABEL}. Dúvidas sobre seus dados: fale com a recepção do hospital.
        </Text>
      </View>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  headerCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  headerSub: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 19,
  },
  card: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  cardBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  dangerIcon: {
    backgroundColor: colors.surfaceSoft,
  },
  passwordField: {
    marginTop: 12,
    marginBottom: 12,
  },
  footerCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  footerText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
});
