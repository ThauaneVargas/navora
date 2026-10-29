import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import Screen
  from '../components/Screen';

import AppHeader
  from '../components/AppHeader';

import BottomTabs
  from '../components/BottomTabs';

import {
  isRouteBarVisible,
  useRouteBarSpace,
} from '../components/ActiveRouteBar';


// Sombra só nos cartões de status do visitante (mantidos como estavam).
import {
  shadows,
} from '../theme/colors';

import {
  useApp,
} from '../context/AppContext';


import {
  getAreaById,
  getReceptionDestination,
} from '../data/routes';


// Abas (62) + barra de gestos + respiro.
const HOME_BOTTOM_SPACE = 120;


const PENDING_STATUSES =
  new Set([
    'PENDING',
    'WAITING_AUTHORIZATION',
    'Aguardando autorizacao',
  ]);


const APPROVED_STATUSES =
  new Set([
    'APPROVED',
    'AUTHORIZED',
  ]);


const DENIED_STATUSES =
  new Set([
    'DENIED',
    'REVOKED',
    'CANCELED',
  ]);


export default function PatientHomeScreen({
  navigate,

  userProfile = {},

  activeRoute,

  navigationProgress,

  visitorAccessRequest,

  onStartRoute,

  onResolveNavigationAccess,

  navigationData,

  activeHospital,

  hospitalDetection,
}) {
  const {
    appColors,
    liveRoute,
    t,
  } = useApp();

  // Rota real em andamento (a mesma regra da barra acima das abas).
  const routeInProgress =
    isRouteBarVisible(liveRoute);

  const routeBarSpace =
    useRouteBarSpace();


  /*
   * PERFIL
   */

  const area =
    getAreaById(
      userProfile.area ||
        'private'
    );


  const isVisitor =
    userProfile.type ===
    'visitor';


  const name =
    userProfile.name ||
    (isVisitor
      ? t('common.visitor')
      : t('common.patient'));


  /*
   * VISITANTE
   */

  const visitStatus =
    visitorAccessRequest
      ?.status;


  const visitPending =
    isVisitor &&
    visitorAccessRequest &&
    PENDING_STATUSES.has(
      visitStatus
    );


  const visitApproved =
    isVisitor &&
    APPROVED_STATUSES.has(
      visitStatus
    );


  const visitDenied =
    isVisitor &&
    DENIED_STATUSES.has(
      visitStatus
    );


  const [
    now,
    setNow,
  ] = useState(
    Date.now()
  );


  const remaining =
    useMemo(
      () =>
        getRemainingTime(
          visitorAccessRequest,
          now,
          t
        ),
      [
        visitorAccessRequest,
        now,
        t,
      ]
    );


  const visitExpired =
    isVisitor &&
    (
      visitStatus ===
        'EXPIRED' ||
      remaining.expired
    );


  /*
   * RECEPÇÃO
   */

  const reception =
    navigationData
      ?.destinations
      ?.find(
        (item) =>
          item.code ===
            `${area.id}-reception` ||

          item.id ===
            `${area.id}-reception`
      ) ||
    getReceptionDestination(
      area.id
    );


  /*
   * DESTINO AUTORIZADO
   */

  const authorizedDestination =
    navigationData
      ?.destinations
      ?.find(
        (destination) =>
          destination.code ===
            visitorAccessRequest
              ?.destinationCode ||

          destination.id ===
            visitorAccessRequest
              ?.destinationCode ||

          destination.id ===
            visitorAccessRequest
              ?.destinationId ||

          destination.name ===
            visitorAccessRequest
              ?.requestedDestination
      );


  /*
   * TIMER VISITANTE
   */

  useEffect(() => {
    if (!visitApproved) {
      return undefined;
    }

    const interval =
      setInterval(() => {
        setNow(
          Date.now()
        );
      }, 1000);

    return () =>
      clearInterval(
        interval
      );
  }, [visitApproved]);


  /*
   * AÇÕES
   */

  const openSearch =
    () => {
      navigate(
        'Search'
      );
    };


  const goReception =
    () => {
      if (
        reception &&
        onStartRoute
      ) {
        onStartRoute(
          reception
        );

        return;
      }

      navigate(
        'Search',
        {
          query:
            'Recepção',
        }
      );
    };


  const startAuthorizedRoute =
    () => {
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
              visitorAccessRequest
                ?.id,


            visitorAccessToken:

              visitorAccessRequest?.accessToken,

            visitorAccessRequest,

            // O botão já é "Iniciar rota": não pede de novo no mapa.
            startNow: true,
          }
        );

        return;
      }


      const rdest = visitorAccessRequest?.requestedDestination;
      navigate(
        'Search',
        {
          query:
            visitorAccessRequest?.allowedRoute ||
            (typeof rdest === 'string' ? rdest : rdest?.name) ||
            '',
        }
      );
    };


  /*
   * ACESSOS RÁPIDOS
   */

  const quickItems =
    isVisitor
      ? [
          {
            icon:
              'face-agent',

            tone: 'amber',

            title:
              t('home.quick.reception'),

            onPress:
              goReception,
          },

          {
            icon:
              'human-male-female',

            tone: 'teal',

            title:
              t('home.quick.restrooms'),

            onPress: () =>
              navigate(
                'Search',
                {
                  query:
                    'Banheiro',
                }
              ),
          },

          // Era "Lanchonete", que não existe nos dados do mapa (a busca abria vazia).
          // Sala de espera existe nas duas unidades e é liberada para visitante.
          {
            icon:
              'sofa-outline',

            tone: 'violet',

            title:
              t('home.quick.waitingRoom'),

            onPress: () =>
              navigate(
                'Search',
                {
                  query:
                    'Sala de espera',
                }
              ),
          },

          {
            icon:
              'exit-run',

            tone: 'green',

            title:
              t('home.quick.exit'),

            onPress: () =>
              navigate(
                'Search',
                {
                  query:
                    'Saída',
                }
              ),
          },
        ]
      : [
          {
            icon:
              'office-building-marker-outline',

            tone: 'wine',

            title:
              t('home.quick.sectors'),

            onPress: () =>
              navigate(
                'Search',
                {
                  category:
                    'Atendimento',
                }
              ),
          },

          {
            icon:
              'flask-outline',

            tone: 'blue',

            title:
              t('home.quick.exams'),

            onPress: () =>
              navigate(
                'Search',
                {
                  category:
                    'Exames',
                }
              ),
          },

          {
            icon:
              'human-male-female',

            tone: 'teal',

            title:
              t('home.quick.restrooms'),

            onPress: () =>
              navigate(
                'Search',
                {
                  query:
                    'Banheiro',
                }
              ),
          },

          {
            icon:
              'face-agent',

            tone: 'amber',

            title:
              t('home.quick.reception'),

            onPress:
              goReception,
          },
        ];


  return (
    <Screen
      scroll={false}
      padded={false}
      withBottomTabs
      topInset={false}
    >
      <View
        style={[
          styles.stage,
          {
            backgroundColor:
              appColors.background,
          },
        ]}
      >
        <AppHeader
          navigate={
            navigate
          }
        />

        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={[
            styles.content,
            // Com a barra "Rota em andamento" visível, nada fica escondido atrás dela.
            {
              paddingBottom:
                HOME_BOTTOM_SPACE +
                routeBarSpace,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
        >
          {/*
           * 1. SAUDAÇÃO
           */}

          <View style={styles.hero}>
            <Text
              style={[styles.hello, { color: appColors.text }]}
              accessibilityRole="header"
            >
              {t('home.hello', { name })}
            </Text>

            <Text style={[styles.heroSubtitle, { color: appColors.muted }]}>
              {routeInProgress
                ? t('home.routeInProgress')
                : isVisitor
                  ? t('home.visitorSub')
                  : t('home.patientSub')}
            </Text>
          </View>

          {/*
           * 2. BUSCA
           */}

          <Pressable
            onPress={openSearch}
            accessibilityRole="search"
            accessibilityLabel={t('home.searchA11y')}
            style={({ pressed }) => [
              styles.searchCard,
              {
                backgroundColor: appColors.surface,
                borderColor: appColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.tile40, { backgroundColor: appColors.iconBg }]}>
              <MaterialCommunityIcons name="magnify" size={22} color={appColors.primary} />
            </View>

            <Text
              numberOfLines={1}
              style={[styles.searchText, { color: appColors.muted }]}
            >
              {t('home.searchPlaceholder')}
            </Text>

            <View style={[styles.searchArrow, { backgroundColor: appColors.primaryStrong }]}>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/*
           * 3. COMO CHEGAR AO HOSPITAL
           */}

          <Pressable
            onPress={() => navigate('ExternalRoute')}
            accessibilityRole="button"
            accessibilityLabel={t('home.howToGet')}
            style={({ pressed }) => [
              styles.rowCard,
              {
                backgroundColor: appColors.surface,
                borderColor: appColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.tile40, { backgroundColor: appColors.iconBg }]}>
              <MaterialCommunityIcons name="sign-direction" size={22} color={appColors.primary} />
            </View>

            <Text numberOfLines={2} style={[styles.rowTitle, { color: appColors.text }]}>
              {t('home.howToGet')}
            </Text>

            <MaterialCommunityIcons name="chevron-right" size={22} color={appColors.primary} />
          </Pressable>

          {/*
           * VISITANTE - PENDENTE
           */}

          {visitPending && (
            <Pressable
              onPress={() =>
                navigate(
                  'VisitorAccessStatus',
                  {
                    request:
                      visitorAccessRequest,
                  }
                )
              }
              style={({ pressed }) => [
                styles.statusCard,

                {
                  backgroundColor:
                    appColors.surface,

                  borderColor:
                    '#E4B94F',
                },

                shadows.card,

                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.statusIcon,

                  {
                    backgroundColor:
                      '#FFF4D6',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={21}
                  color="#A96C00"
                />
              </View>


              <View
                style={
                  styles.statusCopy
                }
              >
                <Text
                  style={[
                    styles.statusTitle,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  {t('home.validationNeeded')}
                </Text>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.statusText,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  {t('home.goToReception')}
                </Text>
              </View>


              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={
                  appColors.primary
                }
              />
            </Pressable>
          )}


          {/*
           * VISITANTE - APROVADO
           */}

          {visitApproved &&
            !visitExpired && (
              <View
                style={[
                  styles.approvedCard,

                  {
                    backgroundColor:
                      appColors.surface,

                    borderColor:
                      appColors.success,
                  },

                  shadows.card,
                ]}
              >
                <View
                  style={
                    styles.approvedTop
                  }
                >
                  <View
                    style={[
                      styles.statusIcon,

                      {
                        backgroundColor:
                          appColors.iconBg,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={22}
                      color={
                        appColors.success
                      }
                    />
                  </View>


                  <View
                    style={
                      styles.statusCopy
                    }
                  >
                    <Text
                      style={[
                        styles.statusTitle,

                        {
                          color:
                            appColors.text,
                        },
                      ]}
                    >
                      {t('home.visitAuthorized')}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.statusText,

                        {
                          color:
                            appColors.muted,
                        },
                      ]}
                    >
                      {(() => {
                        const rd = visitorAccessRequest?.requestedDestination;
                        return (typeof rd === 'string' ? rd : rd?.name) || t('home.authorizedDestination');
                      })()}
                    </Text>
                  </View>


                  <View
                    style={
                      styles.timerMini
                    }
                  >
                    <MaterialCommunityIcons
                      name="timer-outline"
                      size={15}
                      color={
                        remaining.level ===
                        'urgent'
                          ? appColors.danger
                          : appColors.primary
                      }
                    />

                    <Text
                      style={[
                        styles.timerText,

                        {
                          color:
                            remaining.level ===
                            'urgent'
                              ? appColors.danger
                              : appColors.text,
                        },
                      ]}
                    >
                      {
                        remaining.label
                      }
                    </Text>
                  </View>
                </View>


                <Pressable
                  onPress={
                    startAuthorizedRoute
                  }
                  style={({ pressed }) => [
                    styles.visitButton,

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
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.visitButtonText
                    }
                  >
                    {t('home.startRoute')}
                  </Text>
                </Pressable>
              </View>
            )}


          {/*
           * VISITANTE - EXPIRADO
           */}

          {visitExpired && (
            <Pressable
              onPress={() =>
                navigate(
                  'VisitorAccessStatus',
                  {
                    request:
                      visitorAccessRequest,
                  }
                )
              }
              style={({ pressed }) => [
                styles.statusCard,

                {
                  backgroundColor:
                    appColors.surface,

                  borderColor:
                    appColors.danger,
                },

                shadows.card,

                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.statusIcon,

                  {
                    backgroundColor:
                      appColors.surfaceAlt,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="timer-alert-outline"
                  size={21}
                  color={
                    appColors.danger
                  }
                />
              </View>


              <View
                style={
                  styles.statusCopy
                }
              >
                <Text
                  style={[
                    styles.statusTitle,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  {t('home.timeOver')}
                </Text>

                <Text
                  style={[
                    styles.statusText,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  {t('home.goToExit')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={
                  appColors.primary
                }
              />
            </Pressable>
          )}


          {/*
           * VISITANTE - NEGADO
           */}

          {visitDenied &&
            !visitExpired && (
              <Pressable
                onPress={
                  goReception
                }
                style={({ pressed }) => [
                  styles.statusCard,

                  {
                    backgroundColor:
                      appColors.surface,

                    borderColor:
                      appColors.danger,
                  },

                  shadows.card,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.statusIcon,

                    {
                      backgroundColor:
                        appColors.surfaceAlt,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={21}
                    color={
                      appColors.danger
                    }
                  />
                </View>

                <View
                  style={
                    styles.statusCopy
                  }
                >
                  <Text
                    style={[
                      styles.statusTitle,

                      {
                        color:
                          appColors.text,
                      },
                    ]}
                  >
                    {t('home.visitNotReleased')}
                  </Text>

                  <Text
                    style={[
                      styles.statusText,

                      {
                        color:
                          appColors.muted,
                      },
                    ]}
                  >
                    {t('home.askReception')}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={
                    appColors.primary
                  }
                />
              </Pressable>
            )}


          {/*
           * 4. APOIO: ESTOU PERDIDO + AJUDA / SOS (o único bloco bordô da tela)
           */}

          <View style={styles.supportRow}>
            <SupportCard
              icon="compass-outline"
              title={t('help.lost')}
              subtitle={t('home.lostSub')}
              onPress={() => navigate('Lost')}
              appColors={appColors}
            />

            <SupportCard
              icon="hand-heart-outline"
              title={t('home.helpSos')}
              subtitle={t('home.sosSub')}
              emergency
              onPress={() => navigate('Help', { type: 'help' })}
              appColors={appColors}
            />
          </View>

          {/*
           * 5. ACESSOS RÁPIDOS (uma linha, quatro cards)
           */}

          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: appColors.text }]}
              accessibilityRole="header"
            >
              {t('home.quickAccess')}
            </Text>

            <View style={styles.quickRow}>
              {quickItems.map((item) => (
                <QuickCard
                  key={item.title}
                  {...item}
                  appColors={appColors}
                />
              ))}
            </View>

            {isVisitor &&
              !visitApproved && (
                <Text style={[styles.accessNotice, { color: appColors.muted }]}>
                  {t('home.visitorPublicOnly')}
                </Text>
              )}
          </View>

          {/*
           * 6. NAVORA IA
           */}

          <Pressable
            onPress={() => navigate('Assistant')}
            accessibilityRole="button"
            accessibilityLabel={`${t('home.aiTitle')}. ${t('home.aiSub')}`}
            style={({ pressed }) => [
              styles.aiCard,
              {
                backgroundColor: appColors.surface,
                borderColor: appColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.tile46, { backgroundColor: appColors.iconBg }]}>
              <MaterialCommunityIcons name="star-four-points" size={23} color={appColors.primary} />
            </View>

            <View style={styles.cardCopy}>
              <View style={styles.aiTitleRow}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: appColors.text }]}>
                  {t('home.aiTitle')}
                </Text>

                <View style={[styles.aiBadge, { backgroundColor: appColors.iconBg }]}>
                  <Text
                    style={[styles.aiBadgeText, { color: appColors.primary }]}
                    maxFontSizeMultiplier={1.2}
                  >
                    {t('home.assistant')}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={2} style={[styles.cardSubtitle, { color: appColors.muted }]}>
                {t('home.aiSub')}
              </Text>
            </View>

            <View style={[styles.arrowTile, { backgroundColor: appColors.iconBg }]}>
              <MaterialCommunityIcons name="chevron-right" size={20} color={appColors.primary} />
            </View>
          </Pressable>

          {/*
           * 7. ACESSIBILIDADE
           */}

          <Pressable
            onPress={() => navigate('Accessibility')}
            accessibilityRole="button"
            accessibilityLabel={`${t('home.accessibility')}. ${t('home.adjustRoute')}`}
            style={({ pressed }) => [
              styles.rowCard,
              {
                backgroundColor: appColors.surface,
                borderColor: appColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.tile40, { backgroundColor: appColors.iconBg }]}>
              <MaterialCommunityIcons name="wheelchair-accessibility" size={21} color={appColors.primary} />
            </View>

            <View style={styles.cardCopy}>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: appColors.text }]}>
                {t('home.accessibility')}
              </Text>
              <Text numberOfLines={2} style={[styles.cardSubtitle, { color: appColors.muted }]}>
                {t('home.adjustRoute')}
              </Text>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={22} color={appColors.primary} />
          </Pressable>
        </ScrollView>

        <BottomTabs
          active="Home"
          navigate={navigate}
        />
      </View>
    </Screen>
  );
}


/*
 * ACESSO RÁPIDO
 */

function QuickCard({
  icon,
  title,
  onPress,
  appColors,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: appColors.surface,
          borderColor: appColors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.tile46, { backgroundColor: appColors.iconBg }]}>
        <MaterialCommunityIcons name={icon} size={24} color={appColors.primary} />
      </View>

      {/* "Banheiros"/"Recepção" não podem cortar: encolhe um pouco e, se
          ainda não couber (tela pequena / fonte aumentada), quebra em 2 linhas. */}
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        maxFontSizeMultiplier={1.4}
        style={[styles.quickTitle, { color: appColors.text }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}


/*
 * AJUDA
 */

function SupportCard({
  icon,
  title,
  subtitle,
  emergency = false,
  onPress,
  appColors,
}) {
  const textColor = emergency ? '#FFFFFF' : appColors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.supportCard,
        {
          backgroundColor: emergency ? appColors.primaryStrong : appColors.surface,
          borderColor: emergency ? appColors.primaryStrong : appColors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.tile40,
          {
            backgroundColor: emergency
              ? 'rgba(255, 255, 255, 0.18)'
              : appColors.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={emergency ? '#FFFFFF' : appColors.primary}
        />
      </View>

      <Text numberOfLines={2} style={[styles.supportTitle, { color: textColor }]}>
        {title}
      </Text>

      <Text
        numberOfLines={2}
        style={[
          styles.supportSubtitle,
          { color: emergency ? 'rgba(255, 255, 255, 0.86)' : appColors.muted },
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}


/*
 * TIMER VISITANTE
 */

function getExpiryTimestamp(
  request
) {
  if (!request) {
    return null;
  }


  if (
    request.expiresAt ||
    request.validUntil
  ) {
    const timestamp =
      new Date(
        request.expiresAt ||
          request.validUntil
      ).getTime();

    if (
      Number.isFinite(
        timestamp
      )
    ) {
      return timestamp;
    }
  }


  if (
    request.authorizedAt &&
    request.permissionMinutes
  ) {
    const start =
      new Date(
        request.authorizedAt
      ).getTime();

    if (
      Number.isFinite(
        start
      )
    ) {
      return (
        start +
        Number(
          request.permissionMinutes
        ) *
          60000
      );
    }
  }


  return null;
}


function getRemainingTime(
  request,
  now,
  t
) {
  const expiry =
    getExpiryTimestamp(
      request
    );


  if (!expiry) {
    return {
      label:
        request
          ?.allowedTime ||
        t('home.setByReception'),

      expired:
        false,

      level:
        'normal',
    };
  }


  const remainingMs =
    expiry - now;


  if (
    remainingMs <= 0
  ) {
    return {
      label:
        '00:00:00',

      expired:
        true,

      level:
        'expired',
    };
  }


  const totalSeconds =
    Math.floor(
      remainingMs /
        1000
    );


  const hours =
    String(
      Math.floor(
        totalSeconds /
          3600
      )
    ).padStart(
      2,
      '0'
    );


  const minutes =
    String(
      Math.floor(
        (
          totalSeconds %
          3600
        ) /
          60
      )
    ).padStart(
      2,
      '0'
    );


  const seconds =
    String(
      totalSeconds %
        60
    ).padStart(
      2,
      '0'
    );


  let level =
    'normal';


  if (
    totalSeconds <=
    300
  ) {
    level =
      'urgent';
  } else if (
    totalSeconds <=
    900
  ) {
    level =
      'warning';
  }


  return {
    label:
      `${hours}:${minutes}:${seconds}`,

    expired:
      false,

    level,
  };
}


const styles =
  StyleSheet.create({
    cardSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: '900',
      flexShrink: 1,
    },

    cardCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },

    quickRow: {
      flexDirection: 'row',
      gap: 8,
    },

    supportSubtitle: {
      fontSize: 12.5,
      lineHeight: 16,
      fontWeight: '600',
    },

    supportRow: {
      flexDirection: 'row',
      gap: 10,
    },

    rowTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '800',
    },

    rowCard: {
      minHeight: 60,
      borderRadius: 18,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    arrowTile: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },

    tile46: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },

    tile40: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    stage: {
      flex: 1,
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      gap: 12,
    },


    /*
     * HERO
     */

    hero: {
      gap: 4,
      marginBottom: 2,
    },

    hello: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '900',
      letterSpacing: -0.4,
    },

    heroSubtitle: {
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '600',
    },


    /*
     * BUSCA
     */

    searchCard: {
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      paddingVertical: 8,
      paddingLeft: 8,
      paddingRight: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    searchText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
    },

    searchArrow: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    directionsChip: {
      height: 42,

      borderRadius: 21,

      paddingHorizontal: 8,
      paddingRight: 14,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 9,

      alignSelf: 'flex-start',

      marginBottom: 18,

      marginTop: -8,
    },

    directionsChipIcon: {
      width: 28,

      height: 28,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    directionsChipText: {
      fontSize: 12,

      fontWeight: '800',
    },


    /*
     * SEÇÕES
     */

    section: {
      gap: 10,
      marginTop: 4,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '900',
    },


    /*
     * ACESSOS
     */

    quickGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      justifyContent:
        'space-between',

      rowGap: 10,
    },

    quickCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 96,
      borderRadius: 18,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    quickIcon: {
      width: 56,

      height: 56,

      borderRadius: 18,
      borderWidth: 1,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    quickTitle: {
      fontSize: 11.5,
      lineHeight: 14,
      fontWeight: '800',
      textAlign: 'center',
      alignSelf: 'stretch',
    },

    accessNotice: {
      marginTop: 9,

      fontSize: 10.5,

      lineHeight: 15,

      fontWeight: '500',
    },


    /*
     * IA
     */

    aiCard: {
      minHeight: 76,
      borderRadius: 20,
      borderWidth: 1,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    aiMainIcon: {
      width: 50,

      height: 50,

      borderRadius: 16,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    aiCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 12,

      marginRight: 7,
    },

    aiTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },

    aiTitle: {
      fontSize: 15,

      fontWeight: '900',
    },

    aiBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },

    aiBadgeText: {
      fontSize: 11,
      fontWeight: '900',
    },

    aiDescription: {
      marginTop: 4,

      fontSize: 10.5,

      lineHeight: 15,
    },


    /*
     * LOCALIZAÇÃO
     */

    locationCard: {
      minHeight: 76,

      borderRadius: 18,

      borderWidth: 1,

      paddingHorizontal: 13,

      flexDirection: 'row',

      alignItems: 'center',
    },

    locationIcon: {
      width: 43,

      height: 43,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    locationCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,

      marginRight: 8,
    },

    locationLabel: {
      fontSize: 8.5,

      letterSpacing: 0.5,

      fontWeight: '900',
    },

    locationTitle: {
      marginTop: 3,

      fontSize: 13.5,

      fontWeight: '900',
    },

    locationMeta: {
      marginTop: 2,

      fontSize: 10.5,

      lineHeight: 14,
    },

    locationStatus: {
      width: 30,

      height: 30,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    locationDot: {
      width: 8,

      height: 8,

      borderRadius: 4,
    },


    /*
     * JORNADA
     */

    journeyCard: {
      minHeight: 82,

      borderRadius: 18,

      borderWidth: 1,

      marginTop: 10,

      paddingHorizontal: 13,

      flexDirection: 'row',

      alignItems: 'center',
    },

    journeyIcon: {
      width: 44,

      height: 44,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    journeyCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,

      marginRight: 7,
    },

    journeyLabel: {
      fontSize: 8.5,

      letterSpacing: 0.5,

      fontWeight: '900',
    },

    journeyTitle: {
      marginTop: 3,

      fontSize: 14,

      fontWeight: '900',
    },

    journeyMeta: {
      marginTop: 3,

      fontSize: 10.5,

      lineHeight: 14,
    },


    /*
     * VISITANTE
     */

    statusCard: {
      minHeight: 70,

      borderRadius: 18,

      borderWidth: 1,

      paddingHorizontal: 12,

      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 18,
    },

    statusIcon: {
      width: 42,

      height: 42,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    statusCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,

      marginRight: 6,
    },

    statusTitle: {
      fontSize: 13.5,

      lineHeight: 17,

      fontWeight: '900',
    },

    statusText: {
      marginTop: 2,

      fontSize: 11,

      lineHeight: 15,

      fontWeight: '500',
    },

    approvedCard: {
      borderRadius: 18,

      borderWidth: 1,

      padding: 12,

      marginBottom: 18,
    },

    approvedTop: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    timerMini: {
      alignItems: 'flex-end',

      gap: 2,
    },

    timerText: {
      fontSize: 10,

      fontWeight: '900',
    },

    visitButton: {
      minHeight: 42,

      borderRadius: 13,

      marginTop: 10,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,
    },

    visitButtonText: {
      color: '#FFFFFF',

      fontSize: 12,

      fontWeight: '900',
    },


    /*
     * AJUDA
     */

    supportGrid: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      marginBottom: 10,
    },

    supportCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 116,
      borderRadius: 20,
      borderWidth: 1,
      padding: 12,
      gap: 6,
    },

    supportIcon: {
      width: 37,

      height: 37,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    supportTitle: {
      fontSize: 15,
      lineHeight: 19,
      fontWeight: '900',
      marginTop: 2,
    },


    /*
     * ACESSIBILIDADE
     */

    accessibilityCard: {
      minHeight: 58,

      borderRadius: 16,

      borderWidth: 1,

      paddingHorizontal: 11,

      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 8,
    },

    accessibilityIcon: {
      width: 37,

      height: 37,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    accessibilityText: {
      marginLeft: 9,

      fontSize: 12.5,

      fontWeight: '900',
    },

    accessibilityMeta: {
      flex: 1,

      marginLeft: 8,

      fontSize: 9.5,

      textAlign: 'right',
    },


    pressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },
  });