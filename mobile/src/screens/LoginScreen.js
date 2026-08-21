import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const stageWidth = Math.min(width, 430);

const colors = {
  red: '#B40012',
  redDark: '#3A050B',
  text: '#23232A',
  muted: '#767984',
  border: '#EFE3E5',
  softBorder: '#F4E9EB',
  surface: '#FFFFFF',
  softRed: '#FFF4F5',
};

export const LoginScreen = ({ onLoginSuccess, onCreateAccount }) => {
  const [userType, setUserType] = useState('paciente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail, CPF ou matrícula e senha.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess?.(userType);
    }, 700);
  };

  const handleBiometricLogin = () => {
    Alert.alert('Biometria', 'Autenticação por biometria disponível para dispositivos compatíveis.');
  };

  const handleForgotPassword = () => {
    Alert.alert('Recuperar acesso', 'A recuperacao de senha sera feita pela equipe de atendimento.');
  };

  const handleContactTeam = () => {
    Alert.alert('Ajuda', 'Procure a recepcao para auxiliar no acesso.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stage}>
            <Image
              source={require('../../assets/images/segundaTela.png')}
              style={styles.backgroundImage}
              resizeMode="cover"
            />

            <View style={styles.topBar}>
              <View style={styles.brand}>
                <Image
                  source={require('../../assets/images/navora_symbol.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Text style={styles.brandName}>navora</Text>
              </View>

              <TouchableOpacity style={styles.notificationButton} onPress={handleContactTeam} activeOpacity={0.82}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>2</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <Text style={styles.title}>
                Bem-vindo{'\n'}ao <Text style={styles.titleRed}>Navora</Text>
              </Text>
              <Text style={styles.subtitle}>
                Faça login para acessar sua{'\n'}navegação inteligente.
              </Text>
            </View>

            <View style={styles.content}>
              <View style={styles.segment}>
                <RoleButton
                  active={userType === 'paciente'}
                  icon="account"
                  label="Paciente"
                  onPress={() => setUserType('paciente')}
                  disabled={loading}
                />
                <RoleButton
                  active={userType === 'visitante'}
                  icon="account-arrow-right-outline"
                  label="Visitante"
                  onPress={() => setUserType('visitante')}
                  disabled={loading}
                />
              </View>

              <View style={styles.form}>
                <View style={styles.inputBox}>
                  <MaterialCommunityIcons name="email-outline" size={22} color={colors.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail, CPF ou matrícula"
                    placeholderTextColor="#8B8D96"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputBox}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color={colors.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#8B8D96"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    disabled={loading}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotButton}
                  onPress={handleForgotPassword}
                  disabled={loading}
                  activeOpacity={0.75}
                >
                  <Text style={styles.forgotText}>Esqueci minha senha</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.86}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.biometricButton, loading && styles.disabled]}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  activeOpacity={0.82}
                >
                  <MaterialCommunityIcons name="fingerprint" size={34} color={colors.red} />
                  <Text style={styles.biometricText}>Entrar com biometria</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createAccountButton, loading && styles.disabled]}
                  onPress={onCreateAccount}
                  disabled={loading}
                  activeOpacity={0.82}
                >
                  <Text style={styles.createAccountText}>Criar cadastro do paciente</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.helpButton} onPress={handleContactTeam} disabled={loading} activeOpacity={0.75}>
              <MaterialCommunityIcons name="help-circle-outline" size={19} color={colors.red} />
              <Text style={styles.helpMuted}>Precisa de ajuda? </Text>
              <Text style={styles.helpRed}>Fale com a equipe.</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const RoleButton = ({ active, icon, label, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.roleButton, active && styles.roleButtonActive]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
  >
    <MaterialCommunityIcons
      name={icon}
      size={19}
      color={active ? '#FFFFFF' : colors.muted}
    />
    <Text style={[styles.roleText, active && styles.roleTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const NavoraMark = ({ size = 27 }) => (
  <View style={[styles.mark, { width: size, height: size }]}>
    <View
      style={[
        styles.markStem,
        {
          left: size * 0.08,
          top: size * 0.24,
          width: size * 0.18,
          height: size * 0.58,
          borderRadius: size * 0.1,
        },
      ]}
    />
    <View
      style={[
        styles.markStem,
        {
          right: size * 0.08,
          top: size * 0.12,
          width: size * 0.18,
          height: size * 0.58,
          borderRadius: size * 0.1,
        },
      ]}
    />
    <View
      style={[
        styles.markSlash,
        {
          left: size * 0.18,
          top: size * 0.1,
          width: size * 0.18,
          height: size * 0.83,
          borderRadius: size * 0.1,
        },
      ]}
    />
  </View>
);

const BackgroundArt = () => (
  <View pointerEvents="none" style={styles.art}>
    <View style={styles.cloudLarge} />
    <View style={styles.cloudSmall} />
    <View style={styles.hospitalBase}>
      <View style={styles.hospitalTop} />
      <View style={styles.hospitalMain}>
        <View style={styles.crossV} />
        <View style={styles.crossH} />
        <View style={styles.door} />
      </View>
      <View style={styles.hospitalSide} />
    </View>
    <View style={styles.pathOne} />
    <View style={styles.pathTwo} />
    <View style={styles.pathThree} />
    <MaterialCommunityIcons
      name="map-marker"
      size={17}
      color="rgba(180,0,18,0.13)"
      style={styles.artPin}
    />
  </View>
);

const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.055,
  shadowRadius: 22,
  elevation: 3,
};

const redShadow = {
  shadowColor: colors.red,
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.22,
  shadowRadius: 20,
  elevation: 5,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  safeArea: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  stage: {
    flexGrow: 1,
    width: stageWidth,
    minHeight: height,
    paddingHorizontal: 28,
    paddingTop: 42,
    paddingBottom: 22,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },

  topBar: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: stageWidth,
    height: height,
    opacity: 0.92,
  },

  brandLogo: {
    width: 30,
    height: 30,
  },

  mark: {
    position: 'relative',
  },

  markStem: {
    position: 'absolute',
    backgroundColor: colors.red,
  },

  markSlash: {
    position: 'absolute',
    backgroundColor: colors.red,
    transform: [{ rotate: '-46deg' }],
  },

  brandName: {
    color: '#1F1F24',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -1,
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },

  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  hero: {
    marginTop: 48,
    zIndex: 2,
  },

  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },

  titleRed: {
    color: colors.red,
  },

  subtitle: {
    marginTop: 14,
    color: '#4E505A',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },

  content: {
    marginTop: 48,
    zIndex: 2,
  },

  segment: {
    height: 54,
    flexDirection: 'row',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...cardShadow,
  },

  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
  },

  roleButtonActive: {
    margin: 0,
    borderRadius: 14,
    backgroundColor: colors.red,
    ...redShadow,
  },

  roleText: {
    color: '#62656F',
    fontSize: 14,
    fontWeight: '600',
  },

  roleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  form: {
    marginTop: 32,
    gap: 18,
  },

  inputBox: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.softBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    ...cardShadow,
  },

  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },

  eyeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -5,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 2,
  },

  forgotText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '800',
  },

  loginButton: {
    height: 56,
    borderRadius: 11,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    ...redShadow,
  },

  disabled: {
    opacity: 0.72,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  biometricButton: {
    height: 56,
    borderRadius: 11,
    borderWidth: 1.3,
    borderColor: colors.red,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },

  biometricText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '800',
  },

  createAccountButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  createAccountText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '900',
  },

  helpButton: {
    marginTop: 'auto',
    paddingTop: 20,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  helpMuted: {
    color: '#50515A',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },

  helpRed: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
  },

  art: {
    position: 'absolute',
    top: 78,
    right: -4,
    width: 245,
    height: 235,
    opacity: 0.8,
  },

  cloudLarge: {
    position: 'absolute',
    top: 0,
    right: 88,
    width: 48,
    height: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(180,0,18,0.08)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  cloudSmall: {
    position: 'absolute',
    top: 58,
    right: 152,
    width: 30,
    height: 11,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(180,0,18,0.07)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  hospitalBase: {
    position: 'absolute',
    top: 48,
    right: -2,
    width: 142,
    height: 104,
  },

  hospitalTop: {
    position: 'absolute',
    top: 0,
    right: 6,
    width: 118,
    height: 20,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(180,0,18,0.08)',
    transform: [{ skewY: '-12deg' }],
  },

  hospitalMain: {
    position: 'absolute',
    top: 24,
    right: 16,
    width: 76,
    height: 74,
    borderWidth: 1,
    borderColor: 'rgba(180,0,18,0.08)',
  },

  hospitalSide: {
    position: 'absolute',
    top: 41,
    right: 92,
    width: 40,
    height: 57,
    borderWidth: 1,
    borderColor: 'rgba(180,0,18,0.06)',
  },

  crossV: {
    position: 'absolute',
    top: 18,
    left: 34,
    width: 8,
    height: 27,
    backgroundColor: 'rgba(180,0,18,0.08)',
  },

  crossH: {
    position: 'absolute',
    top: 28,
    left: 24,
    width: 28,
    height: 8,
    backgroundColor: 'rgba(180,0,18,0.08)',
  },

  door: {
    position: 'absolute',
    right: 18,
    bottom: 0,
    width: 18,
    height: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(180,0,18,0.08)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  pathOne: {
    position: 'absolute',
    left: 42,
    top: 149,
    width: 118,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(180,0,18,0.11)',
    transform: [{ rotate: '-16deg' }],
  },

  pathTwo: {
    position: 'absolute',
    left: 18,
    top: 178,
    width: 90,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(180,0,18,0.1)',
    transform: [{ rotate: '12deg' }],
  },

  pathThree: {
    position: 'absolute',
    left: 92,
    top: 134,
    width: 70,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(180,0,18,0.08)',
    transform: [{ rotate: '-5deg' }],
  },

  artPin: {
    position: 'absolute',
    top: 153,
    left: 54,
  },
});

export default LoginScreen;
