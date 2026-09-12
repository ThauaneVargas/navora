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

export default function ForgotPasswordScreen({ navigate, goBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      await navoraApi.forgotPassword(trimmed);
      setSent(true);
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert('Sem conexão', 'Verifique sua internet e tente novamente.');
        return;
      }
      setSent(true); // silently succeed to avoid email enumeration
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <MaterialCommunityIcons name="email-check-outline" size={38} color="#980027" />
          </View>
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.body}>
            Se o endereço <Text style={styles.bold}>{email.trim()}</Text> estiver cadastrado,
            você receberá as instruções de recuperação em breve.
          </Text>
          <Text style={styles.hint}>Não recebeu? Verifique a pasta de spam ou entre em contato com a recepção.</Text>
          <Pressable onPress={() => goBack?.()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
            <Text style={styles.btnText}>Voltar ao login</Text>
          </Pressable>
          <Pressable
            onPress={() => navigate('ResetPassword')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>Já tenho o código de recuperação</Text>
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
          <MaterialCommunityIcons name="lock-reset" size={38} color="#980027" />
        </View>

        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.body}>
          Digite o e-mail cadastrado na sua conta. Enviaremos um código para você criar uma nova senha.
        </Text>

        <View style={styles.inputBox}>
          <MaterialCommunityIcons name="email-outline" size={19} color="#980027" />
          <TextInput
            style={styles.input}
            placeholder="Seu e-mail"
            placeholderTextColor="#92959B"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={loading}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed, loading && styles.disabled]}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.btnText}>Enviar instruções</Text>
          }
        </Pressable>

        <Pressable
          onPress={() => navigate('ResetPassword')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>Já tenho o código de recuperação</Text>
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
  bold: { color: '#202124', fontWeight: '800' },
  hint: { color: '#92959B', fontSize: 12, lineHeight: 18, textAlign: 'center' },
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
  secondaryBtn: { alignItems: 'center', paddingVertical: 6 },
  secondaryText: { color: '#980027', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.68 },
});
