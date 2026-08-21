# Navora Web-admin

Painel Vite/React para perfis `ADMIN` e `RECEPTION`.

## Comandos

```powershell
npm install
npm.cmd run dev
npm.cmd run build
```

## API

O contrato de URL e:

```env
VITE_NAVORA_API_URL="http://localhost:8000"
```

Se ausente, o painel usa `http://localhost:8000` em desenvolvimento.

## Escopo Atual

- Dashboard.
- Calls/Help/SOS.
- Visitor authorization.
- Check-ins.
- Operational messages.
- Reports.
- Navigation data.
- Beacons.
- Sectors.

Algumas telas possuem fallback/local demo quando a API esta indisponivel. Erros `401` e `403` nao devem ser tratados como offline.
