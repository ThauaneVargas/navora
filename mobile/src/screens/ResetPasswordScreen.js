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
import PasswordRules from '../components/PasswordRules';
import { navoraApi, isNetworkError } from '../services/api';
import { isStrongPassword, stripSpaces } from '../utils/masks';

export default function ResetPasswordScreen({ navigate, goBack, routeParams = {} }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  const [email, setEmail] = useState(routeParams.email || '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!email.trim().includes('@')) {
      Alert.alert(t('common.attention'), t('forgot.invalidEmail'));
      return;
    }
    if (!/^\d{6}$/.test(token.trim())) {
      Alert.alert(t('common.attention'), t('reset.codeRequired'));
      return;
    }
    if (!isStrongPassword(newPassword)) {
      Alert.alert(t('password.weakTitle'), t('password.weak'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.attention'), t('reset.mismatch'));
      return;
    }

    setLoading(true);
    try {
      await navoraApi.resetPassword(email.trim().toLowerCase(), token.trim(), newPassword);
      setDone(true);
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert(t('common.noConnection'), t('common.checkInternet'));
        return;
      }
      Alert.alert(t('reset.invalidCodeTitle'), t('reset.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <CenteredFormScreen title={t('reset.title')} onBack={() => goBack?.()}>
        <View style={styles.iconTile}>
          <MaterialCommunityIcons name="check-circle-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('reset.doneTitle')}</Text>
        <Text style={styles.body}>{t('reset.done')}</Text>
        <Pressable onPress={() => goBack?.()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Text style={styles.btnText}>{t('reset.goToLogin')}</Text>
        </Pressable>
      </CenteredFormScreen>
    );
  }

  return (
    <CenteredFormScreen title={t('reset.title')} onBack={() => goBack?.()}>
        <View style={styles.iconTile}>
          <MaterialCommunityIcons name="lock-open-outline" size={34} color={colors.primary} />
        </View>

        <Text style={styles.body}>
          {t('reset.intro')}
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

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="key-outline" size={19} color={colors.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('reset.codePlaceholder')}
            placeholderTextColor={colors.lightText}
            value={token}
            onChangeText={(value) => setToken(value.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            editable={!loading}
          />
        </View>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="lock-outline" size={19} color={colors.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('reset.newPassword')}
            placeholderTextColor={colors.lightText}
            value={newPassword}
            onChangeText={(value) => setNewPassword(stripSpaces(value))}
            secureTextEntry={!showPass}
            maxLength={72}
            editable={!loading}
          />
          <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
            <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.lightText} />
          </Pressable>
        </View>
        <PasswordRules value={newPassword} />

        <View style={[styles.inputBox, confirmPassword && newPassword !== confirmPassword && styles.inputBoxError]}>
          <MaterialCommunityIcons name="lock-check-outline" size={19} color={colors.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('reset.confirmPassword')}
            placeholderTextColor={colors.lightText}
            value={confirmPassword}
            onChangeText={(value) => setConfirmPassword(stripSpaces(value))}
            maxLength={72}
            secureTextEntry={!showPass}
            editable={!loading}
          />
        </View>
        {confirmPassword && newPassword !== confirmPassword ? (
          <Text style={styles.errorText}>{t('reset.mismatch')}</Text>
        ) : null}

        <Pressable
          onPress={handleReset}
          disabled={loading}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed, loading && styles.disabled]}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.btnText}>{t('reset.submit')}</Text>
          }
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

// Mesmo visual da Esqueci minha senha (ForgotPasswordScreen).
const createStyles = (colors) => StyleSheet.create({
  iconTile: {
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: colors.iconBg,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  inputBox: {
    height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 0 },
  inputBoxError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '700', marginTop: -8 },
  btn: {
    height: 56, borderRadius: 16, backgroundColor: colors.primaryStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.68 },
});
