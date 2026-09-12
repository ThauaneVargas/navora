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
    title: 'Localizacao indoor',
    body: 'O Navora usa beacons Wi-Fi para estimar sua posicao dentro do hospital. Esses dados sao usados apenas durante a navegacao e nao sao armazenados permanentemente.',
  },
  {
    icon: 'routes',
    title: 'Historico de rotas',
    body: 'As rotas percorridas sao salvas localmente no dispositivo para exibir o historico. Nenhuma rota e enviada a terceiros.',
  },
  {
    icon: 'account-outline',
    title: 'Dados do perfil',
    body: 'Nome, CPF e dados de saude cadastrados sao armazenados de forma criptografada no servidor Navora e nao sao compartilhados sem consentimento.',
  },
  {
    icon: 'bell-outline',
    title: 'Notificacoes',
    body: 'Alertas de rota e SOS sao enviados apenas enquanto o app esta em uso. Nenhuma notificacao de marketing e enviada.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Seguranca dos dados',
    body: 'Toda comunicacao com o servidor usa HTTPS com token JWT. Seus dados nunca trafegam em texto simples.',
  },
  {
    icon: 'delete-outline',
    title: 'Exclusao de dados',
    body: 'Voce pode solicitar a exclusao completa dos seus dados a qualquer momento na recepcao do hospital ou pelo e-mail privacidade@navora.com.br.',
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
            O Navora coleta apenas o necessario para funcionar e nunca vende seus dados.
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
          Ultima atualizacao da politica de privacidade: Janeiro de 2025.
          Para duvidas, acesse o balcao de informacoes do hospital.
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
