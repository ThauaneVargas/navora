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

export default function ResetPasswordScreen({ navigate, goBack }) {
  const { appColors: colors, t } = useApp();
  const styles = useThemeStyles();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert(t('common.attention'), t('reset.codeRequired'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.attention'), t('reset.tooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.attention'), t('reset.mismatch'));
      return;
    }

    setLoading(true);
    try {
      await navoraApi.resetPassword(token.trim(), newPassword);
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
      <CenteredFormScreen>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <MaterialCommunityIcons name="check-circle-outline" size={44} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('reset.doneTitle')}</Text>
          <Text style={styles.body}>{t('reset.done')}</Text>
          <Pressable onPress={() => goBack?.()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
            <Text style={styles.btnText}>{t('reset.goToLogin')}</Text>
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
          <Text style={styles.backText}>{t('reset.back')}</Text>
        </Pressable>

        <View style={styles.iconRing}>
          <MaterialCommunityIcons name="lock-open-outline" size={38} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t('reset.title')}</Text>
        <Text style={styles.body}>
          {t('reset.intro')}
        </Text>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="key-outline" size={19} color={colors.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('reset.codePlaceholder')}
            placeholderTextColor={colors.lightText}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
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
            onChangeText={setNewPassword}
            secureTextEntry={!showPass}
            editable={!loading}
          />
          <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
            <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.lightText} />
          </Pressable>
        </View>

        <View style={[styles.inputBox, confirmPassword && newPassword !== confirmPassword && styles.inputBoxError]}>
          <MaterialCommunityIcons name="lock-check-outline" size={19} color={colors.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('reset.confirmPassword')}
            placeholderTextColor={colors.lightText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
  inputBox: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  inputBoxError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '700', marginTop: -8 },
  btn: {
    height: 50, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.68 },
});
