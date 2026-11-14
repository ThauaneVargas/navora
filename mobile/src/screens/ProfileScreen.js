import React, {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import * as ImagePicker
  from 'expo-image-picker';

import Screen
  from '../components/Screen';

import Header
  from '../components/Header';

import BottomTabs
  from '../components/BottomTabs';

import { useRouteBarSpace } from '../components/ActiveRouteBar';

import {
  shadows,
} from '../theme/colors';

import {
  useApp,
} from '../context/AppContext';

import {
  getProfilePhotoUri,
  removeProfilePhotoUri,
  saveProfilePhotoUri,
} from '../services/profilePhotoService';
import styles from './profile/profileStyles';
import { PhotoMenuItem, ProfileSection } from './profile/ProfileRows';


function getInitials(
  name = 'Paciente'
) {
  const parts =
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);

  if (!parts.length) {
    return 'P';
  }

  return parts
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join('');
}


function getEmergencyContactSummary(
  emergencyContact,
  t
) {
  if (!emergencyContact) {
    return t('common.notInformed');
  }

  if (
    typeof emergencyContact ===
    'string'
  ) {
    return emergencyContact;
  }

  const values = [
    emergencyContact.name,
    emergencyContact.relationship,
    emergencyContact.phone,
  ].filter(Boolean);

  return values.length
    ? values.join(' • ')
    : t('common.notInformed');
}

// Monta o prefill pra PatientRegisterScreen abrir em modo de edição (PATCH /patients/me)
// em vez de criar um cadastro novo — era isto que faltava pros tiles "Dados pessoais" e
// "Contato de emergência" e pro botão de editar (lápis) funcionarem de verdade.
function buildEditInitialValues(userProfile = {}) {
  return {
    name: userProfile?.fullName || userProfile?.name || '',
    phone: userProfile?.phone || '',
    emergencyContact: userProfile?.emergencyContact || '',
    accessibility: userProfile?.accessibility || {},
  };
}


export default function ProfileScreen({
  navigate,
  userType = 'patient',
  userProfile,
  onLogout,
}) {
  const insets =
    useSafeAreaInsets();

  // Espaço da barra "Rota em andamento" (aparece acima das abas).
  const routeBarSpace =
    useRouteBarSpace();

  const { height: windowHeight } =
    useWindowDimensions();

  const {
    appColors,
    isDark,
    toggleTheme,
    userPreferences:
      fallbackPreferences,
    t,
  } = useApp();


  const isVisitor =
    userProfile?.type ===
      'visitor' ||
    userType ===
      'visitor';


  const roleLabel =
    isVisitor
      ? t('common.visitor')
      : t('common.patient');


  const displayName =
    userProfile?.fullName ||
    userProfile?.name ||
    (isVisitor
      ? t('common.visitor')
      : t('common.patient'));


  const [
    photoUri,
    setPhotoUri,
  ] = useState(null);


  const [
    photoMenuVisible,
    setPhotoMenuVisible,
  ] = useState(false);


  const [
    removePhotoConfirmVisible,
    setRemovePhotoConfirmVisible,
  ] = useState(false);


  const userPreferences = {
    ...fallbackPreferences,

    ...(userProfile?.accessibility ||
      {}),
  };


  const emergencyContactSummary =
    getEmergencyContactSummary(
      userProfile?.emergencyContact,
      t
    );


  /*
   * FOTO SALVA
   */

  useEffect(() => {
    let active = true;

    getProfilePhotoUri()
      .then((uri) => {
        if (active) {
          setPhotoUri(
            uri || null
          );
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);


  const saveSelectedPhoto =
    async (result) => {
      if (
        result?.canceled ||
        !result?.assets?.[0]?.uri
      ) {
        return;
      }

      const uri =
        result.assets[0].uri;

      await saveProfilePhotoUri(
        uri
      );

      setPhotoUri(uri);
    };


  const takePhoto =
    async () => {
      try {
        const permission =
          await ImagePicker
            .requestCameraPermissionsAsync();

        if (
          !permission.granted
        ) {
          return;
        }

        const result =
          await ImagePicker
            .launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

        await saveSelectedPhoto(
          result
        );
      } catch (error) {
        console.log(
          '[Navora] Erro ao abrir câmera:',
          error
        );
      }
    };


  const choosePhoto =
    async () => {
      try {
        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          return;
        }

        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes:
                ImagePicker
                  .MediaTypeOptions
                  .Images,

              allowsEditing: true,

              aspect: [1, 1],

              quality: 0.8,
            });

        await saveSelectedPhoto(
          result
        );
      } catch (error) {
        console.log(
          '[Navora] Erro ao abrir galeria:',
          error
        );
      }
    };


  const removePhoto =
    async () => {
      try {
        await removeProfilePhotoUri();

        setPhotoUri(null);

        setRemovePhotoConfirmVisible(
          false
        );
      } catch (error) {
        console.log(
          '[Navora] Erro ao remover foto:',
          error
        );
      }
    };


  const handleTakePhoto =
    async () => {
      setPhotoMenuVisible(
        false
      );

      await takePhoto();
    };


  const handleChoosePhoto =
    async () => {
      setPhotoMenuVisible(
        false
      );

      await choosePhoto();
    };


  const handleAskRemovePhoto =
    () => {
      setPhotoMenuVisible(
        false
      );

      setRemovePhotoConfirmVisible(
        true
      );
    };


  /*
   * CONTA
   */

  const hasAccount =
    userProfile?.authSource === 'api' ||
    Boolean(userProfile?.hasAccount);

  // Paciente e visitante usam a mesma conta (login obrigatório desde 29/10):
  // os dois podem editar o cadastro. Antes o modo visitante não tinha edição.
  const canEditAccount = hasAccount;

  // Segurança da conta: antes abria Configurações (igual ao item
  // "Configurações"). Agora oferece o que existe de segurança de verdade.
  const openSecurity = () => {
    Alert.alert(
      t('profile.security'),
      t('profile.securityText'),
      [
        {
          text: t('profile.changePassword'),
          onPress: () => navigate('ForgotPassword', { email: userProfile?.email || '' }),
        },
        {
          text: t('profile.deleteAccount'),
          onPress: () => navigate('Privacy'),
        },
        { text: t('common.close'), style: 'cancel' },
      ]
    );
  };

  const openAccountHelp = () => {
    Alert.alert(
      t('profile.accountHelp'),
      hasAccount
        ? t('profile.accountHelpText')
        : t('profile.accountHelpNoAccount'),
      [
        hasAccount
          ? {
              text: t('profile.accountHelpForgot'),
              onPress: () => navigate('ForgotPassword'),
            }
          : {
              text: t('profile.createAccount'),
              onPress: () =>
                navigate('PatientRegister', {
                  initialValues: buildEditInitialValues(userProfile),
                  from: 'Profile',
                }),
            },
        ...(hasAccount
          ? [
              {
                text: t('profile.security'),
                onPress: openSecurity,
              },
            ]
          : []),
        { text: t('common.close'), style: 'cancel' },
      ]
    );
  };

  const accountItems = [
    {
      icon:
        'account-outline',

      title:
        t('profile.personalData'),

      subtitle:
        t('profile.personalDataSub'),

      onPress:
        canEditAccount
          ? () =>
              navigate(
                'PatientRegister',
                { mode: 'edit', initialValues: buildEditInitialValues(userProfile) }
              )
          : undefined,
    },

    {
      icon:
        'account-heart-outline',

      title:
        t('profile.emergencyContact'),

      subtitle:
        emergencyContactSummary,

      highlight: true,

      onPress:
        canEditAccount
          ? () =>
              navigate(
                'PatientRegister',
                { mode: 'edit', initialValues: buildEditInitialValues(userProfile), focus: 'emergencyContact' }
              )
          : undefined,
    },

    // Desde 29/10 só se entra com conta, então isto não aparece mais; fica
    // como rede de segurança se um perfil sem conta chegar aqui.
    ...(!isVisitor && !hasAccount
      ? [
          {
            icon:
              'account-plus-outline',

            title:
              t('profile.createAccount'),

            subtitle:
              t('profile.createAccountSub'),

            highlight: true,

            onPress: () =>
              navigate(
                'PatientRegister',
                { initialValues: buildEditInitialValues(userProfile), from: 'Profile' }
              ),
          },
        ]
      : []),

    {
      icon:
        'shield-account-outline',

      title:
        t('profile.security'),

      subtitle:
        t('profile.securitySub'),

      onPress: openSecurity,
    },

    {
      icon:
        'account-question-outline',

      title:
        t('profile.accountHelp'),

      subtitle:
        t('profile.accountHelpSub'),

      // Antes levava pra própria tela de Ajuda (pedido de socorro), sem nada
      // sobre conta. Agora oferece o que resolve: senha ou criar conta.
      onPress: openAccountHelp,
    },
  ];


  /*
   * PREFERÊNCIAS
   */

  const preferenceItems = [
    {
      icon:
        'human-wheelchair',

      title:
        t('profile.accessibility'),

      subtitle:
        t('profile.accessibilitySub'),

      onPress: () =>
        navigate(
          'Accessibility'
        ),
    },

    {
      icon:
        'map-marker-path',

      title:
        t('profile.routePreference'),

      subtitle:
        userPreferences
          .avoidStairs ||
        userPreferences
          .wheelchair
          ? t('profile.accessibleRoute')
          : t('profile.fastestRoute'),

      onPress: () =>
        navigate(
          'Accessibility',
          {
            section:
              'route',
          }
        ),
    },

    {
      icon:
        'volume-high',

      title:
        t('profile.voiceGuidance'),

      subtitle:
        userPreferences
          .voiceGuidance
          ? t('profile.on')
          : t('profile.off'),

      onPress: () =>
        navigate(
          'Accessibility',
          {
            section:
              'voice',
          }
        ),
    },

    {
      icon:
        'bell-outline',

      title:
        t('profile.manageNotifications'),

      subtitle:
        t('profile.manageNotificationsSub'),

      onPress: () =>
        navigate(
          'Notifications'
        ),
    },
  ];


  /*
   * ATIVIDADE
   */

  const activityItems = [
    {
      icon:
        'history',

      title:
        t('profile.routeHistory'),

      subtitle:
        t('profile.routeHistorySub'),

      onPress: () =>
        navigate(
          'RouteHistory'
        ),
    },

    {
      icon:
        'star-outline',

      title:
        t('profile.favorites'),

      subtitle:
        t('profile.favoritesSub'),

      onPress: () =>
        navigate(
          'Search',
          {
            favoritesOnly:
              true,
          }
        ),
    },
  ];


  /*
   * PRIVACIDADE
   */

  const privacyItems = [
    {
      icon:
        'shield-lock-outline',

      title:
        t('profile.privacyPermissions'),

      subtitle:
        t('profile.privacyPermissionsSub'),

      onPress: () =>
        navigate(
          'Privacy'
        ),
    },
  ];


  /*
   * OUTROS
   */

  const otherItems = [
    {
      icon:
        'cog-outline',

      title:
        t('profile.settings'),

      subtitle:
        t('profile.settingsSub'),

      onPress: () =>
        navigate(
          'Settings'
        ),
    },
  ];


  return (
    <Screen
      scroll={false}
      padded={false}
      withBottomTabs
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
        {/* CABEÇALHO */}

        <Header
          fullBleed
          title={t('profile.title')}
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
          {/* CARD PRINCIPAL */}

          <View
            style={[
              styles.profileCard,

              {
                backgroundColor:
                  appColors.surface,

                borderColor:
                  appColors.border,
              },

              shadows.card,
            ]}
          >
            <Pressable
              onPress={() =>
                setPhotoMenuVisible(
                  true
                )
              }
              accessibilityRole="button"
              accessibilityLabel={t('profile.changePhoto')}
              style={({ pressed }) => [
                styles.avatarButton,

                {
                  backgroundColor:
                    appColors.primary,
                },

                pressed &&
                  styles.pressed,
              ]}
            >
              {photoUri ? (
                <Image
                  source={{
                    uri:
                      photoUri,
                  }}
                  style={
                    styles.profilePhoto
                  }
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={
                    styles.initials
                  }
                >
                  {getInitials(
                    displayName
                  )}
                </Text>
              )}


              <View
                style={[
                  styles.cameraBadge,

                  {
                    backgroundColor:
                      appColors.primaryDark,

                    borderColor:
                      appColors.surface,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={15}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>


            <View
              style={
                styles.profileCopy
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.profileName,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                {displayName}
              </Text>

              <Text
                style={[
                  styles.profileRole,

                  {
                    color:
                      appColors.primary,
                  },
                ]}
              >
                {roleLabel}
              </Text>

              <Text
                style={[
                  styles.profileHint,

                  {
                    color:
                      appColors.muted,
                  },
                ]}
              >
                {t('profile.tapToChange')}
              </Text>
            </View>


            {canEditAccount && (
              <Pressable
                onPress={() =>
                  navigate(
                    'PatientRegister',
                    { mode: 'edit', initialValues: buildEditInitialValues(userProfile) }
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit')}
                style={({ pressed }) => [
                  styles.editButton,

                  {
                    backgroundColor:
                      appColors.iconBg,
                  },

                  pressed &&
                    styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={
                    appColors.primary
                  }
                />
              </Pressable>
            )}
          </View>


          {/* MODO ESCURO */}

          <View
            style={[
              styles.themeCard,

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
                styles.mainIcon,

                {
                  backgroundColor:
                    appColors.iconBg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  isDark
                    ? 'weather-night'
                    : 'white-balance-sunny'
                }
                size={21}
                color={
                  appColors.primary
                }
              />
            </View>


            <View
              style={
                styles.themeCopy
              }
            >
              <Text
                style={[
                  styles.itemTitle,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                {t('profile.darkMode')}
              </Text>

              <Text
                style={[
                  styles.itemSubtitle,

                  {
                    color:
                      appColors.muted,
                  },
                ]}
              >
                {t('profile.darkModeSub')}
              </Text>
            </View>


            <Pressable
              onPress={
                toggleTheme
              }
              accessibilityRole="switch"
              accessibilityLabel={t('profile.darkMode')}
              accessibilityState={{
                checked:
                  isDark,
              }}
              style={[
                styles.switchTrack,

                {
                  backgroundColor:
                    isDark
                      ? appColors.primary
                      : appColors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.switchKnob,

                  isDark &&
                    styles.switchKnobActive,
                ]}
              />
            </Pressable>
          </View>


          <ProfileSection
            title={t('profile.sections.account')}
            items={
              accountItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title={t('profile.sections.preferences')}
            items={
              preferenceItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title={t('profile.sections.activity')}
            items={
              activityItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title={t('profile.sections.privacy')}
            items={
              privacyItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title={t('profile.sections.other')}
            items={
              otherItems
            }
            appColors={
              appColors
            }
          />


          {/* SAIR */}

          <Pressable
            onPress={
              onLogout
            }
            style={({ pressed }) => [
              styles.logoutButton,

              {
                backgroundColor:
                  isDark
                    ? appColors.surface
                    : '#FFF8F9',

                borderColor:
                  isDark
                    ? appColors.border
                    : '#F2B8C0',
              },

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="logout"
              size={19}
              color={
                appColors.danger
              }
            />

            <Text
              style={[
                styles.logoutText,

                {
                  color:
                    appColors.danger,
                },
              ]}
            >
              Sair
            </Text>
          </Pressable>
        </ScrollView>


        {/* MENU DA FOTO */}

        <Modal
          visible={
            photoMenuVisible
          }
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setPhotoMenuVisible(
              false
            )
          }
        >
          <Pressable
            style={[
              styles.modalOverlay,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
            onPress={() =>
              setPhotoMenuVisible(
                false
              )
            }
          >
            <Pressable
              onPress={(event) =>
                event.stopPropagation()
              }
              style={[
                styles.photoMenu,

                {
                  maxHeight:
                    Math.min(
                      560,
                      windowHeight * 0.85
                    ),

                  backgroundColor:
                    appColors.surface,

                  borderColor:
                    appColors.border,
                },

                shadows.card,
              ]}
            >
              <View
                style={
                  styles.modalHandle
                }
              />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.photoMenuTitle,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  {t('profile.photoTitle')}
                </Text>

                <Text
                  style={[
                    styles.photoMenuSubtitle,

                    {
                      color:
                        appColors.muted,
                    },
                  ]}
                >
                  {t('profile.photoSub')}
                </Text>


                {Platform.OS !==
                  'web' && (
                  <PhotoMenuItem
                    icon="camera-outline"
                    title={t('profile.takePhoto')}
                    subtitle={t('profile.takePhotoSub')}
                    appColors={
                      appColors
                    }
                    onPress={
                      handleTakePhoto
                    }
                  />
                )}


                <PhotoMenuItem
                  icon="image-outline"
                  title={
                    Platform.OS ===
                    'web'
                      ? t('profile.choosePhoto')
                      : t('profile.chooseFromGallery')
                  }
                  subtitle={
                    Platform.OS ===
                    'web'
                      ? t('profile.chooseFromComputer')
                      : t('profile.chooseExisting')
                  }
                  appColors={
                    appColors
                  }
                  onPress={
                    handleChoosePhoto
                  }
                />


                {photoUri && (
                  <PhotoMenuItem
                    icon="trash-can-outline"
                    title={t('profile.removePhoto')}
                    subtitle={t('profile.removePhotoSub')}
                    appColors={
                      appColors
                    }
                    danger
                    onPress={
                      handleAskRemovePhoto
                    }
                  />
                )}
              </ScrollView>

              <Pressable
                onPress={() =>
                  setPhotoMenuVisible(
                    false
                  )
                }
                style={({ pressed }) => [
                  styles.cancelButton,

                  {
                    borderColor:
                      appColors.border,
                  },

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.cancelButtonText,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>


        {/* CONFIRMAR REMOÇÃO */}

        <Modal
          visible={
            removePhotoConfirmVisible
          }
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setRemovePhotoConfirmVisible(
              false
            )
          }
        >
          <View
            style={
              styles.confirmOverlay
            }
          >
            <View
              style={[
                styles.confirmCard,

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
                  styles.confirmIcon,

                  {
                    backgroundColor:
                      appColors.surfaceAlt,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={25}
                  color={
                    appColors.danger
                  }
                />
              </View>

              <Text
                style={[
                  styles.confirmTitle,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                {t('profile.removePhotoConfirm')}
              </Text>

              <Text
                style={[
                  styles.confirmText,

                  {
                    color:
                      appColors.muted,
                  },
                ]}
              >
                {t('profile.removePhotoConfirmSub')}
              </Text>


              <View
                style={
                  styles.confirmActions
                }
              >
                <Pressable
                  onPress={() =>
                    setRemovePhotoConfirmVisible(
                      false
                    )
                  }
                  style={({ pressed }) => [
                    styles.confirmCancel,

                    {
                      borderColor:
                        appColors.border,
                    },

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.confirmCancelText,

                      {
                        color:
                          appColors.text,
                      },
                    ]}
                  >
                    {t('common.cancel')}
                  </Text>
                </Pressable>


                <Pressable
                  onPress={
                    removePhoto
                  }
                  style={({ pressed }) => [
                    styles.confirmRemove,

                    {
                      backgroundColor:
                        appColors.danger,
                    },

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.confirmRemoveText
                    }
                  >
                    {t('profile.remove')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>


        <BottomTabs
          active="Profile"
          navigate={navigate}
        />
      </View>
    </Screen>
  );
}


