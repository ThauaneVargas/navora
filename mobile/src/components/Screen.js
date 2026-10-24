import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';

import KeyboardAwareScrollView from './KeyboardAwareScrollView';

import { useRouteBarSpace } from './ActiveRouteBar';

import { useApp } from '../context/AppContext';

import {
  APP_MAX_WIDTH,
  horizontalPaddingFor,
  IS_WEB,
} from '../theme/layout';


// Mínimo seguro para Android quando o inset inferior não é reportado corretamente
// (e.g., Expo Go sem configuração de edge-to-edge validada no dispositivo)
const ANDROID_NAV_BAR_MIN = 21;

export default function Screen({
  children,
  scroll = true,
  dark = false,
  padded = true,
  withBottomTabs = false,
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Barra "Rota em andamento" acima das abas: a rolagem ganha esse espaço.
  const routeBarSpace = useRouteBarSpace();

  const {
    isDark,
    appColors,
  } = useApp();

  const effectiveDark =
    dark || isDark;

  const barStyle =
    effectiveDark
      ? 'light'
      : 'dark';

  const availableWidth =
    IS_WEB
      ? Math.min(
          width,
          APP_MAX_WIDTH
        )
      : width;

  const horizontalPadding =
    padded
      ? horizontalPaddingFor(
          availableWidth
        )
      : 0;

  // Para telas com BottomTabs, não incluir 'bottom' nas edges do SafeAreaView
  // — o BottomTabs gerencia o inset inferior via useSafeAreaInsets próprio.
  // Isso evita dupla contagem do inset (SafeAreaView + paddingBottom do BottomTabs).
  const safeAreaEdges = withBottomTabs
    ? ['top', 'left', 'right']
    : ['top', 'left', 'right', 'bottom'];

  // Padding inferior do conteúdo scrollável:
  // withBottomTabs: altura do BottomTabs (62) + inset inferior do dispositivo + folga
  // sem BottomTabs: inset inferior + folga mínima (coberto pelo SafeAreaView)
  const bottomInset = Math.max(
    insets.bottom,
    withBottomTabs && Platform.OS === 'android' ? ANDROID_NAV_BAR_MIN : 0
  );

  const bottomPadding = withBottomTabs
    ? 62 + bottomInset + 18 + routeBarSpace
    : 18;

  const contentStyle = [
    styles.content,

    {
      paddingHorizontal:
        horizontalPadding,

      paddingBottom:
        bottomPadding,
    },
  ];

  if (!scroll) {
    return (
      <SafeAreaView
        edges={safeAreaEdges}
        style={[
          styles.safe,

          {
            backgroundColor:
              appColors.bg,
          },
        ]}
      >
        <StatusBar
          style={barStyle}
        />

        <View
          style={[
            styles.inner,

            {
              maxWidth:
                IS_WEB
                  ? APP_MAX_WIDTH
                  : undefined,
            },
          ]}
        >
          <View
            style={[
              styles.fixedContent,

              padded && {
                paddingHorizontal:
                  horizontalPadding,
              },
            ]}
          >
            {children}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={[
        styles.safe,

        {
          backgroundColor:
            appColors.bg,
        },
      ]}
    >
      <StatusBar
        style={barStyle}
      />

      <View
        style={[
          styles.inner,

          {
            maxWidth:
              IS_WEB
                ? APP_MAX_WIDTH
                : undefined,
          },
        ]}
      >
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={
            contentStyle
          }
          minBottomPadding={
            bottomPadding
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          alwaysBounceVertical={
            false
          }
          overScrollMode="never"
        >
          {children}
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
    },

    inner: {
      flex: 1,
      width: '100%',
      alignSelf: 'center',
      position: 'relative',
    },

    scroll: {
      flex: 1,
      width: '100%',
    },

    content: {
      width: '100%',
      paddingTop: 0,
      flexGrow: 1,
    },

    fixedContent: {
      flex: 1,
      width: '100%',
    },
  });