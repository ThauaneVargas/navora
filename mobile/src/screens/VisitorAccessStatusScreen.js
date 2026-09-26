import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';
import { destinations, getAreaById, getReceptionDestination } from '../data/routes';
import { navoraApi } from '../services/api';

const statusLabels = {
  PENDING: 'Aguardando autorizacao',
  APPROVED: 'Autorizado',
  DENIED: 'Acesso negado',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
  WAITING_AUTHORIZATION: 'Aguardando autorizacao',
  AUTHORIZED: 'Autorizado',
  IN_ROUTE: 'Em rota',
  ARRIVED: 'Chegou ao destino',
  OFF_ROUTE: 'Fora da rota',
  FINISHED: 'Finalizado',
};

// IDs locais (VAR-..., LOCAL-VIS-...) indicam que o pedido ainda nao chegou ao backend.
const isServerRequestId = (id) => /^\d+$/.test(String(id ?? ''));

export default function VisitorAccessStatusScreen({
  navigate,
  goBack,
  userProfile,
  routeParams = {},
  visitorAccessRequest,
  onStartRoute,
  onResolveNavigationAccess,
  onCancelVisitorAccessRequest,
  onCreateVisitorAccessRequest,
  navigationData,
}) {
  const [syncedRequest, setSyncedRequest] = useState(visitorAccessRequest || routeParams.request);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);
  const request = syncedRequest || visitorAccessRequest || routeParams.request;
  const notSent = Boolean(request?.syncError) || !isServerRequestId(request?.id);

  // O App troca o pedido local (VAR-...) pelo pedido real do backend depois que a tela
  // ja foi montada. Sem esta sincronizacao a tela ficava presa ao ID local e nunca
  // conseguia consultar a decisao da recepcao.
  useEffect(() => {
    if (visitorAccessRequest) {
      setSyncedRequest(visitorAccessRequest);
      setRefreshMessage(null);
    }
  }, [visitorAccessRequest]);
  const area = getAreaById(request?.area || userProfile?.area);
  const reception = getReceptionDestination(area.id);
  const statusLabel = statusLabels[request?.status] || request?.status || 'Aguardando autorizacao';
  const authorized = statusLabel === 'Autorizado';
  const denied = statusLabel === 'Acesso negado';
  const allDestinations = navigationData?.destinations || destinations;
  const authorizedDestination = allDestinations.find(
    (destination) =>
      destination.code === request?.destinationCode ||
      destination.id === request?.destinationCode ||
      destination.name === request?.requestedDestination
  );

  const goReception = () => onStartRoute?.(reception);
  const retrySend = () => {
    setRefreshMessage(null);
    onCreateVisitorAccessRequest?.(
      {
        visitorName: request?.visitorName,
        destinationCode: request?.destinationCode,
        requestedDestination: request?.requestedDestination,
        reason: request?.reason,
        accessibility: request?.accessibility,
      },
      { skipNavigate: true }
    );
  };

  const refreshStatus = async () => {
    if (refreshing) return;
    if (notSent) {
      setRefreshMessage('Sua solicitacao ainda nao chegou a recepcao. Toque em "Enviar novamente" ou procure a recepcao.');
      return;
    }
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const updated = await navoraApi.getVisitorAccessRequest(request?.id);
      if (updated?.demoMode) {
        setRefreshMessage('Sem conexao no momento. Tente novamente em instantes.');
        return;
      }
      if (updated) {
        setSyncedRequest({
          id: updated.id,
          visitorName: updated.visitor_name,
          area: updated.area_id || updated.area,
          areaName: updated.area_name,
          entry: updated.entry,
          entrance: updated.entrance,
          currentLocation: updated.current_location,
          requestedDestination: updated.requested_destination,
          destinationCode: updated.destination_code || request?.destinationCode,
          destinationId: updated.destination_id || request?.destinationId,
          reason: updated.reason,
          accessibility: updated.accessibility,
          status: updated.status,
          allowedRoute: updated.authorized_route || updated.allowed_route,
          allowedTime: updated.permission_minutes ? `${updated.permission_minutes} minutos` : updated.allowed_time,
        });
        setRefreshMessage(updated.status === 'PENDING' ? 'Ainda aguardando a decisao da recepcao.' : null);
      }
    } catch (error) {
      setRefreshMessage('Nao foi possivel atualizar agora. Se precisar, procure a recepcao.');
    } finally {
      setRefreshing(false);
    }
  };

  const cancel = () => {
    onCancelVisitorAccessRequest?.();
    navigate('Home');
  };

  return (
    <Screen>
      <Header title="Autorizacao" centerTitle onBack={() => goBack?.()} onMenu={() => navigate('Menu')} />
      <View style={[styles.card, shadows.card]}>
        <View style={styles.statusIcon}>
          <MaterialCommunityIcons name={authorized ? 'check-circle-outline' : denied ? 'close-circle-outline' : 'clock-alert-outline'} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{notSent && !authorized && !denied ? 'Solicitacao nao enviada' : statusLabel}</Text>
        <Text style={styles.text}>Destino solicitado:</Text>
        <Text style={styles.destination}>{request?.requestedDestination || 'Visita / Internacao'}</Text>
        <Text style={styles.description}>
          {authorized
            ? 'Seu acesso foi liberado. Siga apenas pela rota autorizada.'
            : denied
              ? 'Procure a recepcao para receber orientacao presencial.'
              : notSent
                ? 'Nao conseguimos enviar seu pedido para a recepcao. Tente novamente ou procure a recepcao.'
                : 'Enquanto isso, vamos te orientar ate a recepcao correta.'}
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Area</Text>
          <Text style={styles.infoValue}>{area.name}</Text>
          <Text style={styles.infoLabel}>Recepcao</Text>
          <Text style={styles.infoValue}>{reception?.name}</Text>
          {request?.allowedRoute ? (
            <>
              <Text style={styles.infoLabel}>Rota liberada</Text>
              <Text style={styles.infoValue}>{request.allowedRoute}</Text>
            </>
          ) : null}
          {request?.allowedTime ? (
            <>
              <Text style={styles.infoLabel}>Tempo</Text>
              <Text style={styles.infoValue}>{request.allowedTime}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {authorized ? (
          <Pressable
            onPress={() =>
              authorizedDestination
                ? onResolveNavigationAccess?.(authorizedDestination, {
                    subject: 'VISITOR',
                    visitorAccessRequestId: request?.id,
                    visitorAccessRequest: request,
                  })
                : navigate('Search', { query: request?.requestedDestination })
            }
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Ir para destino liberado</Text>
          </Pressable>
        ) : null}
        {refreshMessage ? (
          <Text style={styles.feedback} accessibilityLiveRegion="polite">{refreshMessage}</Text>
        ) : null}
        {notSent && !authorized && !denied ? (
          <Pressable onPress={retrySend} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="send-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Enviar novamente</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={refreshStatus}
            disabled={refreshing}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
            )}
            <Text style={styles.secondaryText}>{refreshing ? 'Atualizando...' : 'Atualizar status'}</Text>
          </Pressable>
        )}
        <Pressable onPress={goReception} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
          <Text style={styles.primaryText}>Ir ate a recepcao</Text>
        </Pressable>
        <Pressable onPress={() => navigate('Assistant')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="microphone" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>Falar com IA</Text>
        </Pressable>
        <Pressable onPress={cancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="close" size={18} color={colors.danger} />
          <Text style={styles.cancelText}>Cancelar solicitacao</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  statusIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '900', textAlign: 'center' },
  text: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 18 },
  destination: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  description: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 14 },
  infoBox: {
    alignSelf: 'stretch',
    borderRadius: 18,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 16,
  },
  infoLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 2 },
  actions: { gap: 10, marginTop: 16 },
  feedback: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 },
  primaryButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FFD2D7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  cancelText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
