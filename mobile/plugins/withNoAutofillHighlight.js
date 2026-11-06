// Plugin de configuração do Expo: quando o Android preenche um campo sozinho
// (e-mail/senha salvos), ele pinta o campo de amarelo por cima do nosso
// visual. Esse realce é do tema do Android (android:autofilledHighlight) e
// não muda pelo estilo do TextInput — aqui ele fica transparente.
const { withAndroidStyles } = require('expo/config-plugins');

const NAME = 'android:autofilledHighlight';

module.exports = function withNoAutofillHighlight(config) {
  return withAndroidStyles(config, (mod) => {
    const appTheme = mod.modResults.resources.style?.find((style) => style.$.name === 'AppTheme');
    if (!appTheme) throw new Error('withNoAutofillHighlight: não achei o AppTheme no styles.xml');
    appTheme.item = (appTheme.item || []).filter((item) => item.$.name !== NAME);
    appTheme.item.push({ $: { name: NAME }, _: '@android:color/transparent' });
    return mod;
  });
};
