# Navora Mobile

App Expo do Navora MVP para paciente, paciente externo e visitante. Recepcao e Administracao ficam no `web-admin`.

## Comandos

```powershell
npm install
npm.cmd run web
npx.cmd expo export --platform web --output-dir verify-dist
```

No PowerShell, use `npm.cmd` e `npx.cmd` se a politica de execucao bloquear `npm`/`npx`.

## API

O contrato de URL e:

```env
EXPO_PUBLIC_NAVORA_API_URL="http://localhost:8000"
```

Se ausente, o app usa `http://localhost:8000` para desenvolvimento local/emulador.

## Beacons

O MVP usa simulacao de deteccao de beacon via `indoorLocationService`. BLE real nao foi validado e nao deve ser chamado de funcionalidade ativa. O provider BLE futuro deve implementar `start`, `stop`, `subscribe` e `getStatus`.

Veja `../docs/DEMO.md` e `../docs/BLE_HARDWARE_VALIDATION.md`.
