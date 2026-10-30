import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { navoraApi, isNetworkError } from '../services/api';
import { getAuthToken, saveAuthToken } from '../services/authToken';
import { useApp } from '../context/AppContext';

const REMEMBERED_EMAIL_KEY = 'navora.login.remembered_email';

async function loadRememberedEmail() {
  try {
    return (await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY)) || '';
  } catch { return ''; }
}

async function saveRememberedEmail(email) {
  try { await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email); } catch {}
}

async function clearRememberedEmail() {
  try { await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY); } catch {}
}


const PROFILE_OPTIONS = [
  {
    key: 'PATIENT',
    icon: 'account-heart-outline',
    titleKey: 'common.patient',
  },
  {
    key: 'VISITOR',
    icon: 'account-group-outline',
    titleKey: 'common.visitor',
  },
];

const shadow = {
  shadowColor: '#7D001F',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};


// Paciente e visitante entram com a mesma conta (e-mail + senha). O cartão
// escolhido só decide o modo de uso: Paciente -> Início; Visitante -> pedido de
// visita. Sem conta não há acesso (decisão da usuária, 29/10).
export const LoginScreen = ({ onPatientReady, onCreateAccount, navigate }) => {
  const styles = useThemeStyles();
  const { appColors: colors, t } = useApp();
  const { width, height } = useWindowDimensions();
  const stageMaxWidth = Math.min(width, 430);
  const compact = height < 720;
  const [selectedProfile, setSelectedProfile] = useState('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberData, setRememberData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const profileAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadRememberedEmail().then((saved) => {
      if (saved) {
        setEmail(saved);
        setRememberData(true);
      }
    });
  }, []);

  const handleProfileChange = (profile) => {
    if (profile === selectedProfile || loading) return;

    Animated.sequence([
      Animated.timing(profileAnim, {
        toValue: 0.98,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(profileAnim, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedProfile(profile);
  };

  const mode = selectedProfile === 'VISITOR' ? 'visitor' : 'patient';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.attention'), t('login.fillFields'));
      return;
    }

    setLoading(true);

    try {
      const auth = await navoraApi.login({ email: email.trim(), password });

      if (!auth?.access_token) {
        Alert.alert(t('common.error'), t('login.invalidResponse'));
        return;
      }

      if (auth.user?.role !== 'PATIENT') {
        Alert.alert(t('common.accessDenied'), t('login.patientsOnly'));
        return;
      }

      await saveAuthToken(auth.access_token);

      if (rememberData) {
        await saveRememberedEmail(email.trim());
      } else {
        await clearRememberedEmail();
      }

      const patient = await navoraApi.getMyPatientProfile();

      onPatientReady?.({
        ...patient,
        apiUser: auth.user,
        authSource: 'api',
        hasAccount: true,
      }, mode);
    } catch (error) {
      if (isNetworkError(error)) {
        if (error?.timeout) {
          Alert.alert(t('login.serverSlowTitle'), t('login.serverSlow'));
        } else {
          Alert.alert(t('common.noConnection'), t('login.cannotConnect'));
        }
        return;
      }
      if (error?.status === 401 || error?.status === 403) {
        Alert.alert(t('common.accessDenied'), t('login.wrongCredentials'));
        return;
      }
      if (error?.status >= 500) {
        Alert.alert(t('login.serverErrorTitle'), t('login.serverError'));
        return;
      }
      Alert.alert(t('common.error'), t('login.genericError', { status: error?.status || t('login.unknownError') }));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate?.('ForgotPassword');
  };

  const handleBiometricLogin = async () => {
    if (loading || biometricLoading) return;

    setBiometricLoading(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(t('login.biometricTitle'), t('login.biometricNoHardware'));
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(t('login.biometricTitle'), t('login.biometricNotEnrolled'));
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('login.biometricTitle'),
        cancelLabel: t('common.cancel'),
        fallbackLabel: t('login.usePassword'),
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
          Alert.alert(t('login.biometricTitle'), t('login.biometricFailed'));
        }
        return;
      }

      const storedToken = await getAuthToken();
      if (!storedToken) {
        Alert.alert(
          t('login.biometricTitle'),
          t('login.biometricLinkFirst')
        );
        return;
      }

      const patient = await navoraApi.getMyPatientProfile();
      if (!patient) {
        Alert.alert(t('login.sessionExpiredTitle'), t('login.sessionExpired'));
        return;
      }

      onPatientReady?.({
        ...patient,
        authSource: 'biometric',
        hasAccount: true,
      }, mode);
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert(t('common.noConnection'), t('common.checkInternet'));
        return;
      }
      if (error?.status === 401 || error?.status === 403) {
        Alert.alert(t('login.sessionExpiredTitle'), t('login.sessionExpired'));
        return;
      }
      Alert.alert(t('login.biometricTitle'), t('login.biometricFailed'));
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          // flexGrow (e não minHeight = altura da janela): a tela não "balança"
          // pra cima e pra baixo à toa; só rola quando o teclado abre ou não cabe.
          contentContainerStyle={[
            styles.scrollContent,
            { paddingVertical: compact ? 10 : 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          {/* Idioma fica só em Configurações (decisão da usuária, 28/10). */}
          <View style={[styles.stage, { maxWidth: stageMaxWidth }]}>
            <View style={[styles.brandBlock, compact && styles.brandBlockCompact]}>
              <Image
                source={require('../../assets/images/navora_symbol.png')}
                style={[styles.brandSymbol, compact && styles.brandSymbolCompact]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, compact && styles.titleCompact]}>
                {t('login.title')} <Text style={styles.titleAccent}>Navora</Text>
              </Text>
            </View>

            <Animated.View style={[styles.profileGrid, { transform: [{ scale: profileAnim }] }]}>
              {PROFILE_OPTIONS.map((profile) => (
                <ProfileSelectorCard
                  key={profile.key}
                  profile={profile}
                  selected={selectedProfile === profile.key}
                  disabled={loading}
                  onPress={() => handleProfileChange(profile.key)}
                />
              ))}
            </Animated.View>

            <View style={styles.form}>
              <LoginInput
                icon="account-outline"
                placeholder={t('login.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <LoginInput
                icon="lock-outline"
                placeholder={t('login.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                rightAction={
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                }
              />

              <View style={styles.loginOptions}>
                <Pressable
                  onPress={() => setRememberData((current) => !current)}
                  disabled={loading}
                  style={({ pressed }) => [styles.rememberButton, pressed && styles.pressed]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberData }}
                >
                  <View style={[styles.checkbox, rememberData && styles.checkboxChecked]}>
                    {rememberData ? (
                      <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <Text style={styles.rememberText}>{t('login.remember')}</Text>
                </Pressable>

                <Pressable
                  onPress={handleForgotPassword}
                  disabled={loading}
                  style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
                >
                  <Text style={styles.forgotText}>{t('login.forgot')} &gt;</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading || biometricLoading}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !loading && !biometricLoading && styles.loginButtonPressed,
                  (loading || biometricLoading) && styles.disabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="login" size={18} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>{t('login.enter')}</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleBiometricLogin}
                disabled={loading || biometricLoading}
                style={({ pressed }) => [
                  styles.biometricButton,
                  pressed && !loading && !biometricLoading && styles.biometricButtonPressed,
                  (loading || biometricLoading) && styles.disabled,
                ]}
              >
                {biometricLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="fingerprint" size={24} color={colors.primary} />
                    <Text style={styles.biometricText}>{t('login.biometric')}</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={onCreateAccount}
              disabled={loading}
              style={({ pressed }) => [styles.signupRow, pressed && styles.pressed]}
            >
              <Text style={styles.signupText}>{t('login.noAccount')}</Text>
              <Text style={styles.signupLink}>{t('login.signUp')}</Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
};

const ProfileSelectorCard = ({ profile, selected, disabled, onPress }) => {
  const styles = useThemeStyles();
  const { appColors: colors, t } = useApp();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.profileCard,
        selected && styles.profileCardSelected,
        pressed && !disabled && styles.profileCardPressed,
      ]}
    >
      <View style={[styles.profileIconWrap, selected && styles.profileIconWrapSelected]}>
        <MaterialCommunityIcons
          name={profile.icon}
          size={28}
          color={selected ? colors.primary : colors.muted}
        />
      </View>
      <Text style={[styles.profileTitle, selected && styles.profileTitleSelected]}>
        {t(profile.titleKey)}
      </Text>
      {selected ? (
        <View style={styles.selectedBadge}>
          <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
};

const LoginInput = ({ icon, rightAction, ...inputProps }) => {
  const styles = useThemeStyles();
  const { appColors: colors } = useApp();
  return (
    <View style={styles.inputBox}>
      <MaterialCommunityIcons name={icon} size={19} color={colors.primary} />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.lightText}
        selectionColor={colors.primary}
        {...inputProps}
      />
      {rightAction}
    </View>
  );
};

// Estilos acompanham o tema (claro/escuro); antes a tela tinha uma paleta
// própria, sempre clara.
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}

const createStyles = (colors) => StyleSheet.create({
  // Fundo rosado suave (o mesmo do cabeçalho/rodapé).
  container: {
    flex: 1,
    backgroundColor: colors.bar,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.bar,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.bar,
  },

  stage: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 22,
    justifyContent: 'center',
  },

  brandBlock: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  brandBlockCompact: {
    marginBottom: 8,
  },

  brandSymbol: {
    width: 68,
    height: 68,
    marginBottom: 6,
  },

  brandSymbolCompact: {
    width: 62,
    height: 62,
    marginBottom: 5,
  },

  header: {
    alignItems: 'center',
    marginBottom: 26,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center',
  },

  titleCompact: {
    fontSize: 24,
    lineHeight: 29,
  },

  titleAccent: {
    color: colors.primary,
  },

  profileGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  // Fora do selecionado: branco levemente rosado (branco puro sobre o fundo
  // rosado ficava "muito branco"). O perfil escolhido ganha fundo rosado
  // (iconBg) + borda bordô, pra ficar claro qual está marcado.
  profileCard: {
    flex: 1,
    height: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.barBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  profileCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.iconBg,
  },

  profileCardPressed: {
    transform: [{ scale: 0.985 }],
  },

  profileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginBottom: 4,
  },

  profileIconWrapSelected: {
    backgroundColor: '#FFFFFF',
  },

  profileTitle: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  profileTitleSelected: {
    color: colors.primary,
  },

  selectedBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    gap: 8,
  },

  inputBox: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.barBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },

  iconButton: {
    width: 32,
    height: 32,
    marginRight: -7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginOptions: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 9,
  },

  rememberButton: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  rememberText: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },

  forgotButton: {
    minHeight: 22,
    justifyContent: 'center',
  },

  forgotText: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },

  loginButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...shadow,
  },

  loginButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.99 }],
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },

  biometricButton: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.barBorder,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  biometricButtonPressed: {
    backgroundColor: colors.surfaceAlt,
    transform: [{ scale: 0.99 }],
  },

  biometricText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },

  signupRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },

  signupText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  signupLink: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    marginLeft: 2,
  },

  pressed: {
    opacity: 0.76,
  },

  disabled: {
    opacity: 0.68,
  },
});

export default LoginScreen;
