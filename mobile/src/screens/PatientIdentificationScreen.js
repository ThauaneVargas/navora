import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { radii, shadows, spacing, typography } from '../theme/colors';
import { FormField, PrimaryButton } from '../components/PremiumUI';
import { useApp } from '../context/AppContext';

export default function PatientIdentificationScreen({
  navigate,
  goBack,
  routeParams = {},
  onPatientReady,
  patientIdentificationDraft = {},
  onPatientIdentificationDraftChange,
}) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [fullName, setFullName] = useState(patientIdentificationDraft.fullName || '');
  const [birthDate, setBirthDate] = useState(patientIdentificationDraft.birthDate || '');
  const [document, setDocument] = useState(patientIdentificationDraft.cpf || patientIdentificationDraft.document || '');
  const [nameError, setNameError] = useState(null);
  const [selectedArea, setSelectedArea] = useState(routeParams.area || 'private');
  const area = selectedArea || 'private';

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
      setNameError('Informe seu nome completo para continuar.');
      return;
    }
    setNameError(null);

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
    navigate('PatientHome');
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
          <MaterialCommunityIcons name="account-heart-outline" size={30} color={appColors.primary} />
        </View>
        <Text style={styles.title}>Vamos com calma</Text>
        <Text style={styles.text}>Voce nao precisa ter consulta ou agendamento vinculado para navegar pelo hospital.</Text>

        <View style={styles.authorizationCard}>
          <Text style={styles.authorizationTitle}>Autorizacao e area</Text>
          <Text style={styles.authorizationText}>Informe em qual unidade voce esta: HMC Marco Capute (SUS) ou HMC Private. Se nao souber, voce pode continuar para a home principal e confirmar depois.</Text>
          <View style={styles.areaOptions}>
            {[
              { value: 'sus', label: 'HMC Marco Capute (SUS)' },
              { value: 'private', label: 'HMC Private' },
              { value: 'unknown', label: 'Nao sei / continuar' },
            ].map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setSelectedArea(option.value === 'unknown' ? 'private' : option.value)}
                style={[styles.areaOption, selectedArea === (option.value === 'unknown' ? 'private' : option.value) && styles.areaOptionActive]}
              >
                <Text style={[styles.areaOptionText, selectedArea === (option.value === 'unknown' ? 'private' : option.value) && styles.areaOptionTextActive]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <FormField label="Nome completo" value={fullName} onChangeText={updateFullName} placeholder="Ex.: Mariana Souza" error={nameError} />
        <FormField label="Data de nascimento" value={birthDate} onChangeText={updateBirthDate} placeholder="DD/MM/AAAA" />
        <FormField label="CPF" value={document} onChangeText={updateDocument} placeholder="Opcional" keyboardType="numeric" />

        <PrimaryButton title="Continuar" onPress={submit} style={styles.primary} />
      </View>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, marginTop: spacing.md },
  icon: { width: 54, height: 54, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, color: colors.text, marginTop: spacing.lg },
  text: { ...typography.body, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xs },
  authorizationCard: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: spacing.md, marginBottom: spacing.md },
  authorizationTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  authorizationText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  areaOptions: { flexDirection: 'column', gap: 8, marginTop: 12 },
  areaOption: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.surface },
  areaOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  areaOptionText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  areaOptionTextActive: { color: colors.primary },
  primary: { marginTop: spacing.xl },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
