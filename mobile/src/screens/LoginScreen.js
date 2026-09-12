import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { navoraApi, isNetworkError } from '../services/api';
import { getAuthToken, saveAuthToken } from '../services/authToken';

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

const COLORS = {
  burgundy: '#980027',
  burgundyDark: '#7D001F',
  burgundyLight: '#FFF6F8',
  background: '#FFFFFF',
  backgroundSoft: '#FBFBFC',
  text: '#202124',
  secondary: '#696B70',
  placeholder: '#92959B',
  border: '#E4E4E6',
  inputText: '#36383D',
};

const PROFILE_OPTIONS = [
  {
    key: 'PATIENT',
    icon: 'account-heart-outline',
    title: 'Paciente',
  },
  {
    key: 'VISITOR',
    icon: 'account-group-outline',
    title: 'Visitante',
  },
];

const shadow = {
  shadowColor: COLORS.burgundyDark,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const GOOGLE_LOGO = require('../../assets/images/logo google.png');

export const LoginScreen = ({ onLoginSuccess, onPatientReady, onCreateAccount, onHowToGet, navigate }) => {
  const { width, height } = useWindowDimensions();
  const stageMaxWidth = Math.min(width, 430);
  const compact = height < 720;
  const [selectedProfile, setSelectedProfile] = useState('PATIENT');
  const [emailOrCpf, setEmailOrCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberData, setRememberData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const profileAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadRememberedEmail().then((saved) => {
      if (saved) {
        setEmailOrCpf(saved);
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

  const handleLogin = async () => {
    if (selectedProfile === 'VISITOR') {
      onLoginSuccess?.('visitor');
      return;
    }

    if (!emailOrCpf || !password) {
      Alert.alert('Atenção', 'Preencha e-mail ou senha.');
      return;
    }

    setLoading(true);

    try {
      const auth = await navoraApi.login({ email: emailOrCpf.trim(), password });

      if (!auth?.access_token) {
        Alert.alert('Erro', 'Resposta inválida do servidor.');
        return;
      }

      if (auth.user?.role !== 'PATIENT') {
        Alert.alert('Acesso negado', 'Este aplicativo é exclusivo para pacientes.');
        return;
      }

      await saveAuthToken(auth.access_token);

      if (rememberData) {
        await saveRememberedEmail(emailOrCpf.trim());
      } else {
        await clearRememberedEmail();
      }

      const patient = await navoraApi.getMyPatientProfile();

      onPatientReady?.({
        ...patient,
        apiUser: auth.user,
        authSource: 'api',
        hasAccount: true,
      });
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert('Sem conexão', 'Não foi possível conectar ao servidor. Verifique sua internet.');
        return;
      }
      if (error?.status === 401 || error?.status === 403) {
        Alert.alert('Acesso negado', 'E-mail ou senha incorretos.');
        return;
      }
      Alert.alert('Erro', 'Não foi possível entrar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate?.('ForgotPassword');
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'Login com Google',
      'Em breve disponível. Configure os Client IDs do Google para ativar.',
      [{ text: 'OK' }]
    );
  };

  const handleSocialLogin = (provider) => {
    if (provider === 'Google') {
      handleGoogleLogin();
    } else {
      Alert.alert(provider, 'Login com Apple ainda não está disponível neste ambiente.');
    }
  };

  const handleBiometricLogin = async () => {
    if (loading || biometricLoading) return;

    setBiometricLoading(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Autenticação biométrica', 'Este aparelho não possui hardware biométrico compatível.');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Autenticação biométrica', 'Nenhuma biometria está cadastrada neste aparelho.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticação biométrica',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
          Alert.alert('Autenticação biométrica', 'Não foi possível autenticar com biometria.');
        }
        return;
      }

      const storedToken = await getAuthToken();
      if (!storedToken) {
        Alert.alert(
          'Autenticação biométrica',
          'Entre com sua senha uma vez para vincular sua conta neste dispositivo.'
        );
        return;
      }

      const patient = await navoraApi.getMyPatientProfile();
      if (!patient) {
        Alert.alert('Sessão expirada', 'Sua sessão expirou. Entre com sua senha.');
        return;
      }

      onPatientReady?.({
        ...patient,
        authSource: 'biometric',
        hasAccount: true,
      });
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert('Sem conexão', 'Verifique sua internet e tente novamente.');
        return;
      }
      if (error?.status === 401 || error?.status === 403) {
        Alert.alert('Sessão expirada', 'Sua sessão expirou. Entre com sua senha.');
        return;
      }
      Alert.alert('Autenticação biométrica', 'Não foi possível autenticar com biometria.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleHowToGet = () => {
    onHowToGet?.();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: height, paddingVertical: compact ? 10 : 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                Entrar no <Text style={styles.titleAccent}>Navora</Text>
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

            <Pressable
              onPress={handleHowToGet}
              disabled={loading}
              style={({ pressed }) => [
                styles.directionsCard,
                pressed && !loading && styles.directionsCardPressed,
                loading && styles.disabled,
              ]}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="map-marker-outline" size={19} color={COLORS.burgundy} />
              <Text style={styles.directionsText}>Como chegar ao local</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.burgundy} />
            </Pressable>

            <View style={styles.form}>
              <LoginInput
                icon="account-outline"
                placeholder="E-mail ou CPF"
                value={emailOrCpf}
                onChangeText={setEmailOrCpf}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <LoginInput
                icon="lock-outline"
                placeholder="Senha"
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
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.secondary}
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
                  <Text style={styles.rememberText}>Lembrar meus dados</Text>
                </Pressable>

                <Pressable
                  onPress={handleForgotPassword}
                  disabled={loading}
                  style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
                >
                  <Text style={styles.forgotText}>Esqueci minha senha &gt;</Text>
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
                    <Text style={styles.loginButtonText}>ENTRAR</Text>
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
                  <ActivityIndicator color={COLORS.burgundy} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="fingerprint" size={24} color={COLORS.burgundy} />
                    <Text style={styles.biometricText}>Entrar com biometria</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <SocialLoginButton
                icon="google"
                label={googleLoading ? 'Entrando...' : 'Google'}
                disabled={loading || googleLoading || biometricLoading}
                onPress={() => handleSocialLogin('Google')}
              />
              <SocialLoginButton
                icon="apple"
                label="Apple"
                disabled={loading || googleLoading}
                onPress={() => handleSocialLogin('Apple')}
              />
            </View>

            <Pressable
              onPress={onCreateAccount}
              disabled={loading}
              style={({ pressed }) => [styles.signupRow, pressed && styles.pressed]}
            >
              <Text style={styles.signupText}>Ainda não tem uma conta? </Text>
              <Text style={styles.signupLink}>Cadastre-se</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const ProfileSelectorCard = ({ profile, selected, disabled, onPress }) => (
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
        color={selected ? COLORS.burgundy : COLORS.secondary}
      />
    </View>
    <Text style={[styles.profileTitle, selected && styles.profileTitleSelected]}>
      {profile.title}
    </Text>
    {selected ? (
      <View style={styles.selectedBadge}>
        <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
      </View>
    ) : null}
  </Pressable>
);

const LoginInput = ({ icon, rightAction, ...inputProps }) => (
  <View style={styles.inputBox}>
    <MaterialCommunityIcons name={icon} size={19} color={COLORS.burgundy} />
    <TextInput
      style={styles.input}
      placeholderTextColor={COLORS.placeholder}
      selectionColor={COLORS.burgundy}
      {...inputProps}
    />
    {rightAction}
  </View>
);

const SocialLoginButton = ({ icon, label, disabled, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.socialButton,
      pressed && !disabled && styles.socialButtonPressed,
      disabled && styles.disabled,
    ]}
  >
    {icon === 'google' ? (
      <Image source={GOOGLE_LOGO} style={styles.socialIconImage} resizeMode="contain" />
    ) : (
      <FontAwesome name="apple" size={22} color="#000000" />
    )}
    <Text style={styles.socialText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
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
    color: COLORS.burgundy,
  },

  profileGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  profileCard: {
    flex: 1,
    height: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  profileCardSelected: {
    borderWidth: 1.3,
    borderColor: COLORS.burgundy,
    backgroundColor: COLORS.burgundyLight,
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
    backgroundColor: COLORS.backgroundSoft,
    marginBottom: 4,
  },

  profileIconWrapSelected: {
    backgroundColor: '#FFFFFF',
  },

  profileTitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  profileTitleSelected: {
    color: COLORS.burgundy,
  },

  selectedBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  directionsCard: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  directionsCardPressed: {
    backgroundColor: COLORS.burgundyLight,
    transform: [{ scale: 0.99 }],
  },

  directionsText: {
    flex: 1,
    color: COLORS.burgundy,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  form: {
    gap: 8,
  },

  inputBox: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  input: {
    flex: 1,
    height: '100%',
    color: COLORS.inputText,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxChecked: {
    borderColor: COLORS.burgundy,
    backgroundColor: COLORS.burgundy,
  },

  rememberText: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },

  forgotButton: {
    minHeight: 22,
    justifyContent: 'center',
  },

  forgotText: {
    color: COLORS.burgundy,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },

  loginButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.burgundy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...shadow,
  },

  loginButtonPressed: {
    backgroundColor: COLORS.burgundyDark,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  biometricButtonPressed: {
    backgroundColor: COLORS.burgundyLight,
    transform: [{ scale: 0.99 }],
  },

  biometricText: {
    color: COLORS.burgundy,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 9,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },

  socialRow: {
    flexDirection: 'row',
    gap: 8,
  },

  socialButton: {
    flex: 1,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  socialButtonPressed: {
    backgroundColor: COLORS.burgundyLight,
    transform: [{ scale: 0.99 }],
  },

  socialIconImage: {
    width: 22,
    height: 22,
  },

  socialText: {
    color: COLORS.text,
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
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  signupLink: {
    color: COLORS.burgundy,
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
