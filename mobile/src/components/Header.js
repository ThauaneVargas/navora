import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';


import {
  useApp,
} from '../context/AppContext';

import HeaderIconButton from './HeaderIconButton';

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

  // true quando a tela usa <Screen padded={false}>: aí não há margem lateral
  // pra "compensar", e o cabeçalho não pode esticar além da borda do celular
  // (o ☰ e o 🔔 ficavam colados/cortados na ponta da tela).
  fullBleed = false,

  // Tela de uma das 5 abas (Início, Navegar, IA, Ajuda, Perfil): sem "voltar",
  // a pessoa troca de tela pelo rodapé.
  tabRoot = false,
}) {
  const { width } =
    useWindowDimensions();

  const {
    appColors,
    t,
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
   * Telas internas: "voltar" sempre visível, no iPhone e no Android.
   * O iPhone não tem botão voltar do sistema, e pra idosos um botão
   * na tela é mais claro que gesto. Com ele, o ☰ vai pra direita.
   */
  const showBackButton =
    !tabRoot &&
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
            fullBleed
              ? 0
              : -horizontalPadding,
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
              appColors.bar,

            borderBottomColor:
              appColors.barBorder,
          },
        ]}
      >
        <View
          style={
            styles.row
          }
        >
          {/* ESQUERDA: voltar (telas internas) ou menu (abas) */}

          {showBackButton ? (
            <HeaderIconButton
              icon="back"
              onPress={onBack}
              accessibilityLabel={t('header.back')}
            />
          ) : (
            <HeaderIconButton
              icon="menu"
              onPress={onMenu}
              disabled={!onMenu}
              accessibilityLabel={t('header.openMenu')}
            />
          )}


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


          {/* DIREITA: menu (telas internas) ou notificações (abas) */}

          {showBackButton && onMenu ? (
            <HeaderIconButton
              icon="menu"
              onPress={onMenu}
              accessibilityLabel={t('header.openMenu')}
            />
          ) : showBackButton && !onNotifications && !onRightPress ? (
            // Tela interna sem menu (ex.: esqueci a senha, antes de entrar):
            // nada à direita em vez de um sino que não faz nada.
            <View style={styles.sideSpacer} />
          ) : (
            <HeaderIconButton
              icon="bell"
              badge={notificationCount}
              onPress={openNotifications}
              disabled={
                !onNotifications &&
                !onRightPress
              }
              accessibilityLabel={t('header.openNotifications')}
            />
          )}
        </View>
      </View>


      {/* TÍTULO SECUNDÁRIO PARA TELAS INTERNAS */}

      {!centerTitle &&
      (title ||
        subtitle) ? (
        <View
          style={[
            styles.pageHeader,

            {
              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >

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
      height: 48,

      flexDirection: 'row',
      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    sideSpacer: {
      width: 42,
      height: 42,
    },

    centerArea: {
      position: 'absolute',

      left: 56,
      right: 56,

      height: 48,

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

    pageHeader: {
      minHeight: 62,

      flexDirection: 'row',
      alignItems: 'center',

      paddingTop: 12,
      paddingBottom: 8,

      gap: 10,
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
  });