import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { FormField, SecondaryButton } from '../components/PremiumUI';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { getPrivacyPolicy } from '../data/privacyPolicy';
import { isAuthError, isNetworkError, navoraApi } from '../services/api';

export default function PrivacyScreen({ navigate, goBack, userProfile, onLogout }) {
  const { appColors, t, language } = useApp();
  const policy = useMemo(() => getPrivacyPolicy(language), [language]);
  const styles = useMemo(() => createStyles(appColors), [appColors]);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const hasAccount = Boolean(userProfile?.hasAccount);

  // LGPD (portabilidade): o servidor monta o JSON e o celular abre o
  // "Compartilhar" do sistema (salvar em arquivo, mandar por e-mail etc.).
  const exportData = async () => {
    setExporting(true);
    try {
      const data = await navoraApi.exportMyData();
      await Share.share({ title: t('privacy.exportTitle'), message: JSON.stringify(data, null, 2) });
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert(t('common.noConnection'), t('privacy.offline'));
      } else {
        Alert.alert(t('privacy.exportFailTitle'), t('privacy.exportFail'));
      }
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await navoraApi.deleteMyAccount(password);
      setPassword('');
      Alert.alert(t('privacy.deletedTitle'), t('privacy.deleted'), [
        { text: 'OK', onPress: () => onLogout?.() },
      ]);
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert(t('privacy.wrongPasswordTitle'), t('privacy.wrongPassword'));
      } else if (isNetworkError(error)) {
        Alert.alert(t('common.noConnection'), t('privacy.offline'));
      } else {
        Alert.alert(t('privacy.failTitle'), t('privacy.fail'));
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!password) {
      Alert.alert(t('privacy.typePasswordTitle'), t('privacy.typePassword'));
      return;
    }
    Alert.alert(
      t('privacy.confirmTitle'),
      t('privacy.confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('privacy.delete'), style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  return (
    <Screen>
      <Header title={t('privacy.title')} centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-lock-outline" size={30} color={appColors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{t('privacy.headerTitle')}</Text>
          <Text style={styles.headerSub}>
            {t('privacy.headerSub')}
          </Text>
        </View>
      </View>

      {policy.sections.map((section) => (
        <View key={section.title} style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name={section.icon} size={20} color={appColors.primary} />
            </View>
            <Text style={styles.cardTitle}>{section.title}</Text>
          </View>
          <Text style={styles.cardBody}>{section.body}</Text>
        </View>
      ))}

      {hasAccount ? (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <MaterialCommunityIcons name="download-outline" size={20} color={appColors.primary} />
            </View>
            <Text style={styles.cardTitle}>{t('privacy.exportTitle')}</Text>
          </View>
          <Text style={[styles.cardBody, styles.exportText]}>{t('privacy.exportText')}</Text>
          <SecondaryButton
            title={exporting ? t('privacy.exporting') : t('privacy.exportTitle')}
            icon="download-outline"
            disabled={exporting}
            onPress={exportData}
          />
        </View>
      ) : null}

      {hasAccount ? (
        <View style={[styles.card, styles.dangerCard, shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.dangerIcon]}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={appColors.danger} />
            </View>
            <Text style={styles.cardTitle}>{t('privacy.deleteTitle')}</Text>
          </View>
          <Text style={styles.cardBody}>
            {t('privacy.deleteText')}
          </Text>
          <FormField
            label={t('privacy.password')}
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder={t('privacy.passwordPlaceholder')}
            accessibilityLabel={t('privacy.passwordA11y')}
            style={styles.passwordField}
          />
          <SecondaryButton
            title={deleting ? t('privacy.deleting') : t('privacy.deleteTitle')}
            icon="delete-outline"
            danger
            disabled={deleting}
            onPress={confirmDelete}
          />
        </View>
      ) : null}

      <View style={[styles.footerCard, shadows.card]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={appColors.muted} />
        <Text style={styles.footerText}>
          {t('privacy.footer', { date: policy.updatedLabel })}
          {policy.translationNote ? `\n${policy.translationNote}` : ''}
        </Text>
      </View>
    </Screen>
  );
}

const createStyles = (colors) => StyleSheet.create({
  headerCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  headerSub: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 19,
  },
  card: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  cardBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  exportText: {
    marginBottom: 12,
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  dangerIcon: {
    backgroundColor: colors.surfaceSoft,
  },
  passwordField: {
    marginTop: 12,
    marginBottom: 12,
  },
  footerCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  footerText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
});
