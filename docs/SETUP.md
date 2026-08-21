# Setup do Navora

Este guia descreve o fluxo local validado para o MVP. Use PowerShell no Windows quando possivel.

## Requisitos

- Node.js e npm.
- Docker Desktop.
- Navegador moderno.
- Expo CLI via `npx`.
- PostgreSQL via Docker Compose em `backend-nest/docker-compose.yml`.

Nao ha uma versao minima de Node documentada no repositorio. Use a versao que instala as dependencias atuais sem erro.

## Variaveis de Ambiente

Crie `backend-nest/.env` a partir de `backend-nest/.env.example` e use placeholders seguros:

```env
PORT=8000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/navora?schema=public"
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081"
JWT_SECRET="replace-with-a-long-random-secret-for-local-development"
JWT_EXPIRES_IN="8h"
```

Mobile:

```env
EXPO_PUBLIC_NAVORA_API_URL="http://localhost:8000"
```

Web-admin:

```env
VITE_NAVORA_API_URL="http://localhost:8000"
```

Nao registre secrets reais na documentacao.

## Backend

```powershell
cd backend-nest
docker compose up -d
docker compose ps
npm install
npx.cmd prisma generate
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run start:dev
```

O backend escuta em `http://localhost:8000` por padrao. Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8000/health
```

Se `npx.cmd prisma migrate status` mostrar migration pendente, use `npx.cmd prisma migrate deploy`. Nao use `migrate reset`, `db push` ou `resolve` como solucao generica.

O `package.json#prisma.seed` funciona hoje, mas o aviso de deprecacao do Prisma 7 deve ser tratado depois migrando a configuracao para o formato recomendado pelo Prisma vigente.

## P1001

Erro:

```txt
Can't reach database server at localhost:5432
```

Procedimento:

1. Abrir Docker Desktop.
2. Aguardar a engine iniciar.
3. Em `backend-nest`, rodar `docker compose up -d`.
4. Conferir `docker compose ps`.
5. So depois rodar comandos Prisma.

## Mobile

```powershell
cd mobile
npm install
npm.cmd run web
```

Export de validacao:

```powershell
npx.cmd expo export --platform web --output-dir verify-dist
```

O Expo web funciona para validacao do MVP. BLE real nao funciona como scanner nativo no Expo Go atual. O fluxo do MVP usa simulacao de deteccao de beacon pelo `indoorLocationService`.

## Web-admin

```powershell
cd web-admin
npm install
npm.cmd run dev
npm.cmd run build
```

O contrato de URL da API e `VITE_NAVORA_API_URL`. Se ausente, o painel usa `http://localhost:8000` em desenvolvimento.

## Ordem Completa

1. Abrir Docker Desktop.
2. `cd backend-nest`.
3. `docker compose up -d`.
4. `docker compose ps`.
5. `npx.cmd prisma generate`.
6. `npx.cmd prisma migrate status`.
7. `npx.cmd prisma migrate deploy`.
8. `npx.cmd prisma db seed`.
9. `npm.cmd run start:dev`.
10. `cd ..\mobile` e `npm.cmd run web`.
11. `cd ..\web-admin` e `npm.cmd run dev`.
