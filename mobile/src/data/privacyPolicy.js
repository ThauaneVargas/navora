// Política de privacidade do app (LGPD). Uma fonte só: a tela Privacidade e o
// aceite do cadastro leem daqui. Ao mudar o conteúdo de verdade, troque a
// versão — o backend guarda qual versão cada paciente aceitou.
// Escreva só o que o app faz de fato (ver docs/lgpd.md).

export const PRIVACY_POLICY_VERSION = '2026-10-22';
export const PRIVACY_POLICY_UPDATED_LABEL = '22 de outubro de 2026';

export const PRIVACY_SECTIONS = [
  {
    icon: 'account-outline',
    title: 'O que guardamos',
    body:
      'Da sua conta: nome, e-mail, telefone, data de nascimento e CPF (se você informar). ' +
      'Para cuidar de você: suas necessidades de acessibilidade, observações (como alergias) e um contato de emergência. ' +
      'Esses últimos são dados de saúde e só são guardados com o seu consentimento.',
  },
  {
    icon: 'target',
    title: 'Para que usamos',
    body:
      'Para guiar você dentro do hospital, escolher rotas adaptadas e permitir que a recepção atenda seus pedidos de ajuda e SOS. ' +
      'Não vendemos seus dados e não usamos para propaganda.',
  },
  {
    icon: 'bluetooth',
    title: 'Localização',
    body:
      'Dentro do hospital, o app usa beacons Bluetooth para saber por qual entrada você chegou — só com o app aberto, nunca em segundo plano. ' +
      'O GPS só é usado na tela "Como chegar ao hospital", enquanto ela estiver aberta. ' +
      'Não guardamos um histórico da sua localização.',
  },
  {
    icon: 'account-group-outline',
    title: 'Quem vê',
    body:
      'A equipe da recepção e a administração do hospital, com login próprio, veem os pedidos de ajuda e SOS (seu nome, onde você está e o contato de emergência) e os pedidos de visita. ' +
      'Não compartilhamos com outras empresas.',
  },
  {
    icon: 'server-outline',
    title: 'Onde ficam',
    body:
      'Em um servidor na nuvem (Render), localizado nos Estados Unidos. ' +
      'A conexão entre o app e o servidor é criptografada (HTTPS) e sua senha é guardada de forma que nem a equipe consegue lê-la.',
  },
  {
    icon: 'clock-outline',
    title: 'Por quanto tempo',
    body:
      'Enquanto sua conta existir. Se você excluir a conta, apagamos seu cadastro e seus dados de saúde. ' +
      'Pedidos de ajuda e SOS já atendidos continuam no registro de atendimento do hospital.',
  },
  {
    icon: 'scale-balance',
    title: 'Seus direitos',
    body:
      'Você pode ver e corrigir seus dados em "Meu perfil", retirar o consentimento e excluir a conta nesta tela, a qualquer momento. ' +
      'Dúvidas ou outros pedidos: fale com a recepção do hospital.',
  },
];

export const CONSENT_TEXT =
  'Li a política de privacidade e autorizo o Navora a guardar meus dados, inclusive os de saúde ' +
  '(acessibilidade, observações e contato de emergência), para me guiar e me atender no hospital.';
