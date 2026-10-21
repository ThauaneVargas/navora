// Testes do assistente do Navora. Rodar com `npm test` (dentro de mobile/).
// Usa os destinos REAIS de data/routes.js: se um destino for renomeado, o
// teste quebra aqui em vez de o assistente parar de achar o local em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assistantSuggestions, getNavoraAssistantResponse } from './navoraAssistant.js';
import { destinations } from '../data/routes.js';

const patientPrivate = { userProfile: { type: 'patient', area: 'private' }, destinations };
const patientSus = { userProfile: { type: 'patient', area: 'sus' }, destinations };
const visitorPending = {
  userProfile: { type: 'visitor', area: 'private' },
  visitorAccessRequest: { status: 'PENDING' },
  destinations,
};

const ask = (message, context = patientPrivate) => getNavoraAssistantResponse(message, context);

test('emergência vem antes de qualquer destino', () => {
  // Bug antigo: caía na rota para o banheiro.
  assert.equal(ask('Estou passando mal no banheiro').intent, 'emergency');
  assert.equal(ask('socorro').intent, 'emergency');
  assert.equal(ask('estou com dor no peito').intent, 'emergency');
  assert.equal(ask('meu pai desmaiou perto da tomografia').intent, 'emergency');
  assert.deepEqual(ask('socorro').actionParams, { type: 'sos' });
});

test('palavra inteira: "sossego" não é SOS, "boa noite" não é modo noturno', () => {
  assert.notEqual(ask('quero sossego').intent, 'emergency');
  // Bug antigo: "noite" disparava a troca de tema.
  const answer = ask('boa noite, onde fica o banheiro?');
  assert.equal(answer.intent, 'destination');
  assert.equal(answer.actionParams.query, 'Banheiro Private');
});

test('visitante pode ir à sala de espera sem liberação', () => {
  // Bug antigo: "sala" contém "ala" e bloqueava o visitante.
  const answer = ask('onde fica a sala de espera?', visitorPending);
  assert.equal(answer.intent, 'destination');
  assert.equal(answer.actionParams.query, 'Sala de espera Private');
});

test('visitante sem liberação não é levado ao quarto nem a exame', () => {
  assert.equal(ask('quero ir no quarto do meu pai', visitorPending).intent, 'visitor_needs_authorization');
  assert.equal(ask('onde fica a tomografia', visitorPending).intent, 'visitor_needs_authorization');
});

test('estou perdido não inventa localização', () => {
  const answer = ask('estou perdido');
  assert.equal(answer.intent, 'lost');
  // Bug antigo: respondia "Voce esta na Recepcao Principal, Corredor A".
  assert.doesNotMatch(answer.text, /Corredor A|Recepcao Principal/);
});

test('estou perdido usa a entrada registrada quando existe', () => {
  const answer = ask('me perdi', {
    ...patientPrivate,
    hospitalDetection: { status: 'confirmed', detectedEntrance: { fullName: 'Entrada Private - Fundos' } },
  });
  assert.match(answer.text, /Entrada Private - Fundos/);
});

test('não oferece destino que não existe nos dados', () => {
  // Bug antigo: oferecia rota para Colonoscopia/Endoscopia, que não existem no app.
  assert.notEqual(ask('onde faço colonoscopia?').intent, 'destination');
  assert.notEqual(ask('endoscopia').intent, 'destination');
});

test('pergunta de saúde não recebe orientação médica', () => {
  const answer = ask('posso tomar dipirona antes do exame?');
  assert.equal(answer.intent, 'medical_question');
  assert.equal(answer.actionScreen, 'Help');
  // "tomo" (verbo) não pode virar tomografia.
  assert.equal(ask('eu tomo remédio de manhã').intent, 'medical_question');
});

test('fora do escopo do app é recusado com clareza', () => {
  assert.equal(ask('qual a capital da França?').intent, 'out_of_scope');
  assert.equal(ask('me conta uma piada').intent, 'out_of_scope');
});

test('destino respeita a unidade do usuário', () => {
  assert.equal(ask('tomografia', patientSus).intent, 'destination_other_area');
  assert.equal(ask('quero fazer exame de sangue', patientSus).actionParams.query, 'Exame de sangue');
  // No Private não existe "Exame de sangue": cai no laboratório.
  assert.equal(ask('quero fazer exame de sangue').actionParams.query, 'Laboratorio Private');
  assert.equal(ask('onde é o rx?').actionParams.query, 'Raio-X');
});

test('"como chegar" ao hospital vs. a um setor', () => {
  assert.equal(ask('como chegar ao hospital').intent, 'external_route');
  assert.equal(ask('como chegar na tomografia').intent, 'destination');
});

test('banheiro do Marco Capute é destino, não troca de unidade', () => {
  assert.equal(ask('onde fica o banheiro do marco capute', patientSus).actionParams.query, 'Banheiro SUS');
});

// Frases do jeito que paciente/visitante fala de verdade (informal, sem acento,
// com erro). Formato: [frase, intent esperada, destino esperado (opcional)].
// Quando alguém usar uma frase que o assistente não entende, é aqui que entra.
const REAL_PHRASES_PATIENT_PRIVATE = [
  ['onde tiro sangue', 'destination', 'Laboratorio Private'],
  ['cade o banheiro', 'destination', 'Banheiro Private'],
  ['preciso ir no banheiro urgente', 'destination', 'Banheiro Private'],
  ['vim fazer ultrassom da barriga', 'destination', 'Ultrassonografia'],
  ['onde faço o exame de raio x', 'destination', 'Raio-X'],
  ['tenho tomografia marcada', 'destination', 'Tomografia'],
  ['onde fica a mamografia', 'destination', 'Mamografia'],
  ['quero fazer exame de imagem', 'destination', 'Setor de Imagem Private'],
  ['onde é a recepção', 'destination', 'Recepcao Private'],
  ['onde fica o balcão', 'destination', 'Recepcao Private'],
  ['quero sair daqui', 'destination', 'Saida Private'],
  ['acabou meu exame, como saio?', 'destination', 'Saida Private'],
  ['onde posso esperar', 'destination', 'Sala de espera Private'],
  ['tenho exame de urina', 'destination', 'Laboratorio Private'],
  ['quero marcar uma consulta', 'no_scheduling'],
  ['como faço pra agendar exame', 'no_scheduling'],
  ['tem elevador?', 'accessibility'],
  ['quero aumentar a letra', 'accessibility'],
  ['sou deficiente visual', 'accessibility'],
  ['como chego no hospital', 'external_route'],
  ['qual o endereço', 'external_route'],
  ['onde estaciono o carro', 'parking'],
  ['to perdido', 'lost'],
  ['nao acho a saida', 'destination', 'Saida Private'],
  ['nao encontro nada aqui', 'lost'],
  ['quero falar com alguém', 'help'],
  ['minha mãe caiu', 'emergency'],
  ['estou com falta de ar', 'emergency'],
  ['onde fica o pronto socorro', 'emergency'],
  ['to com muita dor de cabeça', 'medical_question'],
  ['onde fica a UTI', 'restricted_area'],
  ['qual o horário de visita', 'hours'],
  ['que horas abre o laboratório', 'hours'],
  ['cheguei na tomografia', 'arrived'],
  ['trocar pra modo escuro', 'theme'],
  ['obrigado', 'greeting'],
  ['tem wifi?', 'out_of_scope'],
];

test('frases reais de paciente (Private)', () => {
  for (const [phrase, intent, query] of REAL_PHRASES_PATIENT_PRIVATE) {
    const answer = ask(phrase);
    assert.equal(answer.intent, intent, `"${phrase}" -> esperado ${intent}, veio ${answer.intent}`);
    if (query) assert.equal(answer.actionParams.query, query, `"${phrase}" -> destino errado`);
  }
});

test('frases reais de paciente (SUS) e de visitante', () => {
  assert.equal(ask('onde é a recepção', patientSus).actionParams.query, 'Recepcao Hospital Marco Capute');
  assert.equal(ask('quero ser atendido', patientSus).actionParams.query, 'Atendimento SUS');
  assert.equal(ask('vim visitar minha avó', visitorPending).intent, 'visitor_needs_authorization');
  assert.equal(ask('onde fica o banheiro', visitorPending).actionParams.query, 'Banheiro Private');
});

test('todo atalho da tela tem resposta própria (nenhum cai em "fora do escopo")', () => {
  for (const { label } of assistantSuggestions) {
    assert.notEqual(ask(label).intent, 'out_of_scope', `atalho sem resposta: ${label}`);
  }
});
