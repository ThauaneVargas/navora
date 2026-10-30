import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
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
import HelpRequestSheet from '../components/HelpRequestSheet';
import SosStatusSheet from '../components/SosStatusSheet';
import {
  getActiveCall,
  isTerminalCallStatus,
  saveActiveCall,
  updateActiveCall,
} from '../services/activeCallStorage';
import { getReceptionPhone } from '../data/hospitalContacts';
import { useRouteBarSpace } from '../components/ActiveRouteBar';

import {
  shadows,
} from '../theme/colors';

import {
  toneColors,
} from '../theme/tones';

import {
  useApp,
} from '../context/AppContext';

import {
  getAreaById,
} from '../data/routes';

import {
  isAuthError,
  isNetworkError,
  navoraApi,
} from '../services/api';


// Acessibilidade do perfil -> o que a equipe precisa levar no SOS
// (codigos em backend-nest/src/calls/call-codes.ts).
const NEED_BY_ACCESSIBILITY_KEY = {
  wheelchair: 'wheelchair',
  needsStretcher: 'stretcher',
  mobilityDifficulty: 'mobility',
  visualImpairment: 'visual',
  hearingImpairment: 'hearing',
  needsCompanion: 'companion',
};

// SOS tenta 3 vezes antes de desistir (rede instavel no hospital); o resto, 2.
const SEND_ATTEMPTS = { sos: 3, default: 2 };
const RETRY_DELAYS_MS = [2000, 4000];
const STATUS_POLL_MS = 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


export default function HelpScreen({
  navigate,
  routeParams = {},
  userType = 'patient',
  userProfile,
  onCreateHelpRequest,
  onLogout,
}) {
  const insets =
    useSafeAreaInsets();

  // Espaço da barra "Rota em andamento" (aparece acima das abas).
  const routeBarSpace =
    useRouteBarSpace();

  const {
    appColors,
    currentLocation:
      fallbackLocation,
    t,
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

  const [
    requestSheetVisible,
    setRequestSheetVisible,
  ] = useState(false);

  // Chamado em andamento (sobrevive a troca de tela: activeCallStorage).
  const [activeCall, setActiveCall] = useState(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

  const areaId = userProfile?.area || 'private';
  const receptionPhone = getReceptionPhone(areaId);

  useEffect(() => {
    let alive = true;
    getActiveCall().then((call) => {
      if (alive && call) setActiveCall(call);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Acompanha o andamento enquanto a tela esta aberta e o chamado nao acabou.
  const activeCallId = activeCall?.id;
  const activeCallToken = activeCall?.token;
  const activeCallDone = isTerminalCallStatus(activeCall?.status);
  useEffect(() => {
    if (!activeCallId || !activeCallToken || activeCallDone) return undefined;
    let alive = true;
    const poll = async () => {
      try {
        const remote = await navoraApi.getCallStatus(activeCallId, activeCallToken);
        if (!alive || !remote) return;
        const next = await updateActiveCall({ status: remote.status });
        if (alive && next) setActiveCall(next);
      } catch (error) {
        // 404: chamado nao existe mais (ou codigo invalido) -> para de acompanhar.
        if (alive && error?.status === 404) {
          const next = await updateActiveCall({ status: 'CANCELED' });
          setActiveCall(next);
        }
      }
    };
    poll();
    const timer = setInterval(poll, STATUS_POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [activeCallId, activeCallToken, activeCallDone]);


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


  // Sem pedido ainda: antes mostrava "Aguardando atendimento – Solicitada
  // há 2 min", um pedido que não existia.
  const latestRequest =
    (activeCall && {
      title: t(`help.status_${activeCall.status || 'PENDING'}`),
      subtitle: t('help.protocol', { id: activeCall.id }),
    }) ||
    lastRequest || (
      routeParams.type === 'sos'
        ? {
            title: t('help.waiting'),
            subtitle: t('help.urgentInProgress'),
          }
        : {
            title: t('help.noRequestTitle'),
            subtitle: t('help.noRequestSub'),
          }
    );


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

      emergency_contact:
        typeof userProfile?.emergencyContact ===
        'string'
          ? userProfile.emergencyContact
          : userProfile?.emergencyContact?.phone ||
            undefined,

      priority:
        isSos
          ? 'CRITICAL'
          : 'MEDIUM',

      caller_phone:
        userProfile?.phone ||
        undefined,

      needs:
        Object.entries(NEED_BY_ACCESSIBILITY_KEY)
          .filter(([key]) => userProfile?.accessibility?.[key])
          .map(([, code]) => code),
    };


    const send = () =>
      isSos
        ? navoraApi.createSos(payload)
        : navoraApi.createHelpRequest(payload);

    // Rede instavel: tenta de novo sozinho antes de desistir. So repete erro
    // de conexao (erro do servidor nao melhora repetindo).
    const sendWithRetry = async () => {
      const attempts = SEND_ATTEMPTS[kind] || SEND_ATTEMPTS.default;
      for (let attempt = 1; ; attempt += 1) {
        try {
          return await send();
        } catch (error) {
          if (!isNetworkError(error) || attempt >= attempts) throw error;
          await wait(RETRY_DELAYS_MS[attempt - 1] || 4000);
        }
      }
    };

    try {
      const apiResponse =
        await sendWithRetry();

      if (apiResponse?.id && apiResponse?.access_token) {
        const tracked = {
          id: apiResponse.id,
          token: apiResponse.access_token,
          kind: isSos ? 'sos' : 'help',
          status: apiResponse.status || 'PENDING',
        };
        await saveActiveCall(tracked);
        setActiveCall((await getActiveCall()) || tracked);
        // SOS: abre direto o andamento (Enviado -> Recebido -> ...).
        if (isSos) setStatusSheetVisible(true);
      }


      const request =
        apiResponse?.demoMode
          ? onCreateHelpRequest?.(
              localRequest
            )
          : apiResponse;


      setLastRequest({
        title:
          isSos
            ? t('help.sosSent')
            : t('help.waiting'),

        subtitle:
          request?.id
            ? t('help.protocol', { id: request.id })
            : t('help.requestedNow'),
      });
    } catch (error) {
      const callReceptionButton = receptionPhone
        ? [{ text: t('help.callReception'), onPress: () => Linking.openURL(`tel:${receptionPhone}`).catch(() => {}) }]
        : [];

      // Chamado exige login: sessão vencida (30 dias) recusa o envio. Avisa e leva
      // ao Login, sem esconder a ligação para a recepção.
      if (isAuthError(error)) {
        Alert.alert(
          t('help.sessionExpiredTitle'),
          t('help.sessionExpired'),
          [
            ...callReceptionButton,
            { text: t('help.loginAgain'), onPress: () => onLogout?.() },
          ]
        );
        return;
      }

      Alert.alert(
        t('help.sendFailedTitle'),
        t('help.sendFailed'),
        [
          ...callReceptionButton,
          { text: t('help.tryAgain'), onPress: () => submit(kind, reason) },
          { text: t('common.close'), style: 'cancel' },
        ]
      );
    } finally {
      setSubmittingKind(
        null
      );
    }
  };


  const confirmSos = () => {
    Alert.alert(
      t('help.confirmSosTitle'),
      t('help.confirmSos'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },

        {
          text:
            t('help.triggerSos'),

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
    // Pergunta o motivo e confirma antes de enviar (HelpRequestSheet).
    help: () =>
      setRequestSheetVisible(true),

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
        'reception',
        'Contato com recepção'
      ),

    // Com chamado em andamento, abre o acompanhamento; sem, as notificacoes.
    request: () =>
      activeCall
        ? setStatusSheetVisible(true)
        : navigate(
            'Notifications'
          ),
  };


  return (
    <Screen
      scroll={false}
      padded={false}
      withBottomTabs
    >
      <View
        style={
          styles.stage
        }
      >
        {/* CABEÇALHO PADRÃO */}

        <Header
          fullBleed
          title={t('help.title')}
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
                ) + 104 + routeBarSpace,
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
              {t('help.howCanWeHelp')}
            </Text>

            <Text
              style={
                styles.sectionText
              }
            >
              {t('help.chooseOption')}
            </Text>
          </View>


          <View
            style={
              styles.mainGrid
            }
          >
            <ActionTile
              icon="headphones"
              title={t('help.needHelp')}
              subtitle={t('help.needHelpSub')}
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
              title={t('help.sos')}
              subtitle={t('help.sosSub')}
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
              {t('help.quickHelp')}
            </Text>

            <Text
              style={
                styles.sectionText
              }
            >
              {t('help.quickHelpSub')}
            </Text>
          </View>


          <View
            style={
              styles.quickGrid
            }
          >
            <SmallTile
              icon="compass-outline"
              title={t('help.lost')}
              tone="amber"
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
              title={t('help.accessibility')}
              tone="blue"
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
            icon="face-agent"
            title={t('help.talkToReception')}
            tone="teal"
            onPress={
              actions.reception
            }
            loading={
              submittingKind ===
              'reception'
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
              {t('help.yourRequest')}
            </Text>

            <Text
              style={
                styles.sectionText
              }
            >
              {t('help.yourRequestSub')}
            </Text>
          </View>


          <Pressable
            onPress={
              actions.request
            }
            accessibilityRole="button"
            accessibilityLabel={t('help.openRequestStatus')}
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

        <SosStatusSheet
          visible={statusSheetVisible}
          call={activeCall}
          receptionPhone={receptionPhone}
          onClose={() =>
            setStatusSheetVisible(false)
          }
        />

        <HelpRequestSheet
          visible={requestSheetVisible}
          locationName={currentLocation.name}
          onClose={() =>
            setRequestSheetVisible(false)
          }
          onSend={(reason) =>
            submit('help', reason)
          }
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
              emergency
                ? '#FFFFFF'
                : appColors.primary
            }
          />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={
              emergency
                ? '#FFFFFF'
                : appColors.primary
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
            style={[
              styles.tileSubtitle,
              emergency &&
                styles.emergencySubtitle,
            ]}
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
  tone,
  onPress,
  appColors,
  styles,
}) {
  const { isDark } = useApp();
  const toned = toneColors(tone, appColors, isDark);

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
        style={[
          styles.smallIconWrap,
          {
            backgroundColor:
              toned.bg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={
            toned.fg
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
  tone,
  loading,
  onPress,
  appColors,
  styles,
}) {
  const { isDark } = useApp();
  const toned = toneColors(tone, appColors, isDark);

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
        style={[
          styles.smallIconWrap,
          {
            backgroundColor:
              toned.bg,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              toned.fg
            }
          />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={
              toned.fg
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
          active
            ? '#FFFFFF'
            : appColors.primary
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

    // SOS precisa se destacar de longe: vermelho cheio, texto branco.
    actionTileEmergency: {
      backgroundColor:
        appColors.danger,

      borderColor:
        appColors.danger,
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
        'rgba(255, 255, 255, 0.2)',
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
      color: '#FFFFFF',
    },

    emergencySubtitle: {
      color:
        'rgba(255, 255, 255, 0.88)',
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
        'rgba(255, 255, 255, 0.2)',
    },

    pressed: {
      opacity: 0.82,
    },
  });
}