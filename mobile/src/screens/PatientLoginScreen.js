import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { isAuthError, navoraApi } from '../services/api';
import { saveAuthToken } from '../services/authToken';

export const mockPatient = (area = 'private') => ({
  type: 'patient',
  name: 'Mariana',
  fullName: 'Mariana Souza',
  area,
  hasAccount: true,
  accessibility: {
    wheelchair: true,
    avoidStairs: true,
    needsRamp: true,
    preferElevator: true,
    voiceGuidance: true,
    largerText: false,
  },
  lastDestination: 'Consultorio 501 - Cardiologia',
  emergencyContact: 'Contato cadastrado',
});

export default function PatientLoginScreen({ navigate, goBack, routeParams = {}, onPatientReady }) {
  const { appColors, t } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const area = routeParams.area || 'private';
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const finishFallback = () => {
    const patient = mockPatient(area);
    onPatientReady?.({ ...patient, authSource: 'fallback' });
    navigate('PatientHome');
  };

  const submit = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert(t('common.attention'), t('patientLogin.fillFields'));
      return;
    }
    setLoading(true);
    try {
      const auth = await navoraApi.login({ email: login.trim(), password });
      if (auth?.demoMode) {
        finishFallback();
        return;
      }
      const user = auth?.user;
      if (user?.role !== 'PATIENT') {
        Alert.alert(t('common.accessDenied'), t('patientLogin.patientsOnly'));
        return;
      }
      await saveAuthToken(auth.access_token);
      const authUser = await navoraApi.getAuthMe();
      const patient = await navoraApi.getMyPatientProfile();
      onPatientReady?.({ ...patient, apiUser: authUser, authSource: 'api', hasAccount: true });
      navigate('PatientHome');
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert(t('patientLogin.invalidTitle'), t('patientLogin.invalid'));
        return;
      }
      Alert.alert(t('patientLogin.failTitle'), t('patientLogin.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title={t('patientLogin.title')} subtitle={t('patientLogin.subtitle')} onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
      <View style={[styles.card, shadows.card]}>
        <View style={styles.loginHero}>
          <View style={styles.fingerprint}>
            <MaterialCommunityIcons name="fingerprint" size={42} color={appColors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{t('patientLogin.welcome')}</Text>
            <Text style={styles.subtitle}>{t('patientLogin.welcomeSub')}</Text>
          </View>
        </View>
        <Input icon="account-outline" placeholder={t('patientLogin.loginPlaceholder')} value={login} onChangeText={setLogin} />
        <Input icon="lock-outline" placeholder={t('patientLogin.password')} value={password} onChangeText={setPassword} secureTextEntry />
        <Pressable onPress={submit} disabled={loading} style={({ pressed }) => [styles.primary, pressed && styles.pressed, loading && styles.disabled]}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{t('patientLogin.enter')}</Text>}
        </Pressable>
        <Pressable
          disabled
          accessibilityState={{ disabled: true }}
          style={[styles.bio, styles.disabledFuture]}
        >
          <MaterialCommunityIcons name="fingerprint" size={30} color={appColors.primary} />
          <Text style={styles.bioText}>{t('patientLogin.biometricSoon')}</Text>
        </Pressable>
        <View style={styles.futureRow}>
          <FutureProvider icon="google" label="Google" />
          <FutureProvider icon="apple" label="Apple" />
        </View>
        <Pressable onPress={() => Alert.alert(t('patientLogin.forgotTitle'), t('patientLogin.forgotText'))} style={styles.link}>
          <Text style={styles.linkText}>{t('patientLogin.forgot')}</Text>
        </Pressable>
        <Pressable onPress={finishFallback} style={styles.link}>
          <Text style={styles.linkText}>{t('patientLogin.hospitalRecognition')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Input({ icon, ...props }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <View style={styles.inputBox}>
      <MaterialCommunityIcons name={icon} size={21} color={appColors.muted} />
      <TextInput placeholderTextColor={appColors.lightText} style={styles.input} {...props} />
    </View>
  );
}

function FutureProvider({ icon, label }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <View style={styles.futureProvider}>
      <MaterialCommunityIcons name={icon} size={18} color={appColors.muted} />
      <Text style={styles.futureProviderText}>{label} futuro</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: { borderRadius: 30, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, marginTop: 4 },
  loginHero: { minHeight: 86, borderRadius: 24, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  fingerprint: { width: 58, height: 58, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 5 },
  inputBox: { height: 58, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, ...shadows.card },
  input: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  primary: { height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  bio: { height: 54, borderRadius: 18, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 12 },
  bioText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  disabledFuture: { opacity: 0.72, backgroundColor: colors.surfaceAlt },
  futureRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  futureProvider: { flex: 1, height: 44, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, opacity: 0.72 },
  futureProviderText: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  link: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.7 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
