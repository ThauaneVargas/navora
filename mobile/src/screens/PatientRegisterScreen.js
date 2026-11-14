import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { isAuthError, navoraApi } from '../services/api';
import { saveAuthToken } from '../services/authToken';
import { PRIVACY_POLICY_VERSION, getPrivacyPolicy } from '../data/privacyPolicy';
import {
  isStrongPassword,
  isValidEmail,
  isValidPhone,
  maskPhone,
  sanitizeName,
  stripSpaces,
} from '../utils/masks';
import PasswordRules from '../components/PasswordRules';

// Cadastro mínimo (LGPD, 29/10): nome, telefone, e-mail e senha obrigatórios;
// contato de emergência opcional. Sem CPF, nascimento nem observações.
const personalFields = [
  { key: 'name', label: 'Nome completo', icon: 'account-outline', mask: sanitizeName, autoCapitalize: 'words' },
  { key: 'phone', label: 'Telefone', icon: 'phone-outline', mask: maskPhone, keyboardType: 'phone-pad', maxLength: 15 },
  { key: 'email', label: 'E-mail', icon: 'email-outline', keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false },
  { key: 'password', label: 'Senha', icon: 'lock-outline', secure: true, mask: stripSpaces, maxLength: 72 },
  { key: 'confirmPassword', label: 'Confirmar senha', icon: 'lock-check-outline', secure: true, mask: stripSpaces, maxLength: 72 },
  { key: 'emergencyContact', label: 'Contato de emergência (telefone)', icon: 'account-alert-outline', mask: maskPhone, keyboardType: 'phone-pad', maxLength: 15 },
];

const accessibilityOptions = [
  'Dificuldade de locomocao',
  'Usa cadeira de rodas',
  'Precisa de elevador',
  'Precisa evitar escadas',
  'Precisa de auxilio de maqueiro',
  'Precisa de acompanhante',
  'Deficiencia visual',
  'Deficiencia auditiva',
  'Precisa de orientacao por voz',
];

// Toda opção da tela precisa estar aqui — o que não estiver é descartado ao salvar
// (antes "acompanhante", "deficiência visual" e "auditiva" eram marcadas e sumiam).
const accessibilityMap = {
  'Dificuldade de locomocao': 'mobilityDifficulty',
  'Usa cadeira de rodas': 'wheelchair',
  'Precisa de elevador': 'preferElevator',
  'Precisa evitar escadas': 'avoidStairs',
  'Precisa de auxilio de maqueiro': 'needsStretcher',
  'Precisa de acompanhante': 'needsCompanion',
  'Deficiencia visual': 'visualImpairment',
  'Deficiencia auditiva': 'hearingImpairment',
  'Precisa de orientacao por voz': 'voiceGuidance',
};

const buildAccessibility = (selected) =>
  Object.fromEntries(
    Object.entries(accessibilityMap)
      .filter(([label]) => selected[label])
      .map(([, key]) => [key, true])
  );

// Inverso de accessibilityMap (chave do backend -> label do checkbox), usado pra
// pre-marcar as opções já salvas quando a tela abre em modo de edição.
const accessibilityKeyToLabel = Object.fromEntries(
  Object.entries(accessibilityMap).map(([label, key]) => [key, label])
);

const buildSelectedFromAccessibility = (accessibility = {}) =>
  Object.fromEntries(
    Object.entries(accessibility || {})
      .filter(([key, value]) => value && accessibilityKeyToLabel[key])
      .map(([key]) => [accessibilityKeyToLabel[key], true])
  );

export default function PatientRegisterScreen({ navigate, onPatientReady, onProfileUpdated, routeParams = {} }) {
  const { appColors, t, language } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const policy = useMemo(() => getPrivacyPolicy(language), [language]);
  // mode: 'edit' vem do ProfileScreen (editar cadastro existente via PATCH /patients/me).
  // Sem mode, é cadastro novo (do "Cadastre-se" no Login).
  const isEditMode = routeParams.mode === 'edit';
  const initialValues = routeParams.initialValues || {};
  const [form, setForm] = useState(() => ({
    name: initialValues.name || '',
    phone: initialValues.phone ? maskPhone(initialValues.phone) : '',
    emergencyContact: initialValues.emergencyContact ? maskPhone(initialValues.emergencyContact) : '',
  }));
  const [selected, setSelected] = useState(() => buildSelectedFromAccessibility(initialValues.accessibility));
  const [loading, setLoading] = useState(false);
  // LGPD: cadastro novo só segue com o aceite explícito (dados de saúde).
  const [consent, setConsent] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const updateField = (key, value) => {
    const field = personalFields.find((item) => item.key === key);
    const nextValue = field?.mask ? field.mask(value) : value;
    setForm((current) => ({ ...current, [key]: nextValue }));
  };

  const toggleOption = (option) => {
    setSelected((current) => ({ ...current, [option]: !current[option] }));
  };

  const togglePasswordVisibility = (key) => {
    setVisiblePasswords((current) => ({ ...current, [key]: !current[key] }));
  };

  const fieldErrors = useMemo(() => ({
    email: form.email && !isValidEmail(form.email) ? t('register.errEmail') : null,
    phone: form.phone && !isValidPhone(form.phone) ? t('register.errPhone') : null,
    emergencyContact: form.emergencyContact && !isValidPhone(form.emergencyContact) ? t('register.errPhone') : null,
    confirmPassword:
      form.confirmPassword && form.confirmPassword !== form.password
        ? t('register.errMismatch')
        : null,
  }), [form.email, form.phone, form.emergencyContact, form.confirmPassword, form.password, t]);

  const handleSubmit = async () => {
    if (isEditMode) {
      if (!form.name?.trim()) {
        Alert.alert(t('register.nameRequiredTitle'), t('register.nameRequired'));
        return;
      }

      if (!form.phone?.trim()) {
        Alert.alert(t('register.phoneRequiredTitle'), t('register.phoneRequired'));
        return;
      }

      if (Object.values(fieldErrors).some(Boolean)) {
        Alert.alert(t('register.checkTitle'), t('register.check'));
        return;
      }

      setLoading(true);
      const editPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        accessibility: buildAccessibility(selected),
        // String vazia (e não undefined) pra a pessoa conseguir apagar o contato.
        emergencyContact: form.emergencyContact?.trim() || '',
      };

      // Todo acesso agora tem conta (login obrigatório desde 29/10): sempre salva
      // no servidor. Antes, quem entrava sem conta salvava só nesta sessão.

      try {
        // PATCH/PUT real em /patients/me — ao contrário do fluxo de criação abaixo,
        // nunca chama registerPatient (evita o 409 "E-mail ja cadastrado"/duplicata).
        await navoraApi.updateMyPatientProfile(editPayload);
        const authUser = await navoraApi.getAuthMe();
        const patient = await navoraApi.getMyPatientProfile();
        // Só atualiza os dados (mantém modo paciente/visitante, rota e visita).
        (onProfileUpdated || onPatientReady)?.({ ...patient, apiUser: authUser, authSource: 'api', hasAccount: true });
        Alert.alert(t('register.updatedTitle'), t('register.updated'));
        navigate('Profile');
      } catch (error) {
        if (isAuthError(error)) {
          Alert.alert(t('register.sessionExpiredTitle'), t('register.sessionExpired'));
          navigate('Login');
          return;
        }
        Alert.alert(t('register.saveFailedTitle'), error?.payload?.message || t('register.tryAgain'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!form.name?.trim() || !form.phone?.trim() || !form.email?.trim() || !form.password?.trim()) {
      Alert.alert(t('register.incompleteTitle'), t('register.incomplete'));
      return;
    }

    if (!isStrongPassword(form.password)) {
      Alert.alert(t('password.weakTitle'), t('password.weak'));
      return;
    }

    if (Object.values(fieldErrors).some(Boolean)) {
      Alert.alert(t('register.checkTitle'), t('register.check'));
      return;
    }

    if (!consent) {
      Alert.alert(t('register.consentMissingTitle'), t('register.consentMissing'));
      return;
    }

    setLoading(true);
    const payload = {
      acceptedPrivacyPolicy: true,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim(),
      accessibility: buildAccessibility(selected),
      emergencyContact: form.emergencyContact?.trim() || undefined,
    };

    try {
      const registered = await navoraApi.registerPatient(payload);
      if (registered?.access_token) {
        await saveAuthToken(registered.access_token);
      } else {
        const auth = await navoraApi.login({ email: payload.email, password: payload.password });
        await saveAuthToken(auth.access_token);
      }

      const authUser = await navoraApi.getAuthMe();
      const patient = await navoraApi.getMyPatientProfile();
      onPatientReady?.({ ...patient, apiUser: authUser, authSource: 'api', hasAccount: true });
      navigate('PatientHome');
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert(t('register.createdTitle'), t('register.created'));
        navigate('Login');
        return;
      }
      Alert.alert(t('register.notCompletedTitle'), error?.payload?.message || t('register.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  // Em edição, e-mail/senha ficam fora — essa tela nunca muda credenciais
  // (isso já tem fluxo próprio em "Segurança da conta").
  const visibleFields = isEditMode
    ? personalFields.filter((field) => !['email', 'password', 'confirmPassword'].includes(field.key))
    : personalFields;

  return (
    <Screen>
      <Header
        title={isEditMode ? t('register.titleEdit') : t('register.titleNew')}
        centerTitle
        onBack={() => navigate(isEditMode || routeParams.from === 'Profile' ? 'Profile' : 'Login')}
      />

      <Text style={styles.sectionTitle}>{t('register.personalData')}</Text>
      <View style={styles.formList}>
        {visibleFields.map((field) => {
          const isPasswordVisible = visiblePasswords[field.key];
          const error = fieldErrors[field.key];

          return (
            <View key={field.key}>
              <View style={[styles.inputBox, error && styles.inputBoxError, shadows.card]}>
                <MaterialCommunityIcons name={field.icon} size={21} color={appColors.muted} />
                <TextInput
                  value={form[field.key] || ''}
                  onChangeText={(value) => updateField(field.key, value)}
                  placeholder={t(`register.field_${field.key}`)}
                  placeholderTextColor={appColors.lightText}
                  secureTextEntry={field.secure && !isPasswordVisible}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize}
                  autoCorrect={field.autoCorrect}
                  maxLength={field.maxLength}
                  // Vindo de "Contato de emergência" no Perfil: abre direto nesse campo.
                  autoFocus={routeParams.focus === field.key}
                  style={styles.input}
                />
                {field.secure ? (
                  <Pressable
                    onPress={() => togglePasswordVisibility(field.key)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={isPasswordVisible ? t('register.hidePassword') : t('register.showPassword')}
                  >
                    <MaterialCommunityIcons
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={appColors.muted}
                    />
                  </Pressable>
                ) : null}
              </View>
              {field.key === 'password' ? <PasswordRules value={form.password} /> : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>{t('register.accessibility')}</Text>
      <View style={styles.optionList}>
        {accessibilityOptions.map((option) => {
          const active = selected[option];

          return (
            <Pressable
              key={option}
              onPress={() => toggleOption(option)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && styles.pressed,
                shadows.card,
              ]}
            >
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <MaterialCommunityIcons name="check" size={17} color="#FFFFFF" /> : null}
              </View>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{t(`register.acc_${accessibilityMap[option]}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      {!isEditMode ? (
        <View style={[styles.consentBox, shadows.card]}>
          <Pressable
            onPress={() => setShowPolicy((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showPolicy }}
            style={styles.policyToggle}
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={appColors.primary} />
            <Text style={styles.policyToggleText}>{showPolicy ? t('register.hidePolicy') : t('register.showPolicy')}</Text>
            <MaterialCommunityIcons name={showPolicy ? 'chevron-up' : 'chevron-down'} size={22} color={appColors.primary} />
          </Pressable>
          {showPolicy
            ? policy.sections.map((section) => (
                <View key={section.title} style={styles.policyItem}>
                  <Text style={styles.policyTitle}>{section.title}</Text>
                  <Text style={styles.policyBody}>{section.body}</Text>
                </View>
              ))
            : null}
          <Pressable
            onPress={() => setConsent((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            style={styles.consentRow}
          >
            <MaterialCommunityIcons
              name={consent ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={28}
              color={consent ? appColors.primary : appColors.muted}
            />
            <Text style={styles.consentText}>{policy.consentText}</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={({ pressed }) => [styles.mainButton, pressed && styles.pressed, loading && styles.disabled, shadows.soft]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.mainButtonText}>{isEditMode ? t('register.save') : t('register.create')}</Text>
        )}
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 12,
  },
  formList: {
    gap: 10,
  },
  inputBox: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  inputBoxError: {
    borderColor: colors.danger || '#C0392B',
  },
  errorText: {
    color: colors.danger || '#C0392B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  optionList: {
    gap: 10,
  },
  option: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionActive: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.primary,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  optionTextActive: {
    color: colors.primaryDark,
  },
  consentBox: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  policyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  policyToggleText: {
    flex: 1,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  policyItem: {
    gap: 4,
  },
  policyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  policyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 44,
  },
  consentText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  mainButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.7,
  },
});
