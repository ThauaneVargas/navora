import React, {
  useEffect,
  useState,
} from 'react';

import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  emergencyContact
) {
  if (!emergencyContact) {
    return 'Não informado';
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
    : 'Não informado';
}


export default function ProfileScreen({
  navigate,
  userType = 'patient',
  userProfile,
  onLogout,
}) {
  const insets =
    useSafeAreaInsets();

  const {
    appColors,
    isDark,
    toggleTheme,
    userPreferences:
      fallbackPreferences,
  } = useApp();


  const isVisitor =
    userProfile?.type ===
      'visitor' ||
    userType ===
      'visitor';


  const roleLabel =
    isVisitor
      ? 'Visitante'
      : 'Paciente';


  const displayName =
    userProfile?.fullName ||
    userProfile?.name ||
    (isVisitor
      ? 'Visitante'
      : 'Paciente');


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
      userProfile?.emergencyContact
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

  const accountItems = [
    {
      icon:
        'account-outline',

      title:
        'Dados pessoais',

      subtitle:
        'Nome, nascimento, telefone e e-mail',

      onPress:
        isVisitor
          ? undefined
          : () =>
              navigate(
                'PatientRegister'
              ),
    },

    {
      icon:
        'account-heart-outline',

      title:
        'Contato de emergência',

      subtitle:
        emergencyContactSummary,

      highlight: true,

      onPress:
        isVisitor
          ? undefined
          : () =>
              navigate(
                'PatientRegister'
              ),
    },

    {
      icon:
        'shield-account-outline',

      title:
        'Segurança da conta',

      subtitle:
        'Senha, biometria e segurança',

      onPress: () =>
        navigate(
          'Settings',
          {
            section:
              'security',
          }
        ),
    },

    {
      icon:
        'account-question-outline',

      title:
        'Ajuda sobre minha conta',

      subtitle:
        'Problemas com cadastro ou acesso',

      onPress: () =>
        navigate('Help'),
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
        'Acessibilidade',

      subtitle:
        'Mobilidade, texto, contraste e orientação',

      onPress: () =>
        navigate(
          'Accessibility'
        ),
    },

    {
      icon:
        'map-marker-path',

      title:
        'Preferência de rota',

      subtitle:
        userPreferences
          .avoidStairs ||
        userPreferences
          .wheelchair
          ? 'Rota acessível'
          : 'Mais rápida',

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
        'Orientação por voz',

      subtitle:
        userPreferences
          .voiceGuidance
          ? 'Ativada'
          : 'Desativada',

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
        'Gerenciar notificações',

      subtitle:
        'Autorizações, navegação e recepção',

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
        'Histórico de rotas',

      subtitle:
        'Veja suas rotas recentes',

      onPress: () =>
        navigate(
          'RouteHistory'
        ),
    },

    {
      icon:
        'star-outline',

      title:
        'Destinos favoritos',

      subtitle:
        'Locais salvos para acesso rápido',

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
        'Privacidade e permissões',

      subtitle:
        'Localização, Bluetooth, câmera e dados',

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
        'Configurações',

      subtitle:
        'Biometria, notificações e preferências',

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
          title="Meu perfil"
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
                ) + 104,
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
              accessibilityLabel="Alterar foto de perfil"
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
                Toque na foto para alterar
              </Text>
            </View>


            {!isVisitor && (
              <Pressable
                onPress={() =>
                  navigate(
                    'PatientRegister'
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
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
                Modo escuro
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
                Utilizar o Navora com tema escuro
              </Text>
            </View>


            <Pressable
              onPress={
                toggleTheme
              }
              accessibilityRole="switch"
              accessibilityLabel="Modo escuro"
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
            title="Conta"
            items={
              accountItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title="Preferências"
            items={
              preferenceItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title="Atividade"
            items={
              activityItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title="Privacidade"
            items={
              privacyItems
            }
            appColors={
              appColors
            }
          />


          <ProfileSection
            title="Outros"
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
            style={
              styles.modalOverlay
            }
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

              <Text
                style={[
                  styles.photoMenuTitle,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                Foto do perfil
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
                Escolha como deseja alterar sua foto.
              </Text>


              {Platform.OS !==
                'web' && (
                <PhotoMenuItem
                  icon="camera-outline"
                  title="Tirar foto"
                  subtitle="Usar a câmera do aparelho"
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
                    ? 'Escolher foto'
                    : 'Escolher da galeria'
                }
                subtitle={
                  Platform.OS ===
                  'web'
                    ? 'Selecionar uma imagem do computador'
                    : 'Selecionar uma imagem existente'
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
                  title="Remover foto"
                  subtitle="Voltar para o avatar padrão"
                  appColors={
                    appColors
                  }
                  danger
                  onPress={
                    handleAskRemovePhoto
                  }
                />
              )}


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
                  Cancelar
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
                Remover foto?
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
                Sua foto será removida e o avatar padrão será exibido.
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
                    Cancelar
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
                    Remover
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


function ProfileSection({
  title,
  items,
  appColors,
}) {
  return (
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
        {title}
      </Text>


      <View
        style={[
          styles.sectionCard,

          {
            backgroundColor:
              appColors.surface,

            borderColor:
              appColors.border,
          },

          shadows.card,
        ]}
      >
        {items.map(
          (
            item,
            index
          ) => {
            const isLast =
              index ===
              items.length - 1;

            return (
              <Pressable
                key={
                  item.title
                }
                disabled={
                  !item.onPress
                }
                onPress={
                  item.onPress
                }
                style={({ pressed }) => [
                  styles.row,

                  !isLast && {
                    borderBottomWidth:
                      1,

                    borderBottomColor:
                      appColors.border,
                  },

                  pressed &&
                    item.onPress &&
                    styles.rowPressed,
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,

                    {
                      backgroundColor:
                        item.highlight
                          ? appColors.surfaceAlt
                          : appColors.iconBg,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      item.icon
                    }
                    size={20}
                    color={
                      item.highlight
                        ? appColors.danger
                        : appColors.primary
                    }
                  />
                </View>


                <View
                  style={
                    styles.rowCopy
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
                    {item.title}
                  </Text>


                  {!!item.subtitle && (
                    <Text
                      numberOfLines={
                        2
                      }
                      style={[
                        styles.itemSubtitle,

                        {
                          color:
                            appColors.muted,
                        },
                      ]}
                    >
                      {
                        item.subtitle
                      }
                    </Text>
                  )}
                </View>


                {item.onPress && (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={21}
                    color={
                      appColors.muted
                    }
                  />
                )}
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}


function PhotoMenuItem({
  icon,
  title,
  subtitle,
  appColors,
  danger = false,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoMenuItem,

        {
          borderBottomColor:
            appColors.border,
        },

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={[
          styles.photoMenuIcon,

          {
            backgroundColor:
              danger
                ? appColors.surfaceAlt
                : appColors.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={
            danger
              ? appColors.danger
              : appColors.primary
          }
        />
      </View>


      <View
        style={
          styles.photoMenuCopy
        }
      >
        <Text
          style={[
            styles.photoMenuItemTitle,

            {
              color:
                danger
                  ? appColors.danger
                  : appColors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.photoMenuItemSubtitle,

            {
              color:
                appColors.muted,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={21}
        color={
          appColors.muted
        }
      />
    </Pressable>
  );
}


const styles =
  StyleSheet.create({
    stage: {
      flex: 1,
    },

    content: {
      width: '100%',
      maxWidth: 430,

      alignSelf: 'center',

      paddingHorizontal: 16,
    },

    profileCard: {
      minHeight: 104,

      marginTop: 16,

      paddingHorizontal: 14,
      paddingVertical: 14,

      borderRadius: 20,
      borderWidth: 1,

      flexDirection: 'row',
      alignItems: 'center',
    },

    avatarButton: {
      width: 72,
      height: 72,

      borderRadius: 36,

      alignItems: 'center',
      justifyContent: 'center',

      position: 'relative',
    },

    profilePhoto: {
      width: 72,
      height: 72,

      borderRadius: 36,
    },

    initials: {
      color: '#FFFFFF',

      fontSize: 22,
      fontWeight: '900',
    },

    cameraBadge: {
      position: 'absolute',

      right: -2,
      bottom: -2,

      width: 27,
      height: 27,

      borderRadius: 14,

      borderWidth: 2,

      alignItems: 'center',
      justifyContent: 'center',
    },

    profileCopy: {
      flex: 1,
      minWidth: 0,

      marginLeft: 14,
    },

    profileName: {
      fontSize: 18,
      lineHeight: 23,

      fontWeight: '800',
    },

    profileRole: {
      marginTop: 3,

      fontSize: 12,
      fontWeight: '700',
    },

    profileHint: {
      marginTop: 5,

      fontSize: 11,
      lineHeight: 15,

      fontWeight: '500',
    },

    editButton: {
      width: 36,
      height: 36,

      marginLeft: 8,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',
    },

    themeCard: {
      minHeight: 68,

      marginTop: 12,

      paddingHorizontal: 14,
      paddingVertical: 10,

      borderRadius: 18,
      borderWidth: 1,

      flexDirection: 'row',
      alignItems: 'center',
    },

    mainIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: 'center',
      justifyContent: 'center',
    },

    themeCopy: {
      flex: 1,
      minWidth: 0,

      marginLeft: 11,
      marginRight: 10,
    },

    switchTrack: {
      width: 48,
      height: 28,

      padding: 3,

      borderRadius: 14,

      justifyContent: 'center',
    },

    switchKnob: {
      width: 22,
      height: 22,

      borderRadius: 11,

      backgroundColor:
        '#FFFFFF',
    },

    switchKnobActive: {
      alignSelf: 'flex-end',
    },

    section: {
      marginTop: 20,
    },

    sectionTitle: {
      marginBottom: 9,

      fontSize: 16,
      fontWeight: '800',
    },

    sectionCard: {
      overflow: 'hidden',

      borderRadius: 18,
      borderWidth: 1,
    },

    row: {
      minHeight: 64,

      paddingHorizontal: 14,
      paddingVertical: 10,

      flexDirection: 'row',
      alignItems: 'center',
    },

    rowPressed: {
      opacity: 0.72,
    },

    rowIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: 'center',
      justifyContent: 'center',
    },

    rowCopy: {
      flex: 1,
      minWidth: 0,

      marginLeft: 11,
      marginRight: 7,
    },

    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
    },

    itemSubtitle: {
      marginTop: 3,

      fontSize: 11.5,
      lineHeight: 16,

      fontWeight: '500',
    },

    logoutButton: {
      height: 54,

      marginTop: 22,
      marginBottom: 10,

      borderRadius: 16,
      borderWidth: 1,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent: 'center',

      gap: 8,
    },

    logoutText: {
      fontSize: 14,
      fontWeight: '800',
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.48)',

      justifyContent:
        'flex-end',

      paddingHorizontal: 14,
      paddingBottom: 16,
    },

    photoMenu: {
      width: '100%',
      maxWidth: 430,

      alignSelf: 'center',

      borderRadius: 24,
      borderWidth: 1,

      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
    },

    modalHandle: {
      width: 42,
      height: 4,

      borderRadius: 4,

      backgroundColor:
        '#C8C8CE',

      alignSelf: 'center',

      marginBottom: 16,
    },

    photoMenuTitle: {
      fontSize: 19,
      fontWeight: '800',
    },

    photoMenuSubtitle: {
      marginTop: 4,
      marginBottom: 12,

      fontSize: 12,
      lineHeight: 17,

      fontWeight: '500',
    },

    photoMenuItem: {
      minHeight: 66,

      borderBottomWidth: 1,

      flexDirection: 'row',
      alignItems: 'center',

      paddingVertical: 10,
    },

    photoMenuIcon: {
      width: 42,
      height: 42,

      borderRadius: 14,

      alignItems: 'center',
      justifyContent: 'center',
    },

    photoMenuCopy: {
      flex: 1,

      marginLeft: 12,
      marginRight: 8,
    },

    photoMenuItemTitle: {
      fontSize: 14,
      fontWeight: '700',
    },

    photoMenuItemSubtitle: {
      marginTop: 3,

      fontSize: 11.5,
      lineHeight: 16,

      fontWeight: '500',
    },

    cancelButton: {
      height: 48,

      marginTop: 14,

      borderRadius: 15,
      borderWidth: 1,

      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelButtonText: {
      fontSize: 14,
      fontWeight: '700',
    },

    confirmOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.5)',

      alignItems: 'center',
      justifyContent: 'center',

      paddingHorizontal: 24,
    },

    confirmCard: {
      width: '100%',
      maxWidth: 380,

      borderRadius: 22,
      borderWidth: 1,

      padding: 20,

      alignItems: 'center',
    },

    confirmIcon: {
      width: 52,
      height: 52,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',

      marginBottom: 14,
    },

    confirmTitle: {
      fontSize: 19,
      fontWeight: '800',

      textAlign: 'center',
    },

    confirmText: {
      marginTop: 8,

      fontSize: 13,
      lineHeight: 19,

      textAlign: 'center',
    },

    confirmActions: {
      width: '100%',

      flexDirection: 'row',

      gap: 10,

      marginTop: 20,
    },

    confirmCancel: {
      flex: 1,

      height: 48,

      borderRadius: 15,
      borderWidth: 1,

      alignItems: 'center',
      justifyContent: 'center',
    },

    confirmCancelText: {
      fontSize: 14,
      fontWeight: '700',
    },

    confirmRemove: {
      flex: 1,

      height: 48,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',
    },

    confirmRemoveText: {
      color: '#FFFFFF',

      fontSize: 14,
      fontWeight: '800',
    },

    pressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.98,
        },
      ],
    },
  });