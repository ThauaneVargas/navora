import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const options = [
  { key: 'none', title: 'Nao preciso de apoio', desc: 'Usar rotas padrao.', icon: 'check-circle-outline' },
  { key: 'wheelchair', title: 'Solicitar cadeira de rodas', desc: 'Registra apoio separado quando necessario.', icon: 'wheelchair-accessibility' },
  { key: 'mobility', title: 'Mobilidade reduzida', desc: 'Prioriza caminhos mais confortaveis.', icon: 'walk' },
  { key: 'avoidStairs', title: 'Rota sem escadas', desc: 'Evita escadas quando houver alternativa.', icon: 'stairs' },
  { key: 'preferElevator', title: 'Utilizar somente elevador', desc: 'Prefere elevadores nas trocas de andar.', icon: 'elevator-passenger-outline' },
  { key: 'walkingHelp', title: 'Ajuda para caminhar', desc: 'Sinaliza necessidade de apoio humano.', icon: 'hand-heart-outline' },
  { key: 'voiceGuidance', title: 'Orientacao por voz', desc: 'Permite instrucoes faladas durante a navegacao.', icon: 'volume-high' },
  { key: 'largerText', title: 'Texto e botoes maiores', desc: 'Aumenta a area de leitura e toque.', icon: 'format-size' },
  { key: 'visualImpairment', title: 'Deficiencia visual', desc: 'Favorece orientacoes mais descritivas.', icon: 'eye-outline' },
  { key: 'hearingImpairment', title: 'Deficiencia auditiva', desc: 'Prioriza informacoes visuais claras.', icon: 'ear-hearing' },
  { key: 'other', title: 'Outra necessidade', desc: 'Informe a recepcao durante o atendimento.', icon: 'plus-circle-outline' },
];

export default function AccessibilityScreen({ navigate, goBack }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [activeOptions, setActiveOptions] = useState({
    none: true,
  });

  const toggle = (key) => {
    setActiveOptions((current) => {
      if (key === 'none') return { none: true };
      return { ...current, none: false, [key]: !current[key] };
    });
  };

  return (
    <Screen>
      <Header title="Acessibilidade" subtitle="Preferencias para uma rota segura" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="wheelchair-accessibility" size={34} color={appColors.primary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Preferencias de rota</Text>
          <Text style={styles.heroText}>
            Estas opcoes ajudam o Navora a sugerir caminhos mais seguros e confortaveis.
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {options.map((option) => {
          const active = activeOptions[option.key];

          return (
            <Pressable
              key={option.key}
              onPress={() => toggle(option.key)}
              accessibilityRole="switch"
              accessibilityState={{ checked: Boolean(active) }}
              accessibilityLabel={option.title}
              accessibilityHint={option.desc}
              style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed, shadows.card]}
            >
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={option.icon} size={24} color={appColors.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDesc}>{option.desc}</Text>
              </View>
              <View style={[styles.switchTrack, active && styles.switchTrackActive]}>
                <View style={[styles.switchKnob, active && styles.switchKnobActive]} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => navigate('Menu')}
        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, shadows.soft]}
      >
        <Text style={styles.saveText}>Salvar preferências</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  heroCard: {
    minHeight: 104,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  heroText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 4,
  },
  list: {
    gap: 10,
    marginTop: 18,
  },
  option: {
    minHeight: 78,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  optionDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 3,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchTrackActive: {
    backgroundColor: colors.primary,
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  switchKnobActive: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  saveButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
