import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const logo = require('../../assets/images/navora_symbol.png');

export default function Header({
  title,
  subtitle,
  onBack,
  rightText,
  dark = false,
  centerTitle = false,
  onMenu,
}) {
  const insets = useSafeAreaInsets();
  const internal = centerTitle;
  const { appColors } = useApp();

  return (
    <View style={[styles.container, internal && styles.internal, { paddingTop: Math.max(insets.top, 12), backgroundColor: internal ? appColors.primaryDark : 'transparent' }]}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.iconButton, internal && styles.internalButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={internal ? '#FFFFFF' : colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.brand}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            {!centerTitle ? <Text style={[styles.brandName, dark && styles.white]}>navora</Text> : null}
          </View>
        )}

        {centerTitle ? (
          <Text style={[styles.centerTitle, internal && styles.white, dark && styles.white]}>{title}</Text>
        ) : (
          <View />
        )}

        {rightText ? (
          <View style={[styles.pill, dark && styles.darkPill]}>
            <Text style={[styles.pillText, dark && styles.white]}>{rightText}</Text>
          </View>
        ) : (
          <Pressable onPress={onMenu} disabled={!onMenu} style={[styles.bellButton, internal && styles.internalButton]}>
            <MaterialCommunityIcons name={onMenu ? 'menu' : internal ? 'dots-horizontal' : 'bell-outline'} size={22} color={internal || dark ? '#FFFFFF' : colors.text} />
            {!internal ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            ) : null}
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
    paddingBottom: 14,
  },
  internal: {
    backgroundColor: colors.primaryDark,
    marginHorizontal: -20,
    marginTop: -8,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  topRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  brand: {
    minWidth: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  logo: {
    width: 34,
    height: 34,
  },

  brandName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -1,
  },

  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.card,
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 39,
    marginTop: 12,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    fontWeight: '600',
  },

  pill: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pillText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
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
