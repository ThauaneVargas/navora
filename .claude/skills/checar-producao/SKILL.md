---
name: checar-producao
description: Verifica se a produção do Navora (API no Render, banco no Neon, painel na Vercel) está no ar de verdade, incluindo o banco e a ligação do painel com a API. Usar quando perguntarem se a produção está funcionando, quando o painel não entrar, antes de apresentações, ou depois de deploy/troca de env.
---

# Checar produção

`/health` não prova nada na `main` antiga — o teste certo é o login.

1. Login com conta que não existe (não precisa de senha real):
   ```bash
   curl -s -m 90 -o /dev/null -w "%{http_code}\n" -X POST https://navora-backend-kpio.onrender.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"naoexiste-checagem@navora.com","password":"x-invalida-123"}'
   ```
   - `401` → API e banco respondendo. OK.
   - `500`/`502`/`503`/timeout → problema. O serviço pode estar acordando (free dorme após 15 min, 30–50 s): repetir uma vez.
2. Painel (https://navora-nine.vercel.app) ligado à API certa:
   ```bash
   js=$(curl -s https://navora-nine.vercel.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js')
   curl -s "https://navora-nine.vercel.app/$js" | grep -o -E 'https://[a-z0-9.-]+\.(onrender\.com|railway\.app)' | sort -u
   curl -s -o /dev/null -D - -X OPTIONS https://navora-backend-kpio.onrender.com/auth/login \
     -H "Origin: https://navora-nine.vercel.app" -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
   ```
   - URL diferente de `navora-backend-kpio.onrender.com` → corrigir `VITE_NAVORA_API_URL` na Vercel (projeto `navora`) e **republicar** (a variável é gravada no build).
   - Sem `access-control-allow-origin` → falta o domínio do painel em `CORS_ORIGINS` no Render.
3. Se o login falhar de novo, pelo MCP do Render:
   - `list_deploys` / `get_deploy` do serviço `srv-dah043rl550s73d10v8g` (último deploy falhou?).
   - `list_logs` procurando `P1001` (banco inacessível) → conferir o projeto `navora` no painel do Neon (a usuária tem o acesso) e a `DATABASE_URL` do serviço. **Não recriar banco no Render** — `/recriar-banco` está obsoleta.

Reportar em uma linha: status HTTP do login, se o banco respondeu e se o painel aponta pra API certa.
