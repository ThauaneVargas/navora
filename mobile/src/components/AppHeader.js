import React from 'react';

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useApp,
} from '../context/AppContext';

import { BellIcon, MenuIcon } from './NavIcons';

const logo =
  require('../../assets/images/navora_symbol.png');

export default function AppHeader({
  navigate,
  notificationCount = 0,
}) {
  const insets =
    useSafeAreaInsets();

  const { appColors, t } =
    useApp();

  const topPadding =
    Math.max(
      insets.top,
      8
    );

  const badgeLabel =
    notificationCount > 9
      ? '9+'
      : String(notificationCount);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topPadding,
          backgroundColor: appColors.surface,
          borderBottomColor: appColors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={() => navigate('Menu')}
          accessibilityRole="button"
          accessibilityLabel={t('header.openMenu')}
          hitSlop={4}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: appColors.iconBg },
            pressed && styles.pressed,
          ]}
        >
          <MenuIcon color={appColors.primary} />
        </Pressable>

        <View
          pointerEvents="none"
          style={styles.brand}
        >
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text
            style={[styles.brandName, { color: appColors.text }]}
            maxFontSizeMultiplier={1.3}
          >
            Navora
          </Text>
        </View>

        <Pressable
          onPress={() => navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={
            notificationCount > 0
              ? t('header.openNotificationsCount', { count: badgeLabel })
              : t('header.openNotifications')
          }
          hitSlop={4}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: appColors.iconBg },
            pressed && styles.pressed,
          ]}
        >
          <BellIcon color={appColors.primary} />

          {notificationCount > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: appColors.primaryStrong,
                  // Borda na cor do cabeçalho: "branca" no claro, escura no modo noturno.
                  borderColor: appColors.surface,
                },
              ]}
            >
              <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
                {badgeLabel}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    header: {
      width: '100%',
      borderBottomWidth: 1,
      paddingHorizontal: 16,
      paddingBottom: 8,
      zIndex: 100,
    },

    row: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    // 42x42 visível; o hitSlop={4} leva a área de toque a 50 px (mínimo 44).
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    brand: {
      position: 'absolute',
      left: 56,
      right: 56,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },

    logo: {
      width: 24,
      height: 24,
    },

    brandName: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '900',
      letterSpacing: -0.2,
    },

    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },

    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },

    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.97 }],
    },
  });
