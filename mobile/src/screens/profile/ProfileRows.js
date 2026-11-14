import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shadows } from '../../theme/colors';
import styles from './profileStyles';

// Componentes da tela de Perfil: seção com lista de itens e item do menu da foto.

export function ProfileSection({
  title,
  items,
  appColors,
}) {
  return (
    <View
      style={
        styles.section
      }
    >
      <Text
        style={[
          styles.sectionTitle,

          {
            color:
              appColors.text,
          },
        ]}
      >
        {title}
      </Text>


      <View
        style={[
          styles.sectionCard,

          {
            backgroundColor:
              appColors.surface,

            borderColor:
              appColors.border,
          },

          shadows.card,
        ]}
      >
        {items.map(
          (
            item,
            index
          ) => {
            const isLast =
              index ===
              items.length - 1;

            return (
              <Pressable
                key={
                  item.title
                }
                disabled={
                  !item.onPress
                }
                onPress={
                  item.onPress
                }
                style={({ pressed }) => [
                  styles.row,

                  !isLast && {
                    borderBottomWidth:
                      1,

                    borderBottomColor:
                      appColors.border,
                  },

                  pressed &&
                    item.onPress &&
                    styles.rowPressed,
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,

                    {
                      backgroundColor:
                        item.highlight
                          ? appColors.surfaceAlt
                          : appColors.iconBg,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      item.icon
                    }
                    size={20}
                    color={
                      item.highlight
                        ? appColors.danger
                        : appColors.primary
                    }
                  />
                </View>


                <View
                  style={
                    styles.rowCopy
                  }
                >
                  <Text
                    style={[
                      styles.itemTitle,

                      {
                        color:
                          appColors.text,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>


                  {!!item.subtitle && (
                    <Text
                      numberOfLines={
                        2
                      }
                      style={[
                        styles.itemSubtitle,

                        {
                          color:
                            appColors.muted,
                        },
                      ]}
                    >
                      {
                        item.subtitle
                      }
                    </Text>
                  )}
                </View>


                {item.onPress && (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color={
                      appColors.muted
                    }
                  />
                )}
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}


export function PhotoMenuItem({
  icon,
  title,
  subtitle,
  appColors,
  danger = false,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoMenuItem,

        {
          borderBottomColor:
            appColors.border,
        },

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.photoMenuIcon,

          {
            backgroundColor:
              danger
                ? appColors.surfaceAlt
                : appColors.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={
            danger
              ? appColors.danger
              : appColors.primary
          }
        />
      </View>


      <View
        style={
          styles.photoMenuCopy
        }
      >
        <Text
          style={[
            styles.photoMenuItemTitle,

            {
              color:
                danger
                  ? appColors.danger
                  : appColors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.photoMenuItemSubtitle,

            {
              color:
                appColors.muted,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={21}
        color={
          appColors.muted
        }
      />
    </Pressable>
  );
}
