import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Teclado com o edgeToEdge do Android: o sistema NÃO encolhe mais a janela
// quando o teclado abre (Android 15+), então ele cobria os campos; e os
// KeyboardAvoidingView que existiam às vezes somavam com o ajuste do sistema e
// "subiam demais". Aqui medimos o teclado e damos à tela só o espaço que ele
// ocupa, rolando até o campo em foco ficar logo acima dele. Sem biblioteca
// nativa (a react-native-keyboard-controller traz um reanimated/worklets que
// conflita com o Expo 57).

const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
// Folga entre o campo e o topo do teclado.
const FIELD_GAP = 24;

// Quanto o teclado cobre, medido da borda de baixo da tela (0 com ele fechado).
// Use SEMPRE este valor pra posicionar algo acima do teclado (ex.: caixa de
// mensagem do Assistente). No Android edge-to-edge o RN informa a altura do
// teclado SEM a barra de navegação, mas o teclado fica em cima dela — por isso
// somamos o inset de baixo (antes a caixa do Assistente ficava atrás do teclado).
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  const { bottom: bottomInset } = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const show = Keyboard.addListener(SHOW_EVENT, (event) => setHeight(event?.endCoordinates?.height || 0));
    const hide = Keyboard.addListener(HIDE_EVENT, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!height) return 0;
  return Platform.OS === 'android' ? height + bottomInset : height;
}

// Altura da área onde as telas desenham. No Android edge-to-edge a tela vai
// até a borda de baixo (embaixo da barra de navegação), então é a da tela
// inteira; a "window" do RN pode vir sem a barra e errar a conta.
function useViewportHeight() {
  const { height: windowHeight } = useWindowDimensions();
  return Platform.OS === 'android' ? Dimensions.get('screen').height : windowHeight;
}

// ScrollView que abre espaço pro teclado e rola até o campo em foco.
// `minBottomPadding` é o espaço que a tela já reserva embaixo (abas etc.).
const KeyboardAwareScrollView = forwardRef(function KeyboardAwareScrollView(
  { children, contentContainerStyle, minBottomPadding = 0, onScroll, ...props },
  ref
) {
  const scrollRef = useRef(null);
  const offsetRef = useRef(0);
  const lastFocusedRef = useRef(null);
  const keyboardHeight = useKeyboardHeight();
  const windowHeight = useViewportHeight();

  useImperativeHandle(ref, () => scrollRef.current);

  const revealFocusedInput = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput?.();
    if (!input || !keyboardHeight || typeof input.measureInWindow !== 'function') return;
    lastFocusedRef.current = input;
    input.measureInWindow((x, y, width, inputHeight) => {
      const visibleBottom = windowHeight - keyboardHeight - FIELD_GAP;
      const fieldBottom = y + inputHeight;
      if (fieldBottom > visibleBottom) {
        scrollRef.current?.scrollTo({ y: offsetRef.current + (fieldBottom - visibleBottom), animated: true });
      } else if (y < FIELD_GAP * 3) {
        // Campo escondido em cima (ex.: rolou demais): traz de volta pra vista.
        scrollRef.current?.scrollTo({ y: Math.max(0, offsetRef.current + y - FIELD_GAP * 3), animated: true });
      }
    });
  }, [keyboardHeight, windowHeight]);

  // Ao abrir o teclado, e quando a pessoa troca de campo com ele aberto
  // (nem todo teclado dispara o evento de novo).
  useEffect(() => {
    if (!keyboardHeight) {
      lastFocusedRef.current = null;
      return undefined;
    }
    const first = setTimeout(revealFocusedInput, 60);
    const watcher = setInterval(() => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (input && input !== lastFocusedRef.current) revealFocusedInput();
    }, 250);
    return () => {
      clearTimeout(first);
      clearInterval(watcher);
    };
  }, [keyboardHeight, revealFocusedInput]);

  const handleScroll = (event) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      {...props}
      onScroll={handleScroll}
      contentContainerStyle={[
        contentContainerStyle,
        keyboardHeight ? { paddingBottom: Math.max(minBottomPadding, keyboardHeight + FIELD_GAP) } : null,
      ]}
    >
      {children}
    </ScrollView>
  );
});

export default KeyboardAwareScrollView;
