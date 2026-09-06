import React from 'react';

import {
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


const tabs = [
  {
    key: 'Home',

    screen: 'Home',

    label: 'Início',

    icon:
      'home-outline',

    activeIcon:
      'home',
  },

  {
    key: 'Navigate',

    screen: 'Search',

    label: 'Navegar',

    icon:
      'map-search-outline',

    activeIcon:
      'map-search',
  },

  {
    key: 'Assistant',

    screen: 'Assistant',

    label: 'IA',

    icon:
      'star-four-points-outline',

    activeIcon:
      'star-four-points',
  },

  {
    key: 'Help',

    screen: 'Help',

    label: 'Ajuda',

    icon:
      'hand-heart-outline',

    activeIcon:
      'hand-heart',
  },

  {
    key: 'Profile',

    screen: 'Profile',

    label: 'Perfil',

    icon:
      'account-outline',

    activeIcon:
      'account',
  },
];


export default function BottomTabs({
  active = 'Home',
  navigate,
}) {
  const insets =
    useSafeAreaInsets();

  const {
    appColors,
  } = useApp();


  const bottomPadding =
    Math.max(
      insets.bottom,
      8
    );


  return (
    <View
      style={[
        styles.wrap,

        {
          height:
            62 +
            bottomPadding,

          paddingBottom:
            bottomPadding,

          backgroundColor:
            appColors.surface,

          borderTopColor:
            appColors.border,
        },
      ]}
    >
      {tabs.map(
        (tab) => {
          const isActive =
            active ===
            tab.key;


          return (
            <Pressable
              key={
                tab.key
              }

              onPress={() =>
                navigate?.(
                  tab.screen
                )
              }

              accessibilityRole="button"

              accessibilityLabel={`Abrir ${tab.label}`}

              accessibilityState={{
                selected:
                  isActive,
              }}

              style={({ pressed }) => [
                styles.tab,

                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,

                  isActive && {
                    backgroundColor:
                      appColors.primarySoft,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    isActive
                      ? tab.activeIcon
                      : tab.icon
                  }

                  size={21}

                  color={
                    isActive
                      ? appColors.primary
                      : appColors.muted
                  }
                />
              </View>


              <Text
                numberOfLines={1}
                style={[
                  styles.label,

                  {
                    color:
                      isActive
                        ? appColors.primary
                        : appColors.muted,
                  },

                  isActive &&
                    styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>


              {isActive ? (
                <View
                  style={[
                    styles.activeLine,

                    {
                      backgroundColor:
                        appColors.primary,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        }
      )}
    </View>
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

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      paddingHorizontal: 6,
      paddingTop: 6,

      zIndex: 200,

      elevation: 10,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.05,

      shadowOffset: {
        width: 0,
        height: -2,
      },

      shadowRadius: 8,
    },

    tab: {
      flex: 1,
      minWidth: 0,

      height: 50,

      alignItems:
        'center',

      justifyContent:
        'center',

      position:
        'relative',
    },

    iconWrap: {
      width: 34,
      height: 28,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    label: {
      marginTop: 2,

      fontSize: 10,
      lineHeight: 13,

      fontWeight:
        '700',
    },

    activeLabel: {
      fontWeight:
        '900',
    },

    activeLine: {
      position:
        'absolute',

      bottom: -1,

      width: 18,
      height: 2.5,

      borderRadius: 3,
    },

    pressed: {
      opacity: 0.72,
    },
  });