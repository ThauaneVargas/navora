import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { passwordRules } from '../utils/masks';

// Lista das regras da senha forte embaixo do campo: cada linha fica verde
// com ✓ quando cumprida. Mesmas regras do servidor (utils/masks.js).
export default function PasswordRules({ value }) {
  const { appColors, t } = useApp();

  return (
    <View style={styles.list} accessibilityLabel={t('password.rulesA11y')}>
      {passwordRules(value).map((rule) => (
        <View key={rule.key} style={styles.row}>
          <MaterialCommunityIcons
            name={rule.ok ? 'check-circle' : 'circle-outline'}
            size={16}
            color={rule.ok ? appColors.success : appColors.muted}
          />
          <Text style={[styles.text, { color: rule.ok ? appColors.success : appColors.muted }]}>
            {t(`password.rule_${rule.key}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 8,
    marginLeft: 4,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
