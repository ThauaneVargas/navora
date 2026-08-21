import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { colors, shadows } from '../theme/colors';

export default function HomeStartScreen({ navigate }) {
  const detectArrival = () => navigate('ArrivalDetected', { area: 'unknown' });

  return (
    <Screen scroll={false} padded={false}>
      <ImageBackground source={require('../../assets/images/hmc_hospital.jpg')} resizeMode="cover" style={styles.stage} imageStyle={styles.bg}>
        <View style={styles.overlay}>
          <View style={styles.top}>
            <View style={styles.brand}>
              <ImageLogo />
              <Text style={styles.brandName}>navora</Text>
            </View>
            <Pressable onPress={() => navigate('Notifications')} style={styles.bell}>
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
              <View style={styles.badge} />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>Ola!</Text>
            <Text style={styles.title}>Eu sou o <Text style={styles.red}>Navora.</Text></Text>
            <Text style={styles.title}>Como posso te ajudar hoje?</Text>
            <Text style={styles.subtitle}>Use o app para chegar ao hospital e depois continuar sua navegacao interna.</Text>
          </View>

          <View style={styles.cards}>
            <ActionCard icon="map-marker-path" title="Como chegar ao hospital" subtitle="Encontre a entrada correta" onPress={() => navigate('CareAreaChoice')} />
            <ActionCard icon="hospital-marker" title="Ja estou no hospital" subtitle="Ativar navegacao interna" onPress={detectArrival} />
            <ActionCard icon="hand-heart-outline" title="Preciso de ajuda" subtitle="Falar com a IA ou acionar suporte" onPress={() => navigate('Help', { type: 'help' })} />
          </View>

          <Pressable onPress={() => navigate('Assistant', { voice: true })} style={({ pressed }) => [styles.aiCard, pressed && styles.pressed, shadows.card]}>
            <View style={styles.mic}>
              <MaterialCommunityIcons name="microphone" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.aiTitle}>IA Navora</Text>
              <Text style={styles.aiText}>Fale comigo para tirar duvidas e receber orientacao.</Text>
            </View>
          </Pressable>

          <View style={styles.lockedCard}>
            <MaterialCommunityIcons name="lock-outline" size={22} color={colors.muted} />
            <View style={styles.copy}>
              <Text style={styles.lockedTitle}>Navegacao interna</Text>
              <Text style={styles.lockedText}>Disponivel quando voce chegar ao hospital.</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Screen>
  );
}

function ImageLogo() {
  return (
    <View style={styles.logoMark}>
      <Image source={require('../../assets/images/navora_symbol.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

function ActionCard({ icon, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed, shadows.card]}>
      <View style={styles.actionIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionText}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.bg },
  bg: { opacity: 0.24 },
  overlay: { flex: 1, paddingHorizontal: 22, paddingTop: 42, paddingBottom: 24, backgroundColor: 'rgba(255,255,255,0.82)' },
  top: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadows.card },
  logo: { width: 28, height: 28 },
  brandName: { color: colors.text, fontSize: 19, fontWeight: '900' },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  badge: { position: 'absolute', right: 8, top: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  hero: { marginTop: 36 },
  title: { color: colors.text, fontSize: 31, lineHeight: 37, fontWeight: '900' },
  red: { color: colors.primary },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 12 },
  cards: { gap: 12, marginTop: 28 },
  actionCard: { minHeight: 80, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.96)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  actionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  actionText: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 3 },
  aiCard: { minHeight: 82, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.98)', borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  mic: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  aiTitle: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  aiText: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 3 },
  lockedCard: { minHeight: 66, borderRadius: 20, backgroundColor: '#F8F8FA', borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  lockedTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  lockedText: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
