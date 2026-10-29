import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import HeaderIconButton from '../components/HeaderIconButton';

import { useApp } from '../context/AppContext';
import { isBeaconDiagnosticsEnabled } from '../services/indoorLocationService';
import { toneColors } from '../theme/tones';

const menuItems = [
  // Só na versão de desenvolvimento ou no APK de teste (calibração dos beacons físicos).
  ...(isBeaconDiagnosticsEnabled() ? [{ titleKey: 'menu.beaconDiagnostics', subtitleKey: 'menu.beaconDiagnosticsSub', icon: 'access-point', screen: 'BeaconDiagnostics', tone: 'blue' }] : []),
  { titleKey: 'menu.profile', subtitleKey: 'menu.profileSub', icon: 'account-circle-outline', screen: 'Profile' },
  { titleKey: 'menu.howToGet', subtitleKey: 'menu.howToGetSub', icon: 'sign-direction', screen: 'ExternalRoute', tone: 'teal' },
  { titleKey: 'menu.accessibility', subtitleKey: 'menu.accessibilitySub', icon: 'wheelchair-accessibility', screen: 'Accessibility', tone: 'blue' },
  { titleKey: 'menu.emergencyRoutes', subtitleKey: 'menu.emergencyRoutesSub', icon: 'exit-run', screen: 'EmergencyRoutes', tone: 'green' },
  { titleKey: 'menu.routeHistory', subtitleKey: 'menu.routeHistorySub', icon: 'history', screen: 'RouteHistory', tone: 'violet' },
  { titleKey: 'menu.notifications', subtitleKey: 'menu.notificationsSub', icon: 'bell-outline', screen: 'Notifications', tone: 'amber' },
  { titleKey: 'menu.settings', subtitleKey: 'menu.settingsSub', icon: 'cog-outline', screen: 'Settings' },
  { titleKey: 'menu.privacy', subtitleKey: 'menu.privacySub', icon: 'shield-lock-outline', screen: 'Privacy', tone: 'teal' },
  { titleKey: 'menu.logout', subtitleKey: 'menu.logoutSub', icon: 'logout', screen: 'HomeStart', danger: true },
];

function menuShadow(themeColors, isDark) {
  return {
    shadowColor: isDark ? '#000000' : themeColors.primaryDark,
    shadowOpacity: isDark ? 0.2 : 0.08,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 14,
    elevation: isDark ? 3 : 4,
  };
}

function MenuItem({
  icon,
  title,
  subtitle,
  tone,
  onPress,
  danger = false,
  noArrow = false,
  trailing,
  appColors,
  isDark,
  style,
}) {
  const styles = useThemeStyles();
  const toned = toneColors(tone, appColors, isDark);
  const iconColor = danger ? appColors.danger : toned.fg;
  const backgroundColor = danger ? (isDark ? '#2A171B' : '#FFF7F8') : appColors.surface;
  const iconBg = danger ? (isDark ? '#3A1A20' : '#FFE8EC') : toned.bg;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        menuShadow(appColors, isDark),
        {
          backgroundColor,
          borderColor: danger ? (isDark ? '#4A252C' : '#F4D8DE') : appColors.border,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={23} color={iconColor} />
      </View>

      <View style={styles.menuCopy}>
        <Text
          numberOfLines={1}
          style={[styles.menuTitle, { color: danger ? appColors.danger : appColors.text }]}
        >
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.menuSubtitle, { color: appColors.muted }]}>
          {subtitle}
        </Text>
      </View>

      {trailing ||
        (!noArrow && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={danger ? appColors.danger : appColors.muted}
          />
        ))}
    </Pressable>
  );
}

export default function MenuScreen({ navigate, goBack, onLogout }) {
  const styles = useThemeStyles();
  const { isDark, toggleTheme, appColors, t } = useApp();

  const handlePress = (item) => {
    if (item.danger) {
      if (onLogout) onLogout();
      else navigate('Login');
      return;
    }

    navigate(item.screen);
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={[styles.container, { backgroundColor: appColors.background }]}>
        <View style={[styles.header, { backgroundColor: appColors.bar, borderBottomColor: appColors.barBorder }]}>
          <HeaderIconButton icon="back" onPress={() => goBack?.()} accessibilityLabel={t('header.back')} />

          <Text style={[styles.headerTitle, { color: appColors.text }]}>{t('menu.title')}</Text>

          <HeaderIconButton icon="bell" onPress={() => navigate('Notifications')} accessibilityLabel={t('header.openNotifications')} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 36 },
          ]}
        >
          <MenuItem
            icon={isDark ? 'weather-night' : 'white-balance-sunny'}
            title={t('settings.darkMode')}
            subtitle={t('menu.darkModeSub')}
            onPress={toggleTheme}
            noArrow
            appColors={appColors}
            isDark={isDark}
            trailing={
              <View
                style={[
                  styles.switchTrack,
                  { backgroundColor: isDark ? appColors.primary : '#DADAE1' },
                ]}
              >
                <View style={[styles.switchKnob, isDark && styles.switchKnobActive]} />
              </View>
            }
          />

          <MenuItem
            icon="navigation-variant"
            title="Navora"
            subtitle={t('menu.tagline')}
            onPress={() => navigate('Home')}
            appColors={appColors}
            isDark={isDark}
          />

          {menuItems.map((item, index) => (
            <MenuItem
              key={item.titleKey}
              icon={item.icon}
              title={t(item.titleKey)}
              subtitle={t(item.subtitleKey)}
              tone={item.tone}
              danger={item.danger}
              onPress={() => handlePress(item)}
              appColors={appColors}
              isDark={isDark}
              style={index === menuItems.length - 1 && styles.lastItem}
            />
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

// Estilos acompanham o tema (claro/escuro); antes usavam a paleta fixa do
// tema claro e não mudavam no modo noturno.
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Mesmas medidas do cabeçalho das outras telas (Header/AppHeader).
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 72,
    right: 72,
    top: 8,
    bottom: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 48,
    fontSize: 17,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  menuItem: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  lastItem: {
    marginBottom: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  menuSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  switchKnobActive: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
});
