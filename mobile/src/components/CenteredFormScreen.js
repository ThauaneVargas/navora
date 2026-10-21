import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Screen from './Screen';

// Formulário curto centralizado na tela (esqueci a senha / redefinir senha).
// Usa o Screen (SafeAreaView da safe-area-context): antes essas duas telas não
// tinham proteção de borda nenhuma com o edgeToEdge do Android (gap do bug 2).
export default function CenteredFormScreen({ children }) {
  return (
    <Screen scroll={false} padded={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {children}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 22 },
});
