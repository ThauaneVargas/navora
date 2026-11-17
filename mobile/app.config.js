// Configuração dinâmica do Expo: lê o app.json e injeta só o que não pode ficar
// no repositório (público). Hoje: a chave do Google Maps.
//
// De onde vem GOOGLE_MAPS_API_KEY:
// - Build local (gradlew / expo run): arquivo mobile/.env (não vai pro git).
// - Build EAS na nuvem: variável de ambiente do EAS (ambiente "production"),
//   criada com `npx eas-cli env:create` — ver docs/seguranca-chaves.md.
//
// Sem prefixo EXPO_PUBLIC_ de propósito: a chave só é usada na configuração
// nativa do mapa, não precisa entrar no código JS do app.
//
// Observação: chave de SDK nativo do Maps sempre acaba dentro do APK. A
// proteção real é a RESTRIÇÃO da chave no Google Cloud (pacote com.navora.app +
// SHA-1 no Android, bundle com.navora.app no iOS, só a API do Maps SDK).

module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!googleMapsApiKey) {
    console.warn(
      '[navora] GOOGLE_MAPS_API_KEY não configurada: o mapa de "Como chegar ao hospital" ' +
        'fica sem Google Maps nesse build. Ver docs/seguranca-chaves.md.'
    );
    return config;
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: googleMapsApiKey },
      },
    },
  };
};
