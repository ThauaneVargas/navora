import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function PatientQuickRegisterScreen({ navigate, goBack, routeParams = {}, onPatientReady }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const area = routeParams.area || 'private';
  const quick = routeParams.quick || false;
  const [name, setName] = useState(quick ? 'Paciente Navora' : '');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [alreadyPatient, setAlreadyPatient] = useState(false);
  const [needsAccessibility, setNeedsAccessibility] = useState(false);
  const [selectedArea, setSelectedArea] = useState(area || 'private');

  const continueFlow = () => {
    if (!quick && !name.trim()) {
      Alert.alert('Nome completo', 'Informe seu nome completo para continuar.');
      return;
    }
    const patient = {
      type: 'patient',
      name: name.trim().split(' ')[0] || 'Paciente',
      fullName: name.trim() || 'Paciente Navora',
      area: selectedArea || area || 'private',
      hasAccount: false,
      quick,
      phone,
      birth,
      alreadyPatient,
      accessibility: {},
      lastDestination: 'Recepção',
    };
    onPatientReady?.(patient);
    if (needsAccessibility) {
      navigate('PatientAccessibilitySetup', { area: selectedArea || area || 'private', mode: 'register', patient });
      return;
    }
    navigate('PatientHome');
  };

  return (
    <Screen>
      <Header
        title={quick ? 'Acesso rápido' : 'Primeiro acesso'}
        subtitle="Vamos preencher apenas o necessário para iniciar sua navegação."
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />
      <View style={[styles.card, shadows.card]}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons name="account-heart-outline" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{quick ? 'Continuar sem cadastro' : 'Vamos te conhecer rapidamente'}</Text>
            <Text style={styles.subtitle}>Precisamos de algumas informações para te guiar melhor.</Text>
          </View>
        </View>
        <View style={styles.authorizationCard}>
          <Text style={styles.authorizationTitle}>Autorização e área</Text>
          <Text style={styles.authorizationText}>Informe em qual unidade você está: HMC Marco Capute (SUS) ou HMC Private. Se não souber, você pode continuar para a home principal.</Text>
          <View style={styles.areaOptions}>
            {[
              { value: 'sus', label: 'HMC Marco Capute (SUS)' },
              { value: 'private', label: 'HMC Private' },
              { value: 'unknown', label: 'Não sei / continuar' },
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

        <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome completo" />
        <Input label="Telefone opcional" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" />
        <Input label="Data de nascimento opcional" value={birth} onChangeText={setBirth} placeholder="DD/MM/AAAA" />
        <CheckRow title="Já sou paciente do hospital" active={alreadyPatient} onPress={() => setAlreadyPatient((value) => !value)} />
        <Text style={styles.question}>Precisa de acessibilidade?</Text>
        <View style={styles.binary}>
          {['Sim', 'Não'].map((item) => (
            <Pressable key={item} onPress={() => setNeedsAccessibility(item === 'Sim')} style={[styles.binaryButton, needsAccessibility === (item === 'Sim') && styles.binaryActive]}>
              <Text style={[styles.binaryText, needsAccessibility === (item === 'Sim') && styles.binaryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={continueFlow} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Continuar</Text>
        </Pressable>
        {!quick ? (
          <Pressable onPress={continueFlow} style={styles.link}>
            <Text style={styles.linkText}>Criar cadastro completo depois</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

function Input({ label, ...props }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={appColors.lightText} style={styles.input} {...props} />
    </View>
  );
}

function CheckRow({ title, active, onPress }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  return (
    <Pressable onPress={onPress} style={styles.checkRow}>
      <MaterialCommunityIcons name={active ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={appColors.primary} />
      <Text style={styles.checkText}>{title}</Text>
    </Pressable>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: { borderRadius: 30, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, marginTop: 4 },
  intro: { minHeight: 82, borderRadius: 24, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  introIcon: { width: 52, height: 52, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 18, lineHeight: 23, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  field: { marginTop: 12, gap: 7 },
  label: { color: colors.text, fontSize: 12, fontWeight: '900' },
  input: { height: 52, borderRadius: 17, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 13, fontSize: 14, fontWeight: '700', backgroundColor: colors.surface },
  checkRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  checkText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  authorizationCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: 14, marginTop: 10, marginBottom: 6 },
  authorizationTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  authorizationText: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  areaOptions: { flexDirection: 'column', gap: 8, marginTop: 12 },
  areaOption: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.surface },
  areaOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  areaOptionText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  areaOptionTextActive: { color: colors.primary },
  question: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 12 },
  binary: { flexDirection: 'row', gap: 10, marginTop: 9 },
  binaryButton: { flex: 1, height: 46, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  binaryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  binaryText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  binaryTextActive: { color: '#FFFFFF' },
  primary: { height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
