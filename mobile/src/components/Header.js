import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme/colors';
import { useApp } from '../context/AppContext';

const logo = require('../../assets/images/navora_symbol.png');

export default function Header({
  title,
  subtitle,
  onBack,
  rightText,
  rightIcon,
  onRightPress,
  dark = false,
  centerTitle = false,
  onMenu,
}) {
  const insets = useSafeAreaInsets();
  const internal = centerTitle;
  const { appColors } = useApp();

  return (
    <View
      style={[
        styles.container,
        internal && styles.internal,
        { paddingTop: Math.max(insets.top, 12), backgroundColor: internal ? appColors.surface : 'transparent', borderBottomColor: internal ? appColors.border : 'transparent' },
      ]}
    >
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            accessibilityHint="Retorna para a tela anterior"
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: appColors.surface, borderColor: appColors.border }, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={appColors.primary} />
          </Pressable>
        ) : (
          <View style={styles.brand}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            {!centerTitle ? <Text style={[styles.brandName, dark && styles.white]}>navora</Text> : null}
          </View>
        )}

        {centerTitle ? (
          <View style={styles.centerCopy}>
            <Text numberOfLines={1} style={[styles.centerTitle, { color: appColors.text }, dark && styles.white]}>{title}</Text>
            {subtitle ? <Text numberOfLines={1} style={[styles.centerSubtitle, { color: appColors.muted }]}>{subtitle}</Text> : null}
          </View>
        ) : (
          <View />
        )}

        {rightText ? (
          <View style={[styles.pill, dark && styles.darkPill]}>
            <Text style={[styles.pillText, dark && styles.white]}>{rightText}</Text>
          </View>
        ) : (
          <Pressable
            onPress={onRightPress || onMenu}
            disabled={!onRightPress && !onMenu}
            accessibilityRole="button"
            accessibilityLabel={onRightPress ? 'Acao da tela' : onMenu ? 'Abrir menu' : 'Mais opcoes'}
            hitSlop={8}
            style={({ pressed }) => [
              styles.bellButton,
              { backgroundColor: appColors.surface, borderColor: appColors.border },
              pressed && (onRightPress || onMenu) && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name={rightIcon || (onMenu ? 'menu' : 'dots-horizontal')} size={22} color={appColors.text} />
          </Pressable>
        )}
      </View>

      {!centerTitle ? (
        <>
          <Text style={[styles.title, dark && styles.white]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, dark && styles.darkSubtitle]}>{subtitle}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  internal: {
    backgroundColor: colors.surface,
    marginHorizontal: -20,
    marginTop: -6,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },

  topRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  brand: {
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  logo: {
    width: 31,
    height: 31,
  },

  brandName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  internalButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  centerTitle: {
    color: colors.text,
    ...typography.subtitle,
    fontWeight: '800',
  },
  centerCopy: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  centerSubtitle: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },

  title: {
    color: colors.text,
    ...typography.headline,
    marginTop: 12,
  },

  subtitle: {
    color: colors.muted,
    ...typography.subtitle,
    marginTop: 10,
    fontWeight: '500',
  },

  pill: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pillText: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: '800',
  },

  darkPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },

  white: {
    color: '#FFFFFF',
  },

  darkSubtitle: {
    color: '#C7C8D2',
  },
});
