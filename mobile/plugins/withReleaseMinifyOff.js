// Plugin de configuração do Expo: a partir do Expo SDK 58 o template do Android
// liga o R8 no release (android.enableMinifyInReleaseBuilds=true). O R8 remove
// a classe gerada do banco do WorkManager e o APK fecha ao abrir
// ("Failed to create an instance of class androidx.work.impl.WorkDatabase").
// Solução: release sem R8, como era antes do SDK 58.
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'android.enableMinifyInReleaseBuilds';

module.exports = function withReleaseMinifyOff(config) {
  return withGradleProperties(config, (mod) => {
    mod.modResults = mod.modResults.filter((item) => !(item.type === 'property' && item.key === KEY));
    mod.modResults.push({ type: 'property', key: KEY, value: 'false' });
    return mod;
  });
};
