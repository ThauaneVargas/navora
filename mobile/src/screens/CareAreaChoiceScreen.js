import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';

export default function CareAreaChoiceScreen({ navigate, goBack, onAreaDetected }) {
  const chooseArea = (area) => {
    if (area !== 'unknown') onAreaDetected?.(area);
    navigate('ExternalRoute', { area });
  };

  return (
    <Screen>
      <Header
        title="Para qual atendimento você deseja ir?"
        subtitle="Escolha a área correta para receber a rota até a entrada do hospital."
        onBack={() => goBack?.()}
        onMenu={() => navigate('Menu')}
      />
      <View style={styles.hero}>
        <View style={styles.heroMark}>
          <MaterialCommunityIcons name="hospital-marker" size={30} color="#FFFFFF" />
        </View>
        <Text style={styles.heroText}>O Navora calcula a entrada certa antes de liberar a navegação interna.</Text>
      </View>

      <ChoiceCard icon="hospital-building" title="Unidade / entrada A" subtitle="Ambiente carregado pelo hospital ativo" detail="Entrada conforme dados atuais" onPress={() => chooseArea('private')} />
      <ChoiceCard icon="medical-bag" title="Unidade / entrada B" subtitle="Outro ambiente disponível no hospital ativo" detail="Entrada conforme dados atuais" onPress={() => chooseArea('sus')} />
      <ChoiceCard icon="help-circle-outline" title="Não sei meu atendimento" subtitle="Vamos te orientar até a recepção" detail="Confirmação presencial" onPress={() => chooseArea('unknown')} />

      <Pressable onPress={() => navigate('Assistant')} style={({ pressed }) => [styles.aiCard, pressed && styles.pressed, shadows.card]}>
        <View style={styles.aiIcon}>
          <MaterialCommunityIcons name="microphone" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.aiTitle}>Assistente Navora</Text>
          <Text style={styles.aiText}>Posso ajudar você a escolher a entrada correta.</Text>
        </View>
      </Pressable>
    </Screen>
  );
}

function ChoiceCard({ icon, title, subtitle, detail, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, shadows.card]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
        <Text style={styles.cardDetail}>{detail}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 82, borderRadius: 26, backgroundColor: '#FFF7F8', borderWidth: 1, borderColor: '#FFD2D7', padding: 16, marginTop: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadows.card },
  heroMark: { width: 52, height: 52, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  heroText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  card: { minHeight: 96, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 54, height: 54, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  cardSub: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 4 },
  cardDetail: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 3 },
  aiCard: { minHeight: 78, borderRadius: 24, backgroundColor: '#FFF7F8', borderWidth: 1, borderColor: '#FFD2D7', padding: 14, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  aiText: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 3 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
