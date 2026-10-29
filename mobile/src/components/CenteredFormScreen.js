import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Screen from './Screen';
import Header from './Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

// Formulário curto (esqueci a senha / redefinir senha): cabeçalho padrão com
// "← Voltar" no mesmo lugar das outras telas e o conteúdo num cartão branco.
// Antes o voltar ficava solto no meio da tela, sem cabeçalho nem cartão.
// Usa o Screen (safe area + rolagem que respeita o teclado).
export default function CenteredFormScreen({ title, onBack, children }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  return (
    <Screen>
      <Header title={title} centerTitle onBack={onBack} />
      <View style={styles.container}>
        <View style={[styles.card, shadows.card]}>{children}</View>
      </View>
    </Screen>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 22,
      gap: 16,
    },
  });
