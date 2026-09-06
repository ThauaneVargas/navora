import React, {
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import Screen from '../components/Screen';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';

import {
  shadows,
} from '../theme/colors';

import {
  useApp,
} from '../context/AppContext';

import {
  getAreaById,
} from '../data/routes';

import {
  navoraApi,
} from '../services/api';


export default function HelpScreen({
  navigate,
  routeParams = {},
  userType = 'patient',
  userProfile,
  onCreateHelpRequest,
}) {
  const insets =
    useSafeAreaInsets();

  const {
    appColors,
    currentLocation:
      fallbackLocation,
  } = useApp();

  const styles =
    useMemo(
      () =>
        createStyles(
          appColors
        ),
      [appColors]
    );

  const [
    lastRequest,
    setLastRequest,
  ] = useState(null);

  const [
    submittingKind,
    setSubmittingKind,
  ] = useState(null);


  const currentLocation = {
    ...fallbackLocation,

    name:
      userProfile?.currentLocation ||
      fallbackLocation.name,

    beacon:
      userProfile?.currentBeacon ||
      fallbackLocation.beacon,
  };


  const profileLabel =
    userProfile?.type ===
      'visitor' ||
    userType ===
      'visitor'
      ? 'Visitante'
      : 'Paciente';


  const latestRequest =
    lastRequest || {
      title:
        'Aguardando atendimento',

      subtitle:
        routeParams.type ===
        'sos'
          ? 'Solicitação urgente em andamento'
          : 'Solicitada há 2 min',
    };


  const submit = async (
    kind,
    reason
  ) => {
    if (submittingKind) {
      return;
    }

    const isSos =
      kind === 'sos';

    setSubmittingKind(
      kind
    );

    const area =
      getAreaById(
        userProfile?.area ||
          'private'
      );


    const localRequest = {
      tipo:
        isSos
          ? 'SOS Emergência'
          : 'Pedido de ajuda',

      motivo:
        reason,

      urgente:
        isSos,

      perfil:
        profileLabel,

      status:
        'Pendente',

      local:
        currentLocation.name,

      setor:
        currentLocation.corridor,
    };


    const payload = {
      user_type:
        userProfile?.type ||
        userType ||
        'patient',

      user_name:
        userProfile?.name ||
        (profileLabel ===
        'Visitante'
          ? 'Visitante Navora'
          : 'Paciente Navora'),

      area:
        area.id,

      area_name:
        area.name,

      patient_name:
        userProfile?.name ||
        (profileLabel ===
        'Visitante'
          ? 'Visitante Navora'
          : 'Paciente Navora'),

      call_type:
        isSos
          ? 'SOS'
          : 'HELP',

      reason,

      location:
        currentLocation.name,

      sector:
        currentLocation.corridor,

      beacon_code:
        currentLocation.beacon,

      message:
        reason,

      priority:
        isSos
          ? 'CRITICAL'
          : 'MEDIUM',
    };


    try {
      const apiResponse =
        isSos
          ? await navoraApi.createSos(
              payload
            )
          : await navoraApi.createHelpRequest(
              payload
            );


      const request =
        apiResponse?.demoMode
          ? onCreateHelpRequest?.(
              localRequest
            )
          : apiResponse;


      setLastRequest({
        title:
          isSos
            ? 'SOS enviado'
            : 'Aguardando atendimento',

        subtitle:
          request?.id
            ? `Protocolo ${request.id}`
            : 'Solicitada agora',
      });
    } catch (error) {
      Alert.alert(
        'Não foi possível enviar',
        'Confira a conexão e tente novamente. Se for urgente, procure a recepção imediatamente.'
      );
    } finally {
      setSubmittingKind(
        null
      );
    }
  };


  const confirmSos = () => {
    Alert.alert(
      'Acionar SOS?',
      'Use o SOS apenas em situação urgente. A equipe receberá sua localização atual.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text:
            'Acionar SOS',

          style:
            'destructive',

          onPress: () =>
            submit(
              'sos',
              'Atendimento imediato'
            ),
        },
      ]
    );
  };


  const actions = {
    help: () =>
      submit(
        'help',
        'Preciso de ajuda'
      ),

    sos:
      confirmSos,

    lost: () =>
      navigate('Lost'),

    accessibility: () =>
      navigate(
        'Accessibility'
      ),

    reception: () =>
      submit(
        'help',
        'Contato com recepção'
      ),

    request: () =>
      navigate(
        'Notifications'
      ),
  };


  return (
    <Screen
      scroll={false}
      padded={false}
    >
      <View
        style={
          styles.stage
        }
      >
        {/* CABEÇALHO PADRÃO */}

        <Header
          title="Ajuda e SOS"
          centerTitle
          onMenu={() =>
            navigate('Menu')
          }
          onNotifications={() =>
            navigate(
              'Notifications'
            )
          }
        />


        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,

            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  14
                ) + 104,
            },
          ]}
        >
          {/* COMEÇA DIRETO NO CONTEÚDO */}

          <View
            style={
              styles.sectionIntro
            }
          >
            <Text
              style={
                styles.heroTitle
              }
            >
              Como podemos ajudar?
            </Text>

            <Text
              style={
                styles.sectionText
              }
            >
              Escolha a opção que melhor se aplica à sua necessidade.
            </Text>
          </View>


          <View
            style={
              styles.mainGrid
            }
          >
            <ActionTile
              icon="headphones"
              title="Preciso de ajuda"
              subtitle="Falar com a equipe"
              onPress={
                actions.help
              }
              loading={
                submittingKind ===
                'help'
              }
              appColors={
                appColors
              }
              styles={styles}
            />

            <ActionTile
              icon="alarm-light-outline"
              title="SOS - Emergência"
              subtitle="Atendimento imediato"
              emergency
              onPress={
                actions.sos
              }
              loading={
                submittingKind ===
                'sos'
              }
              appColors={
                appColors
              }
              styles={styles}
            />
          </View>


          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Ajuda rápida
            </Text>

            <Text
              style={
                styles.sectionText
              }
            >
              Acesso rápido para as necessidades mais comuns.
            </Text>
          </View>


          <View
            style={
              styles.quickGrid
            }
          >
            <SmallTile
              icon="map-marker-outline"
              title="Estou perdido"
              onPress={
                actions.lost
              }
              appColors={
                appColors
              }
              styles={styles}
            />

            <SmallTile
              icon="wheelchair-accessibility"
              title="Acessibilidade"
              onPress={
                actions.accessibility
              }
              appColors={
                appColors
              }
              styles={styles}
            />
          </View>


          <WideTile
            icon="account-group-outline"
            title="Falar com a recepção"
            onPress={
              actions.reception
            }
            loading={
              submittingKind ===
              'help'
            }
            appColors={
              appColors
            }
            styles={styles}
          />


          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Sua solicitação
            </Text>

            <Text
              style={
                styles.sectionText
              }
            >
              Acompanhe o status do seu pedido de ajuda.
            </Text>
          </View>


          <Pressable
            onPress={
              actions.request
            }
            accessibilityRole="button"
            accessibilityLabel="Abrir status da solicitação"
            style={({ pressed }) => [
              styles.statusCard,

              shadows.card,

              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={
                styles.statusIconWrap
              }
            >
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={22}
                color={
                  appColors.primary
                }
              />
            </View>


            <View
              style={
                styles.statusDot
              }
            />


            <View
              style={
                styles.statusCopy
              }
            >
              <Text
                style={
                  styles.statusTitle
                }
              >
                {
                  latestRequest.title
                }
              </Text>

              <Text
                style={
                  styles.statusText
                }
              >
                {
                  latestRequest.subtitle
                }
              </Text>
            </View>


            <Chevron
              appColors={
                appColors
              }
              styles={styles}
            />
          </Pressable>
        </ScrollView>


        <BottomTabs
          active="Help"
          navigate={navigate}
        />
      </View>
    </Screen>
  );
}


function ActionTile({
  icon,
  title,
  subtitle,
  emergency,
  loading,
  onPress,
  appColors,
  styles,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={
        title
      }
      style={({ pressed }) => [
        styles.actionTile,

        emergency &&
          styles.actionTileEmergency,

        shadows.card,

        (pressed ||
          loading) &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.tileIconWrap,

          emergency &&
            styles.tileIconEmergency,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              appColors.primary
            }
          />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={
              appColors.primary
            }
          />
        )}
      </View>


      <View
        style={
          styles.tileBottom
        }
      >
        <View
          style={
            styles.tileCopy
          }
        >
          <Text
            style={[
              styles.tileTitle,

              emergency &&
                styles.emergencyText,
            ]}
          >
            {title}
          </Text>

          <Text
            style={
              styles.tileSubtitle
            }
          >
            {subtitle}
          </Text>
        </View>

        <Chevron
          active={emergency}
          appColors={
            appColors
          }
          styles={styles}
        />
      </View>
    </Pressable>
  );
}


function SmallTile({
  icon,
  title,
  onPress,
  appColors,
  styles,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        title
      }
      style={({ pressed }) => [
        styles.smallTile,

        shadows.card,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.smallIconWrap
        }
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={
            appColors.primary
          }
        />
      </View>

      <Text
        numberOfLines={2}
        style={
          styles.smallTitle
        }
      >
        {title}
      </Text>

      <Chevron
        appColors={
          appColors
        }
        styles={styles}
      />
    </Pressable>
  );
}


function WideTile({
  icon,
  title,
  loading,
  onPress,
  appColors,
  styles,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={
        title
      }
      style={({ pressed }) => [
        styles.wideTile,

        shadows.card,

        (pressed ||
          loading) &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.smallIconWrap
        }
      >
        {loading ? (
          <ActivityIndicator
            color={
              appColors.primary
            }
          />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={
              appColors.primary
            }
          />
        )}
      </View>

      <Text
        style={
          styles.wideTitle
        }
      >
        {title}
      </Text>

      <Chevron
        appColors={
          appColors
        }
        styles={styles}
      />
    </Pressable>
  );
}


function Chevron({
  active = false,
  appColors,
  styles,
}) {
  return (
    <View
      style={[
        styles.chevron,

        active &&
          styles.chevronActive,
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
  );
}


function createStyles(
  appColors
) {
  return StyleSheet.create({
    stage: {
      flex: 1,

      backgroundColor:
        appColors.background,
    },

    content: {
      width: '100%',
      maxWidth: 430,

      alignSelf: 'center',

      paddingHorizontal: 20,
    },

    sectionIntro: {
      marginTop: 14,
      marginBottom: 10,
    },

    heroTitle: {
      color:
        appColors.text,

      fontSize: 22,
      lineHeight: 28,

      fontWeight: '900',
    },

    section: {
      marginTop: 20,
      marginBottom: 10,
    },

    sectionTitle: {
      color:
        appColors.text,

      fontSize: 18,
      lineHeight: 23,

      fontWeight: '900',
    },

    sectionText: {
      color:
        appColors.muted,

      fontSize: 12,
      lineHeight: 17,

      fontWeight: '600',

      marginTop: 2,
    },

    mainGrid: {
      flexDirection: 'row',

      gap: 10,
    },

    actionTile: {
      flex: 1,
      minWidth: 0,

      minHeight: 104,

      borderRadius: 18,
      borderWidth: 1,

      borderColor:
        appColors.border,

      backgroundColor:
        appColors.surface,

      padding: 12,

      justifyContent:
        'space-between',
    },

    actionTileEmergency: {
      backgroundColor:
        appColors.surfaceAlt,

      borderColor:
        appColors.borderStrong ||
        appColors.border,
    },

    tileIconWrap: {
      width: 40,
      height: 40,

      borderRadius: 14,

      backgroundColor:
        appColors.iconBg,

      alignItems: 'center',
      justifyContent: 'center',
    },

    tileIconEmergency: {
      backgroundColor:
        appColors.iconBg,
    },

    tileBottom: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 7,
    },

    tileCopy: {
      flex: 1,
      minWidth: 0,
    },

    tileTitle: {
      color:
        appColors.text,

      fontSize: 13,
      lineHeight: 17,

      fontWeight: '900',
    },

    emergencyText: {
      color:
        appColors.primaryDark,
    },

    tileSubtitle: {
      color:
        appColors.muted,

      fontSize: 11,
      lineHeight: 14,

      fontWeight: '600',

      marginTop: 1,
    },

    quickGrid: {
      flexDirection: 'row',

      gap: 10,
    },

    smallTile: {
      flex: 1,
      minWidth: 0,

      minHeight: 62,

      borderRadius: 15,
      borderWidth: 1,

      borderColor:
        appColors.border,

      backgroundColor:
        appColors.surface,

      paddingHorizontal: 10,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,
    },

    smallIconWrap: {
      width: 40,
      height: 40,

      borderRadius: 14,

      backgroundColor:
        appColors.iconBg,

      alignItems: 'center',
      justifyContent: 'center',
    },

    smallTitle: {
      flex: 1,
      minWidth: 0,

      color:
        appColors.text,

      fontSize: 12,
      lineHeight: 16,

      fontWeight: '900',
    },

    wideTile: {
      minHeight: 62,

      borderRadius: 15,
      borderWidth: 1,

      borderColor:
        appColors.border,

      backgroundColor:
        appColors.surface,

      paddingHorizontal: 12,

      marginTop: 10,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 10,
    },

    wideTitle: {
      flex: 1,
      minWidth: 0,

      color:
        appColors.text,

      fontSize: 13,
      lineHeight: 17,

      fontWeight: '900',
    },

    statusCard: {
      minHeight: 64,

      borderRadius: 15,
      borderWidth: 1,

      borderColor:
        appColors.border,

      backgroundColor:
        appColors.surface,

      paddingHorizontal: 12,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 10,

      marginBottom: 4,
    },

    statusIconWrap: {
      width: 40,
      height: 40,

      borderRadius: 14,

      backgroundColor:
        appColors.iconBg,

      alignItems: 'center',
      justifyContent: 'center',
    },

    statusDot: {
      width: 10,
      height: 10,

      borderRadius: 5,

      backgroundColor:
        appColors.success,

      alignSelf:
        'flex-start',

      marginTop: 17,
    },

    statusCopy: {
      flex: 1,
      minWidth: 0,
    },

    statusTitle: {
      color:
        appColors.text,

      fontSize: 12,
      lineHeight: 16,

      fontWeight: '900',
    },

    statusText: {
      color:
        appColors.muted,

      fontSize: 11,
      lineHeight: 15,

      fontWeight: '600',

      marginTop: 1,
    },

    chevron: {
      width: 30,
      height: 30,

      borderRadius: 15,

      backgroundColor:
        appColors.surfaceAlt,

      alignItems: 'center',
      justifyContent: 'center',
    },

    chevronActive: {
      backgroundColor:
        appColors.iconBg,
    },

    pressed: {
      opacity: 0.82,
    },
  });
}