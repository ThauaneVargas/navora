# Navora Backend NestJS

Backend principal atual do Navora MVP.

## Stack

- NestJS + TypeScript.
- PostgreSQL.
- Prisma.
- JWT com roles `ADMIN`, `RECEPTION` e `PATIENT`.

## Rodar Localmente

```powershell
npm install
copy .env.example .env
docker compose up -d
docker compose ps
npx.cmd prisma generate
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run start:dev
```

Depois acesse `http://localhost:8000/health`.

Nao use `prisma migrate reset` nem `prisma db push` como fluxo normal. Use `migrate deploy` para aplicar migrations existentes quando o banco estiver disponivel.

## Scripts

- `npm run start:dev`: servidor Nest em watch.
- `npm run build`: build TypeScript/Nest.
- `npm run test`: suite atual via `ts-node`.
- `npm run prisma:generate`: `prisma generate`.
- `npm run prisma:deploy`: `prisma migrate deploy`.
- `npm run prisma:seed`: `prisma db seed`.

`npm run prisma:migrate` existe, mas usa `prisma migrate dev` e nao e o fluxo operacional da Fase 10.

## Documentacao

Veja:

- `../docs/SETUP.md`
- `../docs/RUNBOOK.md`
- `../docs/API.md`
