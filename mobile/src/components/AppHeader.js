import React from 'react';

import {
  Image,
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

import HeaderIconButton from './HeaderIconButton';

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
          backgroundColor: appColors.bar,
          borderBottomColor: appColors.barBorder,
        },
      ]}
    >
      <View style={styles.row}>
        <HeaderIconButton
          icon="menu"
          onPress={() => navigate('Menu')}
          accessibilityLabel={t('header.openMenu')}
        />

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

        <HeaderIconButton
          icon="bell"
          badge={notificationCount}
          onPress={() => navigate('Notifications')}
          accessibilityLabel={
            notificationCount > 0
              ? t('header.openNotificationsCount', { count: badgeLabel })
              : t('header.openNotifications')
          }
        />
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
  });
