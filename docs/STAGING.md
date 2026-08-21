# Staging do Navora

Staging e um ambiente de demonstracao controlada. Nao e producao definitiva, nao deve receber dados reais de pacientes e nao valida BLE fisico.

## Arquitetura Recomendada

```txt
web-admin estatico HTTPS -> backend NestJS HTTPS -> PostgreSQL gerenciado
mobile Expo/local/device -> backend NestJS HTTPS
```

Recomendacao minima:

- Backend NestJS em plataforma Node com HTTPS, logs basicos e variaveis de ambiente.
- PostgreSQL gerenciado separado de desenvolvimento/producao.
- Web-admin como frontend estatico apontando para a API staging.
- Mobile Expo local/device apontando temporariamente para a API staging.

Plataformas possiveis: Render, Railway, Fly.io, Heroku-like Node hosting, Supabase/Neon/Railway Postgres para banco e Vercel/Netlify/Cloudflare Pages para web-admin. A escolha final exige conta, politica de custo e credenciais do usuario.

## Variaveis de Ambiente

Backend:

```env
PORT=8000
DATABASE_URL="<STAGING_DATABASE_URL>"
CORS_ORIGINS="https://<WEB_ADMIN_STAGING_URL>,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081"
JWT_SECRET="<STAGING_JWT_SECRET>"
JWT_EXPIRES_IN="8h"
```

Web-admin:

```env
VITE_NAVORA_API_URL="<STAGING_API_URL>"
```

Mobile:

```env
EXPO_PUBLIC_NAVORA_API_URL="<STAGING_API_URL>"
```

Nunca colocar `DATABASE_URL` ou `JWT_SECRET` no frontend.

## Build Backend

```powershell
cd backend-nest
npm install
npx.cmd prisma generate
npm.cmd run build
npm.cmd run start:prod
```

O artefato executavel e `dist/main.js`, iniciado por `node dist/main`.

## Migrations

Aplicar migrations existentes somente depois do banco staging estar criado e acessivel:

```powershell
cd backend-nest
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
```

Nao usar `prisma migrate dev`, `prisma db push` ou `prisma migrate reset` em staging.

## Seed Staging

O seed atual cria dados ficticios/demo, incluindo contas `admin@navora.com`, `recepcao@navora.com` e `paciente@navora.com`. Ele deve ser executado manualmente quando necessario:

```powershell
cd backend-nest
npx.cmd prisma db seed
```

Nao executar seed automaticamente a cada restart do backend.

## CORS

Usar `CORS_ORIGINS` com lista separada por virgulas. Incluir:

- URL HTTPS do web-admin staging.
- Localhost de desenvolvimento quando necessario.
- Origem do Expo web/local quando usada.

Evitar `*`.

## Web-admin Staging

```powershell
cd web-admin
$env:VITE_NAVORA_API_URL="<STAGING_API_URL>"
npm.cmd run build
```

Publicar o diretorio de build gerado pelo Vite na plataforma estatica escolhida.

## Mobile Contra Staging

```powershell
cd mobile
$env:EXPO_PUBLIC_NAVORA_API_URL="<STAGING_API_URL>"
npm.cmd run web
```

Em celular fisico, `localhost` aponta para o proprio aparelho, nao para o computador. Para teste local/device use IP da maquina quando necessario. Para staging, use dominio HTTPS.

## Ordem de Deploy

1. Criar banco PostgreSQL staging.
2. Configurar envs do backend.
3. Instalar dependencias do backend.
4. Rodar `npx prisma generate`.
5. Rodar `npx prisma migrate deploy`.
6. Rodar seed demo uma vez, se o ambiente deve conter dados demonstraveis.
7. Rodar `npm run build`.
8. Subir backend com `npm run start:prod`.
9. Validar `GET /health`.
10. Configurar `VITE_NAVORA_API_URL` e publicar web-admin.
11. Configurar `EXPO_PUBLIC_NAVORA_API_URL` temporariamente para mobile staging.

## Smoke Tests

Backend:

- `GET /health`
- login ADMIN, RECEPTION e PATIENT
- `GET /auth/me`
- `GET /navigation/destinations`
- `POST /navigation/access-check`
- `POST /navigation/route-preview`
- `POST /beacons/detect`
- `GET /dashboard/summary` com role adequada
- `GET /calls`
- `GET /visitor-access`

Web-admin:

- login ADMIN
- login RECEPTION
- dashboard
- visitor requests
- calls
- check-ins
- messages
- reports

Mobile:

- login
- destino
- route-preview
- mapa
- beacon simulado
- replanejamento
- arrival

Nao imprimir tokens no relatorio.

## Rollback Basico

- Backend: voltar para build/release anterior da plataforma.
- Web-admin: voltar para deploy estatico anterior.
- Banco: nao rodar comandos destrutivos; se migration falhar, parar e investigar.
- Env: manter registro seguro dos valores configurados na plataforma, sem commitar secrets.

## Diferencas Local vs Staging

- Local pode usar Postgres Docker em `localhost:5432`.
- Staging usa PostgreSQL remoto/gerenciado.
- Local pode usar `http://localhost:8000`.
- Staging deve usar HTTPS.
- BLE segue simulado em ambos.
- Staging usa dados ficticios/demo.

## Acoes Manuais Necessarias

Antes de deploy externo real, o usuario precisa escolher/criar:

- Conta/plataforma de backend.
- Banco PostgreSQL staging.
- Hospedagem estatica para web-admin.
- Dominios/URLs HTTPS.
- Secrets de staging.
- Politica de custo.
