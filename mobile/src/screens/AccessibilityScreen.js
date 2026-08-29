import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

const options = [
  { key: 'mobility', title: 'Tenho dificuldade de locomocao', desc: 'O app procura caminhos mais confortaveis e seguros.', icon: 'walk' },
  { key: 'wheelchair', title: 'Uso cadeira de rodas', desc: 'Prioriza rotas acessiveis para cadeira de rodas.', icon: 'wheelchair-accessibility' },
  { key: 'avoidStairs', title: 'Evitar escadas', desc: 'Remove escadas das rotas sempre que houver alternativa.', icon: 'stairs' },
  { key: 'preferElevator', title: 'Priorizar elevador', desc: 'Prefere elevador mesmo se o caminho for um pouco maior.', icon: 'elevator-passenger-outline' },
  { key: 'needsStretcher', title: 'Preciso de maca ou equipe', desc: 'Sinaliza necessidade de apoio para deslocamento.', icon: 'stretcher' },
  { key: 'voiceGuidance', title: 'Orientacao por voz', desc: 'Permite instrucoes faladas durante a navegacao.', icon: 'volume-high' },
  { key: 'highContrast', title: 'Alto contraste', desc: 'Aumenta a separacao visual entre textos e botoes.', icon: 'contrast-circle' },
  { key: 'largerText', title: 'Texto maior', desc: 'Usa textos maiores nas telas principais.', icon: 'format-size' },
];

export default function AccessibilityScreen({ navigate, goBack }) {
  const [activeOptions, setActiveOptions] = useState({
    mobility: true,
    avoidStairs: true,
    preferElevator: true,
  });

  const toggle = (key) => {
    setActiveOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Screen>
      <Header title="Acessibilidade" subtitle="Preferencias para uma rota segura" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.heroIcon}>
    <MaterialCommunityIcons name="wheelchair-accessibility" size={34} color={colors.primary} />
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
                <MaterialCommunityIcons name={option.icon} size={24} color={colors.primary} />
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

const styles = StyleSheet.create({
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
    borderColor: '#FFD2D7',
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
    backgroundColor: '#E5E5EA',
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
    backgroundColor: '#FFFFFF',
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
