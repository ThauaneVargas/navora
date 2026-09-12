import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { shadows } from '../theme/colors';
import { useApp } from '../context/AppContext';

const sections = [
  {
    icon: 'map-marker-outline',
    title: 'Localização indoor',
    body: 'O Navora usa beacons Wi-Fi para estimar sua posição dentro do hospital. Esses dados são usados apenas durante a navegação e não são armazenados permanentemente.',
  },
  {
    icon: 'routes',
    title: 'Histórico de rotas',
    body: 'As rotas percorridas são salvas localmente no dispositivo para exibir o histórico. Nenhuma rota é enviada a terceiros.',
  },
  {
    icon: 'account-outline',
    title: 'Dados do perfil',
    body: 'Nome, CPF e dados de saúde cadastrados são armazenados de forma criptografada no servidor Navora e não são compartilhados sem consentimento.',
  },
  {
    icon: 'bell-outline',
    title: 'Notificações',
    body: 'Alertas de rota e SOS são enviados apenas enquanto o app está em uso. Nenhuma notificação de marketing é enviada.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Segurança dos dados',
    body: 'Toda comunicação com o servidor usa HTTPS com token JWT. Seus dados nunca trafegam em texto simples.',
  },
  {
    icon: 'delete-outline',
    title: 'Exclusão de dados',
    body: 'Você pode solicitar a exclusão completa dos seus dados a qualquer momento na recepção do hospital ou pelo e-mail privacidade@navora.com.br.',
  },
];

export default function PrivacyScreen({ navigate, goBack }) {
  const { appColors } = useApp();
  const styles = useMemo(() => createStyles(appColors), [appColors]);

  return (
    <Screen>
      <Header title="Privacidade" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />

      <View style={[styles.headerCard, shadows.card]}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="shield-lock-outline" size={30} color={appColors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Seus dados, sua privacidade</Text>
          <Text style={styles.headerSub}>
            O Navora coleta apenas o necessário para funcionar e nunca vende seus dados.
          </Text>
        </View>
      </View>

      {sections.map((section, index) => (
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

      <View style={[styles.footerCard, shadows.card]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={appColors.muted} />
        <Text style={styles.footerText}>
          Última atualização da política de privacidade: Janeiro de 2025.
          Para dúvidas, acesse o balcão de informações do hospital.
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
