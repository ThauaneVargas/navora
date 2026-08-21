# Auditoria Documental da Fase 10

Data: 2026-08-21.

## Documentacao Correta ou Aproveitavel

- `README.md`: atualizado na Fase 10 para apontar para a documentacao operacional.
- `backend-nest/.env.example`: nomes reais de variaveis do backend.
- `backend-nest/docker-compose.yml`: Postgres local `navora-postgres` em `localhost:5432`.
- `backend-nest/package.json`: scripts reais conferidos.
- `mobile/package.json`: scripts Expo reais conferidos.
- `mobile/app.json`: Expo SDK 54 e configuracao sem BLE nativo.
- `web-admin/package.json`: scripts Vite reais conferidos.
- `backend-nest/prisma/schema.prisma`: fonte de verdade para modelos, enums e relacoes.
- `backend-nest/prisma/seed.ts`: fonte de verdade para contas demo, grafo e beacons seed.

## Documentacao Desatualizada Corrigida

- `backend-nest/README.md`: removida recomendacao operacional de `prisma migrate dev` como fluxo normal e substituida por `migrate status` + `migrate deploy`.
- `mobile/README.md`: atualizado para explicitar `EXPO_PUBLIC_NAVORA_API_URL`, export web e simulacao de beacons.
- `README.md`: atualizado para diferenciar backend NestJS principal, FastAPI legado, BLE simulado e documentacao da Fase 10.

## Documentacao Faltante Criada

- `docs/SETUP.md`
- `docs/RUNBOOK.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DEMO.md`
- `docs/BLE_HARDWARE_VALIDATION.md`
- `docs/HANDOFF.md`
- `web-admin/README.md`

## Arquivos Redundantes ou Historicos

- `backend/README.md` e `backend/`: FastAPI legado, nao backend principal.
- `docs/arquitetura.md`, `docs/banco_dados.md`, `docs/requisitos.md`, `docs/roadmap.md`: arquivos vazios antigos.
- `docs/PLANO_PROTOTIPO_NAVORA.md`: plano prototipal anterior, util como historico, nao como runbook atual.
- `mobile/src/data/routes.js`: fallback local do app, nao fonte primaria do grafo quando API esta disponivel.

## Instrucoes Perigosas Removidas ou Evitadas

- Nao recomendar `prisma migrate reset`.
- Nao recomendar `prisma db push`.
- Nao recomendar `prisma migrate resolve` como solucao generica.
- Nao resetar banco para corrigir falha de migration/seed.

## Scripts Conferidos

Backend:

- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:deploy`
- `npm run prisma:seed`
- `npm run prisma:studio`

Mobile:

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`

Web-admin:

- `npm run dev`
- `npm run build`
- `npm run preview`

## Contratos Conferidos

- Backend padrao: porta `8000`.
- Banco local: `postgresql://postgres:postgres@localhost:5432/navora?schema=public` em ambiente demo/local.
- Mobile: `EXPO_PUBLIC_NAVORA_API_URL`.
- Web-admin: `VITE_NAVORA_API_URL`.
- CORS: `CORS_ORIGINS`.
- Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`.
- Beacons: provider simulado validado, BLE real nao validado.
