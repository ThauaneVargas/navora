import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { APP_MAX_WIDTH, bottomTabHeight, horizontalPadding, IS_WEB } from '../theme/layout';
import { useApp } from '../context/AppContext';

export default function Screen({
  children,
  scroll = true,
  dark = false,
  padded = true,
  withBottomTabs = false,
}) {
  const insets = useSafeAreaInsets();
  const { isDark, appColors } = useApp();
  const effectiveDark = dark || isDark;
  const barStyle = effectiveDark ? 'light' : 'dark';
  const contentStyle = [
    styles.content,
    { paddingBottom: Math.max(insets.bottom, 14) + 14 },
    !padded && styles.noPadding,
    withBottomTabs && { paddingBottom: bottomTabHeight + Math.max(insets.bottom, 14) + 24 },
  ];

  if (!scroll) {
    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.safe, { backgroundColor: appColors.bg }, effectiveDark && styles.dark]}>
        <StatusBar style={barStyle} />
        <View style={[styles.inner, !padded && styles.noPadding]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safe, { backgroundColor: appColors.bg }, effectiveDark && styles.dark]}>
      <StatusBar style={barStyle} />
      <View style={[styles.inner, !padded && styles.noPadding]}>
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  dark: {
    backgroundColor: colors.dark,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: IS_WEB ? APP_MAX_WIDTH : undefined,
    alignSelf: IS_WEB ? 'center' : 'stretch',
    position: 'relative',
  },
  content: {
    width: '100%',
    paddingHorizontal: horizontalPadding,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: 28,
  },
  withBottomTabs: {
    paddingBottom: bottomTabHeight + 34,
  },
  noPadding: {
    paddingHorizontal: 0,
  },
});
