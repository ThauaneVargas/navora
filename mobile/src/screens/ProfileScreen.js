import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import ProfileAvatar from '../components/ProfileAvatar';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { getProfilePhotoUri, removeProfilePhotoUri, saveProfilePhotoUri } from '../services/profilePhotoService';

export default function ProfileScreen({ navigate, goBack, userType = 'patient', userProfile, activeRoute: selectedRoute, onLogout }) {
  const { appColors, isDark, toggleTheme, currentLocation: fallbackLocation, userPreferences: fallbackPreferences, activeRoute: fallbackRoute } = useApp();
  const isVisitor = userProfile?.type === 'visitor' || userType === 'visitor';
  const roleLabel = isVisitor ? 'Visitante' : 'Paciente';
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
  const activeRoute = selectedRoute || fallbackRoute;
  const displayName = isVisitor ? 'Visitante Navora' : userProfile?.fullName || userProfile?.name || 'Paciente Navora';
  const [photoUri, setPhotoUri] = useState(null);
  const personalData = [
    ['account-outline', 'Dados pessoais', userProfile?.authSource === 'api' ? 'Backend' : 'Local'],
    ['email-outline', 'E-mail', userProfile?.email || 'Nao informado'],
    ['phone-outline', 'Telefone', userProfile?.phone || 'Nao informado'],
    ['card-account-details-outline', 'Codigo do paciente', userProfile?.patientCode || 'Nao informado'],
  ];
  const mobilityData = [
    ['wheelchair-accessibility', 'Cadeira de rodas', userPreferences.wheelchair ? 'Sim' : 'Nao'],
    ['elevator-passenger-outline', 'Priorizar elevador', userPreferences.preferElevator ? 'Sim' : 'Nao'],
    ['stairs', 'Evitar escadas', userPreferences.avoidStairs ? 'Sim' : 'Nao'],
    ['volume-high', 'Orientacao por voz', userPreferences.voiceGuidance ? 'Sim' : 'Nao'],
    ['format-size', 'Texto maior', userPreferences.largerText ? 'Sim' : 'Nao'],
    ['contrast-circle', 'Alto contraste', userPreferences.highContrast ? 'Sim' : 'Nao'],
    ['stretcher', 'Apoio com maca', userPreferences.needsStretcher ? 'Sim' : 'Nao'],
  ];

  useEffect(() => {
    let active = true;
    getProfilePhotoUri().then((uri) => {
      if (active) setPhotoUri(uri);
    });
    return () => {
      active = false;
    };
  }, []);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Autorize o acesso a galeria para escolher sua foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;
    await saveProfilePhotoUri(result.assets[0].uri);
    setPhotoUri(result.assets[0].uri);
  };

  const removePhoto = async () => {
    await removeProfilePhotoUri();
    setPhotoUri(null);
  };

  return (
    <Screen withBottomTabs>
      <Header title="Meu perfil" subtitle="Dados, foto e preferencias" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.userCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <ProfileAvatar name={displayName} uri={photoUri} onPress={pickPhoto} onRemove={removePhoto} />
        <View style={styles.userCopy}>
          <Text numberOfLines={1} style={[styles.name, { color: appColors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.role, { color: appColors.muted }]}>{roleLabel}</Text>
          <Text style={[styles.photoNote, { color: appColors.muted }]}>Foto salva apenas neste dispositivo.</Text>
        </View>
        <Pressable
          onPress={() => navigate('PatientRegister')}
          accessibilityRole="button"
          accessibilityLabel="Editar cadastro"
          style={styles.editButton}
        >
          <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.themeCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <MaterialCommunityIcons name={isDark ? 'weather-night' : 'white-balance-sunny'} size={21} color={colors.primary} />
        <View style={styles.userCopy}>
          <Text style={[styles.infoLabelStrong, { color: appColors.text }]}>Modo noturno</Text>
          <Text style={[styles.infoMuted, { color: appColors.muted }]}>Melhor para uso a noite</Text>
        </View>
        <Pressable
          onPress={toggleTheme}
          accessibilityRole="switch"
          accessibilityLabel="Modo noturno"
          accessibilityState={{ checked: isDark }}
          style={[styles.switchTrack, isDark && styles.switchTrackActive]}
        >
          <View style={[styles.switchKnob, isDark && styles.switchKnobActive]} />
        </Pressable>
      </View>

      <NavoraInfoCard
        navigate={navigate}
        currentLocation={currentLocation}
        userPreferences={userPreferences}
        activeRoute={activeRoute}
        appColors={appColors}
      />

      <Section title="Informacoes pessoais" items={personalData} appColors={appColors} />
      <Section title="Acessibilidade" items={mobilityData} appColors={appColors} />
      <Section title="Outros" items={[['history', 'Historico de rotas', 'Disponivel'], ['cog-outline', 'Configuracoes', 'Preferencias']]} appColors={appColors} />

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="logout" size={19} color={colors.danger} />
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>

      <BottomTabs active="Profile" navigate={navigate} />
    </Screen>
  );
}

function NavoraInfoCard({ navigate, currentLocation, userPreferences, activeRoute, appColors }) {
  const enabledPrefs = [
    userPreferences.accessibleRoute && 'Rota acessivel ativa',
    userPreferences.avoidStairs && 'Evitar escadas',
    userPreferences.preferElevator && 'Priorizar elevador',
    userPreferences.voiceGuidance && 'Orientacao por voz',
  ].filter(Boolean);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: appColors.text }]}>Informacoes usadas pelo Navora</Text>
      <View style={[styles.navoraCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        <InfoLine icon="map-marker" label="Localizacao atual" value={`${currentLocation.name} - ${currentLocation.corridor} - ${currentLocation.floor}`} appColors={appColors} />
        <InfoLine icon="bluetooth-connect" label="Beacon simulado" value={currentLocation.beacon} appColors={appColors} />
        <InfoLine icon="check-circle-outline" label="Status indoor" value={currentLocation.indoorStatus} appColors={appColors} success />
        <InfoLine icon="wheelchair-accessibility" label="Preferencias de rota" value={enabledPrefs.join(', ')} appColors={appColors} />
        <InfoLine
          icon="navigation-variant"
          label="Rota ativa"
          value={activeRoute?.destination ? `De: ${activeRoute.origin} / Para: ${activeRoute.destination} / ${activeRoute.distance || 'distancia indisponivel'} - ${activeRoute.time || activeRoute.eta || 'tempo indisponivel'}` : 'Nenhuma rota ativa'}
          appColors={appColors}
        />
        <Text style={[styles.privacyText, { color: appColors.muted }]}>
          Essas informacoes sao usadas para calcular rotas, acessibilidade e assistencia.
        </Text>
        <Pressable onPress={() => navigate('Accessibility')} style={styles.permissionButton}>
          <Text style={styles.permissionText}>Gerenciar acessibilidade</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoLine({ icon, label, value, appColors, success }) {
  return (
    <View style={styles.navoraLine}>
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon} size={17} color={success ? colors.success : colors.primary} />
      </View>
      <View style={styles.userCopy}>
        <Text style={[styles.infoMuted, { color: appColors.muted }]}>{label}</Text>
        <Text style={[styles.infoLabelStrong, { color: appColors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, items, appColors }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: appColors.text }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: appColors.surface, borderColor: appColors.border }, shadows.card]}>
        {items.map(([icon, label, value], index) => (
          <View key={label} style={[styles.infoRow, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: appColors.border }]}>
            <View style={styles.infoLeft}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name={icon} size={17} color={colors.primary} />
              </View>
              <Text numberOfLines={1} style={[styles.infoLabel, { color: appColors.text }]}>{label}</Text>
            </View>
            <View style={styles.valueWrap}>
              <Text numberOfLines={1} style={[styles.infoValue, { color: appColors.muted }]}>{value}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={appColors.muted} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 14,
  },
  themeCard: {
    minHeight: 62,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontWeight: '900' },
  role: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  photoNote: { fontSize: 11, fontWeight: '700', marginTop: 7, lineHeight: 15 },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 9 },
  sectionCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  navoraCard: { borderRadius: 22, borderWidth: 1, padding: 14, gap: 11 },
  navoraLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#FFF6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { flex: 1, fontSize: 13, fontWeight: '900' },
  infoValue: { fontSize: 12, fontWeight: '800' },
  infoMuted: { fontSize: 11, fontWeight: '800', marginBottom: 2 },
  infoLabelStrong: { fontSize: 13, fontWeight: '900' },
  privacyText: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  valueWrap: { maxWidth: 120, flexDirection: 'row', alignItems: 'center', gap: 4 },
  permissionButton: {
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  permissionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E7E0E2',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackActive: { backgroundColor: colors.primary },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  switchKnobActive: { alignSelf: 'flex-end' },
  logoutButton: {
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFF6F7',
    borderWidth: 1,
    borderColor: '#FFD2D7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
