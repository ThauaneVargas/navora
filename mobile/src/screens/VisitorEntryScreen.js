import React, {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
  startVisitorAccessMonitor,
} from '../services/visitorAccessMonitor';


const PURPOSES = [
  {
    id: 'VISIT_PATIENT',
    icon: 'account-heart-outline',
    title: 'Visitar paciente',
    text: 'Quero visitar uma pessoa internada.',
  },

  {
    id: 'RECEPTION',
    icon: 'desk',
    title: 'Ir à recepção',
    text: 'Preciso falar com a recepção.',
  },

  {
    id: 'INFORMATION',
    icon: 'information-outline',
    title: 'Buscar informações',
    text: 'Preciso de orientação ou informações.',
  },

  {
    id: 'OTHER',
    icon: 'dots-horizontal-circle-outline',
    title: 'Outros',
    text: 'Outro motivo de visita.',
  },
];


const ACCESSIBILITY_OPTIONS = [
  {
    id: 'wheelchair',
    icon: 'wheelchair-accessibility',
    label: 'Cadeira de rodas',
  },

  {
    id: 'reducedMobility',
    icon: 'walk',
    label: 'Mobilidade reduzida',
  },

  {
    id: 'avoidStairs',
    icon: 'stairs',
    label: 'Rota sem escadas',
  },

  {
    id: 'elevatorOnly',
    icon: 'elevator-passenger-outline',
    label: 'Utilizar somente elevador',
  },

  {
    id: 'walkingHelp',
    icon: 'human-cane',
    label: 'Ajuda para caminhar',
  },

  {
    id: 'voiceGuidance',
    icon: 'volume-high',
    label: 'Orientação por voz',
  },

  {
    id: 'largeText',
    icon: 'format-size',
    label: 'Textos e botões maiores',
  },

  {
    id: 'visualImpairment',
    icon: 'eye-outline',
    label: 'Deficiência visual',
  },

  {
    id: 'hearingImpairment',
    icon: 'ear-hearing',
    label: 'Deficiência auditiva',
  },

  {
    id: 'otherNeeds',
    icon: 'medical-bag',
    label: 'Outras necessidades',
  },
];


const STEP_TITLES = [
  'Quem vai usar o app?',
  'Motivo e destino',
  'Acompanhantes',
  'Acessibilidade',
  'Revisar visita',
];


export default function VisitorEntryScreen({
  navigate,
  goBack,
  routeParams = {},
  onVisitorReady,
  onCreateVisitorAccessRequest,
  onVisitorAccessRequestUpdated,
  visitorIdentificationDraft = {},
  onVisitorIdentificationDraftChange,
}) {
  const {
    appColors,
  } = useApp();

  const area =
    routeParams.area ||
    visitorIdentificationDraft.area ||
    'private';

  const [step, setStep] =
    useState(0);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  /*
   * IDENTIFICAÇÃO
   */

  const [
    fullName,
    setFullName,
  ] = useState(
    visitorIdentificationDraft.fullName ||
      ''
  );

  const [
    phone,
    setPhone,
  ] = useState(
    visitorIdentificationDraft.phone ||
      ''
  );

  const [
    birthDate,
    setBirthDate,
  ] = useState(
    visitorIdentificationDraft.birthDate ||
      ''
  );


  /*
   * VISITA
   */

  const [
    purpose,
    setPurpose,
  ] = useState(null);

  const [
    patientName,
    setPatientName,
  ] = useState('');

  const [
    patientLocationKnown,
    setPatientLocationKnown,
  ] = useState(null);

  const [
    patientLocation,
    setPatientLocation,
  ] = useState('');

  const [
    destinationText,
    setDestinationText,
  ] = useState('');


  /*
   * ACOMPANHANTES
   */

  const [
    accompanied,
    setAccompanied,
  ] = useState(false);

  const [
    companions,
    setCompanions,
  ] = useState([]);


  /*
   * ACESSIBILIDADE
   */

  const [
    needsSupport,
    setNeedsSupport,
  ] = useState(false);

  const [
    accessibility,
    setAccessibility,
  ] = useState({});


  const selectedPurpose =
    useMemo(
      () =>
        PURPOSES.find(
          (item) =>
            item.id === purpose
        ),
      [purpose]
    );


  const isPatientVisit =
    purpose === 'VISIT_PATIENT';


  const companionTotal =
    companions.length;


  /*
   * IDENTIFICAÇÃO
   */

  const updateName = (value) => {
    setFullName(value);

    onVisitorIdentificationDraftChange?.({
      fullName: value,
    });
  };


  const updatePhone = (value) => {
    setPhone(value);

    onVisitorIdentificationDraftChange?.({
      phone: value,
    });
  };


  const updateBirth = (value) => {
    setBirthDate(value);

    onVisitorIdentificationDraftChange?.({
      birthDate: value,
    });
  };


  /*
   * ACOMPANHANTES
   */

  const createCompanion = () => ({
    id:
      `companion-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    name: '',

    type: 'adult',
  });


  const addCompanion = () => {
    setCompanions(
      (current) => [
        ...current,
        createCompanion(),
      ]
    );
  };


  const updateCompanion = (
    companionId,
    patch
  ) => {
    setCompanions(
      (current) =>
        current.map(
          (companion) =>
            companion.id ===
            companionId
              ? {
                  ...companion,
                  ...patch,
                }
              : companion
        )
    );
  };


  const removeCompanion = (
    companionId
  ) => {
    setCompanions(
      (current) =>
        current.filter(
          (companion) =>
            companion.id !==
            companionId
        )
    );
  };


  const companionTypeLabel =
    (type) => {
      if (type === 'child') {
        return 'Criança';
      }

      if (type === 'elderly') {
        return 'Idoso';
      }

      return 'Adulto';
    };


  /*
   * ACESSIBILIDADE
   */

  const toggleAccessibility = (
    id
  ) => {
    setAccessibility(
      (current) => ({
        ...current,

        [id]:
          !current[id],
      })
    );
  };


  /*
   * VALIDAÇÃO
   */

  const validateStep = () => {
    if (step === 0) {
      if (!fullName.trim()) {
        Alert.alert(
          'Nome completo',
          'Informe seu nome completo para continuar.'
        );

        return false;
      }
    }


    if (step === 1) {
      if (!purpose) {
        Alert.alert(
          'Motivo da visita',
          'Selecione o objetivo da sua visita.'
        );

        return false;
      }


      if (isPatientVisit) {
        if (!patientName.trim()) {
          Alert.alert(
            'Nome do paciente',
            'Informe o nome do paciente que você deseja visitar.'
          );

          return false;
        }


        if (
          patientLocationKnown ===
          null
        ) {
          Alert.alert(
            'Local do paciente',
            'Informe se você sabe onde o paciente está.'
          );

          return false;
        }


        if (
          patientLocationKnown ===
            true &&
          !patientLocation.trim()
        ) {
          Alert.alert(
            'Local do paciente',
            'Informe o local que você conhece ou selecione “Não sei”.'
          );

          return false;
        }
      }


      if (
        purpose === 'OTHER' &&
        !destinationText.trim()
      ) {
        Alert.alert(
          'Destino',
          'Informe a pessoa, setor ou destino relacionado à visita.'
        );

        return false;
      }
    }


    if (
      step === 2 &&
      accompanied
    ) {
      if (
        companionTotal === 0
      ) {
        Alert.alert(
          'Acompanhantes',
          'Adicione pelo menos um acompanhante ou selecione “Não”.'
        );

        return false;
      }


      const companionWithoutName =
        companions.find(
          (companion) =>
            !companion.name.trim()
        );


      if (
        companionWithoutName
      ) {
        Alert.alert(
          'Nome do acompanhante',
          'Informe o nome completo de cada acompanhante para continuar.'
        );

        return false;
      }
    }


    return true;
  };


  const nextStep = () => {
    if (!validateStep()) {
      return;
    }

    setStep(
      (current) =>
        Math.min(
          current + 1,
          STEP_TITLES.length - 1
        )
    );
  };


  const previousStep = () => {
    if (step === 0) {
      goBack?.(
        'HomeStart'
      );

      return;
    }

    setStep(
      (current) =>
        Math.max(
          0,
          current - 1
        )
    );
  };


  /*
   * GERAR DADOS DA VISITA
   */

  const getRequestedDestination =
    () => {
      if (
        isPatientVisit
      ) {
        return `Paciente: ${patientName.trim()}`;
      }

      if (
        purpose ===
        'RECEPTION'
      ) {
        return 'Recepção';
      }

      if (
        purpose ===
        'INFORMATION'
      ) {
        return (
          destinationText.trim() ||
          'Recepção / Informações'
        );
      }

      return (
        destinationText.trim() ||
        selectedPurpose?.title ||
        'Recepção'
      );
    };


  const getReason = () => {
    const parts = [
      selectedPurpose?.title ||
        'Visita',
    ];


    if (
      isPatientVisit
    ) {
      parts.push(
        `Paciente: ${patientName.trim()}`
      );

      parts.push(
        patientLocationKnown
          ? `Local informado pelo visitante: ${patientLocation.trim()}`
          : 'Visitante não sabe onde o paciente está'
      );
    }


    if (
      destinationText.trim() &&
      !isPatientVisit
    ) {
      parts.push(
        `Destino informado: ${destinationText.trim()}`
      );
    }


    if (accompanied) {
      parts.push(
        `Acompanhantes: ${companionTotal}`
      );

      companions.forEach(
        (companion) => {
          parts.push(
            `${companion.name.trim()} (${companionTypeLabel(
              companion.type
            )})`
          );
        }
      );
    } else {
      parts.push(
        'Sem acompanhantes'
      );
    }


    return parts.join(
      ' | '
    );
  };


  const getAccessibilityText =
    () => {
      if (!needsSupport) {
        return 'Não precisa de apoio';
      }

      const selected =
        ACCESSIBILITY_OPTIONS
          .filter(
            (item) =>
              accessibility[
                item.id
              ]
          )
          .map(
            (item) =>
              item.label
          );

      return selected.length
        ? selected.join(', ')
        : 'Precisa de apoio';
    };


  /*
   * ENVIAR SOLICITAÇÃO
   */

  const submitVisit =
    async () => {
      if (submitting) {
        return;
      }

      setSubmitting(true);


      const cleanName =
        fullName.trim();


      const visitorProfile = {
        type: 'visitor',

        profile: 'VISITOR',

        name:
          cleanName.split(
            ' '
          )[0],

        fullName:
          cleanName,

        phone:
          phone.trim() ||
          null,

        birthDate:
          birthDate.trim() ||
          null,

        area,

        arrivalStatus:
          'INDOOR',

        accessibility,

        visitPurpose:
          purpose,

        patientName:
          patientName.trim() ||
          null,

        patientLocationKnown,

        patientLocation:
          patientLocation.trim() ||
          null,

        companions,

        groupTotal:
          companionTotal + 1,
      };


      /*
       * Primeiro mantém o perfil
       * do visitante no App.
       */

      onVisitorReady?.(
        visitorProfile
      );


      const payload = {
        visitorName:
          cleanName,

        area,

        requestedDestination:
          getRequestedDestination(),

        reason:
          getReason(),

        accessibility:
          getAccessibilityText(),

        patientName:
          patientName.trim() ||
          undefined,

        patientLocation:
          patientLocationKnown
            ? patientLocation.trim()
            : undefined,

        companions,

        groupTotal:
          companionTotal + 1,
      };


      try {
        /*
         * O App atual cria primeiro
         * uma solicitação local e
         * depois sincroniza com a API.
         */

        const requestPromise =
          onCreateVisitorAccessRequest?.(
            payload
          );


        /*
         * Não deixamos o visitante
         * preso na tela de autorização.
         */

        navigate('Home');


        const createdRequest =
          await Promise.resolve(
            requestPromise
          );


        if (
          createdRequest
        ) {
          startVisitorAccessMonitor({
            request:
              createdRequest,

            onUpdate: (
              updated
            ) => {
              onVisitorAccessRequestUpdated?.(
                updated
              );
            },


            onApproved: (
              updated
            ) => {
              Alert.alert(
                'Autorização confirmada',
                'A recepção confirmou sua visita. O destino e o tempo autorizado já estão disponíveis no Navora.',
                [
                  {
                    text:
                      'Agora não',

                    style:
                      'cancel',
                  },

                  {
                    text:
                      'Ver autorização',

                    onPress: () =>
                      navigate(
                        'Home',
                        {
                          visitorAccessRequest:
                            updated,
                        }
                      ),
                  },
                ]
              );
            },


            onWarning: ({
              minutes,
              request,
            }) => {
              Alert.alert(
                'Tempo de visita',
                `Faltam aproximadamente ${minutes} minutos para o término da sua autorização.`,
                [
                  {
                    text:
                      'Continuar',

                    style:
                      'cancel',
                  },

                  {
                    text:
                      'Ver opções',

                    onPress: () =>
                      navigate(
                        'VisitorAccessStatus',
                        {
                          request,
                        }
                      ),
                  },
                ]
              );
            },


            onExpired: (
              request
            ) => {
              Alert.alert(
                'Tempo de visita encerrado',
                'O tempo autorizado terminou. Dirija-se à saída ou à recepção.',
                [
                  {
                    text:
                      'Ir para início',

                    onPress: () =>
                      navigate(
                        'Home',
                        {
                          visitorAccessRequest:
                            request,
                        }
                      ),
                  },
                ]
              );
            },
          });
        }
      } catch (error) {
        /*
         * O App mantém a solicitação
         * local mesmo se a API estiver
         * temporariamente indisponível.
         */
      } finally {
        setSubmitting(
          false
        );
      }
    };


  /*
   * INTERFACE
   */

  return (
    <Screen>
      <Header
        title="Visitante"
        subtitle={
          STEP_TITLES[
            step
          ]
        }
        onBack={
          previousStep
        }
        onMenu={() =>
          navigate(
            'Menu'
          )
        }
      />


      <Progress
        step={step}
        total={
          STEP_TITLES.length
        }
        appColors={
          appColors
        }
      />


      {step === 0 && (
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
          <Text
            style={[
              styles.title,

              {
                color:
                  appColors.text,
              },
            ]}
          >
            Quem vai usar o app?
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
            Precisamos apenas dos dados básicos para identificar sua solicitação.
          </Text>


          <Field
            label="Nome completo"
            required
            value={
              fullName
            }
            onChangeText={
              updateName
            }
            placeholder="Ex.: Maria Silva"
            appColors={
              appColors
            }
          />


          <Field
            label="Telefone"
            value={phone}
            onChangeText={
              updatePhone
            }
            placeholder="Opcional"
            keyboardType="phone-pad"
            appColors={
              appColors
            }
          />


          <Field
            label="Data de nascimento"
            value={
              birthDate
            }
            onChangeText={
              updateBirth
            }
            placeholder="Opcional"
            appColors={
              appColors
            }
          />
        </View>
      )}


      {step === 1 && (
        <>
          <Text
            style={[
              styles.sectionTitle,

              {
                color:
                  appColors.text,
              },
            ]}
          >
            Qual é o objetivo da visita?
          </Text>


          <View
            style={
              styles.options
            }
          >
            {PURPOSES.map(
              (item) => (
                <Option
                  key={
                    item.id
                  }
                  icon={
                    item.icon
                  }
                  title={
                    item.title
                  }
                  text={
                    item.text
                  }
                  selected={
                    purpose ===
                    item.id
                  }
                  onPress={() =>
                    setPurpose(
                      item.id
                    )
                  }
                  appColors={
                    appColors
                  }
                />
              )
            )}
          </View>


          {isPatientVisit && (
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
              <Text
                style={[
                  styles.cardTitle,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                Paciente
              </Text>


              <Field
                label="Nome do paciente"
                required
                value={
                  patientName
                }
                onChangeText={
                  setPatientName
                }
                placeholder="Ex.: Ana Souza"
                appColors={
                  appColors
                }
              />


              <Text
                style={[
                  styles.question,

                  {
                    color:
                      appColors.text,
                  },
                ]}
              >
                Você sabe onde o paciente está?
              </Text>


              <View
                style={
                  styles.twoButtons
                }
              >
                <ChoiceButton
                  label="Sim"
                  selected={
                    patientLocationKnown ===
                    true
                  }
                  onPress={() =>
                    setPatientLocationKnown(
                      true
                    )
                  }
                  appColors={
                    appColors
                  }
                />

                <ChoiceButton
                  label="Não sei"
                  selected={
                    patientLocationKnown ===
                    false
                  }
                  onPress={() => {
                    setPatientLocationKnown(
                      false
                    );

                    setPatientLocation(
                      ''
                    );
                  }}
                  appColors={
                    appColors
                  }
                />
              </View>


              {patientLocationKnown ===
                true && (
                <Field
                  label="Setor, quarto ou local"
                  required
                  value={
                    patientLocation
                  }
                  onChangeText={
                    setPatientLocation
                  }
                  placeholder="Ex.: Internação, quarto 204"
                  appColors={
                    appColors
                  }
                />
              )}


              <View
                style={[
                  styles.securityNotice,

                  {
                    backgroundColor:
                      appColors.iconBg,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={20}
                  color={
                    appColors.primary
                  }
                />

                <Text
                  style={[
                    styles.securityText,

                    {
                      color:
                        appColors.text,
                    },
                  ]}
                >
                  O Navora não confirma internação ou quarto antes da validação presencial. A recepção confirmará essas informações.
                </Text>
              </View>
            </View>
          )}


          {!isPatientVisit &&
            purpose && (
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
                <Field
                  label="Pessoa, setor ou destino"
                  required={
                    purpose ===
                    'OTHER'
                  }
                  value={
                    destinationText
                  }
                  onChangeText={
                    setDestinationText
                  }
                  placeholder={
                    purpose ===
                    'OTHER'
                      ? 'Informe o destino'
                      : 'Opcional'
                  }
                  appColors={
                    appColors
                  }
                />
              </View>
            )}
        </>
      )}


      {step === 2 && (
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
          <Text
            style={[
              styles.title,

              {
                color:
                  appColors.text,
              },
            ]}
          >
            Você está acompanhado?
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
            Se houver acompanhantes, informe o nome completo e o tipo de cada pessoa.
          </Text>


          <View
            style={
              styles.twoButtons
            }
          >
            <ChoiceButton
              label="Não"
              selected={
                !accompanied
              }
              onPress={() => {
                setAccompanied(
                  false
                );

                setCompanions(
                  []
                );
              }}
              appColors={
                appColors
              }
            />

            <ChoiceButton
              label="Sim"
              selected={
                accompanied
              }
              onPress={() => {
                setAccompanied(
                  true
                );

                if (
                  companions.length ===
                  0
                ) {
                  setCompanions([
                    createCompanion(),
                  ]);
                }
              }}
              appColors={
                appColors
              }
            />
          </View>


          {accompanied && (
            <View
              style={
                styles.companionList
              }
            >
              {companions.map(
                (
                  companion,
                  index
                ) => (
                  <CompanionCard
                    key={
                      companion.id
                    }
                    companion={
                      companion
                    }
                    index={index}
                    appColors={
                      appColors
                    }
                    onChangeName={(
                      value
                    ) =>
                      updateCompanion(
                        companion.id,
                        {
                          name:
                            value,
                        }
                      )
                    }
                    onChangeType={(
                      type
                    ) =>
                      updateCompanion(
                        companion.id,
                        {
                          type,
                        }
                      )
                    }
                    onRemove={() =>
                      removeCompanion(
                        companion.id
                      )
                    }
                  />
                )
              )}


              <Pressable
                onPress={
                  addCompanion
                }
                style={({
                  pressed,
                }) => [
                  styles.addCompanionButton,

                  {
                    backgroundColor:
                      appColors.iconBg,

                    borderColor:
                      appColors.border,
                  },

                  pressed &&
                    styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={20}
                  color={
                    appColors.primary
                  }
                />

                <Text
                  style={[
                    styles.addCompanionText,

                    {
                      color:
                        appColors.primary,
                    },
                  ]}
                >
                  Adicionar outro acompanhante
                </Text>
              </Pressable>


              <Text
                style={[
                  styles.totalText,

                  {
                    color:
                      appColors.muted,
                  },
                ]}
              >
                Total: {companionTotal} acompanhante(s)
              </Text>
            </View>
          )}
        </View>
      )}


      {step === 3 && (
        <>
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
            <Text
              style={[
                styles.title,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              Alguém precisa de apoio?
            </Text>


            <View
              style={
                styles.twoButtons
              }
            >
              <ChoiceButton
                label="Não preciso"
                selected={
                  !needsSupport
                }
                onPress={() => {
                  setNeedsSupport(
                    false
                  );

                  setAccessibility(
                    {}
                  );
                }}
                appColors={
                  appColors
                }
              />

              <ChoiceButton
                label="Preciso de apoio"
                selected={
                  needsSupport
                }
                onPress={() =>
                  setNeedsSupport(
                    true
                  )
                }
                appColors={
                  appColors
                }
              />
            </View>
          </View>


          {needsSupport && (
            <View
              style={
                styles.options
              }
            >
              {ACCESSIBILITY_OPTIONS.map(
                (item) => (
                  <Option
                    key={
                      item.id
                    }
                    icon={
                      item.icon
                    }
                    title={
                      item.label
                    }
                    selected={
                      Boolean(
                        accessibility[
                          item.id
                        ]
                      )
                    }
                    onPress={() =>
                      toggleAccessibility(
                        item.id
                      )
                    }
                    appColors={
                      appColors
                    }
                    compact
                  />
                )
              )}
            </View>
          )}
        </>
      )}


      {step === 4 && (
        <>
          <View
            style={[
              styles.reviewNotice,

              {
                backgroundColor:
                  appColors.iconBg,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="desk"
              size={23}
              color={
                appColors.primary
              }
            />

            <Text
              style={[
                styles.reviewNoticeText,

                {
                  color:
                    appColors.text,
                },
              ]}
            >
              Após enviar, você deverá ir obrigatoriamente à recepção para confirmar sua presença e os dados da visita.
            </Text>
          </View>


          <ReviewSection
            title="Identificação"
            onEdit={() =>
              setStep(0)
            }
            appColors={
              appColors
            }
          >
            <ReviewLine
              label="Nome"
              value={
                fullName
              }
              appColors={
                appColors
              }
            />

            <ReviewLine
              label="Telefone"
              value={
                phone ||
                'Não informado'
              }
              appColors={
                appColors
              }
            />

            <ReviewLine
              label="Nascimento"
              value={
                birthDate ||
                'Não informado'
              }
              appColors={
                appColors
              }
            />
          </ReviewSection>


          <ReviewSection
            title="Visita"
            onEdit={() =>
              setStep(1)
            }
            appColors={
              appColors
            }
          >
            <ReviewLine
              label="Motivo"
              value={
                selectedPurpose?.title
              }
              appColors={
                appColors
              }
            />

            {isPatientVisit && (
              <>
                <ReviewLine
                  label="Paciente"
                  value={
                    patientName
                  }
                  appColors={
                    appColors
                  }
                />

                <ReviewLine
                  label="Local"
                  value={
                    patientLocationKnown
                      ? patientLocation
                      : 'Não sei'
                  }
                  appColors={
                    appColors
                  }
                />
              </>
            )}
          </ReviewSection>


          <ReviewSection
            title="Acompanhantes"
            onEdit={() =>
              setStep(2)
            }
            appColors={
              appColors
            }
          >
            {!accompanied ||
            companionTotal ===
              0 ? (
              <ReviewLine
                label="Acompanhantes"
                value="Nenhum"
                appColors={
                  appColors
                }
              />
            ) : (
              <>
                <ReviewLine
                  label="Quantidade"
                  value={String(
                    companionTotal
                  )}
                  appColors={
                    appColors
                  }
                />

                {companions.map(
                  (
                    companion,
                    index
                  ) => (
                    <ReviewLine
                      key={
                        companion.id
                      }
                      label={`Acompanhante ${
                        index + 1
                      }`}
                      value={`${companion.name.trim()} • ${companionTypeLabel(
                        companion.type
                      )}`}
                      appColors={
                        appColors
                      }
                    />
                  )
                )}
              </>
            )}
          </ReviewSection>


          <ReviewSection
            title="Acessibilidade"
            onEdit={() =>
              setStep(3)
            }
            appColors={
              appColors
            }
          >
            <ReviewLine
              label="Apoio"
              value={
                getAccessibilityText()
              }
              appColors={
                appColors
              }
            />
          </ReviewSection>
        </>
      )}


      {step < 4 ? (
        <Pressable
          onPress={
            nextStep
          }
          style={({ pressed }) => [
            styles.primaryButton,

            {
              backgroundColor:
                appColors.primary,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={
              styles.primaryText
            }
          >
            Continuar
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={
            submitVisit
          }
          disabled={
            submitting
          }
          style={({ pressed }) => [
            styles.primaryButton,

            {
              backgroundColor:
                appColors.primary,
            },

            submitting &&
              styles.disabled,

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="send-outline"
            size={19}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.primaryText
            }
          >
            {submitting
              ? 'Enviando...'
              : 'Enviar solicitação de visita'}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}


function Progress({
  step,
  total,
  appColors,
}) {
  return (
    <View
      style={
        styles.progress
      }
    >
      {Array.from({
        length:
          total,
      }).map(
        (
          _,
          index
        ) => (
          <View
            key={index}
            style={[
              styles.progressBar,

              {
                backgroundColor:
                  index <=
                  step
                    ? appColors.primary
                    : appColors.border,
              },
            ]}
          />
        )
      )}
    </View>
  );
}


function Field({
  label,
  required,
  appColors,
  ...props
}) {
  return (
    <View
      style={
        styles.field
      }
    >
      <View
        style={
          styles.labelRow
        }
      >
        <Text
          style={[
            styles.label,

            {
              color:
                appColors.text,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.optional,

            {
              color:
                appColors.muted,
            },
          ]}
        >
          {required
            ? 'Obrigatório'
            : 'Opcional'}
        </Text>
      </View>

      <TextInput
        {...props}
        placeholderTextColor={
          appColors.muted
        }
        style={[
          styles.input,

          {
            color:
              appColors.text,

            backgroundColor:
              appColors.background,

            borderColor:
              appColors.border,
          },
        ]}
      />
    </View>
  );
}


function Option({
  icon,
  title,
  text,
  selected,
  onPress,
  appColors,
  compact,
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({ pressed }) => [
        styles.option,

        compact &&
          styles.compactOption,

        {
          backgroundColor:
            appColors.surface,

          borderColor:
            selected
              ? appColors.primary
              : appColors.border,
        },

        selected && {
          borderWidth: 2,
        },

        pressed &&
          styles.pressed,

        shadows.card,
      ]}
    >
      <View
        style={[
          styles.optionIcon,

          {
            backgroundColor:
              selected
                ? appColors.primary
                : appColors.iconBg,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={
            selected
              ? '#FFFFFF'
              : appColors.primary
          }
        />
      </View>

      <View
        style={
          styles.optionCopy
        }
      >
        <Text
          style={[
            styles.optionTitle,

            {
              color:
                appColors.text,
            },
          ]}
        >
          {title}
        </Text>

        {!!text && (
          <Text
            style={[
              styles.optionText,

              {
                color:
                  appColors.muted,
              },
            ]}
          >
            {text}
          </Text>
        )}
      </View>

      {selected && (
        <MaterialCommunityIcons
          name="check-circle"
          size={21}
          color={
            appColors.primary
          }
        />
      )}
    </Pressable>
  );
}


function ChoiceButton({
  label,
  selected,
  onPress,
  appColors,
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({ pressed }) => [
        styles.choice,

        {
          backgroundColor:
            selected
              ? appColors.primary
              : appColors.surface,

          borderColor:
            selected
              ? appColors.primary
              : appColors.border,
        },

        pressed &&
          styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.choiceText,

          {
            color:
              selected
                ? '#FFFFFF'
                : appColors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


function CompanionCard({
  companion,
  index,
  appColors,
  onChangeName,
  onChangeType,
  onRemove,
}) {
  return (
    <View
      style={[
        styles.companionCard,

        {
          backgroundColor:
            appColors.surface,

          borderColor:
            appColors.border,
        },
      ]}
    >
      <View
        style={
          styles.companionHeader
        }
      >
        <View
          style={
            styles.companionHeaderCopy
          }
        >
          <Text
            style={[
              styles.companionTitle,

              {
                color:
                  appColors.text,
              },
            ]}
          >
            Acompanhante {index + 1}
          </Text>

          <Text
            style={[
              styles.companionHint,

              {
                color:
                  appColors.muted,
              },
            ]}
          >
            Nome completo obrigatório
          </Text>
        </View>

        <Pressable
          onPress={
            onRemove
          }
          hitSlop={8}
          style={({ pressed }) => [
            styles.removeCompanionButton,

            {
              backgroundColor:
                appColors.iconBg,
            },

            pressed &&
              styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={19}
            color={
              appColors.danger ||
              appColors.primary
            }
          />
        </Pressable>
      </View>


      <Field
        label="Nome completo"
        required
        value={
          companion.name
        }
        onChangeText={
          onChangeName
        }
        placeholder="Ex.: João da Silva"
        appColors={
          appColors
        }
      />


      <Text
        style={[
          styles.companionTypeLabel,

          {
            color:
              appColors.text,
          },
        ]}
      >
        Tipo
      </Text>


      <View
        style={
          styles.companionTypeButtons
        }
      >
        <ChoiceButton
          label="Adulto"
          selected={
            companion.type ===
            'adult'
          }
          onPress={() =>
            onChangeType(
              'adult'
            )
          }
          appColors={
            appColors
          }
        />

        <ChoiceButton
          label="Criança"
          selected={
            companion.type ===
            'child'
          }
          onPress={() =>
            onChangeType(
              'child'
            )
          }
          appColors={
            appColors
          }
        />

        <ChoiceButton
          label="Idoso"
          selected={
            companion.type ===
            'elderly'
          }
          onPress={() =>
            onChangeType(
              'elderly'
            )
          }
          appColors={
            appColors
          }
        />
      </View>
    </View>
  );
}


function ReviewSection({
  title,
  onEdit,
  appColors,
  children,
}) {
  return (
    <View
      style={[
        styles.reviewCard,

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
          styles.reviewHeader
        }
      >
        <Text
          style={[
            styles.reviewTitle,

            {
              color:
                appColors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Pressable
          onPress={
            onEdit
          }
        >
          <Text
            style={[
              styles.editText,

              {
                color:
                  appColors.primary,
              },
            ]}
          >
            Editar
          </Text>
        </Pressable>
      </View>

      {children}
    </View>
  );
}


function ReviewLine({
  label,
  value,
  appColors,
}) {
  return (
    <View
      style={
        styles.reviewLine
      }
    >
      <Text
        style={[
          styles.reviewLabel,

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
          styles.reviewValue,

          {
            color:
              appColors.text,
          },
        ]}
      >
        {value || '—'}
      </Text>
    </View>
  );
}


const styles =
  StyleSheet.create({
    progress: {
      flexDirection:
        'row',

      gap: 5,

      marginTop: 12,

      marginBottom: 16,
    },

    progressBar: {
      flex: 1,

      height: 5,

      borderRadius: 5,
    },

    card: {
      borderRadius: 22,

      borderWidth: 1,

      padding: 16,

      marginBottom: 14,
    },

    title: {
      fontSize: 20,

      fontWeight: '900',
    },

    cardTitle: {
      fontSize: 16,

      fontWeight: '900',
    },

    description: {
      fontSize: 13,

      lineHeight: 19,

      marginTop: 6,
    },

    sectionTitle: {
      fontSize: 18,

      fontWeight: '900',

      marginBottom: 12,
    },

    field: {
      marginTop: 16,
    },

    labelRow: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 7,
    },

    label: {
      fontSize: 13,

      fontWeight: '800',
    },

    optional: {
      fontSize: 10,

      fontWeight: '700',
    },

    input: {
      height: 51,

      borderRadius: 15,

      borderWidth: 1,

      paddingHorizontal: 13,

      fontSize: 14,

      fontWeight: '600',
    },

    options: {
      gap: 10,

      marginBottom: 14,
    },

    option: {
      minHeight: 72,

      borderRadius: 18,

      borderWidth: 1,

      padding: 12,

      flexDirection:
        'row',

      alignItems:
        'center',
    },

    compactOption: {
      minHeight: 60,
    },

    optionIcon: {
      width: 42,

      height: 42,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    optionCopy: {
      flex: 1,

      marginLeft: 12,

      marginRight: 8,
    },

    optionTitle: {
      fontSize: 14,

      fontWeight: '800',
    },

    optionText: {
      fontSize: 11.5,

      lineHeight: 16,

      marginTop: 3,
    },

    question: {
      fontSize: 13,

      fontWeight: '800',

      marginTop: 18,

      marginBottom: 9,
    },

    twoButtons: {
      flexDirection:
        'row',

      gap: 9,

      marginTop: 14,
    },

    choice: {
      flex: 1,

      minHeight: 48,

      borderRadius: 15,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 8,
    },

    choiceText: {
      fontSize: 13,

      fontWeight: '800',

      textAlign:
        'center',
    },

    securityNotice: {
      borderRadius: 15,

      padding: 12,

      flexDirection:
        'row',

      gap: 9,

      marginTop: 16,
    },

    securityText: {
      flex: 1,

      fontSize: 11.5,

      lineHeight: 17,

      fontWeight: '600',
    },

    companionList: {
      marginTop: 18,

      gap: 12,
    },

    companionCard: {
      borderWidth: 1,

      borderRadius: 18,

      padding: 13,
    },

    companionHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 10,
    },

    companionHeaderCopy: {
      flex: 1,

      minWidth: 0,
    },

    companionTitle: {
      fontSize: 14,

      fontWeight: '900',
    },

    companionHint: {
      marginTop: 2,

      fontSize: 10.5,

      lineHeight: 15,

      fontWeight: '600',
    },

    removeCompanionButton: {
      width: 36,

      height: 36,

      borderRadius: 12,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    companionTypeLabel: {
      marginTop: 16,

      marginBottom: 8,

      fontSize: 13,

      fontWeight: '800',
    },

    companionTypeButtons: {
      flexDirection:
        'row',

      gap: 7,
    },

    addCompanionButton: {
      minHeight: 48,

      borderRadius: 15,

      borderWidth: 1,

      borderStyle:
        'dashed',

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      paddingHorizontal: 12,
    },

    addCompanionText: {
      fontSize: 12,

      fontWeight: '900',

      textAlign:
        'center',
    },

    totalText: {
      textAlign:
        'right',

      fontSize: 12,

      fontWeight: '700',
    },

    reviewNotice: {
      padding: 14,

      borderRadius: 18,

      flexDirection:
        'row',

      gap: 10,

      marginBottom: 14,
    },

    reviewNoticeText: {
      flex: 1,

      fontSize: 12,

      lineHeight: 18,

      fontWeight: '700',
    },

    reviewCard: {
      borderRadius: 18,

      borderWidth: 1,

      padding: 14,

      marginBottom: 11,
    },

    reviewHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 10,
    },

    reviewTitle: {
      fontSize: 15,

      fontWeight: '900',
    },

    editText: {
      fontSize: 12,

      fontWeight: '900',
    },

    reviewLine: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      gap: 15,

      marginTop: 7,
    },

    reviewLabel: {
      fontSize: 11,

      fontWeight: '700',
    },

    reviewValue: {
      flex: 1,

      textAlign:
        'right',

      fontSize: 12,

      fontWeight: '800',
    },

    primaryButton: {
      minHeight: 54,

      borderRadius: 17,

      alignItems:
        'center',

      justifyContent:
        'center',

      flexDirection:
        'row',

      gap: 8,

      marginTop: 6,

      marginBottom: 16,

      paddingHorizontal: 15,
    },

    primaryText: {
      color: '#FFFFFF',

      fontSize: 14,

      fontWeight: '900',

      textAlign:
        'center',
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