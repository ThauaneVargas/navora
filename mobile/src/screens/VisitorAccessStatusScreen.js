import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Header from '../components/Header';
import { colors, shadows } from '../theme/colors';
import { destinations, getAreaById, getReceptionDestination } from '../data/routes';
import { navoraApi } from '../services/api';

const statusLabels = {
  PENDING: 'Aguardando autorizacao da recepcao...',
  APPROVED: 'Entrada autorizada',
  DENIED: 'Acesso negado',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
  REVOKED: 'Acesso revogado',
  WAITING_AUTHORIZATION: 'Aguardando autorizacao da recepcao...',
  AUTHORIZED: 'Entrada autorizada',
  IN_ROUTE: 'Em rota',
  ARRIVED: 'Chegou ao destino',
  OFF_ROUTE: 'Fora da rota',
  FINISHED: 'Finalizado',
  'Aguardando autorizacao': 'Aguardando autorizacao da recepcao...',
};

const pendingStatuses = new Set(['PENDING', 'WAITING_AUTHORIZATION', 'Aguardando autorizacao']);
const approvedStatuses = new Set(['APPROVED', 'AUTHORIZED']);
const deniedStatuses = new Set(['DENIED']);
const pollingIntervalMs = 2500;

export default function VisitorAccessStatusScreen({
  navigate,
  goBack,
  userProfile,
  routeParams = {},
  visitorAccessRequest,
  onVisitorAccessRequestUpdated,
  onStartRoute,
  onResolveNavigationAccess,
  onCancelVisitorAccessRequest,
  navigationData,
}) {
  const [syncedRequest, setSyncedRequest] = useState(visitorAccessRequest || routeParams.request);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const refreshingRef = useRef(false);
  const intervalRef = useRef(null);
  const request = syncedRequest || visitorAccessRequest || routeParams.request;
  const area = getAreaById(request?.area || userProfile?.area);
  const reception = getReceptionDestination(area.id);
  const statusLabel = statusLabels[request?.status] || request?.status || 'Aguardando autorizacao da recepcao...';
  const pending = pendingStatuses.has(request?.status);
  const authorized = approvedStatuses.has(request?.status);
  const remaining = getRemainingTime(request, now);
  const expired = request?.status === 'EXPIRED' || remaining.expired;
  const denied = deniedStatuses.has(request?.status) || ['REVOKED', 'CANCELED'].includes(request?.status) || expired;
  const allDestinations = navigationData?.destinations || destinations;
  const authorizedDestination = allDestinations.find(
    (destination) =>
      destination.code === request?.destinationCode ||
      destination.id === request?.destinationCode ||
      destination.name === request?.requestedDestination
  );

  const goReception = () => onStartRoute?.(reception);
  const normalizeRequest = useCallback((updated) => ({
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
    permissionMinutes: updated.permission_minutes,
    authorizedAt: updated.authorized_at,
    expiresAt: updated.expires_at,
    validUntil: updated.expires_at,
  }), [request?.destinationCode, request?.destinationId]);

  const refreshStatus = useCallback(async ({ quiet = false } = {}) => {
    if (!request?.id || refreshingRef.current) return;
    refreshingRef.current = true;
    if (!quiet) setSyncing(true);
    setSyncError(null);
    try {
      const updated = await navoraApi.getVisitorAccessRequest(request?.id);
      if (updated?.demoMode) {
        setSyncError('Nao foi possivel atualizar agora. Mantivemos o ultimo status conhecido.');
        return;
      }
      if (updated && !updated.demoMode) {
        const normalized = normalizeRequest(updated);
        setSyncedRequest(normalized);
        onVisitorAccessRequestUpdated?.(normalized);
      }
    } catch (error) {
      setSyncError('Nao foi possivel atualizar agora. Mantivemos o ultimo status conhecido.');
    } finally {
      refreshingRef.current = false;
      if (!quiet) setSyncing(false);
    }
  }, [normalizeRequest, onVisitorAccessRequestUpdated, request?.id]);

  useEffect(() => {
    setSyncedRequest(visitorAccessRequest || routeParams.request);
  }, [routeParams.request, visitorAccessRequest]);

  useEffect(() => {
    refreshStatus({ quiet: true });

    if (!pending || !request?.id) return undefined;

    intervalRef.current = setInterval(() => {
      refreshStatus({ quiet: true });
    }, pollingIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pending, refreshStatus, request?.id]);

  useEffect(() => {
    if (!authorized || !request?.expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [authorized, request?.expiresAt]);

  useEffect(() => {
    if (!authorized || !remaining.expired || request?.status === 'EXPIRED') return;
    const expiredRequest = { ...request, status: 'EXPIRED' };
    setSyncedRequest(expiredRequest);
    onVisitorAccessRequestUpdated?.(expiredRequest);
  }, [authorized, onVisitorAccessRequestUpdated, remaining.expired, request]);

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
        <Text style={styles.title}>{expired ? 'Seu acesso de visitante expirou.' : statusLabel}</Text>
        <Text style={styles.text}>Destino solicitado:</Text>
        <Text style={styles.destination}>{request?.requestedDestination || 'Visita / Internacao'}</Text>
        <Text style={styles.description}>
          {authorized
            ? expired
              ? 'A navegacao para areas restritas foi encerrada. Procure a recepcao ou siga para a saida.'
              : 'Seu acesso foi liberado. Siga apenas pela rota autorizada.'
            : denied
              ? 'Procure a recepcao para receber orientacao presencial.'
              : 'Aguardando confirmacao da recepcao. Voce nao precisa sair desta tela.'}
        </Text>
        {pending ? (
          <View style={styles.syncRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.syncText}>Atualizando automaticamente</Text>
          </View>
        ) : null}
        {syncError ? <Text style={styles.syncError}>{syncError}</Text> : null}
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
          {authorized ? (
            <>
              <Text style={styles.infoLabel}>Tempo restante</Text>
              <Text style={[styles.infoValue, remaining.warning && styles.dangerText]}>{remaining.label}</Text>
            </>
          ) : null}
          {authorized ? (
            <>
              <Text style={styles.infoLabel}>Credencial</Text>
              <Text style={styles.infoValue}>QR seguro nao fornecido pela API atual</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {authorized && !expired ? (
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
        <Pressable onPress={() => refreshStatus()} disabled={syncing} style={({ pressed }) => [styles.secondaryButton, syncing && styles.disabledButton, pressed && styles.pressed]}>
          {syncing ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />}
          <Text style={styles.secondaryText}>{syncing ? 'Atualizando...' : 'Atualizar status'}</Text>
        </Pressable>
        <Pressable onPress={goReception} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
          <Text style={styles.primaryText}>{expired ? 'Ir para recepcao / saida' : 'Ir ate a recepcao'}</Text>
        </Pressable>
        <Pressable onPress={() => navigate('Assistant')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="microphone" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>Abrir assistente</Text>
        </Pressable>
        <Pressable onPress={cancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="close" size={18} color={colors.danger} />
          <Text style={styles.cancelText}>Cancelar solicitacao</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function getRemainingTime(request, now) {
  const expiry = request?.expiresAt || request?.validUntil;
  if (!expiry) {
    return { label: request?.allowedTime || 'definido pela recepcao', warning: false, expired: false };
  }
  const expiresAt = new Date(expiry).getTime();
  const remainingMs = expiresAt - now;
  if (!Number.isFinite(expiresAt) || remainingMs <= 0) {
    return { label: '00:00:00', warning: true, expired: true };
  }
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return {
    label: `${hours}:${minutes}:${seconds}`,
    warning: totalSeconds <= 10 * 60,
    expired: false,
  };
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
  syncRow: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  syncText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  syncError: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: '700', textAlign: 'center', marginTop: 10 },
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
  dangerText: { color: colors.danger },
  actions: { gap: 10, marginTop: 16 },
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
  disabledButton: { opacity: 0.7 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});
