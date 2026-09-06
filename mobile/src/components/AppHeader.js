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
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useApp,
} from '../context/AppContext';

const logo =
  require('../../assets/images/navora_symbol.png');

export default function AppHeader({
  navigate,
  notificationCount = 0,
}) {
  const insets =
    useSafeAreaInsets();

  const { appColors } =
    useApp();

  const topPadding =
    Math.max(
      insets.top,
      8
    );

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop:
            topPadding,

          backgroundColor:
            appColors.surface,

          borderBottomColor:
            appColors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={() =>
            navigate('Menu')
          }
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor:
                appColors.surface,

              borderColor:
                appColors.border,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="menu"
            size={23}
            color={appColors.text}
          />
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
            style={[
              styles.brandName,
              {
                color:
                  appColors.text,
              },
            ]}
          >
            Navora
          </Text>
        </View>

        <Pressable
          onPress={() =>
            navigate(
              'Notifications'
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Abrir notificações"
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor:
                appColors.surface,

              borderColor:
                appColors.border,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color={appColors.text}
          />

          {notificationCount > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    appColors.primary,
                },
              ]}
            >
              <Text
                style={
                  styles.badgeText
                }
              >
                {notificationCount > 9
                  ? '9+'
                  : notificationCount}
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
      height: 46,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,

      borderWidth: 1,

      alignItems: 'center',
      justifyContent: 'center',

      position: 'relative',
    },

    brand: {
      position: 'absolute',

      left: 52,
      right: 52,

      height: 46,

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

      top: -3,
      right: -3,

      minWidth: 17,
      height: 17,
      borderRadius: 9,

      paddingHorizontal: 4,

      alignItems: 'center',
      justifyContent: 'center',
    },

    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
    },

    pressed: {
      opacity: 0.72,

      transform: [
        {
          scale: 0.97,
        },
      ],
    },
  });