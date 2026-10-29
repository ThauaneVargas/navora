import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import Screen from '../components/Screen';
import Header from '../components/Header';

import {
  shadows,
} from '../theme/colors';

import {
  useApp,
} from '../context/AppContext';

import {
  destinations,
  getAreaById,
  getReceptionDestination,
} from '../data/routes';

import {
  navoraApi,
} from '../services/api';

import {
  stopVisitorAccessMonitor,
  updateVisitorAccessMonitorRequest,
} from '../services/visitorAccessMonitor';


const PENDING =
  new Set([
    'PENDING',
    'WAITING_AUTHORIZATION',
    'Aguardando autorizacao',
  ]);


const APPROVED =
  new Set([
    'APPROVED',
    'AUTHORIZED',
  ]);


const DENIED =
  new Set([
    'DENIED',
    'REVOKED',
    'CANCELED',
  ]);


export default function VisitorAccessStatusScreen({
  navigate,
  userProfile,
  routeParams = {},
  visitorAccessRequest,
  onVisitorAccessRequestUpdated,
  onStartRoute,
  onResolveNavigationAccess,
  onCancelVisitorAccessRequest,
  navigationData,
}) {
  const {
    appColors,
    t,
  } = useApp();


  const [
    syncedRequest,
    setSyncedRequest,
  ] = useState(
    visitorAccessRequest ||
      routeParams.request
  );


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [now, setNow] =
    useState(Date.now());


  const request =
    syncedRequest ||
    visitorAccessRequest ||
    routeParams.request;


  const status =
    request?.status ||
    'PENDING';


  const pending =
    PENDING.has(status);


  const approved =
    APPROVED.has(status);


  const denied =
    DENIED.has(status);


  const remaining =
    useMemo(
      () =>
        getRemainingTime(
          request,
          now,
          t
        ),

      [request, now, t]
    );


  const expired =
    status === 'EXPIRED' ||
    remaining.expired;


  const area =
    getAreaById(
      request?.area ||
        userProfile?.area ||
        'private'
    );


  const reception =
    getReceptionDestination(
      area.id
    );


  const allDestinations =
    navigationData?.destinations ||
    destinations;


  const authorizedDestination =
    allDestinations.find(
      (destination) =>
        destination.code ===
          request?.destinationCode ||

        destination.id ===
          request?.destinationCode ||

        destination.id ===
          request?.destinationId ||

        destination.name ===
          request?.requestedDestination
    );


  /*
   * SINCRONIZAR PROP
   */

  useEffect(() => {
    if (visitorAccessRequest) {
      setSyncedRequest(
        visitorAccessRequest
      );
    }
  }, [visitorAccessRequest]);


  /*
   * TIMER
   */

  useEffect(() => {
    if (!approved) {
      return undefined;
    }

    const id =
      setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () =>
      clearInterval(id);
  }, [approved]);


  /*
   * REFRESH MANUAL
   */

  const refreshStatus =
    async () => {
      if (
        !request?.id ||
        refreshing
      ) {
        return;
      }

      setRefreshing(true);

      try {
        const updated =
          await navoraApi.getVisitorAccessRequest(
            request.id,
            request.accessToken
          );

        if (
          updated &&
          !updated.demoMode
        ) {
          const normalized =
            normalizeRequest(
              updated,
              request
            );

          setSyncedRequest(
            normalized
          );

          onVisitorAccessRequestUpdated?.(
            normalized
          );

          updateVisitorAccessMonitorRequest(
            normalized
          );
        }
      } catch {
        /*
         * Mantemos o último status
         * conhecido.
         */
      } finally {
        setRefreshing(false);
      }
    };


  /*
   * AÇÕES
   */

  const goReception =
    () => {
      if (reception) {
        onStartRoute?.(
          reception
        );

        return;
      }

      navigate('Search', {
        query: 'Recepção',
      });
    };


  const goExit = () => {
    navigate('Search', {
      query: 'Saída',
    });
  };


  const startRoute = () => {
    if (
      authorizedDestination &&
      onResolveNavigationAccess
    ) {
      onResolveNavigationAccess(
        authorizedDestination,
        {
          subject:
            'VISITOR',

          visitorAccessRequestId:
            request?.id,


          visitorAccessToken:

            request?.accessToken,

          visitorAccessRequest:
            request,

          // O botão já é "Iniciar rota autorizada": não pede de novo no mapa.
          startNow: true,
        }
      );

      return;
    }


    navigate('Search', {
      query:
        request?.allowedRoute ||
        request?.requestedDestination ||
        '',
    });
  };


  const requestMoreTime =
    () => {
      navigate('Help', {
        type:
          'visitor-time-extension',

        visitorAccessRequestId:
          request?.id,


        visitorAccessToken:

          request?.accessToken,

        message:
          'Solicito mais tempo para a visita.',
      });
    };


  const contactReception =
    () => {
      navigate('Help', {
        type:
          'visitor-reception-contact',

        visitorAccessRequestId:
          request?.id,


        visitorAccessToken:

          request?.accessToken,

        message:
          'Preciso falar com a recepção sobre minha visita.',
      });
    };


  const cancelRequest =
    () => {
      stopVisitorAccessMonitor();

      onCancelVisitorAccessRequest?.();

      navigate('Home');
    };


  /*
   * STATUS VISUAL
   */

  let icon =
    'clock-outline';

  let iconColor =
    '#B77900';

  let title =
    t('visitorStatus.pendingTitle');

  let description =
    t('visitorStatus.pendingText');


  if (approved && !expired) {
    icon =
      'check-decagram-outline';

    iconColor =
      appColors.success;

    title =
      t('visitorStatus.approvedTitle');

    description =
      t('visitorStatus.approvedText');
  }


  if (expired) {
    icon =
      'timer-alert-outline';

    iconColor =
      appColors.danger;

    title =
      t('visitorStatus.expiredTitle');

    description =
      t('visitorStatus.expiredText');
  }


  if (denied) {
    icon =
      'close-circle-outline';

    iconColor =
      appColors.danger;

    title =
      t('visitorStatus.deniedTitle');

    description =
      t('visitorStatus.deniedText');
  }


  return (
    <Screen>
      <Header
        title={t('visitorStatus.title')}
        subtitle={t('visitorStatus.subtitle')}
        centerTitle
        onBack={() =>
          navigate('Home')
        }
        onMenu={() =>
          navigate('Menu')
        }
      />


      <View
        style={[
          styles.card,

          {
            backgroundColor:
              appColors.surface,

            borderColor:
              appColors.border,
          },

          shadows.card,
        ]}
      >
        <View
          style={[
            styles.statusIcon,

            {
              backgroundColor:
                iconColor,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={31}
            color="#FFFFFF"
          />
        </View>


        <Text
          style={[
            styles.title,

            {
              color:
                appColors.text,
            },
          ]}
        >
          {title}
        </Text>


        <Text
          style={[
            styles.description,

            {
              color:
                appColors.muted,
            },
          ]}
        >
          {description}
        </Text>


        <View
          style={[
            styles.infoBox,

            {
              backgroundColor:
                appColors.backgroundSoft,

              borderColor:
                appColors.border,
            },
          ]}
        >
          <Info
            label={t('visitorStatus.request')}
            value={
              (typeof request?.requestedDestination === 'string'
                ? request.requestedDestination
                : request?.requestedDestination?.name) ||
              t('visitorStatus.visit')
            }
            appColors={
              appColors
            }
          />


          <Info
            label={t('visitorStatus.reception')}
            value={
              reception?.name ||
              t('visitorStatus.reception')
            }
            appColors={
              appColors
            }
          />


          {approved &&
            request?.allowedRoute && (
            <Info
              label={t('visitorStatus.allowedRoute')}
              value={
                request.allowedRoute
              }
              appColors={
                appColors
              }
            />
          )}


          {approved &&
            (request?.sector ||
              request?.floor) && (
            <Info
              label={t('visitorStatus.confirmedDestination')}
              value={[
                request?.sector,
                request?.floor,
              ]
                .filter(Boolean)
                .join(' • ')}
              appColors={
                appColors
              }
            />
          )}


          {approved &&
            !expired && (
            <View
              style={[
                styles.timerBox,

                {
                  backgroundColor:
                    appColors.iconBg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="timer-outline"
                size={22}
                color={
                  remaining.level ===
                  'urgent'
                    ? appColors.danger
                    : appColors.primary
                }
              />

              <View>
                <Text
                  style={[
                    styles.timerLabel,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  {t('visitorStatus.timeLeft')}
                </Text>

                <Text
                  style={[
                    styles.timerValue,

                    {
                      color:
                        remaining.level ===
                        'urgent'
                          ? appColors.danger
                          : appColors.text,
                    },
                  ]}
                >
                  {remaining.label}
                </Text>
              </View>
            </View>
          )}
        </View>


        {pending && (
          <View
            style={[
              styles.pendingNotice,

              {
                backgroundColor:
                  appColors.iconBg,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={19}
              color={
                appColors.primary
              }
            />

            <Text
              style={[
                styles.pendingNoticeText,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              {t('visitorStatus.whileWaiting')}
            </Text>
          </View>
        )}
      </View>


      {/* APROVADO */}

      {approved &&
        !expired && (
        <Pressable
          onPress={startRoute}
          style={({ pressed }) => [
            styles.primary,

            {
              backgroundColor:
                appColors.primary,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="navigation-variant"
            size={19}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.primaryText
            }
          >
            {t('visitorStatus.startRoute')}
          </Text>
        </Pressable>
      )}


      {/* PENDENTE */}

      {pending && (
        <Pressable
          onPress={
            goReception
          }
          style={({ pressed }) => [
            styles.primary,

            {
              backgroundColor:
                appColors.primary,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="desk"
            size={19}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.primaryText
            }
          >
            {t('visitorStatus.goToReception')}
          </Text>
        </Pressable>
      )}


      {/* EXPIRADO */}

      {expired && (
        <>
          <Pressable
            onPress={goExit}
            style={({ pressed }) => [
              styles.primary,

              {
                backgroundColor:
                  appColors.primary,
              },

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="exit-run"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.primaryText
              }
            >
              {t('visitorStatus.goToExit')}
            </Text>
          </Pressable>


          <Pressable
            onPress={
              requestMoreTime
            }
            style={({ pressed }) => [
              styles.secondary,

              {
                borderColor:
                  appColors.border,
              },

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="timer-plus-outline"
              size={18}
              color={
                appColors.primary
              }
            />

            <Text
              style={[
                styles.secondaryText,

                {
                  color:
                    appColors.primary,
                },
              ]}
            >
              {t('visitorStatus.askMoreTime')}
            </Text>
          </Pressable>
        </>
      )}


      {/* ATUALIZAR */}

      {!expired && (
        <Pressable
          onPress={
            refreshStatus
          }
          disabled={
            refreshing
          }
          style={({ pressed }) => [
            styles.secondary,

            {
              borderColor:
                appColors.border,
            },

            refreshing &&
              styles.disabled,

            pressed &&
              styles.pressed,
          ]}
        >
          {refreshing ? (
            <ActivityIndicator
              size="small"
              color={
                appColors.primary
              }
            />
          ) : (
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={
                appColors.primary
              }
            />
          )}

          <Text
            style={[
              styles.secondaryText,

              {
                color:
                  appColors.primary,
              },
            ]}
          >
            {refreshing
              ? t('visitorStatus.refreshing')
              : t('visitorStatus.refresh')}
          </Text>
        </Pressable>
      )}


      {/* RECEPÇÃO */}

      {!pending && (
        <Pressable
          onPress={
            goReception
          }
          style={({ pressed }) => [
            styles.secondary,

            {
              borderColor:
                appColors.border,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="desk"
            size={18}
            color={
              appColors.primary
            }
          />

          <Text
            style={[
              styles.secondaryText,

              {
                color:
                  appColors.primary,
              },
            ]}
          >
            {t('visitorStatus.backToReception')}
          </Text>
        </Pressable>
      )}


      {/* CONTATO */}

      <Pressable
        onPress={
          contactReception
        }
        style={({ pressed }) => [
          styles.secondary,

          {
            borderColor:
              appColors.border,
          },

          pressed &&
            styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          name="message-text-outline"
          size={18}
          color={
            appColors.primary
          }
        />

        <Text
          style={[
            styles.secondaryText,

            {
              color:
                appColors.primary,
            },
          ]}
        >
          {t('visitorStatus.talkToReception')}
        </Text>
      </Pressable>


      {/* HOME */}

      <Pressable
        onPress={() =>
          navigate('Home')
        }
        style={({ pressed }) => [
          styles.secondary,

          {
            borderColor:
              appColors.border,
          },

          pressed &&
            styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          name="home-outline"
          size={18}
          color={
            appColors.primary
          }
        />

        <Text
          style={[
            styles.secondaryText,

            {
              color:
                appColors.primary,
            },
          ]}
        >
          {t('visitorStatus.backHome')}
        </Text>
      </Pressable>


      {/* CANCELAR */}

      {pending && (
        <Pressable
          onPress={
            cancelRequest
          }
          style={({ pressed }) => [
            styles.cancel,

            {
              borderColor:
                appColors.danger,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={
              appColors.danger
            }
          />

          <Text
            style={[
              styles.cancelText,

              {
                color:
                  appColors.danger,
              },
            ]}
          >
            {t('visitorStatus.cancelRequest')}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}


function normalizeRequest(
  updated,
  fallback
) {
  return {
    ...fallback,

    id:
      updated?.id ||
      fallback?.id,

    visitorName:
      updated?.visitor_name ||
      fallback?.visitorName,

    area:
      updated?.area_id ||
      updated?.area ||
      fallback?.area,

    requestedDestination:
      updated?.requested_destination ||
      fallback?.requestedDestination,

    destinationCode:
      updated?.destination_code ||
      fallback?.destinationCode,

    destinationId:
      updated?.destination_id ||
      fallback?.destinationId,

    reason:
      updated?.reason ||
      fallback?.reason,

    accessibility:
      updated?.accessibility ||
      fallback?.accessibility,

    status:
      updated?.status ||
      fallback?.status,

    allowedRoute:
      updated?.authorized_route ||
      updated?.allowed_route ||
      fallback?.allowedRoute,

    permissionMinutes:
      updated?.permission_minutes ??
      fallback?.permissionMinutes,

    allowedTime:
      updated?.permission_minutes
        ? `${updated.permission_minutes} min`
        : updated?.allowed_time ||
          fallback?.allowedTime,

    authorizedAt:
      updated?.authorized_at ||
      fallback?.authorizedAt,

    expiresAt:
      updated?.expires_at ||
      fallback?.expiresAt,

    validUntil:
      updated?.expires_at ||
      fallback?.validUntil,

    sector:
      updated?.sector ||
      fallback?.sector,

    floor:
      updated?.floor ||
      updated?.destination_floor ||
      fallback?.floor,
  };
}


function getRemainingTime(
  request,
  now,
  t
) {
  let expiry = null;


  if (
    request?.expiresAt ||
    request?.validUntil
  ) {
    expiry =
      new Date(
        request.expiresAt ||
          request.validUntil
      ).getTime();
  } else if (
    request?.authorizedAt &&
    request?.permissionMinutes
  ) {
    const start =
      new Date(
        request.authorizedAt
      ).getTime();

    if (
      Number.isFinite(start)
    ) {
      expiry =
        start +
        Number(
          request.permissionMinutes
        ) *
          60000;
    }
  }


  if (
    !expiry ||
    !Number.isFinite(expiry)
  ) {
    return {
      label:
        request?.allowedTime ||
        t('visitorStatus.setByReception'),

      expired: false,

      level: 'normal',
    };
  }


  const remainingMs =
    expiry - now;


  if (remainingMs <= 0) {
    return {
      label: '00:00:00',

      expired: true,

      level: 'expired',
    };
  }


  const totalSeconds =
    Math.floor(
      remainingMs / 1000
    );


  const hours =
    String(
      Math.floor(
        totalSeconds / 3600
      )
    ).padStart(2, '0');


  const minutes =
    String(
      Math.floor(
        (totalSeconds % 3600) /
          60
      )
    ).padStart(2, '0');


  const seconds =
    String(
      totalSeconds % 60
    ).padStart(2, '0');


  let level = 'normal';


  if (totalSeconds <= 300) {
    level = 'urgent';
  } else if (
    totalSeconds <= 900
  ) {
    level = 'warning';
  }


  return {
    label: `${hours}:${minutes}:${seconds}`,

    expired: false,

    level,
  };
}


function Info({
  label,
  value,
  appColors,
}) {
  return (
    <View
      style={
        styles.info
      }
    >
      <Text
        style={[
          styles.infoLabel,

          {
            color:
              appColors.muted,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,

          {
            color:
              appColors.text,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}


const styles =
  StyleSheet.create({
    card: {
      borderRadius: 24,
      borderWidth: 1,
      padding: 18,
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 8,
    },

    statusIcon: {
      width: 65,
      height: 65,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    title: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '900',
      textAlign: 'center',
    },

    description: {
      fontSize: 12.5,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 8,
    },

    infoBox: {
      alignSelf: 'stretch',
      borderWidth: 1,
      borderRadius: 18,
      padding: 13,
      marginTop: 17,
    },

    info: {
      marginBottom: 10,
    },

    infoLabel: {
      fontSize: 9.5,
      fontWeight: '900',
      textTransform:
        'uppercase',
    },

    infoValue: {
      fontSize: 13,
      fontWeight: '800',
      marginTop: 3,
    },

    timerBox: {
      borderRadius: 15,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 4,
    },

    timerLabel: {
      fontSize: 9,
      fontWeight: '900',
    },

    timerValue: {
      fontSize: 19,
      fontWeight: '900',
      marginTop: 2,
    },

    pendingNotice: {
      alignSelf: 'stretch',
      borderRadius: 16,
      padding: 12,
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    pendingNoticeText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '600',
    },

    primary: {
      minHeight: 52,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 9,
      paddingHorizontal: 12,
    },

    primaryText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '900',
      textAlign: 'center',
    },

    secondary: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
      marginTop: 9,
      paddingHorizontal: 12,
    },

    secondaryText: {
      fontSize: 12.5,
      fontWeight: '900',
      textAlign: 'center',
    },

    cancel: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
      marginTop: 12,
    },

    cancelText: {
      fontSize: 12.5,
      fontWeight: '900',
    },

    disabled: {
      opacity: 0.65,
    },

    pressed: {
      opacity: 0.84,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },
  });