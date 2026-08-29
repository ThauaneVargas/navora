import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, radii, shadows, spacing, typography } from '../theme/colors';

export default function PatientIdentificationScreen({
  navigate,
  goBack,
  routeParams = {},
  onPatientReady,
  patientIdentificationDraft = {},
  onPatientIdentificationDraftChange,
}) {
  const [fullName, setFullName] = useState(patientIdentificationDraft.fullName || '');
  const [birthDate, setBirthDate] = useState(patientIdentificationDraft.birthDate || '');
  const [document, setDocument] = useState(patientIdentificationDraft.cpf || patientIdentificationDraft.document || '');
  const area = routeParams.area || 'private';

  const updateFullName = (value) => {
    setFullName(value);
    onPatientIdentificationDraftChange?.({ fullName: value });
  };

  const updateBirthDate = (value) => {
    setBirthDate(value);
    onPatientIdentificationDraftChange?.({ birthDate: value });
  };

  const updateDocument = (value) => {
    setDocument(value);
    onPatientIdentificationDraftChange?.({ cpf: value, document: value });
  };

  const submit = () => {
    const name = fullName.trim();
    if (!name) {
      Alert.alert('Nome completo', 'Informe seu nome completo para continuar.');
      return;
    }

    onPatientReady?.({
      type: 'patient',
      profile: 'PATIENT',
      name: name.split(' ')[0],
      fullName: name,
      birthDate: birthDate.trim() || null,
      cpf: document.trim() || null,
      document: document.trim() || null,
      area,
      hasAccount: false,
      alreadyPatient: false,
      authSource: 'identified',
      indoorConfirmed: false,
      arrivalStatus: 'OUTSIDE',
    });
    navigate('ArrivalPreparation', { userType: 'patient', area });
  };

  return (
    <Screen>
      <Header
        title="Identificacao do paciente"
        subtitle="Sem cadastro longo. O Navora so precisa reconhecer voce nesta jornada."
        onBack={() => goBack?.('HomeStart')}
        onMenu={() => navigate('Menu')}
      />

      <View style={[styles.card, shadows.card]}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="account-heart-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Vamos com calma</Text>
        <Text style={styles.text}>Voce nao precisa ter consulta ou agendamento vinculado para navegar pelo hospital.</Text>

        <Field label="Nome completo" required value={fullName} onChangeText={updateFullName} placeholder="Ex.: Mariana Souza" />
        <Field label="Data de nascimento" value={birthDate} onChangeText={updateBirthDate} placeholder="DD/MM/AAAA" />
        <Field label="CPF" value={document} onChangeText={updateDocument} placeholder="Opcional" keyboardType="numeric" />

        <Pressable onPress={submit} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Continuar</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </Screen>
  );
}

function Field({ label, required, ...props }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.fieldHint}>{required ? 'Obrigatorio' : 'Opcional'}</Text>
      </View>
      <TextInput placeholderTextColor="#8B8D96" style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, marginTop: spacing.md },
  icon: { width: 54, height: 54, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, color: colors.text, marginTop: spacing.lg },
  text: { ...typography.body, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xs },
  field: { marginTop: spacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  fieldHint: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  input: { height: 50, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, paddingHorizontal: spacing.md, color: colors.text, fontSize: 14, fontWeight: '600' },
  primary: { height: 54, borderRadius: radii.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
