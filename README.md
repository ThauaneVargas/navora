# Navora MVP

Navora e um MVP de navegacao hospitalar, apoio ao paciente/visitante e operacao de recepcao/admin. O backend principal atual e NestJS com Prisma/PostgreSQL. O backend FastAPI em `backend/` e legado e fica apenas como referencia historica.

## Estado Atual

- Backend NestJS: auth JWT, roles `ADMIN`, `RECEPTION` e `PATIENT`, PatientProfile, access-check, visitor authorization, Dijkstra, route-preview, instrucoes de navegacao, beacons cadastrados, `/beacons/detect`, chamados Help/SOS, check-ins, mensagens operacionais, relatorios e dashboard.
- Mobile Expo: login/registro, sessao, perfil, fluxos `PATIENT`, `EXTERNAL_PATIENT` e `VISITOR`, `activeRoute`, `navigationProgress`, mapa dinamico, modo 3D, replanejamento, chegada, WaitingMode, provider de beacon simulado e fallback offline.
- Web-admin Vite: telas ADMIN/RECEPTION para dashboard, chamados, autorizacao de visitantes, check-ins, mensagens, relatorios, dados de navegacao, beacons e setores.
- Hardware: BLE real ainda nao validado. O provider simulado esta validado e a arquitetura esta preparada para um provider BLE futuro.

## Documentacao Principal

- [Instalacao e execucao](docs/SETUP.md)
- [Runbook operacional](docs/RUNBOOK.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [API principal](docs/API.md)
- [Roteiro de demonstracao](docs/DEMO.md)
- [Staging/deploy controlado](docs/STAGING.md)
- [Auditoria de deploy](docs/DEPLOY_AUDIT.md)
- [Validacao futura MBM02/BLE](docs/BLE_HARDWARE_VALIDATION.md)
- [Handoff tecnico e backlog](docs/HANDOFF.md)

## Ordem Recomendada Para Subir

1. Abrir o Docker Desktop.
2. Subir PostgreSQL em `backend-nest` com `docker compose up -d`.
3. Conferir `docker compose ps`.
4. Rodar Prisma generate, status, deploy e seed.
5. Iniciar o backend NestJS.
6. Iniciar o mobile Expo.
7. Iniciar o web-admin Vite.

Veja o passo a passo completo em [docs/SETUP.md](docs/SETUP.md).

## Comandos de Validacao

```powershell
cd backend-nest
npx.cmd prisma migrate status
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma db seed
npm.cmd run test
npm.cmd run build

cd ..\mobile
npx.cmd expo export --platform web --output-dir verify-dist

cd ..\web-admin
npm.cmd run build
```

Nao use `prisma migrate reset` ou `prisma db push` como fluxo normal deste MVP.
