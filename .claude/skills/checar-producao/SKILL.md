---
name: checar-producao
description: Verifica se a produção do Navora (Render) está no ar de verdade, incluindo o banco. Usar quando perguntarem se a produção está funcionando, antes de apresentações, ou depois de deploy/troca de env.
---

# Checar produção

`/health` não consulta o banco — não serve pra isso. O teste certo é o login.

1. Login com conta que não existe (não precisa de senha real):
   ```bash
   curl -s -m 90 -o /dev/null -w "%{http_code}\n" -X POST https://navora-backend-kpio.onrender.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"naoexiste-checagem@navora.com","password":"x-invalida-123"}'
   ```
   - `401` → API e banco respondendo. OK.
   - `500`/`502`/`503`/timeout → problema. O serviço pode estar acordando (free dorme após 15 min, 30–50 s): repetir uma vez.
2. Se falhar de novo, pelo MCP do Render:
   - `list_deploys` / `get_deploy` do serviço `srv-dah043rl550s73d10v8g` (último deploy falhou?).
   - `list_logs` procurando `P1001` (banco inacessível → provavelmente expirou → `/recriar-banco`).
   - `get_postgres` do banco `dpg-dbburtjncjis73fdjpig-a` (status).
3. Lembrar a data de expiração do banco free (hoje 19/11/2026) se faltar menos de 10 dias.

Reportar em uma linha: status HTTP, se o banco respondeu, e dias até a expiração.
