import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { isAuthError, navoraApi } from '../services/api';
import { saveAuthToken } from '../services/authToken';
import {
  isValidBirthDate,
  isValidCPF,
  isValidEmail,
  maskBirthDate,
  maskCPF,
  maskPhone,
  passwordStrength,
  sanitizeName,
} from '../utils/masks';

const personalFields = [
  { key: 'name', label: 'Nome completo', icon: 'account-outline', mask: sanitizeName, autoCapitalize: 'words' },
  { key: 'birth', label: 'Data de nascimento', icon: 'calendar-outline', mask: maskBirthDate, keyboardType: 'number-pad', maxLength: 10 },
  { key: 'document', label: 'CPF', icon: 'card-account-details-outline', mask: maskCPF, keyboardType: 'number-pad', maxLength: 14 },
  { key: 'phone', label: 'Telefone', icon: 'phone-outline', mask: maskPhone, keyboardType: 'phone-pad', maxLength: 15 },
  { key: 'email', label: 'E-mail', icon: 'email-outline', keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false },
  { key: 'password', label: 'Senha', icon: 'lock-outline', secure: true },
  { key: 'confirmPassword', label: 'Confirmar senha', icon: 'lock-check-outline', secure: true },
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

const accessibilityMap = {
  'Dificuldade de locomocao': 'mobilityDifficulty',
  'Usa cadeira de rodas': 'wheelchair',
  'Precisa de elevador': 'preferElevator',
  'Precisa evitar escadas': 'avoidStairs',
  'Precisa de auxilio de maqueiro': 'needsStretcher',
  'Precisa de orientacao por voz': 'voiceGuidance',
};

const parseBirthDate = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const brDate = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) return `${brDate[3]}-${brDate[2]}-${brDate[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
};

const buildAccessibility = (selected) =>
  Object.fromEntries(
    Object.entries(accessibilityMap)
      .filter(([label]) => selected[label])
      .map(([, key]) => [key, true])
  );

export default function PatientRegisterScreen({ navigate, onPatientReady }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [form, setForm] = useState({});
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
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
    document: form.document && !isValidCPF(form.document) ? 'CPF inválido' : null,
    email: form.email && !isValidEmail(form.email) ? 'E-mail inválido' : null,
    birth: form.birth && !isValidBirthDate(form.birth) ? 'Data inválida' : null,
    confirmPassword:
      form.confirmPassword && form.confirmPassword !== form.password
        ? 'As senhas não coincidem'
        : null,
  }), [form.document, form.email, form.birth, form.confirmPassword, form.password]);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.password?.trim()) {
      Alert.alert('Cadastro incompleto', 'Preencha nome, e-mail e senha para continuar.');
      return;
    }

    if (Object.values(fieldErrors).some(Boolean)) {
      Alert.alert('Confira os dados', 'Alguns campos precisam de atenção antes de continuar.');
      return;
    }

    setLoading(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone?.trim() || undefined,
      patientCode: form.document?.trim() || undefined,
      birthDate: parseBirthDate(form.birth),
      accessibility: buildAccessibility(selected),
      emergencyContact: form.emergencyContact?.trim() || undefined,
    };

    try {
      const registered = await navoraApi.registerPatient(payload);
      if (registered?.demoMode) {
        onPatientReady?.({
          type: 'patient',
          name: payload.name.split(' ')[0],
          fullName: payload.name,
          phone: payload.phone,
          patientCode: payload.patientCode,
          accessibility: payload.accessibility,
          hasAccount: true,
          authSource: 'fallback',
        });
        navigate('PatientHome');
        return;
      }

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
        Alert.alert('Cadastro criado', 'Não foi possível autenticar automaticamente. Tente entrar com e-mail e senha.');
        navigate('Login');
        return;
      }
      Alert.alert('Cadastro não concluído', error?.payload?.message || 'Confira os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Cadastro do paciente" centerTitle onBack={() => navigate('Login')} />

      <Text style={styles.sectionTitle}>Dados pessoais</Text>
      <View style={styles.formList}>
        {personalFields.map((field) => {
          const isPasswordVisible = visiblePasswords[field.key];
          const error = fieldErrors[field.key];

          return (
            <View key={field.key}>
              <View style={[styles.inputBox, error && styles.inputBoxError, shadows.card]}>
                <MaterialCommunityIcons name={field.icon} size={21} color={appColors.muted} />
                <TextInput
                  value={form[field.key] || ''}
                  onChangeText={(value) => updateField(field.key, value)}
                  placeholder={field.label}
                  placeholderTextColor={appColors.lightText}
                  secureTextEntry={field.secure && !isPasswordVisible}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize}
                  autoCorrect={field.autoCorrect}
                  maxLength={field.maxLength}
                  style={styles.input}
                />
                {field.secure ? (
                  <Pressable
                    onPress={() => togglePasswordVisibility(field.key)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <MaterialCommunityIcons
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color={appColors.muted}
                    />
                  </Pressable>
                ) : null}
              </View>
              {field.key === 'password' && strength.label ? (
                <Text style={[styles.hintText, { color: appColors.muted }]}>
                  Força da senha: {strength.label}
                </Text>
              ) : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Acessibilidade e mobilidade</Text>
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
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.notesBox, shadows.card]}>
        <Text style={styles.notesLabel}>Observacoes importantes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
          placeholder="Ex.: alergias, restrições, preferência por elevador, necessidade de acompanhante..."
          placeholderTextColor={appColors.lightText}
          style={styles.notesInput}
        />
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={({ pressed }) => [styles.mainButton, pressed && styles.pressed, loading && styles.disabled, shadows.soft]}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Criar cadastro</Text>}
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
  notesBox: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  notesLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  notesInput: {
    minHeight: 96,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    padding: 0,
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
