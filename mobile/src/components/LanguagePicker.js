import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../i18n';

// Seletor de idioma (PT / EN / ES). `compact` = só as siglas (tela de login);
// sem ele mostra o nome do idioma (Configurações). Botões grandes (≥ 44 px).
export default function LanguagePicker({ compact = false, style }) {
  const { appColors, language, setLanguage, t } = useApp();

  return (
    <View style={[styles.row, style]} accessibilityRole="radiogroup" accessibilityLabel={t('language.title')}>
      {LANGUAGES.map((item) => {
        const selected = item.code === language;
        return (
          <Pressable
            key={item.code}
            onPress={() => setLanguage(item.code)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.chip,
              compact && styles.chipCompact,
              {
                backgroundColor: selected ? appColors.primary : appColors.surface,
                borderColor: selected ? appColors.primary : appColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.text, { color: selected ? '#FFFFFF' : appColors.text }]}>
              {compact ? item.short : item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: { minWidth: 48, paddingHorizontal: 12 },
  text: { fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.8 },
});
