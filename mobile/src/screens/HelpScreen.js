import React, { useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { getAreaById } from '../data/routes';
import { navoraApi } from '../services/api';

const helpTypes = [
  'Estou perdido',
  'Dificuldade de locomocao',
  'Preciso de orientacao',
  'Preciso de acompanhante',
  'Problema na rota',
  'Outro',
];

export default function HelpScreen({ navigate, goBack, routeParams = {}, userType = 'patient', userProfile, onCreateHelpRequest }) {
  const { appColors, currentLocation: fallbackLocation, userPreferences: fallbackPreferences } = useApp();
  const currentLocation = {
    ...fallbackLocation,
    name: userProfile?.currentLocation || fallbackLocation.name,
    beacon: userProfile?.currentBeacon || fallbackLocation.beacon,
  };
  const userPreferences = {
    ...fallbackPreferences,
    ...(userProfile?.accessibility || {}),
    accessibleRoute: Boolean(userProfile?.accessibility?.wheelchair || userProfile?.accessibility?.avoidStairs || fallbackPreferences.accessibleRoute),
  };
  const profileLabel = userProfile?.type === 'visitor' || userType === 'visitor' ? 'Visitante' : 'Paciente';
  const [selectedType, setSelectedType] = useState(routeParams.type === 'help' ? 'Preciso de orientacao' : helpTypes[0]);
  const [helpDescription, setHelpDescription] = useState('');
  const [doctorReason, setDoctorReason] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [submittingKind, setSubmittingKind] = useState(null);

  const submit = async (kind) => {
    if (submittingKind) return;

    const isSos = kind === 'sos';
    const isDoctor = kind === 'doctor';
    setSubmittingKind(kind);
    const area = getAreaById(userProfile?.area || 'private');
    const callType = isSos ? 'SOS' : isDoctor ? 'DOCTOR' : 'HELP';
    const priority = isSos ? 'CRITICAL' : isDoctor ? 'HIGH' : 'MEDIUM';
    const localRequest = {
      tipo: isSos ? 'SOS Emergencia' : isDoctor ? 'Solicitacao medica' : 'Pedido de ajuda',
      motivo: isSos ? 'Atendimento imediato' : isDoctor ? doctorReason || 'Avaliacao clinica' : selectedType,
      queixa: isDoctor ? doctorNotes : helpDescription,
      urgente: isSos || isDoctor,
      perfil: profileLabel,
      status: 'Pendente',
      local: currentLocation.name,
      setor: currentLocation.corridor,
    };
    const payload = {
      user_type: userProfile?.type || userType || 'patient',
      user_name: userProfile?.name || (profileLabel === 'Visitante' ? 'Visitante Navora' : 'Paciente Navora'),
      area: area.id,
      area_name: area.name,
      patient_name: userProfile?.name || (profileLabel === 'Visitante' ? 'Visitante Navora' : 'Paciente Navora'),
      call_type: callType,
      reason: isSos ? 'Atendimento imediato' : isDoctor ? doctorReason || 'Avaliacao clinica' : selectedType,
      location: currentLocation.name,
      sector: currentLocation.corridor,
      beacon_code: currentLocation.beacon,
      message: isDoctor ? doctorNotes || doctorReason : helpDescription || selectedType,
      priority,
    };
    try {
      const apiResponse = isSos
        ? await navoraApi.createSos(payload)
        : isDoctor
          ? await navoraApi.createCall(payload)
          : await navoraApi.createHelpRequest(payload);
      const request = apiResponse?.demoMode ? onCreateHelpRequest?.(localRequest) : null;

      setConfirmation({
        kind,
        title: isSos ? 'SOS enviado' : isDoctor ? 'Solicitacao medica enviada' : 'Pedido de ajuda enviado',
        text: apiResponse?.demoMode
          ? 'API indisponivel: solicitacao registrada localmente para demonstracao.'
          : 'Solicitacao enviada para a recepcao.',
        protocol: apiResponse?.id || request?.id || 'NAVORA',
      });
    } catch (error) {
      Alert.alert(
        'Nao foi possivel enviar',
        'Confira a conexao e tente novamente. Se for urgente, procure a recepcao imediatamente.'
      );
    } finally {
      setSubmittingKind(null);
    }
  };

  if (confirmation) {
    return (
      <Screen withBottomTabs>
        <Header title="Ajuda e SOS" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
        <View style={[styles.confirmCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
          <View style={[styles.confirmIcon, confirmation.kind === 'sos' && styles.confirmIconDanger]}>
            <MaterialCommunityIcons
              name={confirmation.kind === 'sos' ? 'alarm-light-outline' : 'check-circle-outline'}
              size={58}
              color={confirmation.kind === 'sos' ? colors.danger : colors.success}
            />
          </View>
          <Text style={[styles.confirmTitle, { color: appColors.text }]}>{confirmation.title}</Text>
          <Text style={[styles.confirmText, { color: appColors.muted }]}>{confirmation.text}</Text>
          <Text style={styles.protocol}>Protocolo: {confirmation.protocol}</Text>
          <Pressable onPress={() => navigate('Notifications')} style={[styles.primaryButton, shadows.soft]}>
            <Text style={styles.primaryText}>Ver notificacoes</Text>
          </Pressable>
          <Pressable onPress={() => navigate('Home')} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Voltar para Home</Text>
          </Pressable>
        </View>
        <BottomTabs active="Home" navigate={navigate} />
      </Screen>
    );
  }

  return (
    <Screen withBottomTabs>
      <Header title="Ajuda e SOS" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <Card title="Solicitar ajuda" icon="hand-heart-outline" appColors={appColors}>
        <Text style={[styles.cardText, { color: appColors.muted }]}>Informe o tipo de apoio que voce precisa.</Text>
        <View style={styles.chips}>
          {helpTypes.map((item) => {
            const active = selectedType === item;
            return (
              <Pressable key={item} onPress={() => setSelectedType(item)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={helpDescription}
          onChangeText={setHelpDescription}
          placeholder="Ex.: estou proximo a recepcao e nao encontro o setor de imagem."
          placeholderTextColor="#8B8D96"
          multiline
          style={[styles.input, { color: appColors.text, borderColor: appColors.border }]}
        />
        <Pressable
          onPress={() => submit('help')}
          disabled={Boolean(submittingKind)}
          style={[styles.primaryButton, submittingKind && styles.disabled]}
        >
          {submittingKind === 'help' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Enviar pedido de ajuda</Text>}
        </Pressable>
      </Card>

      <Card title="Solicitar medico" icon="stethoscope" appColors={appColors}>
        <Text style={[styles.cardText, { color: appColors.muted }]}>Use esta opcao quando precisar de avaliacao ou apoio clinico.</Text>
        <TextInput
          value={doctorReason}
          onChangeText={setDoctorReason}
          placeholder="Motivo: tontura, dor, mal-estar, falta de ar..."
          placeholderTextColor="#8B8D96"
          style={[styles.input, styles.singleInput, { color: appColors.text, borderColor: appColors.border }]}
        />
        <TextInput
          value={doctorNotes}
          onChangeText={setDoctorNotes}
          placeholder="Observacoes e detalhes importantes."
          placeholderTextColor="#8B8D96"
          multiline
          style={[styles.input, { color: appColors.text, borderColor: appColors.border }]}
        />
        <Pressable
          onPress={() => submit('doctor')}
          disabled={Boolean(submittingKind)}
          style={[styles.primaryButton, submittingKind && styles.disabled]}
        >
          {submittingKind === 'doctor' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Solicitar medico</Text>}
        </Pressable>
      </Card>

      <Card title="SOS Emergencia" icon="alarm-light-outline" danger appColors={appColors}>
        <Text style={[styles.cardText, { color: appColors.muted }]}>Atendimento imediato em situacao urgente.</Text>
        <View style={styles.sosInfo}>
          <Info label="Localizacao" value={`${currentLocation.name} - ${currentLocation.corridor}`} appColors={appColors} />
          <Info label="Beacon" value={currentLocation.beacon} appColors={appColors} />
          <Info label="Horario" value={new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} appColors={appColors} />
          <Info label="Prioridade" value="Critica" appColors={appColors} danger />
          <Info label="Perfil" value={profileLabel} appColors={appColors} />
          <Info label="Preferencias" value={userPreferences.accessibleRoute ? 'Rota acessivel ativa' : 'Padrao'} appColors={appColors} />
        </View>
        <Pressable
          onPress={() => submit('sos')}
          disabled={Boolean(submittingKind)}
          style={[styles.sosButton, submittingKind && styles.disabled]}
        >
          {submittingKind === 'sos' ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="alarm-light-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryText}>ACIONAR SOS AGORA</Text>
            </>
          )}
        </Pressable>
      </Card>

      <BottomTabs active="Home" navigate={navigate} />
    </Screen>
  );
}

function Card({ title, icon, danger, appColors, children }) {
  return (
    <View style={[styles.card, { backgroundColor: appColors.surface, borderColor: danger ? '#FFD2D7' : appColors.border }, shadows.card]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, danger && styles.cardIconDanger]}>
          <MaterialCommunityIcons name={icon} size={24} color={danger ? colors.danger : colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: appColors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Info({ label, value, appColors, danger }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: appColors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: danger ? colors.danger : appColors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDanger: { backgroundColor: '#FFE8EC' },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  cardText: { fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 11,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#F3D7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  chipTextActive: { color: '#FFFFFF' },
  input: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    fontWeight: '700',
  },
  singleInput: { minHeight: 48 },
  primaryButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryButton: {
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  sosInfo: { gap: 8, marginTop: 12 },
  infoRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: { fontSize: 12, fontWeight: '800' },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '900' },
  sosButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    flexDirection: 'row',
    gap: 9,
  },
  confirmCard: {
    marginTop: 22,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EAF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIconDanger: { backgroundColor: '#FFF1F2' },
  confirmTitle: { fontSize: 24, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  confirmText: { fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center', marginTop: 7 },
  protocol: { color: colors.primary, fontSize: 13, fontWeight: '900', marginTop: 12 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.72 },
});
