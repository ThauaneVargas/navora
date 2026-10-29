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
      await navoraApi.forgotPassword(trimmed);
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
      <CenteredFormScreen>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <MaterialCommunityIcons name="email-check-outline" size={38} color={colors.primary} />
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
            onPress={() => navigate('ResetPassword')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>{t('forgot.haveCode')}</Text>
          </Pressable>
        </View>
      </CenteredFormScreen>
    );
  }

  return (
    <CenteredFormScreen>
      <View style={styles.card}>
        <Pressable onPress={() => goBack?.()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
          <Text style={styles.backText}>{t('forgot.back')}</Text>
        </Pressable>

        <View style={styles.iconRing}>
          <MaterialCommunityIcons name="lock-reset" size={38} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t('forgot.title')}</Text>
        <Text style={styles.body}>
          {t('forgot.intro')}
        </Text>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="email-outline" size={19} color={colors.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('forgot.emailPlaceholder')}
            placeholderTextColor={colors.lightText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
          onPress={() => navigate('ResetPassword')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{t('forgot.haveCode')}</Text>
        </Pressable>
      </View>
    </CenteredFormScreen>
  );
}

// Estilos acompanham o tema (claro/escuro); antes usavam a paleta fixa do
// tema claro e não mudavam no modo noturno.
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}

const createStyles = (colors) => StyleSheet.create({
  card: { gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  bold: { color: colors.text, fontWeight: '800' },
  hint: { color: colors.lightText, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  inputBox: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  btn: {
    height: 50, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 6 },
  secondaryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.68 },
});
