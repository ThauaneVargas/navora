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
  shadows,
} from '../theme/colors';

import {
  useApp,
} from '../context/AppContext';

import {
  getAreaById,
  getReceptionDestination,
} from '../data/routes';


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
  } = useApp();


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
      ? 'Visitante'
      : 'Paciente');


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
          now
        ),
      [
        visitorAccessRequest,
        now,
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
   * ROTA ATIVA
   */

  const hasActiveRoute =
    Boolean(
      activeRoute?.status ===
        'active' ||
      activeRoute?.destination
    );


  const activeDestination =
    activeRoute?.destination ||
    userProfile
      .lastDestination ||
    'Destino selecionado';


  /*
   * LOCALIZAÇÃO
   */

  const presenceDetected =
    Boolean(
      userProfile
        .currentBeacon ||

      userProfile
        .arrivalStatus ===
        'INDOOR' ||

      hospitalDetection
        ?.arrivalStatus ===
        'INDOOR' ||

      hospitalDetection
        ?.status ===
        'confirmed'
    );


  const currentLocation =
    userProfile
      .currentLocation ||

    area.entryLabel ||

    activeHospital?.name ||

    'Entrada identificada';


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

            visitorAccessRequest,
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
              'desk',

            title:
              'Recepção',

            onPress:
              goReception,
          },

          {
            icon:
              'toilet',

            title:
              'Banheiros',

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
              'food-fork-drink',

            title:
              'Lanchonete',

            onPress: () =>
              navigate(
                'Search',
                {
                  query:
                    'Lanchonete',
                }
              ),
          },

          {
            icon:
              'exit-run',

            title:
              'Saída',

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
              'office-building-outline',

            title:
              'Setores',

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

            title:
              'Exames',

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
              'toilet',

            title:
              'Banheiros',

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
              'desk',

            title:
              'Recepção',

            onPress:
              goReception,
          },
        ];


  return (
    <Screen
      scroll={false}
      padded={false}
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
        {/*
         * HEADER
         */}

        <AppHeader
          navigate={
            navigate
          }
        />


        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
        >
          {/*
           * BOAS-VINDAS
           */}

          <View
            style={
              styles.hero
            }
          >
            <Text
              style={[
                styles.hello,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              Olá, {name}!
            </Text>

            <Text
              style={[
                styles.heroSubtitle,

                {
                  color:
                    appColors.muted,
                },
              ]}
            >
              {isVisitor
                ? 'O Navora acompanha sua visita.'
                : 'Para onde vamos hoje?'}
            </Text>
          </View>


          {/*
           * BUSCA
           */}

          <Pressable
            onPress={
              openSearch
            }
            style={({ pressed }) => [
              styles.searchCard,

              {
                backgroundColor:
                  appColors.surface,

                borderColor:
                  appColors.border,
              },

              shadows.card,

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={
                appColors.primary
              }
            />

            <Text
              style={[
                styles.searchText,

                {
                  color:
                    appColors.muted,
                },
              ]}
            >
              Buscar setor, serviço ou destino
            </Text>

            <View
              style={[
                styles.searchArrow,

                {
                  backgroundColor:
                    appColors.iconBg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={
                  appColors.primary
                }
              />
            </View>
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
                  Validação necessária
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
                  Vá à recepção para confirmar sua visita.
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
                      Visita autorizada
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
                        return (typeof rd === 'string' ? rd : rd?.name) || 'Destino autorizado';
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
                    Iniciar rota
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
                  Tempo encerrado
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
                  Vá à saída ou procure a recepção.
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
                    Visita não liberada
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
                    Procure a recepção para orientação.
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
           * ACESSOS
           */}

          <View
            style={
              styles.section
            }
          >
            <Text
              style={[
                styles.sectionTitle,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              Acessos rápidos
            </Text>


            <View
              style={
                styles.quickGrid
              }
            >
              {quickItems.map(
                (item) => (
                  <QuickCard
                    key={
                      item.title
                    }
                    {...item}
                    appColors={
                      appColors
                    }
                  />
                )
              )}
            </View>


            {isVisitor &&
              !visitApproved && (
                <Text
                  style={[
                    styles.accessNotice,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  Enquanto a visita não for liberada, somente destinos públicos ficam disponíveis.
                </Text>
              )}
          </View>


          {/*
           * IA
           */}

          <Pressable
            onPress={() =>
              navigate(
                'Assistant'
              )
            }
            style={({ pressed }) => [
              styles.aiCard,

              {
                backgroundColor:
                  appColors.surface,

                borderColor:
                  appColors.border,
              },

              shadows.card,

              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={[
                styles.aiMainIcon,

                {
                  backgroundColor:
                    appColors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="microphone"
                size={25}
                color="#FFFFFF"
              />
            </View>


            <View
              style={
                styles.aiCopy
              }
            >
              <View
                style={
                  styles.aiTitleRow
                }
              >
                <Text
                  style={[
                    styles.aiTitle,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  Navora IA
                </Text>

                <View
                  style={[
                    styles.aiBadge,

                    {
                      backgroundColor:
                        appColors.iconBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.aiBadgeText,

                      {
                        color:
                          appColors.primary,
                      },
                    ]}
                  >
                    Assistente
                  </Text>
                </View>
              </View>


              <Text
                numberOfLines={2}
                style={[
                  styles.aiDescription,

                  {
                    color:
                      appColors.muted,
                  },
                ]}
              >
                Pergunte por rotas, localização, acessibilidade ou orientação.
              </Text>
            </View>


            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={
                appColors.primary
              }
            />
          </Pressable>


          {/*
           * SUA JORNADA
           */}

          <View
            style={
              styles.section
            }
          >
            <Text
              style={[
                styles.sectionTitle,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              Sua jornada
            </Text>


            {/*
             * LOCALIZAÇÃO
             */}

            <View
              style={[
                styles.locationCard,

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
                  styles.locationIcon,

                  {
                    backgroundColor:
                      appColors.iconBg,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={22}
                  color={
                    appColors.primary
                  }
                />
              </View>


              <View
                style={
                  styles.locationCopy
                }
              >
                <Text
                  style={[
                    styles.locationLabel,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  LOCALIZAÇÃO ATUAL
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationTitle,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  {currentLocation}
                </Text>

                <Text
                  style={[
                    styles.locationMeta,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  {presenceDetected
                    ? 'Localização interna identificada'
                    : 'Localização aproximada'}
                </Text>
              </View>


              <View
                style={[
                  styles.locationStatus,

                  {
                    backgroundColor:
                      presenceDetected
                        ? appColors.iconBg
                        : appColors.surfaceAlt,
                  },
                ]}
              >
                <View
                  style={[
                    styles.locationDot,

                    {
                      backgroundColor:
                        presenceDetected
                          ? appColors.success
                          : appColors.muted,
                    },
                  ]}
                />
              </View>
            </View>


            {/*
             * ROTA OU PRONTO PARA NAVEGAR
             */}

            {hasActiveRoute ? (
              <Pressable
                onPress={() =>
                  navigate(
                    'Navigation',
                    {
                      destination:
                        activeDestination,
                    }
                  )
                }
                style={({ pressed }) => [
                  styles.journeyCard,

                  {
                    backgroundColor:
                      appColors.surface,

                    borderColor:
                      appColors.border,
                  },

                  shadows.card,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.journeyIcon,

                    {
                      backgroundColor:
                        appColors.primary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="navigation-variant"
                    size={23}
                    color="#FFFFFF"
                  />
                </View>


                <View
                  style={
                    styles.journeyCopy
                  }
                >
                  <Text
                    style={[
                      styles.journeyLabel,

                      {
                        color:
                          appColors.muted,
                      },
                    ]}
                  >
                    ROTA EM ANDAMENTO
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.journeyTitle,

                      {
                        color:
                          appColors.text,
                      },
                    ]}
                  >
                    {
                      activeDestination
                    }
                  </Text>

                  <Text
                    style={[
                      styles.journeyMeta,

                      {
                        color:
                          appColors.muted,
                      },
                    ]}
                  >
                    {[
                      activeRoute
                        ?.distance,

                      navigationProgress
                        ?.currentFloor ||
                        activeRoute
                          ?.eta,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(' • ') ||
                      'Orientação ativa'}
                  </Text>
                </View>


                <MaterialCommunityIcons
                  name="chevron-right"
                  size={23}
                  color={
                    appColors.primary
                  }
                />
              </Pressable>
            ) : (
              <Pressable
                onPress={
                  openSearch
                }
                style={({ pressed }) => [
                  styles.journeyCard,

                  {
                    backgroundColor:
                      appColors.surface,

                    borderColor:
                      appColors.border,
                  },

                  shadows.card,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.journeyIcon,

                    {
                      backgroundColor:
                        appColors.iconBg,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="navigation-variant-outline"
                    size={23}
                    color={
                      appColors.primary
                    }
                  />
                </View>


                <View
                  style={
                    styles.journeyCopy
                  }
                >
                  <Text
                    style={[
                      styles.journeyLabel,

                      {
                        color:
                          appColors.muted,
                      },
                    ]}
                  >
                    SUA PRÓXIMA ROTA
                  </Text>

                  <Text
                    style={[
                      styles.journeyTitle,

                      {
                        color:
                          appColors.text,
                      },
                    ]}
                  >
                    Pronto para navegar
                  </Text>

                  <Text
                    style={[
                      styles.journeyMeta,

                      {
                        color:
                          appColors.muted,
                      },
                    ]}
                  >
                    Escolha um destino e inicie sua rota.
                  </Text>
                </View>


                <MaterialCommunityIcons
                  name="chevron-right"
                  size={23}
                  color={
                    appColors.primary
                  }
                />
              </Pressable>
            )}
          </View>


          {/*
           * AJUDA RÁPIDA
           */}

          <View
            style={
              styles.supportGrid
            }
          >
            <SupportCard
              icon="map-marker-question-outline"
              title="Estou perdido"
              onPress={() =>
                navigate(
                  'Lost'
                )
              }
              appColors={
                appColors
              }
            />

            <SupportCard
              icon="alarm-light-outline"
              title="Ajuda / SOS"
              onPress={() =>
                navigate(
                  'Help',
                  {
                    type:
                      'help',
                  }
                )
              }
              appColors={
                appColors
              }
            />
          </View>


          <Pressable
            onPress={() =>
              navigate(
                'Accessibility'
              )
            }
            style={({ pressed }) => [
              styles.accessibilityCard,

              {
                backgroundColor:
                  appColors.surface,

                borderColor:
                  appColors.border,
              },

              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={[
                styles.accessibilityIcon,

                {
                  backgroundColor:
                    appColors.iconBg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="wheelchair-accessibility"
                size={20}
                color={
                  appColors.primary
                }
              />
            </View>

            <Text
              style={[
                styles.accessibilityText,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              Acessibilidade
            </Text>

            <Text
              style={[
                styles.accessibilityMeta,

                {
                  color:
                    appColors.muted,
                },
              ]}
            >
              Ajustar rota e orientação
            </Text>

            <MaterialCommunityIcons
              name="chevron-right"
              size={21}
              color={
                appColors.primary
              }
            />
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
      style={({ pressed }) => [
        styles.quickCard,

        {
          backgroundColor:
            appColors.surface,

          borderColor:
            appColors.border,
        },

        shadows.card,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.quickIcon,

          {
            backgroundColor:
              appColors.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={
            appColors.primary
          }
        />
      </View>

      <Text
        style={[
          styles.quickTitle,

          {
            color:
              appColors.text,
          },
        ]}
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
  onPress,
  appColors,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.supportCard,

        {
          backgroundColor:
            appColors.surface,

          borderColor:
            appColors.border,
        },

        shadows.card,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.supportIcon,

          {
            backgroundColor:
              appColors.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={
            appColors.primary
          }
        />
      </View>

      <Text
        style={[
          styles.supportTitle,

          {
            color:
              appColors.text,
          },
        ]}
      >
        {title}
      </Text>

      <MaterialCommunityIcons
        name="chevron-right"
        size={19}
        color={
          appColors.muted
        }
      />
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
  now
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
        'Definido pela recepção',

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
    stage: {
      flex: 1,
    },

    scroll: {
      flex: 1,
    },

    content: {
      width: '100%',

      maxWidth: 430,

      alignSelf: 'center',

      paddingHorizontal: 18,

      paddingBottom: 110,
    },


    /*
     * HERO
     */

    hero: {
      paddingTop: 18,

      paddingBottom: 15,
    },

    hello: {
      fontSize: 24,

      lineHeight: 29,

      fontWeight: '900',

      letterSpacing: -0.4,
    },

    heroSubtitle: {
      marginTop: 3,

      fontSize: 12.5,

      lineHeight: 18,

      fontWeight: '500',
    },


    /*
     * BUSCA
     */

    searchCard: {
      minHeight: 52,

      borderRadius: 17,

      borderWidth: 1,

      paddingHorizontal: 13,

      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 18,
    },

    searchText: {
      flex: 1,

      marginLeft: 10,

      fontSize: 12.5,

      fontWeight: '600',
    },

    searchArrow: {
      width: 31,
      height: 31,

      borderRadius: 11,

      alignItems: 'center',

      justifyContent:
        'center',
    },


    /*
     * SEÇÕES
     */

    section: {
      marginBottom: 19,
    },

    sectionTitle: {
      fontSize: 17,

      lineHeight: 22,

      fontWeight: '900',

      marginBottom: 11,
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
      width: '48.5%',

      minHeight: 92,

      borderRadius: 18,

      borderWidth: 1,

      padding: 13,

      justifyContent:
        'space-between',
    },

    quickIcon: {
      width: 40,

      height: 40,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    quickTitle: {
      marginTop: 9,

      fontSize: 12.5,

      lineHeight: 16,

      fontWeight: '900',
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
      minHeight: 88,

      borderRadius: 20,

      borderWidth: 1,

      paddingHorizontal: 14,

      paddingVertical: 13,

      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 20,
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

      gap: 7,
    },

    aiTitle: {
      fontSize: 15,

      fontWeight: '900',
    },

    aiBadge: {
      minHeight: 21,

      borderRadius: 11,

      paddingHorizontal: 7,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    aiBadgeText: {
      fontSize: 8.5,

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
      width: '48.5%',

      minHeight: 64,

      borderRadius: 17,

      borderWidth: 1,

      paddingHorizontal: 11,

      flexDirection: 'row',

      alignItems: 'center',
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
      flex: 1,

      minWidth: 0,

      marginLeft: 8,

      fontSize: 11.5,

      lineHeight: 15,

      fontWeight: '900',
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