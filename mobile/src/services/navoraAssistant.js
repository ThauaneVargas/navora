const normalize = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const response = (text, actionLabel, actionScreen, actionParams = {}) => ({
  text,
  actionLabel,
  actionScreen,
  actionParams,
});

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

export function getNavoraAssistantResponse(message, userProfile = {}) {
  const text = normalize(message);
  const userArea = userProfile.area || 'private';
  const isVisitor = userProfile.type === 'visitor';

  if (hasAny(text, ['estou no sus', 'hospital marco capute', 'entrada da frente'])) {
    return response(
      'Voce esta no Hospital Marco Capute. Vou mostrar apenas rotas permitidas para essa area.',
      'Ver destinos SUS',
      'Search',
      { area: 'sus' }
    );
  }

  if (hasAny(text, ['private', 'hmc private', 'entrada dos fundos', 'entrada de fundos'])) {
    return response(
      'Voce esta no HMC Private. Vou mostrar apenas rotas permitidas para essa area.',
      'Ver destinos Private',
      'Search',
      { area: 'private' }
    );
  }

  if (hasAny(text, ['quero visitar alguem', 'visitar paciente', 'preciso de autorizacao', 'internacao', 'quero ir para internacao'])) {
    if (isVisitor) {
      return response(
        'Esse destino precisa de liberacao da recepcao. Vou te orientar ate a recepcao correta.',
        'Solicitar autorizacao',
        'Search',
        { category: 'Visita' }
      );
    }

    return response(
      'Visitas e internacao podem exigir liberacao da recepcao. Vou abrir os destinos permitidos para sua area.',
      'Ver visita',
      'Search',
      { category: 'Visita' }
    );
  }

  if (hasAny(text, ['modo noturno', 'modo escuro', 'dark mode', 'tela escura', 'tema escuro', 'noite'])) {
    return response(
      'Posso alternar o tema do aplicativo agora para melhorar o conforto visual.',
      'Alternar modo noturno',
      'ToggleTheme'
    );
  }

  if (hasAny(text, ['medico', 'doutor', 'enfermeiro', 'solicitar medico', 'preciso de medico'])) {
    return response(
      'Vou abrir a solicitacao medica para a equipe receber seu motivo e sua localizacao.',
      'Solicitar medico',
      'Help',
      { type: 'doctor' }
    );
  }

  if (hasAny(text, ['cheguei', 'ja cheguei', 'cheguei ao destino', 'estou no destino', 'aguardando atendimento'])) {
    return response(
      'Perfeito. Vou ativar o modo de espera para acompanhar seu atendimento sem manter a rota aberta.',
      'Ativar modo espera',
      'WaitingMode',
      { destination: 'Tomografia' }
    );
  }

  if (hasAny(text, ['finalizar rota', 'encerrar rota', 'parar rota', 'cancelar rota'])) {
    return response(
      'Posso encerrar a rota e voltar para a tela inicial.',
      'Encerrar rota',
      'Home'
    );
  }

  if (hasAny(text, ['tomografia', 'tomo'])) {
    if (userArea === 'sus') {
      return response(
        'Tomografia Private pertence ao HMC Private. Voce esta no Hospital Marco Capute. Procure a recepcao para orientacao.',
        'Ir para recepcao',
        'Search',
        { query: 'Recepcao' }
      );
    }

    return response(
      'Encontrei Tomografia Private. Exames com atendimento externo seguem o horario de 07h as 17h.',
      'Ver tomografia',
      'Search',
      { query: 'Tomografia' }
    );
  }

  if (hasAny(text, ['raio-x', 'raiox', 'rx'])) {
    return response(
      'Encontrei Raio-X no setor de exames de imagem. O acesso externo de pacientes fica liberado das 07h as 17h.',
      'Ver Raio-X',
      'Search',
      { query: 'Raio-X' }
    );
  }

  if (text.includes('mamografia')) {
    return response(
      'Encontrei Mamografia. O acesso externo de pacientes fica liberado das 07h as 17h.',
      'Ver mamografia',
      'Search',
      { query: 'Mamografia' }
    );
  }

  if (hasAny(text, ['colonoscopia', 'colono'])) {
    return response(
      'Encontrei Colonoscopia. Este destino fica na area de procedimentos.',
      'Iniciar rota',
      'Navigation',
      { destination: 'Colonoscopia' }
    );
  }

  if (hasAny(text, ['endoscopia', 'endoscop'])) {
    return response(
      'Encontrei Endoscopia. Posso iniciar a rota.',
      'Iniciar rota',
      'Navigation',
      { destination: 'Endoscopia' }
    );
  }

  if (hasAny(text, ['exame de sangue', 'sangue', 'laboratorio'])) {
    return response(
      userArea === 'sus'
        ? 'Encontrei Laboratorio SUS. O atendimento externo de exames funciona das 07h as 17h.'
        : 'Encontrei Laboratorio Private. O atendimento externo de exames funciona das 07h as 17h.',
      'Ver laboratorio',
      'Search',
      { query: userArea === 'sus' ? 'Laboratorio SUS' : 'Laboratorio Private' }
    );
  }

  if (hasAny(text, ['atendimento clinico', 'clinico', 'consulta', 'consultorio'])) {
    return response(
      'Encontrei a area de consultas e atendimento clinico.',
      'Ver consultas',
      'Search',
      { category: 'Consultas' }
    );
  }

  if (text.includes('banheiro')) {
    return response(
      'O banheiro mais proximo fica proximo aos consultorios. Posso iniciar a rota.',
      'Iniciar rota',
      'Navigation',
      { destination: 'Banheiro' }
    );
  }

  if (hasAny(text, ['perdido', 'nao sei onde estou', 'onde estou'])) {
    return response(
      'Voce esta na Recepcao Principal, Corredor A, Piso Terreo. Posso recalcular sua rota.',
      'Recalcular rota',
      'Lost'
    );
  }

  if (hasAny(text, ['sos', 'emergencia', 'urgente', 'passando mal'])) {
    return response(
      'SOS e uma solicitacao urgente. Posso abrir a tela de emergencia para acionar a equipe.',
      'Abrir SOS',
      'Help',
      { type: 'sos' }
    );
  }

  if (hasAny(text, ['ajuda', 'preciso de ajuda', 'apoio', 'chamar ajuda'])) {
    return response(
      'Posso enviar um pedido de ajuda para a equipe.',
      'Chamar ajuda',
      'Help',
      { type: 'help' }
    );
  }

  if (hasAny(text, ['como chegar', 'chegar ao hospital', 'rota externa', 'ir para hospital'])) {
    return response(
      'Vou abrir a opcao de rota externa ate a entrada principal do hospital.',
      'Abrir rota externa',
      'HowToGet'
    );
  }

  if (hasAny(text, ['cadeira', 'cadeirante', 'acessivel', 'elevador', 'escada', 'sem escada'])) {
    return response(
      'Vou priorizar uma rota acessivel, evitando escadas e utilizando elevador.',
      'Ajustar acessibilidade',
      'Accessibility'
    );
  }

  if (hasAny(text, ['saida', 'rota de emergencia', 'evacuacao'])) {
    return response(
      'Posso guiar voce ate a saida de emergencia mais proxima.',
      'Ver rota segura',
      'EmergencyRoutes'
    );
  }

  if (hasAny(text, ['recepcao'])) {
    return response(
      userArea === 'sus'
        ? 'Voce esta no Hospital Marco Capute. Posso te orientar ate a Recepcao Hospital Marco Capute.'
        : 'Voce esta no HMC Private. Posso te orientar ate a Recepcao Private.',
      'Abrir mapa',
      'Search',
      { query: 'Recepcao' }
    );
  }

  return response(
    'Posso ajudar com rotas internas, como chegar ao hospital, acessibilidade, localizacao, ajuda ou SOS.',
    'Ver destinos',
    'Search'
  );
}
