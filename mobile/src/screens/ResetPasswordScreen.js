import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { navoraApi, isNetworkError } from '../services/api';

export default function ResetPasswordScreen({ navigate, goBack }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert('Atenção', 'Digite o código de recuperação recebido por e-mail.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await navoraApi.resetPassword(token.trim(), newPassword);
      setDone(true);
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert('Sem conexão', 'Verifique sua internet e tente novamente.');
        return;
      }
      Alert.alert('Código inválido', 'O código informado é inválido ou já expirou. Solicite um novo link de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <MaterialCommunityIcons name="check-circle-outline" size={44} color="#980027" />
          </View>
          <Text style={styles.title}>Senha atualizada!</Text>
          <Text style={styles.body}>Sua senha foi redefinida com sucesso. Faça login com a nova senha.</Text>
          <Pressable onPress={() => goBack?.()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
            <Text style={styles.btnText}>Ir para o login</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Pressable onPress={() => goBack?.()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#980027" />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>

        <View style={styles.iconRing}>
          <MaterialCommunityIcons name="lock-open-outline" size={38} color="#980027" />
        </View>

        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.body}>
          Digite o código de recuperação recebido por e-mail e escolha uma nova senha.
        </Text>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="key-outline" size={19} color="#980027" />
          <TextInput
            style={styles.input}
            placeholder="Código de recuperação"
            placeholderTextColor="#92959B"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="lock-outline" size={19} color="#980027" />
          <TextInput
            style={styles.input}
            placeholder="Nova senha"
            placeholderTextColor="#92959B"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPass}
            editable={!loading}
          />
          <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
            <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#92959B" />
          </Pressable>
        </View>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="lock-check-outline" size={19} color="#980027" />
          <TextInput
            style={styles.input}
            placeholder="Confirmar nova senha"
            placeholderTextColor="#92959B"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPass}
            editable={!loading}
          />
        </View>

        <Pressable
          onPress={handleReset}
          disabled={loading}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed, loading && styles.disabled]}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.btnText}>Redefinir senha</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 22 },
  card: { gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backText: { color: '#980027', fontSize: 14, fontWeight: '800' },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF6F8', borderWidth: 1, borderColor: '#FFD2D7',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  title: { color: '#202124', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { color: '#696B70', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  inputBox: {
    height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E4E4E6',
    paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9,
  },
  input: { flex: 1, color: '#36383D', fontSize: 14, paddingVertical: 0 },
  btn: {
    height: 50, borderRadius: 14, backgroundColor: '#980027',
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.68 },
});
