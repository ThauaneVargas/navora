# Auditoria de Deploy da Fase 11

Data: 2026-08-21.

## Scripts Reais

Backend `backend-nest/package.json`:

- `build`: `nest build`
- `start`: `node dist/main`
- `start:prod`: `node dist/main`
- `start:dev`: `nest start --watch`
- `test`: suite atual via `ts-node`
- `prisma:generate`: `prisma generate`
- `prisma:deploy`: `prisma migrate deploy`
- `prisma:seed`: `prisma db seed`
- `prisma:migrate`: `prisma migrate dev`, nao usar em staging

Mobile `mobile/package.json`:

- `start`: `expo start`
- `android`: `expo start --android`
- `ios`: `expo start --ios`
- `web`: `expo start --web`

Web-admin `web-admin/package.json`:

- `dev`: `vite`
- `build`: `vite build`
- `preview`: `vite preview`

## Runtime e Build

- Backend: NestJS 10, build com `npm.cmd run build`, runtime com `npm.cmd run start:prod`.
- Prisma: dependencias permitem Prisma 6.x; `npx prisma generate` executou Prisma Client v6.19.3 neste ambiente.
- PostgreSQL: schema Prisma usa provider `postgresql`; Docker local usa `postgres:16-alpine`.
- Mobile: Expo SDK 54, React Native 0.81.5, Expo web exportavel.
- Web-admin: Vite 7, frontend estatico.

Nao ha campo `engines` em `package.json`; portanto o requisito exato de Node nao esta declarado no repo.

## Porta e Health

- Backend usa `PORT` via env, fallback `8000`.
- `GET /health` existe e retorna status simples sem secrets.
- `GET /` tambem retorna status simples.

## Variaveis de Ambiente

Backend:

- `PORT`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Mobile:

- `EXPO_PUBLIC_NAVORA_API_URL`

Web-admin:

- `VITE_NAVORA_API_URL`

## CORS

`backend-nest/src/main.ts` le `CORS_ORIGINS` separado por virgulas. Se ausente, usa localhosts de desenvolvimento:

- `http://localhost:8081`
- `http://127.0.0.1:8081`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Staging deve configurar explicitamente a URL HTTPS do web-admin.

## Localhost e URLs Encontradas

Localhost esperado/documentado:

- Backend local: `http://localhost:8000`
- Web-admin local: `http://localhost:5173`
- Expo web/local: `http://localhost:8081`
- Postgres local: `localhost:5432`

Codigo com fallback local:

- `mobile/src/services/api.js`: usa `EXPO_PUBLIC_NAVORA_API_URL` ou fallback `http://localhost:8000`.
- `web-admin/src/services/api.js`: usa `VITE_NAVORA_API_URL` ou fallback `http://localhost:8000`.
- `backend-nest/src/main.ts`: usa `CORS_ORIGINS` ou fallback local.

URLs externas nao relacionadas a staging:

- Google Maps, Apple Maps e Waze nos fluxos de rota externa.

Nao foi encontrado dominio de staging hardcoded.

## Credenciais e Secrets

- `.env` nao foi alterado.
- Nenhum secret real foi adicionado.
- `JWT_SECRET` e `DATABASE_URL` aparecem apenas em backend/docs/env examples.
- Frontends recebem apenas URL publica da API.
- Credenciais demo permanecem documentadas como dados ficticios.

## Dependencias de Staging

Para deploy acessivel externamente ainda faltam decisoes manuais:

- Plataforma Node para backend.
- PostgreSQL staging.
- Hospedagem estatica do web-admin.
- URLs HTTPS.
- Secrets reais de staging.
- Politica de custo/conta.
