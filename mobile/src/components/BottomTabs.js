import React from 'react';

import {
  Platform,
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

import { TabIcon } from './NavIcons';

import ActiveRouteBar from './ActiveRouteBar';


const TAB_BAR_HEIGHT = 62;

const tabs = [
  { key: 'Home', screen: 'Home', labelKey: 'tabs.home', icon: 'home' },
  { key: 'Navigate', screen: 'Search', labelKey: 'tabs.navigate', icon: 'navigate' },
  { key: 'Assistant', screen: 'Assistant', labelKey: 'tabs.assistant', icon: 'assistant' },
  { key: 'Help', screen: 'Help', labelKey: 'tabs.help', icon: 'help' },
  { key: 'Profile', screen: 'Profile', labelKey: 'tabs.profile', icon: 'profile' },
];


// hideRouteBar: telas que JÁ são a rota (mapa, 3D, modo espera) não mostram
// a barra "Rota em andamento" — o "Continuar" levaria pra própria tela.
export default function BottomTabs({
  active = 'Home',
  navigate,
  hideRouteBar = false,
}) {
  const insets =
    useSafeAreaInsets();

  const {
    appColors,
    t,
  } = useApp();


  // Mínimo de 21px no Android para cobrir a barra de gestos (gesture nav pill),
  // mesmo quando insets.bottom não é reportado corretamente em builds de dev.
  const bottomPadding =
    Math.max(
      insets.bottom,
      Platform.OS === 'android' ? 21 : 8
    );


  return (
    <>
      {hideRouteBar ? null : (
        <ActiveRouteBar
          navigate={navigate}
          bottom={TAB_BAR_HEIGHT + bottomPadding + 8}
        />
      )}

      <View
        style={[
          styles.wrap,
          {
            height: TAB_BAR_HEIGHT + bottomPadding,
            paddingBottom: bottomPadding,
            backgroundColor: appColors.bar,
            borderTopColor: appColors.barBorder,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const color = isActive ? appColors.primary : appColors.barInactive;
          const label = t(tab.labelKey);

          return (
            <Pressable
              key={tab.key}
              onPress={() => navigate?.(tab.screen)}
              accessibilityRole="tab"
              accessibilityLabel={t('tabs.open', { label })}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.pressed,
              ]}
            >
              {/* Altura fixa de 32: todos os rótulos ficam na mesma linha. */}
              <View
                style={[
                  styles.iconWrap,
                  // Aba ativa: pílula branca sobre o rosado do rodapé.
                  isActive && { backgroundColor: appColors.surface },
                ]}
              >
                <TabIcon
                  name={tab.icon}
                  active={isActive}
                  color={color}
                  detailColor={appColors.surface}
                />
              </View>

              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
                style={[
                  styles.label,
                  { color },
                  isActive && styles.activeLabel,
                ]}
              >
                {label}
              </Text>

              {isActive ? (
                <View style={[styles.activeLine, { backgroundColor: appColors.primary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}


const styles =
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,

      borderTopWidth: 1,

      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',

      paddingHorizontal: 4,
      paddingTop: 5,

      zIndex: 200,
      elevation: 10,

      shadowColor: '#000000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 8,
    },

    tab: {
      flex: 1,
      minWidth: 0,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
    },

    iconWrap: {
      width: 54,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    label: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
    },

    activeLabel: {
      fontWeight: '900',
    },

    activeLine: {
      position: 'absolute',
      bottom: -1,
      width: 18,
      height: 2.5,
      borderRadius: 3,
    },

    pressed: {
      opacity: 0.72,
    },
  });
