import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, useWindowDimensions } from 'react-native';

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

// Altura do teclado aberto (0 com ele fechado).
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const show = Keyboard.addListener(SHOW_EVENT, (event) => setHeight(event?.endCoordinates?.height || 0));
    const hide = Keyboard.addListener(HIDE_EVENT, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
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
  const { height: windowHeight } = useWindowDimensions();

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
