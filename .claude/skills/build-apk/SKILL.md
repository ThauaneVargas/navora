---
name: build-apk
description: Compila o APK release do Navora (JS embutido, sem Metro) no Windows. Usar quando pedirem APK, build Android, instalar no celular ou testar beacons no aparelho.
---

# Build do APK (Android, Windows)

O projeto mora em `C:\dev\navora` desde 28/10/2026 (saiu do OneDrive porque, com RN 0.88, os arquivos C++ gerados passavam de 260 caracteres). **Mesmo assim o build direto em `C:\dev\navora\mobile` falha** (testado em 28/10: o codegen do `react-native-safe-area-context` gera pasta com 267 caracteres). Usar sempre o plano B (cópia em `C:\nv\mobile`), no fim deste arquivo.

## Antes
1. Conferir `mobile/.env` — o APK embute os valores na compilação:
   - `EXPO_PUBLIC_API_URL`: produção (`https://navora-backend-kpio.onrender.com`). Release bloqueia HTTP sem TLS, então IP local não funciona no APK.
   - `EXPO_PUBLIC_BLE_ENABLED="true"` se for teste de beacon.
   - `EXPO_PUBLIC_BEACON_DIAGNOSTICS="true"` pra mostrar a tela de diagnóstico no release.
   - Mostrar os valores à usuária e confirmar antes de compilar.
2. Lembrar: depois do build, o `.env` precisa voltar pro IP local pra trabalhar com Metro.

## Passos
1. Se `C:\dev\navora\mobile\android` não existir: `npx expo prebuild --platform android` dentro de `C:\dev\navora\mobile`.
2. Compilar (rodar em background, demora):
   ```powershell
   cd C:\dev\navora\mobile\android; .\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
   ```
3. Saída: `C:\dev\navora\mobile\android\app\build\outputs\apk\release\app-release.apk`. Copiar pra `C:\Users\thaua\OneDrive\Desktop\navora-<motivo>.apk` (fica fácil de achar).

## Problemas conhecidos
- Falha baixando `androidx.compose.*` → é a internet. Tentar de novo. **Não** forçar versão (conflito `strictly` com savedstate).
- Erro de caminho longo mesmo em `C:\nv` → o plugin `mobile/plugins/withShortCmakeStaging.js` manda o staging do CMake pra `C:/cx`; conferir se está no `app.json`.
- O APK é assinado com a debug key — instala por cima do dev-client.
- APK fecha ao abrir com `Failed to create an instance of class androidx.work.impl.WorkDatabase` → R8 ligado. O plugin `mobile/plugins/withReleaseMinifyOff.js` desliga no prebuild; se a pasta `android` já existia, conferir `android.enableMinifyInReleaseBuilds=false` em `android/gradle.properties`.
- Ver erro do APK no celular: cabo USB + depuração USB, `adb logcat -b crash -d` e procurar `Process: com.navora.app`. O "Enviar relatório" do Android vai pro Google, não chega pra gente.

## Entregar no celular
Pela LAN: servidor Node simples na porta 8090 servindo o APK + QR Code com `http://<IP do PC>:8090/<arquivo>.apk` (IP via `ipconfig`, adaptador Wi-Fi).

## Plano B (necessário — ver topo)
Copiar pra `C:\nv\mobile` e compilar lá (passos 1–3 trocando `C:\dev\navora\mobile` por `C:\nv\mobile`). **Não** excluir as pastas `build` de dentro de `node_modules` (têm o JS compilado dos pacotes). Excluir `android\build` e `android\app\build`: o `autolinking.json` gerado ali guarda o caminho absoluto e, se for copiado de `C:\dev`, o CMake volta a usar o caminho longo.
```powershell
robocopy "C:\dev\navora\mobile" "C:\nv\mobile" /MIR /XD "C:\dev\navora\mobile\android\build" "C:\dev\navora\mobile\android\app\build" "C:\dev\navora\mobile\android\.gradle" /NFL /NDL /NJH /NJS
```
(robocopy devolve 1–7 em sucesso; ≥ 8 é erro.) Se der erro de `mkdir` com `C_/dev/navora` no caminho, apagar `C:\nv\mobile\android\build\generated\autolinking` e `C:\nv\mobile\android\app\build\generated\autolinking` e compilar de novo.
