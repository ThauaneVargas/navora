// Telefone da recepção de cada unidade, para o botão "Ligar para a recepção"
// do SOS. Fica no próprio app (não vem do servidor) porque é justamente quando
// a internet falha que a pessoa precisa dele.
//
// Preencher com o número que o hospital informar, só dígitos com DDD
// (ex.: '8133330000'), ou via .env: EXPO_PUBLIC_RECEPTION_PHONE_PRIVATE e
// EXPO_PUBLIC_RECEPTION_PHONE_SUS. Sem número, o botão não aparece.
const RECEPTION_PHONES = {
  private: process.env.EXPO_PUBLIC_RECEPTION_PHONE_PRIVATE || null,
  sus: process.env.EXPO_PUBLIC_RECEPTION_PHONE_SUS || null,
};

export function getReceptionPhone(areaId) {
  const raw = RECEPTION_PHONES[areaId] || null;
  const digits = raw ? String(raw).replace(/\D/g, '') : '';
  return digits.length >= 8 ? digits : null;
}
