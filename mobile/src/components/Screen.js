import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';

import { useApp } from '../context/AppContext';

import {
  APP_MAX_WIDTH,
  bottomTabHeight,
  horizontalPaddingFor,
  IS_WEB,
} from '../theme/layout';

export default function Screen({
  children,
  scroll = true,
  dark = false,
  padded = true,
  withBottomTabs = false,
}) {
  const { width } = useWindowDimensions();

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

  const bottomPadding =
    withBottomTabs
      ? bottomTabHeight + 18
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
        edges={[
          'top',
          'left',
          'right',
          'bottom',
        ]}
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
      edges={[
        'top',
        'left',
        'right',
        'bottom',
      ]}
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            contentStyle
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
        </ScrollView>
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
    },

    fixedContent: {
      flex: 1,
      width: '100%',
    },
  });