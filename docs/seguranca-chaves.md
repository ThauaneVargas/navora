# Segurança das chaves (segredos) — Navora

Criado em 17/11/2026 (branch `fix/seguranca-chaves`). O repositório no GitHub é **público**: tudo o que está commitado — inclusive no histórico — qualquer pessoa pode ler.

## Regra geral

| Onde | O que pode ficar | O que NUNCA fica |
|---|---|---|
| Código e arquivos commitados (`app.json`, `eas.json`, `render.yaml`, `.env.example`) | URLs públicas, flags (`BLE_ENABLED`), telefone da recepção, valores de exemplo | Senha de banco, `JWT_SECRET`, senha SMTP, chaves de API |
| `.env` local (já está no `.gitignore`) | Tudo do desenvolvimento local | — |
| Painel do Render (Environment) | Segredos da API de produção | — |
| Variáveis do EAS (Expo) | Chaves usadas no build do app | — |

Variáveis `EXPO_PUBLIC_*` (mobile) e `VITE_*` (painel) **vão dentro do app/site** e qualquer um consegue ler. Nunca colocar segredo nelas. Segredo de verdade só existe no backend.

## Como está montado

```
App mobile / Painel web  ──(só JWT do usuário)──▶  API NestJS (Render)  ──▶  Neon (Postgres)
                                                     │  segredos lidos do ambiente:
                                                     │  DATABASE_URL, JWT_SECRET,
                                                     │  SMTP_*, GOOGLE_CLIENT_IDS
```

- **Backend — `backend-nest/src/config/env.validation.ts`:** confere as variáveis ao subir. Em produção o servidor **não sobe** se faltar `DATABASE_URL`, `JWT_SECRET` ou `CORS_ORIGINS`, se o `JWT_SECRET` tiver menos de 32 caracteres ou for o valor de exemplo, ou se houver `SMTP_USER` sem `SMTP_PASS`. As mensagens mostram só o nome da variável, nunca o valor. Fora de produção só avisa.
- **`render.yaml`:** todos os segredos com `sync: false` (valor só no painel do Render).
- **Mobile — `mobile/app.config.js`:** injeta `GOOGLE_MAPS_API_KEY` na configuração nativa no momento do build. A chave saiu do `app.json`.

## Verificação feita em 17/11/2026

- `.gitignore` bloqueia `.env` e `.env.*` (exceto `.env.example`) — ok. Nenhum `.env` real foi commitado em nenhum dos 96 commits.
- Nenhuma senha de banco, `JWT_SECRET`, senha SMTP ou token encontrado no código nem no histórico.
- **Encontrado:** chave do Google Maps (`AIzaSyDC…`) no `mobile/app.json` desde 20/09 — está no histórico público. Removida do arquivo, mas **precisa ser trocada** (passo 2 abaixo).

## Feito em 17/11/2026

- `JWT_SECRET` e senha do banco (`neondb_owner`) **trocados** pelo Claude, com aceite da usuária; `DATABASE_URL` do Render atualizada (host direto do Neon, `sslmode=require&connect_timeout=15`). Para trocar de novo no futuro, os passos são os do item 1 abaixo.
- Resiliência: banco fora → API responde `503` claro (`src/common/database-unavailable.filter.ts`); app trata `502/503/504` como sem conexão; mapa com limite de 30 s antes do modo offline.
- Painel com cabeçalhos de segurança (`web-admin/vercel.json`).

## O que falta — só a usuária pode fazer

1. ~~Trocar o `JWT_SECRET` e a senha do banco~~ (feito em 17/11). Como fazer de novo:
   - Gerar segredo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
   - Render → serviço `navora-backend` → Environment → `JWT_SECRET` → colar → salvar. (Todos precisam entrar de novo no app/painel — esperado.)
   - Neon → projeto `navora` → Roles → resetar a senha → copiar a nova connection string → `DATABASE_URL` no Render.
   - Conferir que `CORS_ORIGINS` no Render tem `https://navora-nine.vercel.app` — senão, com esta branch, a API não sobe.
2. **Trocar a chave do Google Maps** (Google Cloud Console → APIs e serviços → Credenciais):
   - Criar uma chave nova; **restringir**: Android (pacote `com.navora.app` + SHA-1 do certificado — pegar com `npx eas-cli credentials`) e iOS (bundle `com.navora.app`); restringir as APIs a *Maps SDK for Android* e *Maps SDK for iOS*.
   - Apagar a chave antiga `AIzaSyDC…`.
   - Colocar a nova em `mobile/.env` (`GOOGLE_MAPS_API_KEY=...`) para o build local.
   - Para o build EAS: `cd mobile; npx eas-cli env:create --name GOOGLE_MAPS_API_KEY --value <chave> --environment production --visibility sensitive`.
   - Chave de SDK de mapa sempre fica dentro do APK; o que protege é a restrição acima.
3. Apagar no Neon os projetos que não são usados (`navora-producao` e os dois `navora-staging`) — cada um tem senha própria e só aumenta o que pode vazar.
4. No Render, configurar `Health Check Path` = `/health` (hoje está vazio): o Render passa a detectar banco fora.
5. Fazer o deploy desta branch (`git push origin fix/seguranca-chaves:main`) **depois** do passo 1 — se o Render estiver sem `CORS_ORIGINS` ou com segredo fraco, o deploy novo falha e o antigo continua no ar (nada cai).
6. Gerar APK novo depois do passo 2 (sem a chave o mapa do "Como chegar" fica em branco no Android).
