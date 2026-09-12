import React from 'react';

import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';


import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useApp,
} from '../context/AppContext';

import {
  APP_MAX_WIDTH,
  horizontalPaddingFor,
  IS_WEB,
} from '../theme/layout';

const logo =
  require('../../assets/images/navora_symbol.png');

export default function Header({
  title,
  subtitle,
  centerTitle = false,

  onBack,
  onMenu,

  onNotifications,
  onRightPress,

  notificationCount = 0,
}) {
  const { width } =
    useWindowDimensions();

  const {
    appColors,
  } = useApp();

  const availableWidth =
    IS_WEB
      ? Math.min(
          width,
          APP_MAX_WIDTH
        )
      : width;

  const horizontalPadding =
    horizontalPaddingFor(
      availableWidth
    );

  /*
   * Não mostra seta nas páginas
   * principais que usam centerTitle.
   *
   * Em Android o usuário pode usar
   * o botão voltar do próprio celular.
   */
  const showBackButton =
    !centerTitle &&
    Platform.OS === 'ios' &&
    Boolean(onBack);

  const openNotifications =
    () => {
      if (onNotifications) {
        onNotifications();
        return;
      }

      if (onRightPress) {
        onRightPress();
      }
    };

  return (
    <View
      style={[
        styles.wrapper,
        {
          marginHorizontal:
            -horizontalPadding,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: 8,

            paddingHorizontal:
              horizontalPadding,

            backgroundColor:
              appColors.surface,

            borderBottomColor:
              appColors.border,
          },
        ]}
      >
        <View
          style={
            styles.row
          }
        >
          {/* MENU */}

          <Pressable
            onPress={onMenu}
            disabled={!onMenu}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            style={({ pressed }) => [
              styles.iconButton,

              {
                backgroundColor:
                  appColors.surface,

                borderColor:
                  appColors.border,
              },

              pressed &&
                onMenu &&
                styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="menu"
              size={23}
              color={
                appColors.text
              }
            />
          </Pressable>


          {/* CENTRO */}

          <View
            pointerEvents="none"
            style={
              styles.centerArea
            }
          >
            {centerTitle ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.centerTitle,
                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                {title}
              </Text>
            ) : (
              <View
                style={
                  styles.brand
                }
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
            )}
          </View>


          {/* NOTIFICAÇÕES */}

          <Pressable
            onPress={
              openNotifications
            }
            disabled={
              !onNotifications &&
              !onRightPress
            }
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Abrir notificações"
            style={({ pressed }) => [
              styles.iconButton,

              {
                backgroundColor:
                  appColors.surface,

                borderColor:
                  appColors.border,
              },

              pressed &&
                (onNotifications ||
                  onRightPress) &&
                styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color={
                appColors.text
              }
            />

            {notificationCount >
            0 ? (
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
                  {notificationCount >
                  9
                    ? '9+'
                    : notificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>


      {/* TÍTULO SECUNDÁRIO PARA TELAS INTERNAS */}

      {!centerTitle &&
      (title ||
        subtitle ||
        showBackButton) ? (
        <View
          style={[
            styles.pageHeader,

            {
              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >
          {showBackButton ? (
            <Pressable
              onPress={onBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => [
                styles.backButton,

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
                name="chevron-left"
                size={23}
                color={
                  appColors.text
                }
              />
            </Pressable>
          ) : null}


          <View
            style={
              styles.titleCopy
            }
          >
            {title ? (
              <Text
                numberOfLines={2}
                style={[
                  styles.pageTitle,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                {title}
              </Text>
            ) : null}

            {subtitle ? (
              <Text
                numberOfLines={2}
                style={[
                  styles.subtitle,

                  {
                    color:
                      appColors.muted,
                  },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    wrapper: {
      width: 'auto',
    },

    header: {
      width: '100%',
      borderBottomWidth: 1,
      paddingBottom: 8,
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

    centerArea: {
      position: 'absolute',

      left: 54,
      right: 54,

      height: 46,

      alignItems: 'center',
      justifyContent: 'center',
    },

    brand: {
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

    centerTitle: {
      maxWidth: '100%',

      fontSize: 17,
      lineHeight: 22,

      fontWeight: '900',

      letterSpacing: -0.25,

      textAlign: 'center',
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

    pageHeader: {
      minHeight: 62,

      flexDirection: 'row',
      alignItems: 'center',

      paddingTop: 12,
      paddingBottom: 8,

      gap: 10,
    },

    backButton: {
      width: 36,
      height: 36,

      borderRadius: 18,
      borderWidth: 1,

      alignItems: 'center',
      justifyContent: 'center',
    },

    titleCopy: {
      flex: 1,
      minWidth: 0,
    },

    pageTitle: {
      fontSize: 20,
      lineHeight: 25,

      fontWeight: '900',

      letterSpacing: -0.3,
    },

    subtitle: {
      marginTop: 2,

      fontSize: 12,
      lineHeight: 17,

      fontWeight: '600',
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