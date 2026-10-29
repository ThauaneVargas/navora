---
name: nova-tela
description: Checklist para criar ou alterar uma tela do app mobile do Navora (tema claro/escuro, tradução pt/en/es, safe area, teclado, navegação pela state machine). Usar sempre que for criar tela nova ou mexer no layout/textos de uma tela existente.
---

# Tela nova (ou alteração de tela) no mobile

Antes de criar: procurar se já existe tela/componente que faça isso (`mobile/src/screens`, `mobile/src/components`). Não duplicar.

## Estrutura
- Envolver em `Screen` (`components/Screen.js`): já tem safe area e `KeyboardAwareScrollView`. Com abas embaixo: `<Screen withBottomTabs>` + `<BottomTabs>`.
- Nunca `KeyboardAvoidingView`. Nunca `SafeAreaView` do `react-native` (só da `react-native-safe-area-context`, e normalmente nem isso — o `Screen` cuida).
- Formulário centralizado simples (tipo esqueci a senha): `components/CenteredFormScreen.js`.
- Navegação: não há React Navigation. Registrar a tela em `App.js` (import + entrada no mapa de telas) e navegar com `navigate('NomeDaTela', params)`. Conferir que alguma tela realmente navega pra ela — telas sem ponto de entrada já foram apagadas antes por serem mortas.

## Tema (modo noturno)
Padrão do projeto (ex.: `screens/CareAreaChoiceScreen.js`):
```js
function useThemeStyles() {
  const { appColors } = useApp();
  return useMemo(() => createStyles(appColors), [appColors]);
}
const createStyles = (colors) => StyleSheet.create({ ... });
```
- Não importar `colors` de `theme/colors` pra estilo, nem escrever hex direto. `shadows` pode ser importado.
- Bordô sólido (`primaryStrong`) só em Ajuda/SOS, seta da busca e "Continuar". Ícones: tile `iconBg` + ícone bordô.

## Textos (pt/en/es)
- Todo texto visível via `const { t } = useApp(); t('secao.chave')`.
- Adicionar a chave em **`src/i18n/pt.js`, `en.js` e `es.js`** — o teste falha se faltar em algum.
- Ficam em português (não traduzir): motivo de chamado enviado à recepção, nomes de destinos do hospital, textos vindos da API. Constantes de módulo guardam o valor em português como id e mostram `t(...)`.

## Público
Botões grandes, textos curtos e objetivos, bastante espaço em branco — pessoas com mobilidade reduzida ou ansiosas.

## Escopo
Só Paciente e Visitante; sem QR Code, agendamento ou chamada de paciente; Private e SUS separados; tudo funcionando sem beacon e sem API (fallback).

## Verificar
`cd mobile && npm test && npm run lint`.
