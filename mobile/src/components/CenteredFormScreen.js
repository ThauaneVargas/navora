import React from 'react';
import { StyleSheet, View } from 'react-native';
import Screen from './Screen';

// Formulário curto centralizado na tela (esqueci a senha / redefinir senha).
// Usa o Screen (safe area + rolagem que respeita o teclado). Antes tinha um
// KeyboardAvoidingView próprio, que às vezes subia demais, e fundo branco fixo
// (não acompanhava o modo noturno).
export default function CenteredFormScreen({ children }) {
  return (
    <Screen padded={false}>
      <View style={styles.container}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 22 },
});
