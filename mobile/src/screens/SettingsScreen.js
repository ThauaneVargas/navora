import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import LanguagePicker from '../components/LanguagePicker';
import { HOSPITAL_CODE } from '../services/api';
import { getOfflineDatabaseInfo, subscribeOfflineDatabase } from '../services/offlineDatabase';
import { localeFor } from '../i18n';

export default function SettingsScreen({ navigate, goBack }) {
  const { appColors, isDark, toggleTheme, t, language } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  // O que o banco local (SQLite) já guardou para usar sem internet.
  const [offlineInfo, setOfflineInfo] = useState(null);
  useEffect(() => {
    let active = true;
    const refresh = () => getOfflineDatabaseInfo(HOSPITAL_CODE).then((info) => active && setOfflineInfo(info));
    refresh();
    const unsubscribe = subscribeOfflineDatabase(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const offlineSubtitle = offlineInfo?.syncedAt
    ? t('settings.offlineSaved', {
        destinations: offlineInfo.destinations,
        routes: offlineInfo.routes,
        date: new Date(offlineInfo.syncedAt).toLocaleString(localeFor(language), {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : offlineInfo
      ? t('settings.offlineEmpty')
      : t('settings.offlineModeSub');

  return (
    <Screen>
      <Header title={t('settings.title')} centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <SectionLabel label={t('language.title')} styles={styles} />
      <View style={[styles.group, styles.languageGroup, shadows.card]}>
        <Text style={styles.rowSub}>{t('language.subtitle')}</Text>
        <LanguagePicker />
      </View>

      <SectionLabel label={t('settings.appearance')} styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon={isDark ? 'weather-night' : 'white-balance-sunny'}
          title={t('settings.darkMode')}
          subtitle={t('settings.darkModeSub')}
          styles={styles}
          appColors={appColors}
          trailing={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: appColors.border, true: appColors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      <SectionLabel label={t('settings.dataConnection')} styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon="database-outline"
          title={t('settings.offlineMode')}
          subtitle={offlineSubtitle}
          styles={styles}
          appColors={appColors}
          last={false}
          noChevron
        />
        <SettingRow
          icon="shield-lock-outline"
          title={t('settings.privacy')}
          subtitle={t('settings.privacySub')}
          styles={styles}
          appColors={appColors}
          last
          onPress={() => navigate('Privacy')}
        />
      </View>

      <SectionLabel label={t('settings.about')} styles={styles} />
      <View style={[styles.group, shadows.card]}>
        <SettingRow
          icon="information-outline"
          title="Navora"
          subtitle={t('settings.appTagline')}
          styles={styles}
          appColors={appColors}
          last={false}
        />
        <SettingRow
          icon="tag-outline"
          title={t('settings.version')}
          subtitle="1.0.0"
          styles={styles}
          appColors={appColors}
          last
          noChevron
        />
      </View>
    </Screen>
  );
}

function SectionLabel({ label, styles }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SettingRow({ icon, title, subtitle, trailing, onPress, last, noChevron, styles, appColors }) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={appColors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {trailing || (!noChevron && onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={appColors.muted} />
      ) : null)}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const createStyles = (colors) => StyleSheet.create({
  languageGroup: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.86,
  },
});
