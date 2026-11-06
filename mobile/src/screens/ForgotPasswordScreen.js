import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CenteredFormScreen from '../components/CenteredFormScreen';
import { navoraApi, isNetworkError } from '../services/api';

export default function ForgotPasswordScreen({ navigate, goBack }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert(t('common.attention'), t('forgot.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const result = await navoraApi.forgotPassword(trimmed);
      // Servidor sem e-mail configurado: avisar, nao mandar esperar um e-mail.
      if (result?.delivery === 'unavailable') {
        Alert.alert(t('forgot.unavailableTitle'), t('forgot.unavailable'));
        return;
      }
      setSent(true);
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert(t('common.noConnection'), t('common.checkInternet'));
        return;
      }
      setSent(true); // silently succeed to avoid email enumeration
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <CenteredFormScreen title={t('forgot.title')} onBack={() => goBack?.()}>
        <View style={styles.iconTile}>
          <MaterialCommunityIcons name="email-check-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('forgot.checkEmail')}</Text>
        <Text style={styles.body}>
          {t('forgot.sentBefore')} <Text style={styles.bold}>{email.trim()}</Text> {t('forgot.sentAfter')}
        </Text>
        <Text style={styles.hint}>{t('forgot.notReceived')}</Text>
        <Pressable onPress={() => goBack?.()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>{t('forgot.backToLogin')}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigate('ResetPassword', { email: email.trim().toLowerCase() })}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{t('forgot.haveCode')}</Text>
        </Pressable>
      </CenteredFormScreen>
    );
  }

  return (
    <CenteredFormScreen title={t('forgot.title')} onBack={() => goBack?.()}>
      <View style={styles.iconTile}>
        <MaterialCommunityIcons name="lock-reset" size={34} color={colors.primary} />
      </View>

      <Text style={styles.body}>{t('forgot.intro')}</Text>

      <View style={styles.inputBox}>
        <MaterialCommunityIcons name="email-outline" size={21} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholder={t('forgot.emailPlaceholder')}
          placeholderTextColor={colors.lightText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />
      </View>

      <Pressable
        onPress={handleSend}
        disabled={loading}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, loading && styles.disabled]}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" size="small" />
          : <Text style={styles.btnText}>{t('forgot.send')}</Text>
        }
      </Pressable>

      <Pressable
        onPress={() => navigate('ResetPassword', { email: email.trim().toLowerCase() })}
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryText}>{t('forgot.haveCode')}</Text>
      </Pressable>
    </CenteredFormScreen>
  );
}

// Estilos acompanham o tema (claro/escuro); antes usavam a paleta fixa do
// tema claro e não mudavam no modo noturno.
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}

// Mesmo visual da Redefinir senha (ResetPasswordScreen): tile rosado com
// ícone bordô, texto 15+, campo e botão de 56 px (público idoso).
const createStyles = (colors) => StyleSheet.create({
  iconTile: {
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: colors.iconBg,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  bold: { color: colors.text, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  inputBox: {
    height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 0 },
  btn: {
    height: 56, borderRadius: 16, backgroundColor: colors.primaryStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.68 },
});
