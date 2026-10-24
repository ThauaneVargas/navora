// Plugin de configuração do Expo: no Windows, a partir do React Native 0.88
// (Expo SDK 58), os arquivos C++ gerados em android/app/.cxx passam do limite
// de 260 caracteres de caminho e a compilação falha ("Filename longer than 260
// characters" / mkdir "No such file or directory"). O ninja do CMake 3.22 do
// Android SDK ignora o LongPathsEnabled do Windows.
// Solução: a pasta de trabalho do C++ vai pra um caminho curto (C:/cx).
// Só vale no Windows; em outros sistemas não mexe em nada.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// navora: buildStagingDirectory curto (Windows)';

module.exports = function withShortCmakeStaging(config, { directory = 'C:/cx' } = {}) {
  return withAppBuildGradle(config, (mod) => {
    if (process.platform !== 'win32' || mod.modResults.contents.includes(MARKER)) return mod;
    const anchor = '    ndkVersion rootProject.ext.ndkVersion';
    if (!mod.modResults.contents.includes(anchor)) {
      throw new Error('withShortCmakeStaging: não achei "ndkVersion" no app/build.gradle');
    }
    mod.modResults.contents = mod.modResults.contents.replace(
      anchor,
      `${anchor}\n    ${MARKER}\n    externalNativeBuild {\n        cmake {\n            buildStagingDirectory "${directory}"\n        }\n    }`
    );
    return mod;
  });
};
