import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const menuItems = [
  { title: 'Meu perfil', subtitle: 'Dados pessoais e acessos', icon: 'account-outline', screen: 'Profile' },
  { title: 'Como chegar ao hospital', subtitle: 'Rota ate a entrada principal', icon: 'map-marker-distance', screen: 'ExternalRoute' },
  { title: 'Acessibilidade', subtitle: 'Rotas adaptadas', icon: 'wheelchair-accessibility', screen: 'Accessibility' },
  { title: 'Rotas de emergencia', subtitle: 'Saidas seguras', icon: 'exit-run', screen: 'EmergencyRoutes' },
  { title: 'Historico de rotas', subtitle: 'Ultimos destinos', icon: 'history', screen: 'RouteHistory' },
  { title: 'Notificacoes', subtitle: 'Avisos do Navora', icon: 'bell-outline', screen: 'Notifications' },
  { title: 'Configuracoes', subtitle: 'Preferencias do app', icon: 'cog-outline', screen: 'Settings' },
  { title: 'Privacidade', subtitle: 'Dados e permissoes', icon: 'shield-lock-outline', screen: 'Privacy' },
  { title: 'Sair', subtitle: 'Encerrar sessao', icon: 'logout', screen: 'HomeStart', danger: true },
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
  onPress,
  danger = false,
  noArrow = false,
  trailing,
  appColors,
  isDark,
  style,
}) {
  const iconColor = danger ? appColors.danger : appColors.primary;
  const backgroundColor = danger ? (isDark ? '#2A171B' : '#FFF7F8') : appColors.surface;
  const iconBg = danger ? (isDark ? '#3A1A20' : '#FFE8EC') : appColors.iconBg;

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
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, appColors } = useApp();

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
      <View style={[styles.container, { backgroundColor: appColors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: appColors.border }]}>
          <Pressable
            onPress={() => goBack?.()}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: appColors.surface, borderColor: appColors.border },
              menuShadow(appColors, isDark),
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="chevron-left" size={27} color={isDark ? appColors.text : appColors.primaryDark} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: appColors.text }]}>Menu</Text>

          <Pressable
            onPress={() => navigate('Notifications')}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: appColors.surface, borderColor: appColors.border },
              menuShadow(appColors, isDark),
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={isDark ? appColors.text : appColors.primaryDark} />
            <View style={[styles.badge, { backgroundColor: appColors.primary }]}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 36 },
          ]}
        >
          <MenuItem
            icon={isDark ? 'weather-night' : 'white-balance-sunny'}
            title="Modo noturno"
            subtitle="Melhor para uso a noite"
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
            subtitle="Navegacao hospitalar inteligente e segura."
            onPress={() => navigate('Home')}
            appColors={appColors}
            isDark={isDark}
          />

          {menuItems.map((item, index) => (
            <MenuItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    position: 'absolute',
    left: 74,
    right: 74,
    bottom: 19,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
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
