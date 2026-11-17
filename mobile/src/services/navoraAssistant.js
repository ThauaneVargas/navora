/**
 * Assistente do Navora — local e determinístico: sem IA generativa, sem
 * internet e sem custo por mensagem. Só responde sobre o app/hospital; o
 * resto recebe uma resposta de "fora do escopo".
 *
 * A ORDEM das regras em getNavoraAssistantResponse é a prioridade. Emergência
 * vem sempre primeiro: "estou passando mal no banheiro" tem que virar SOS, não
 * rota pro banheiro.
 *
 * Função pura (sem imports de React Native) pra rodar em teste no Node —
 * ver navoraAssistant.test.mjs (`npm test`).
 */

export const assistantProvider = {
  id: 'deterministic-local',
  label: 'Assistente local guiado',
  generative: false,
};

// Atalhos exibidos na tela do assistente. Ficam aqui (e não na tela) pra o
// teste garantir que todo atalho tem resposta própria. `label` é o texto em
// português que vai pro assistente; a tela mostra `t('assistant.sug_<key>')`.
export const assistantSuggestions = [
  { key: 'howToGet', label: 'Como chegar ao hospital', icon: 'map-marker-outline' },
  { key: 'otherEntrance', label: 'Estou em outra entrada', icon: 'door-open' },
  { key: 'visit', label: 'Quero visitar alguém', icon: 'account-heart-outline' },
  { key: 'lost', label: 'Estou perdido', icon: 'help-circle-outline' },
  { key: 'restroom', label: 'Banheiro mais próximo', icon: 'human-male' },
  { key: 'accessible', label: 'Rota acessível', icon: 'wheelchair-accessibility' },
  { key: 'darkMode', label: 'Ativar modo noturno', icon: 'weather-night' },
  { key: 'clinical', label: 'Apoio clínico', icon: 'stethoscope' },
  { key: 'sos', label: 'SOS Emergência', icon: 'alarm-light-outline' },
];

// --- Texto -------------------------------------------------------------------

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Palavra/frase INTEIRA: "ala" não casa com "sala", "noite" não casa com
// "noturno", "sos" não casa com "sossego". (O assistente antigo usava
// includes() e errava nesses casos.)
const hasTerm = (text, term) =>
  new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}($|[^a-z0-9])`).test(text);

const hasAny = (text, terms) => terms.some((term) => hasTerm(text, term));

const reply = (intent, text, action = null) => ({
  intent,
  text,
  actionLabel: action?.label || null,
  actionScreen: action?.screen || null,
  actionParams: action?.params || {},
});

// --- Vocabulário (sempre sem acento — o texto é normalizado antes) ----------

// Sem "urgente": "preciso ir no banheiro urgente" não é emergência.
// ("pronto socorro" cai em "socorro" de propósito.)
const EMERGENCY_TERMS = [
  'sos', 'socorro', 'emergencia', 'urgencia', 'passando mal',
  'dor no peito', 'infarto', 'avc', 'derrame', 'falta de ar', 'sem ar',
  'nao consigo respirar', 'desmaio', 'desmaiei', 'desmaiou', 'convulsao',
  'sangrando', 'sangramento', 'hemorragia', 'perdendo sangue',
  'cai', 'caiu', 'queda', 'acidente', 'incendio', 'fogo',
];

const CLINICAL_SUPPORT_TERMS = [
  'medico', 'medica', 'doutor', 'doutora', 'enfermeiro', 'enfermeira',
  'apoio clinico', 'equipe de saude',
];

// Pergunta de saúde: o app não orienta sobre remédio, sintoma ou diagnóstico.
const MEDICAL_QUESTION_TERMS = [
  'remedio', 'remedios', 'medicamento', 'medicamentos', 'medicacao', 'dose',
  'dosagem', 'posso tomar', 'tomo', 'comprimido', 'antibiotico', 'dipirona',
  'paracetamol', 'ibuprofeno', 'diagnostico', 'sintoma', 'sintomas',
  'tratamento', 'receita', 'o que eu tenho', 'e grave', 'dor', 'febre',
  'enjoo', 'vomito', 'tontura', 'pressao',
];

const VISIT_TERMS = [
  'quarto', 'leito', 'internacao', 'internado', 'internada', 'ala',
  'enfermaria', 'uti', 'visita', 'visitar',
];

const CHANGE_AREA_TERMS = [
  'outra entrada', 'entrada errada', 'trocar unidade', 'mudar unidade',
  'estou no sus', 'marco capute', 'entrada da frente', 'estou no private',
  'hmc private', 'particular', 'convenio', 'entrada dos fundos', 'entrada de fundos',
];

const THEME_TERMS = [
  'modo noturno', 'modo escuro', 'tema escuro', 'tela escura', 'dark mode',
  'modo claro', 'tema claro', 'tela clara',
];

const END_ROUTE_TERMS = ['finalizar rota', 'encerrar rota', 'parar rota', 'cancelar rota', 'sair da rota'];
const ARRIVED_TERMS = ['cheguei', 'ja cheguei', 'estou no destino', 'aguardando atendimento', 'esperando atendimento'];
const LOST_TERMS = ['perdido', 'perdida', 'me perdi', 'nao sei onde estou', 'onde estou'];
// Genéricos: só valem se a frase não citar um destino ("não acho a saída" é destino).
const LOST_GENERIC_TERMS = ['nao acho', 'nao encontro', 'nao consigo achar', 'nao sei chegar'];
const RESTRICTED_TERMS = ['centro cirurgico', 'bloco cirurgico', 'cirurgia', 'uti', 'terapia intensiva'];
const EMERGENCY_EXIT_TERMS = ['saida de emergencia', 'rota de fuga', 'evacuacao', 'evacuar'];

// Regra de escopo do projeto: o Navora não faz agendamento.
const SCHEDULING_TERMS = [
  'marcar consulta', 'marcar uma consulta', 'marcar exame', 'marcar um exame', 'agendar',
  'agendamento', 'remarcar', 'desmarcar', 'cancelar consulta', 'cancelar exame',
];

const PARKING_TERMS = ['estacionamento', 'estacionar', 'estaciono', 'vaga de carro', 'onde paro o carro'];

// O app não tem horário de funcionamento nos dados — não inventar.
const HOURS_TERMS = ['horario', 'horarios', 'que horas', 'funcionamento', 'hora de visita'];

// Específico o bastante pra vir antes da busca de destino.
const EXTERNAL_ROUTE_TERMS = [
  'chegar ao hospital', 'chegar no hospital', 'ir para o hospital', 'ir pro hospital',
  'endereco', 'rota externa', 'como chego ai',
];

const ACCESSIBILITY_TERMS = [
  'cadeira de rodas', 'cadeirante', 'acessivel', 'acessibilidade', 'elevador',
  'sem escada', 'evitar escada', 'escada', 'mobilidade', 'muleta', 'andador', 'maca',
  'letra', 'fonte maior', 'alto contraste', 'enxergo mal', 'nao enxergo', 'baixa visao',
  'surdo', 'surda', 'cego', 'cega', 'deficiente', 'deficiencia',
];

const HELP_TERMS = ['ajuda', 'preciso de ajuda', 'chamar ajuda', 'falar com alguem', 'atendente', 'funcionario'];
const GREETING_TERMS = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'obrigado', 'obrigada', 'valeu', 'tudo bem'];

// --- Destinos (vêm dos dados do app, nunca de uma lista escrita à mão) ----

// Os nomes no dado trazem a unidade no fim ("Laboratorio Private", "Banheiro SUS").
const AREA_SUFFIXES = [' private', ' sus', ' hospital marco capute'];

const coreName = (name = '') =>
  AREA_SUFFIXES.reduce(
    (current, suffix) => (current.endsWith(suffix) ? current.slice(0, -suffix.length) : current),
    normalize(name)
  );

// Como as pessoas falam -> nome-base do destino. Vale a primeira base que
// existir na unidade do usuário (ex.: no Private não há "exame de sangue", cai
// no laboratório). Específicos antes de genéricos ("raio x" antes de "imagem").
const DESTINATION_SYNONYMS = [
  { terms: ['recepcao', 'balcao', 'guiche'], cores: ['recepcao', 'recepcao mais proxima'] },
  { terms: ['banheiro', 'sanitario', 'toalete', 'wc'], cores: ['banheiro'] },
  { terms: ['sala de espera', 'esperar', 'aguardar'], cores: ['sala de espera'] },
  // Só o HMC Private tem (planta de 17/11): lanchonete de comida fresca e um
  // ponto de autoatendimento com geladeira de lanches e café.
  { terms: ['lanchonete', 'cantina', 'comer', 'comida', 'fome', 'lanchar', 'lanche'], cores: ['lanchonete', 'cafe e lanches (autoatendimento)'] },
  { terms: ['cafe', 'cafezinho', 'autoatendimento', 'maquina de cafe', 'geladeira'], cores: ['cafe e lanches (autoatendimento)', 'lanchonete'] },
  { terms: ['saida', 'ir embora', 'sair do hospital', 'sair daqui', 'como saio'], cores: ['saida'] },
  { terms: ['tomografia'], cores: ['tomografia'] },
  { terms: ['raio-x', 'raio x', 'raiox', 'rx'], cores: ['raio-x'] },
  { terms: ['mamografia'], cores: ['mamografia'] },
  { terms: ['ultrassonografia', 'ultrassom', 'ultrasom', 'ultra som'], cores: ['ultrassonografia'] },
  { terms: ['setor de imagem', 'exame de imagem', 'imagem'], cores: ['setor de imagem'] },
  { terms: ['exame de sangue', 'coleta', 'sangue'], cores: ['exame de sangue', 'laboratorio'] },
  { terms: ['laboratorio', 'urina', 'exame de urina', 'fezes'], cores: ['laboratorio'] },
  { terms: ['atendimento', 'consulta', 'consultorio', 'clinico geral', 'ser atendido', 'atendido'], cores: ['atendimento'] },
  { terms: ['visita', 'visitar', 'internacao', 'internado', 'internada', 'quarto', 'leito'], cores: ['visita / internacao'] },
];

const isInArea = (destination, userArea) =>
  destination.area === userArea || destination.area === 'shared';

function findDestination(text, destinations, userArea) {
  for (const { terms, cores } of DESTINATION_SYNONYMS) {
    if (!hasAny(text, terms)) continue;
    for (const core of cores) {
      const inUserArea = destinations.find((item) => coreName(item.name) === core && isInArea(item, userArea));
      if (inUserArea) return { destination: inUserArea, inUserArea: true };
    }
    for (const core of cores) {
      const elsewhere = destinations.find((item) => coreName(item.name) === core);
      if (elsewhere) return { destination: elsewhere, inUserArea: false };
    }
  }

  // Sem sinônimo: o usuário pode ter digitado o nome de um destino novo vindo da API.
  const direct = destinations.find(
    (item) => item.area !== 'restricted' && coreName(item.name).length > 2 && hasTerm(text, coreName(item.name))
  );
  return direct ? { destination: direct, inUserArea: isInArea(direct, userArea) } : null;
}

const AREA_LABELS = { private: 'HMC Private', sus: 'Hospital Marco Capute (SUS)' };
const areaLabel = (area) => AREA_LABELS[area] || 'outra unidade';

const prettyFloor = (floor = '') =>
  floor.replace('Terreo', 'Térreo').replace(/(\d+)o Andar/, '$1º andar');

const receptionQuery = (destinations, userArea) =>
  destinations.find((item) => coreName(item.name) === 'recepcao' && item.area === userArea)?.name || 'Recepção';

const VISITOR_FREE_ACCESS = ['public', 'visitor_allowed'];

// --- Resposta -----------------------------------------------------------------

/**
 * @param {string} message - texto digitado (ou atalho tocado).
 * @param {object} context
 * @param {object} context.userProfile - { type: 'patient'|'visitor', area: 'private'|'sus' }
 * @param {object} context.visitorAccessRequest - pedido de acesso do visitante (status, destino liberado)
 * @param {Array}  context.destinations - destinos do app (API ou fallback de data/routes.js)
 * @param {object} context.hospitalDetection - estado de chegada (pra "estou perdido" não inventar posição)
 * @returns {{ intent, text, actionLabel, actionScreen, actionParams }}
 */
export function getNavoraAssistantResponse(message, context = {}) {
  const {
    userProfile = {},
    visitorAccessRequest = null,
    destinations = [],
    hospitalDetection = null,
  } = context;

  const text = normalize(message);
  const userArea = userProfile.area || 'private';
  const isVisitor = userProfile.type === 'visitor';
  const visitorApproved = isVisitor && ['APPROVED', 'AUTHORIZED'].includes(visitorAccessRequest?.status);
  const authorizedDestinationRaw = visitorAccessRequest?.requestedDestination;
  const authorizedDestination =
    typeof authorizedDestinationRaw === 'string' ? authorizedDestinationRaw : authorizedDestinationRaw?.name || '';
  const goToReception = {
    label: 'Ir para a recepção',
    screen: 'Search',
    params: { query: receptionQuery(destinations, userArea) },
  };

  // 1. Emergência — sempre primeiro. O SOS ainda pede confirmação na tela de
  //    ajuda, então um falso positivo aqui não dispara nada sozinho.
  if (hasAny(text, EMERGENCY_TERMS)) {
    return reply(
      'emergency',
      'Isso parece uma emergência. Toque em "Acionar SOS" para chamar a equipe agora. Se você não estiver no hospital, ligue 192 (SAMU).',
      { label: 'Acionar SOS', screen: 'Help', params: { type: 'sos' } }
    );
  }

  // 2. Pedido de profissional de saúde.
  if (hasAny(text, CLINICAL_SUPPORT_TERMS)) {
    return reply(
      'clinical_support',
      'Vou abrir o pedido de apoio clínico para a equipe receber seu chamado e sua localização.',
      { label: 'Chamar a equipe', screen: 'Help', params: { type: 'doctor' } }
    );
  }

  // 3. Pergunta de saúde — o app não dá orientação médica.
  if (hasAny(text, MEDICAL_QUESTION_TERMS)) {
    return reply(
      'medical_question',
      'Não posso dar orientação sobre saúde, remédios ou sintomas. A equipe do hospital pode te ajudar. Se for algo forte ou repentino, use o SOS.',
      { label: 'Falar com a equipe', screen: 'Help', params: { type: 'doctor' } }
    );
  }

  // 4. Visitante pedindo área de internação.
  if (isVisitor && hasAny(text, VISIT_TERMS)) {
    if (!visitorApproved) {
      return reply(
        'visitor_needs_authorization',
        'Para visitar um paciente internado, a recepção precisa liberar sua entrada. Até lá, você pode ir à recepção, ao banheiro, à sala de espera e à saída.',
        goToReception
      );
    }
    return reply(
      'visitor_authorized',
      authorizedDestination
        ? `Sua visita está liberada só para: ${authorizedDestination}.`
        : 'Sua visita está liberada. Veja os detalhes e a rota permitida.',
      { label: 'Ver minha visita', screen: 'VisitorAccessStatus' }
    );
  }

  // 5. Ações do app.
  if (hasAny(text, THEME_TERMS)) {
    return reply('theme', 'Posso trocar entre o modo claro e o noturno agora.', { label: 'Trocar tema', screen: 'ToggleTheme' });
  }

  if (hasAny(text, END_ROUTE_TERMS)) {
    return reply('end_route', 'Posso encerrar a rota e voltar para a tela inicial.', { label: 'Encerrar rota', screen: 'Home' });
  }

  if (hasAny(text, ARRIVED_TERMS)) {
    return reply(
      'arrived',
      'Que bom! Posso ativar o modo de espera para acompanhar seu atendimento.',
      { label: 'Ativar modo espera', screen: 'WaitingMode' }
    );
  }

  // 6. Perdido — nunca inventar posição: o app não tem localização interna sem o beacon.
  if (hasAny(text, LOST_TERMS)) {
    const entrance = hospitalDetection?.status === 'confirmed'
      ? hospitalDetection?.detectedEntrance?.fullName || hospitalDetection?.detectedEntrance?.name
      : null;
    const knownPart = entrance ? `O último registro é que você entrou por: ${entrance}. ` : '';
    return reply(
      'lost',
      `${knownPart}Não consigo ver sua posição exata dentro do hospital. Posso chamar alguém da equipe ou te levar até a recepção.`,
      { label: 'Pedir orientação', screen: 'Lost' }
    );
  }

  if (hasAny(text, RESTRICTED_TERMS)) {
    return reply(
      'restricted_area',
      'Essa é uma área restrita do hospital: só a equipe entra. Se você tem cirurgia marcada ou quer notícias de um paciente, procure a recepção.',
      goToReception
    );
  }

  if (hasAny(text, SCHEDULING_TERMS)) {
    return reply(
      'no_scheduling',
      'O Navora não faz agendamento de consultas ou exames. A recepção pode marcar ou remarcar para você.',
      goToReception
    );
  }

  if (hasAny(text, HOURS_TERMS)) {
    return reply(
      'hours',
      'Não tenho os horários atualizados no app. A recepção confirma os horários de exames e de visitas.',
      goToReception
    );
  }

  if (hasAny(text, PARKING_TERMS)) {
    return reply(
      'parking',
      'Ainda não tenho informações de estacionamento no app. Posso mostrar a rota até a entrada do hospital.',
      { label: 'Como chegar', screen: 'ExternalRoute' }
    );
  }

  if (hasAny(text, EMERGENCY_EXIT_TERMS)) {
    return reply('emergency_exit', 'Posso mostrar as saídas de emergência mais próximas.', { label: 'Ver saídas', screen: 'EmergencyRoutes' });
  }

  if (hasAny(text, EXTERNAL_ROUTE_TERMS)) {
    return reply('external_route', 'Vou abrir o mapa com a rota até a entrada do hospital.', { label: 'Como chegar', screen: 'ExternalRoute' });
  }

  // 7. Destinos — buscados nos dados reais do app.
  const match = findDestination(text, destinations, userArea);
  if (match) {
    const { destination, inUserArea } = match;

    if (!inUserArea) {
      return reply(
        'destination_other_area',
        `${destination.name} fica em outra unidade (${areaLabel(destination.area)}). Você está em ${areaLabel(userArea)}. Procure a recepção para ser orientado.`,
        goToReception
      );
    }

    if (isVisitor && !visitorApproved && !VISITOR_FREE_ACCESS.includes(destination.accessLevel)) {
      return reply(
        'visitor_needs_authorization',
        `${destination.name} precisa de liberação da recepção para visitantes. Até lá, você pode ir à recepção, ao banheiro, à sala de espera e à saída.`,
        goToReception
      );
    }

    const visitNote = destination.accessLevel === 'visitor_authorization' ? ' Visitas precisam de liberação da recepção.' : '';
    return reply(
      'destination',
      `Encontrei ${destination.name} (${prettyFloor(destination.floor)}).${visitNote}`,
      { label: 'Ver rota', screen: 'Search', params: { query: destination.name } }
    );
  }

  // 8. Genéricos — depois dos destinos ("como chegar na tomografia" é destino,
  //    "banheiro do Marco Capute" é destino, não troca de unidade).
  if (hasAny(text, LOST_GENERIC_TERMS)) {
    return reply(
      'lost',
      'Não consigo ver sua posição exata dentro do hospital. Me diga o lugar que você procura, ou posso chamar alguém da equipe.',
      { label: 'Pedir orientação', screen: 'Lost' }
    );
  }

  if (hasAny(text, CHANGE_AREA_TERMS)) {
    return reply(
      'change_area',
      'Você pode trocar a unidade (HMC Private ou Hospital Marco Capute) para ver os locais certos.',
      { label: 'Escolher unidade', screen: 'CareAreaChoice' }
    );
  }

  if (hasAny(text, ['como chegar', 'como chego'])) {
    return reply('external_route', 'Vou abrir o mapa com a rota até a entrada do hospital.', { label: 'Como chegar', screen: 'ExternalRoute' });
  }

  if (hasAny(text, ACCESSIBILITY_TERMS)) {
    return reply(
      'accessibility',
      'Posso ajustar suas preferências para priorizar rotas sem escada e com elevador.',
      { label: 'Ajustar acessibilidade', screen: 'Accessibility' }
    );
  }

  if (hasAny(text, HELP_TERMS)) {
    return reply('help', 'Posso enviar um pedido de ajuda para a equipe do hospital.', { label: 'Chamar ajuda', screen: 'Help', params: { type: 'help' } });
  }

  if (hasAny(text, GREETING_TERMS)) {
    return reply(
      'greeting',
      'Olá! Sou o assistente do Navora. Posso te ajudar a encontrar um setor, chegar ao hospital, pedir ajuda ou acionar o SOS.'
    );
  }

  // 9. Fora do escopo.
  return reply(
    'out_of_scope',
    'Sou o assistente do Navora e só ajudo com o hospital: encontrar setores, como chegar, acessibilidade, visitas, ajuda e SOS. Tente, por exemplo: "onde fica o banheiro?"',
    { label: 'Ver locais', screen: 'Search' }
  );
}
