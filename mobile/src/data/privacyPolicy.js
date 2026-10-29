// Política de privacidade do app (LGPD). Uma fonte só: a tela Privacidade e o
// aceite do cadastro leem daqui. Ao mudar o conteúdo de verdade, troque a
// versão — o backend guarda qual versão cada paciente aceitou — e atualize os
// TRÊS idiomas juntos (en/es são tradução do pt; o texto em português prevalece).
// Escreva só o que o app faz de fato (ver docs/lgpd.md). Depois de mudar, rode
// `npm run privacidade` no web-admin: gera a página pública exigida pelas lojas.

export const PRIVACY_POLICY_VERSION = '2026-10-29';

const ICONS = ['account-outline', 'target', 'bluetooth', 'account-group-outline', 'server-outline', 'clock-outline', 'scale-balance'];

const POLICY = {
  pt: {
    updatedLabel: '23 de outubro de 2026',
    translationNote: null,
    sections: [
      ['O que guardamos',
        'Da sua conta: nome, e-mail, telefone, data de nascimento e CPF (se você informar). ' +
        'Para cuidar de você: suas necessidades de acessibilidade, observações (como alergias) e um contato de emergência. ' +
        'Esses últimos são dados de saúde e só são guardados com o seu consentimento.'],
      ['Para que usamos',
        'Para guiar você dentro do hospital, escolher rotas adaptadas e permitir que a recepção atenda seus pedidos de ajuda e SOS. ' +
        'Não vendemos seus dados e não usamos para propaganda.'],
      ['Localização',
        'Dentro do hospital, o app usa beacons Bluetooth para saber por qual entrada você chegou — só com o app aberto, nunca em segundo plano. ' +
        'O GPS só é usado na tela "Como chegar ao hospital", enquanto ela estiver aberta. ' +
        'O servidor não guarda um histórico da sua localização. ' +
        'A lista de rotas que você iniciou (em "Histórico de rotas") fica só no seu celular e é apagada quando você toca em Sair. ' +
        'Visitantes podem, se quiserem, deixar nome e telefone salvos só no próprio celular.'],
      ['Quem vê',
        'A equipe da recepção e a administração do hospital, com login próprio, veem os pedidos de ajuda e SOS (seu nome, onde você está, telefone, contato de emergência, se precisa de cadeira de rodas ou maca e o que você informar que está sentindo) e os pedidos de visita. ' +
        'Não compartilhamos com outras empresas.'],
      ['Onde ficam',
        'Em um servidor na nuvem (Render), localizado nos Estados Unidos. ' +
        'A conexão entre o app e o servidor é criptografada (HTTPS) e sua senha é guardada de forma que nem a equipe consegue lê-la.'],
      ['Por quanto tempo',
        'Enquanto sua conta existir. Se você excluir a conta, apagamos seu cadastro e seus dados de saúde. ' +
        'Pedidos de ajuda e SOS já atendidos continuam no registro de atendimento do hospital.'],
      ['Seus direitos',
        'Você pode ver e corrigir seus dados em "Meu perfil", retirar o consentimento e excluir a conta nesta tela, a qualquer momento. ' +
        'Dúvidas ou outros pedidos: fale com a recepção do hospital.'],
    ],
    consentText:
      'Li a política de privacidade e autorizo o Navora a guardar meus dados, inclusive os de saúde ' +
      '(acessibilidade, observações e contato de emergência), para me guiar e me atender no hospital.',
  },
  en: {
    updatedLabel: 'October 23, 2026',
    translationNote: 'This is a translation for your convenience. The Portuguese version prevails.',
    sections: [
      ['What we keep',
        'From your account: name, e-mail, phone, date of birth and CPF (if you provide it). ' +
        'To take care of you: your accessibility needs, notes (such as allergies) and an emergency contact. ' +
        'The latter are health data and are only kept with your consent.'],
      ['What we use it for',
        'To guide you inside the hospital, choose adapted routes and let the reception handle your help and SOS requests. ' +
        'We do not sell your data and do not use it for advertising.'],
      ['Location',
        'Inside the hospital, the app uses Bluetooth beacons to know which entrance you came in through — only while the app is open, never in the background. ' +
        'GPS is only used on the "How to get to the hospital" screen, while it is open. ' +
        'The server does not keep a history of your location. ' +
        'The list of routes you started (in "Route history") stays only on your phone and is erased when you tap Sign out. ' +
        'Visitors can, if they want, keep their name and phone saved only on their own phone.'],
      ['Who sees it',
        'The reception staff and the hospital administration, with their own login, see help and SOS requests (your name, where you are, phone, emergency contact, whether you need a wheelchair or stretcher and what you say you are feeling) and visit requests. ' +
        'We do not share it with other companies.'],
      ['Where it is stored',
        'On a cloud server (Render) located in the United States. ' +
        'The connection between the app and the server is encrypted (HTTPS), and your password is stored in a way that not even the staff can read it.'],
      ['For how long',
        'For as long as your account exists. If you delete your account, we erase your registration and your health data. ' +
        'Help and SOS requests already handled remain in the hospital\'s care records.'],
      ['Your rights',
        'You can see and correct your data in "My profile", withdraw your consent and delete your account on this screen at any time. ' +
        'Questions or other requests: talk to the hospital reception.'],
    ],
    consentText:
      'I have read the privacy policy and allow Navora to keep my data, including health data ' +
      '(accessibility, notes and emergency contact), to guide and assist me at the hospital.',
  },
  es: {
    updatedLabel: '23 de octubre de 2026',
    translationNote: 'Esta es una traducción para tu comodidad. Prevalece la versión en portugués.',
    sections: [
      ['Qué guardamos',
        'De tu cuenta: nombre, correo, teléfono, fecha de nacimiento y CPF (si lo informas). ' +
        'Para cuidarte: tus necesidades de accesibilidad, observaciones (como alergias) y un contacto de emergencia. ' +
        'Estos últimos son datos de salud y solo se guardan con tu consentimiento.'],
      ['Para qué los usamos',
        'Para guiarte dentro del hospital, elegir rutas adaptadas y permitir que la recepción atienda tus pedidos de ayuda y SOS. ' +
        'No vendemos tus datos ni los usamos para publicidad.'],
      ['Ubicación',
        'Dentro del hospital, la app usa beacons Bluetooth para saber por qué entrada llegaste — solo con la app abierta, nunca en segundo plano. ' +
        'El GPS solo se usa en la pantalla "Cómo llegar al hospital", mientras esté abierta. ' +
        'El servidor no guarda un historial de tu ubicación. ' +
        'La lista de rutas que iniciaste (en "Historial de rutas") queda solo en tu celular y se borra cuando tocas Salir. ' +
        'Los visitantes pueden, si quieren, dejar su nombre y teléfono guardados solo en su propio celular.'],
      ['Quién los ve',
        'El equipo de recepción y la administración del hospital, con su propio acceso, ven los pedidos de ayuda y SOS (tu nombre, dónde estás, teléfono, contacto de emergencia, si necesitas silla de ruedas o camilla y lo que informes que sientes) y los pedidos de visita. ' +
        'No los compartimos con otras empresas.'],
      ['Dónde se guardan',
        'En un servidor en la nube (Render), ubicado en Estados Unidos. ' +
        'La conexión entre la app y el servidor está cifrada (HTTPS) y tu contraseña se guarda de forma que ni el equipo puede leerla.'],
      ['Por cuánto tiempo',
        'Mientras exista tu cuenta. Si eliminas la cuenta, borramos tu registro y tus datos de salud. ' +
        'Los pedidos de ayuda y SOS ya atendidos permanecen en el registro de atención del hospital.'],
      ['Tus derechos',
        'Puedes ver y corregir tus datos en "Mi perfil", retirar tu consentimiento y eliminar la cuenta en esta pantalla, en cualquier momento. ' +
        'Dudas u otros pedidos: habla con la recepción del hospital.'],
    ],
    consentText:
      'Leí la política de privacidad y autorizo a Navora a guardar mis datos, incluidos los de salud ' +
      '(accesibilidad, observaciones y contacto de emergencia), para guiarme y atenderme en el hospital.',
  },
};

// Política no idioma do app (reserva: português).
export function getPrivacyPolicy(language) {
  const policy = POLICY[language] || POLICY.pt;
  return {
    updatedLabel: policy.updatedLabel,
    translationNote: policy.translationNote,
    consentText: policy.consentText,
    sections: policy.sections.map(([title, body], index) => ({ icon: ICONS[index], title, body })),
  };
}
