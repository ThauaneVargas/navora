import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';
import { isAuthError, navoraApi } from '../services/api';
import { saveAuthToken } from '../services/authToken';

const personalFields = [
  { key: 'name', label: 'Nome completo', icon: 'account-outline' },
  { key: 'birth', label: 'Data de nascimento ou idade', icon: 'calendar-outline' },
  { key: 'document', label: 'CPF/documento', icon: 'card-account-details-outline' },
  { key: 'phone', label: 'Telefone', icon: 'phone-outline' },
  { key: 'email', label: 'E-mail', icon: 'email-outline' },
  { key: 'password', label: 'Senha', icon: 'lock-outline', secure: true },
  { key: 'emergencyContact', label: 'Contato de emergencia', icon: 'account-alert-outline' },
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
  const [form, setForm] = useState({});
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleOption = (option) => {
    setSelected((current) => ({ ...current, [option]: !current[option] }));
  };

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.password?.trim()) {
      Alert.alert('Cadastro incompleto', 'Preencha nome, e-mail e senha para continuar.');
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
        Alert.alert('Cadastro criado', 'Nao foi possivel autenticar automaticamente. Tente entrar com e-mail e senha.');
        navigate('Login');
        return;
      }
      Alert.alert('Cadastro nao concluido', error?.payload?.message || 'Confira os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Cadastro do paciente" centerTitle onBack={() => navigate('Login')} />

      <Text style={styles.sectionTitle}>Dados pessoais</Text>
      <View style={styles.formList}>
        {personalFields.map((field) => (
          <View key={field.key} style={[styles.inputBox, shadows.card]}>
            <MaterialCommunityIcons name={field.icon} size={21} color={colors.muted} />
            <TextInput
              value={form[field.key] || ''}
              onChangeText={(value) => updateField(field.key, value)}
              placeholder={field.label}
              placeholderTextColor="#8B8D96"
              secureTextEntry={field.secure}
              style={styles.input}
            />
          </View>
        ))}
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
          placeholder="Ex.: alergias, restricoes, preferencia por elevador, necessidade de acompanhante..."
          placeholderTextColor="#8B8D96"
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

const styles = StyleSheet.create({
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
