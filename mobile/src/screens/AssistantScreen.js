import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Screen from '../components/Screen';
import { useKeyboardHeight } from '../components/KeyboardAwareScrollView';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { shadows } from '../theme/colors';
import { assistantProvider, assistantSuggestions, getNavoraAssistantResponse } from '../services/navoraAssistant';
import { destinations as fallbackDestinations } from '../data/routes';
import { useApp } from '../context/AppContext';

// O app ainda não tem reconhecimento de voz (expo-speech só FALA, não escuta).
// Antes, o microfone gravava o áudio e respondia sempre "Me leve até Tomografia",
// fosse o que fosse dito. Ler as respostas em voz alta ("Ouvir") continua funcionando.
const VOICE_UNAVAILABLE_TEXT =
  'O reconhecimento de voz ainda não está disponível. Digite sua mensagem ou toque em um dos atalhos. Você pode ouvir minhas respostas tocando em "Ouvir".';

const initialMessages = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'Olá, sou o Assistente Navora. Posso ajudar com destinos, acessibilidade, ajuda e SOS.',
  },
];

export default function AssistantScreen({
  navigate,
  goBack,
  userProfile,
  visitorAccessRequest,
  navigationData,
  navigationSource,
  hospitalDetection,
}) {
  const insets = useSafeAreaInsets();
  const { appColors, toggleTheme } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Pronta para ajudar');
  const scrollRef = useRef(null);
  // Mesma fonte da tela de busca: destinos da API quando ela respondeu, senão os locais.
  const availableDestinations =
    navigationSource === 'api' && navigationData?.destinations?.length
      ? navigationData.destinations
      : fallbackDestinations;
  // Com o teclado aberto, a caixa de mensagem fica logo acima dele (as abas
  // ficam escondidas atrás do teclado); fechado, fica acima das abas.
  const keyboardHeight = useKeyboardHeight();
  const composerBottom = keyboardHeight ? keyboardHeight + 8 : Math.max(insets.bottom, 12) + 78;
  const composerSpace = composerBottom + 88;

  useEffect(() => {
    if (keyboardHeight) setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 60);
  }, [keyboardHeight]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 80);
  }, [messages]);

  const appendMessage = (message) => {
    setMessages((current) => [
      ...current,
      {
        id: `${message.role}-${Date.now()}-${Math.random()}`,
        ...message,
      },
    ]);
  };

  const processMessage = (rawText) => {
    const text = rawText.trim();
    if (!text) return;

    appendMessage({ role: 'user', text });
    setStatus('Processando...');

    const assistantResponse = getNavoraAssistantResponse(text, {
      userProfile,
      visitorAccessRequest,
      destinations: availableDestinations,
      hospitalDetection,
    });
    setTimeout(() => {
      appendMessage({ role: 'assistant', ...assistantResponse });
      setStatus('Pronta para ajudar');
    }, 250);
  };

  const sendMessage = () => {
    const text = input;
    setInput('');
    processMessage(text);
  };

  const speakText = (text) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'pt-BR',
      rate: 0.95,
      pitch: 1,
    });
  };

  const stopSpeech = () => {
    Speech.stop();
  };

  const handleMicrophonePress = () => {
    appendMessage({ role: 'assistant', text: VOICE_UNAVAILABLE_TEXT });
  };

  const runAction = (message) => {
    if (message.actionScreen === 'ToggleTheme') {
      toggleTheme();
      appendMessage({
        role: 'assistant',
        text: 'Pronto. Ajustei o modo de exibição do app.',
      });
      return;
    }

    if (message.actionScreen) {
      navigate(message.actionScreen, message.actionParams || {});
    }
  };

  const clearConversation = () => {
    Speech.stop();
    setMessages(initialMessages);
    setStatus('Pronta para ajudar');
  };

  return (
    <Screen scroll={false} padded={false} withBottomTabs>
      <View style={styles.screen}>
        <Header fullBleed title="Assistente Navora" subtitle="Orientação guiada" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

        <View style={styles.keyboardArea}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: composerSpace }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.aiCard, shadows.card]}>
              <Pressable
                onPress={handleMicrophonePress}
                style={({ pressed }) => [styles.aiIcon, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="microphone" size={25} color="#FFFFFF" />
              </Pressable>
              <View style={styles.aiCopy}>
                <Text style={styles.aiTitle}>Assistente Navora</Text>
                <Text style={styles.aiText}>Busca destinos e orienta próximos passos. Não usa IA generativa neste app.</Text>
                <Text style={styles.providerText}>{assistantProvider.label}</Text>
                <Text style={styles.statusText}>{status}</Text>
              </View>
              <Pressable onPress={stopSpeech} style={styles.stopVoiceButton}>
                <MaterialCommunityIcons name="volume-off" size={18} color={appColors.primary} />
              </Pressable>
            </View>

            <View style={styles.suggestions}>
              {assistantSuggestions.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => processMessage(item.label)}
                  style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name={item.icon} size={13} color={appColors.primary} />
                  <Text numberOfLines={1} style={styles.suggestionText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.history}>
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text style={[styles.messageText, isUser && styles.userText]}>
                      {message.text}
                    </Text>

                    {!isUser ? (
                      <View style={styles.messageActions}>
                        <Pressable
                          onPress={() => speakText(message.text)}
                          style={({ pressed }) => [styles.listenButton, pressed && styles.pressed]}
                        >
                          <MaterialCommunityIcons name="volume-high" size={15} color={appColors.primary} />
                          <Text style={styles.listenText}>Ouvir</Text>
                        </Pressable>

                        {message.actionLabel ? (
                          <Pressable
                            onPress={() => runAction(message)}
                            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                          >
                            <Text style={styles.actionText}>{message.actionLabel}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.composer, { bottom: composerBottom }, shadows.card]}>
            <Pressable onPress={clearConversation} style={styles.smallIconButton}>
              <MaterialCommunityIcons name="trash-can-outline" size={19} color={appColors.muted} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={appColors.lightText}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <Pressable onPress={sendMessage} style={styles.sendButton}>
              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={handleMicrophonePress} style={styles.micButton}>
              <MaterialCommunityIcons name="microphone" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        <BottomTabs active="Assistant" navigate={navigate} />
      </View>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    alignSelf: 'center',
    backgroundColor: colors.bg,
  },
  keyboardArea: {
    flex: 1,
    position: 'relative',
  },
  content: {
    paddingHorizontal: 20,
  },
  aiCard: {
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  aiCopy: {
    flex: 1,
    minWidth: 0,
  },
  aiTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  aiText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  statusText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 7,
  },
  providerText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  stopVoiceButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  suggestion: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  suggestionText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  history: {
    gap: 10,
    marginTop: 14,
  },
  messageBubble: {
    maxWidth: '92%',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  messageText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  messageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  listenButton: {
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  listenText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  actionButton: {
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  composer: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  smallIconButton: {
    width: 38,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
