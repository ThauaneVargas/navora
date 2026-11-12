// Política de privacidade do app (LGPD). Uma fonte só: a tela Privacidade e o
// aceite do cadastro leem daqui. Ao mudar o conteúdo de verdade, troque a
// versão — o backend guarda qual versão cada paciente aceitou — e atualize os
// TRÊS idiomas juntos (en/es são tradução do pt; o texto em português prevalece).
// Escreva só o que o app faz de fato (ver docs/lgpd.md). Depois de mudar, rode
// `npm run privacidade` no web-admin: gera a página pública exigida pelas lojas.

export const PRIVACY_POLICY_VERSION = '2026-11-07';

const ICONS = ['account-outline', 'target', 'bluetooth', 'account-group-outline', 'server-outline', 'clock-outline', 'scale-balance'];

const POLICY = {
  pt: {
    updatedLabel: '7 de novembro de 2026',
    translationNote: null,
    sections: [
      ['O que guardamos',
        'Da sua conta: nome, e-mail e telefone. ' +
        'Se você quiser informar: um contato de emergência e suas necessidades de acessibilidade (como cadeira de rodas) — este é um dado de saúde e só é guardado com o seu consentimento. ' +
        'Não pedimos CPF, data de nascimento nem informações médicas.'],
      ['Para que usamos',
        'Para guiar você dentro do hospital, escolher rotas adaptadas e permitir que a recepção atenda seus pedidos de ajuda, SOS e visita. ' +
        'Esses pedidos só são feitos com a sua conta, para a recepção saber quem pediu. ' +
        'Não vendemos seus dados e não usamos para propaganda.'],
      ['Localização',
        'Dentro do hospital, o app usa beacons Bluetooth para saber por qual entrada você chegou — só com o app aberto, nunca em segundo plano. ' +
        'O GPS só é usado na tela "Como chegar ao hospital", enquanto ela estiver aberta. ' +
        'O servidor não guarda um histórico da sua localização. ' +
        'A lista de rotas que você iniciou (em "Histórico de rotas") fica só no seu celular e é apagada quando você toca em Sair.'],
      ['Quem vê',
        'A equipe da recepção e a administração do hospital onde você está, com login próprio, veem os pedidos de ajuda e SOS (seu nome, onde você está, telefone, contato de emergência e se precisa de cadeira de rodas ou maca) e os pedidos de visita. ' +
        'Cada hospital só vê os pedidos feitos nele, e tudo o que a equipe faz no sistema fica registrado. ' +
        'Não compartilhamos com outras empresas.'],
      ['Onde ficam',
        'Em servidores na nuvem nos Estados Unidos: o sistema roda na Render e o banco de dados fica na Neon. ' +
        'A conexão entre o app e o servidor é criptografada (HTTPS), o banco de dados também é criptografado e sua senha é guardada de forma que nem a equipe consegue lê-la.'],
      ['Por quanto tempo',
        'Seu cadastro, enquanto a conta existir; se você excluir a conta, apagamos seu cadastro e seus dados de saúde. ' +
        'Pedidos de visita são apagados depois de 30 dias. ' +
        'Pedidos de ajuda, SOS e check-ins: depois de 180 dias o hospital guarda só o registro do atendimento (tipo, local e data), sem seu nome, telefone ou necessidades. ' +
        'Notificações são apagadas depois de 90 dias.'],
      ['Seus direitos',
        'Você pode ver e corrigir seus dados em "Meu perfil" e, nesta tela, baixar uma cópia dos seus dados, retirar o consentimento e excluir a conta, a qualquer momento. ' +
        'Dúvidas ou outros pedidos: fale com a recepção do hospital.'],
    ],
    consentText:
      'Li a política de privacidade e autorizo o Navora a guardar meus dados, inclusive os de saúde ' +
      '(acessibilidade) e o contato de emergência, para me guiar e me atender no hospital.',
  },
  en: {
    updatedLabel: 'November 7, 2026',
    translationNote: 'This is a translation for your convenience. The Portuguese version prevails.',
    sections: [
      ['What we keep',
        'From your account: name, e-mail and phone. ' +
        'If you choose to provide them: an emergency contact and your accessibility needs (such as a wheelchair) — the latter is health data and is only kept with your consent. ' +
        'We do not ask for CPF, date of birth or medical information.'],
      ['What we use it for',
        'To guide you inside the hospital, choose adapted routes and let the reception handle your help, SOS and visit requests. ' +
        'These requests are only made with your account, so the reception knows who asked. ' +
        'We do not sell your data and do not use it for advertising.'],
      ['Location',
        'Inside the hospital, the app uses Bluetooth beacons to know which entrance you came in through — only while the app is open, never in the background. ' +
        'GPS is only used on the "How to get to the hospital" screen, while it is open. ' +
        'The server does not keep a history of your location. ' +
        'The list of routes you started (in "Route history") stays only on your phone and is erased when you tap Sign out.'],
      ['Who sees it',
        'The reception staff and the administration of the hospital you are in, with their own login, see help and SOS requests (your name, where you are, phone, emergency contact and whether you need a wheelchair or stretcher) and visit requests. ' +
        'Each hospital only sees the requests made there, and everything the staff does in the system is recorded. ' +
        'We do not share it with other companies.'],
      ['Where it is stored',
        'On cloud servers in the United States: the system runs on Render and the database is hosted by Neon. ' +
        'The connection between the app and the server is encrypted (HTTPS), the database is encrypted too, and your password is stored in a way that not even the staff can read it.'],
      ['For how long',
        'Your registration, for as long as your account exists; if you delete your account, we erase your registration and your health data. ' +
        'Visit requests are erased after 30 days. ' +
        'Help requests, SOS and check-ins: after 180 days the hospital keeps only the care record (type, place and date), without your name, phone or needs. ' +
        'Notifications are erased after 90 days.'],
      ['Your rights',
        'You can see and correct your data in "My profile" and, on this screen, download a copy of your data, withdraw your consent and delete your account, at any time. ' +
        'Questions or other requests: talk to the hospital reception.'],
    ],
    consentText:
      'I have read the privacy policy and allow Navora to keep my data, including health data ' +
      '(accessibility) and my emergency contact, to guide and assist me at the hospital.',
  },
  es: {
    updatedLabel: '7 de noviembre de 2026',
    translationNote: 'Esta es una traducción para tu comodidad. Prevalece la versión en portugués.',
    sections: [
      ['Qué guardamos',
        'De tu cuenta: nombre, correo y teléfono. ' +
        'Si quieres informarlos: un contacto de emergencia y tus necesidades de accesibilidad (como silla de ruedas) — este es un dato de salud y solo se guarda con tu consentimiento. ' +
        'No pedimos CPF, fecha de nacimiento ni información médica.'],
      ['Para qué los usamos',
        'Para guiarte dentro del hospital, elegir rutas adaptadas y permitir que la recepción atienda tus pedidos de ayuda, SOS y visita. ' +
        'Estos pedidos solo se hacen con tu cuenta, para que la recepción sepa quién pidió. ' +
        'No vendemos tus datos ni los usamos para publicidad.'],
      ['Ubicación',
        'Dentro del hospital, la app usa beacons Bluetooth para saber por qué entrada llegaste — solo con la app abierta, nunca en segundo plano. ' +
        'El GPS solo se usa en la pantalla "Cómo llegar al hospital", mientras esté abierta. ' +
        'El servidor no guarda un historial de tu ubicación. ' +
        'La lista de rutas que iniciaste (en "Historial de rutas") queda solo en tu celular y se borra cuando tocas Salir.'],
      ['Quién los ve',
        'El equipo de recepción y la administración del hospital donde estás, con su propio acceso, ven los pedidos de ayuda y SOS (tu nombre, dónde estás, teléfono, contacto de emergencia y si necesitas silla de ruedas o camilla) y los pedidos de visita. ' +
        'Cada hospital solo ve los pedidos hechos en él, y todo lo que el equipo hace en el sistema queda registrado. ' +
        'No los compartimos con otras empresas.'],
      ['Dónde se guardan',
        'En servidores en la nube en Estados Unidos: el sistema funciona en Render y la base de datos está en Neon. ' +
        'La conexión entre la app y el servidor está cifrada (HTTPS), la base de datos también está cifrada y tu contraseña se guarda de forma que ni el equipo puede leerla.'],
      ['Por cuánto tiempo',
        'Tu registro, mientras exista tu cuenta; si eliminas la cuenta, borramos tu registro y tus datos de salud. ' +
        'Los pedidos de visita se borran después de 30 días. ' +
        'Pedidos de ayuda, SOS y check-ins: después de 180 días el hospital guarda solo el registro de la atención (tipo, lugar y fecha), sin tu nombre, teléfono ni necesidades. ' +
        'Las notificaciones se borran después de 90 días.'],
      ['Tus derechos',
        'Puedes ver y corregir tus datos en "Mi perfil" y, en esta pantalla, descargar una copia de tus datos, retirar tu consentimiento y eliminar la cuenta, en cualquier momento. ' +
        'Dudas u otros pedidos: habla con la recepción del hospital.'],
    ],
    consentText:
      'Leí la política de privacidad y autorizo a Navora a guardar mis datos, incluidos los de salud ' +
      '(accesibilidad) y el contacto de emergencia, para guiarme y atenderme en el hospital.',
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
