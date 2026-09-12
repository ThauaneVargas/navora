import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function SettingsScreen({ navigate, goBack }) {
  const { appColors, isDark, toggleTheme } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  const [prefs, setPrefs] = useState({
    routeAlerts: true,
    sosVibration: true,
    voiceGuidance: false,
    offlineMode: true,
  });

  const toggle = (key) => setPrefs((current) => ({ ...current, [key]: !current[key] }));

  return (
    <Screen>
      <Header title="Configuracoes" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <SectionLabel label="Aparencia" styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon={isDark ? 'weather-night' : 'white-balance-sunny'}
          title="Modo noturno"
          subtitle="Inverte as cores da interface"
          styles={styles}
          appColors={appColors}
          trailing={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      <SectionLabel label="Notificacoes" styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon="routes"
          title="Alertas de rota"
          subtitle="Avisos de recalculo e desvios"
          styles={styles}
          appColors={appColors}
          last={false}
          trailing={
            <Switch
              value={prefs.routeAlerts}
              onValueChange={() => toggle('routeAlerts')}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingRow
          icon="alarm-light-outline"
          title="Vibracao no SOS"
          subtitle="Vibrar ao enviar ou receber SOS"
          styles={styles}
          appColors={appColors}
          last={false}
          trailing={
            <Switch
              value={prefs.sosVibration}
              onValueChange={() => toggle('sosVibration')}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingRow
          icon="volume-high"
          title="Orientacao por voz"
          subtitle="Falar instrucoes durante a navegacao"
          styles={styles}
          appColors={appColors}
          last
          trailing={
            <Switch
              value={prefs.voiceGuidance}
              onValueChange={() => toggle('voiceGuidance')}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      <SectionLabel label="Dados e conexao" styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon="wifi-off"
          title="Modo offline"
          subtitle="Usar dados locais quando sem internet"
          styles={styles}
          appColors={appColors}
          last={false}
          trailing={
            <Switch
              value={prefs.offlineMode}
              onValueChange={() => toggle('offlineMode')}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingRow
          icon="shield-lock-outline"
          title="Privacidade"
          subtitle="Dados, localizacao e consentimentos"
          styles={styles}
          appColors={appColors}
          last
          onPress={() => navigate('Privacy')}
        />
      </View>

      <SectionLabel label="Sobre o app" styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon="information-outline"
          title="Navora"
          subtitle="Navegacao hospitalar inteligente"
          styles={styles}
          appColors={appColors}
          last={false}
        />
        <SettingRow
          icon="tag-outline"
          title="Versao"
          subtitle="1.0.0"
          styles={styles}
          appColors={appColors}
          last
          noChevron
        />
      </View>
    </Screen>
  );
}

function SectionLabel({ label, styles }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SettingRow({ icon, title, subtitle, trailing, onPress, last, noChevron, styles, appColors }) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={appColors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {trailing || (!noChevron && onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={appColors.muted} />
      ) : null)}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const createStyles = (colors) => StyleSheet.create({
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.86,
  },
});
