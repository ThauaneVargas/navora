---
name: recriar-banco
description: OBSOLETA desde 03/11/2026 — o banco de produção agora é o Neon (não expira), não recriar no Render. Recriava o Postgres free do Render quando expirava. Só consultar como referência histórica; se o login de produção falhar, investigar o Neon. Antes servia quando a produção cair com P1001, o login de produção falhar, ou a data de expiração estiver perto.
---

# Recriar o banco de produção (Render free)

Fonte completa: `docs/arquitetura.md` §7. Isto é produção — **confirmar cada passo com a usuária antes de executar**; criar banco e trocar env var são ações externas.

## Checar primeiro
- `/checar-producao`. Se o login com e-mail inexistente devolve 401, o banco está vivo — não recriar.
- Pelo MCP do Render: `list_postgres_instances` / `get_postgres` (status e data de expiração) e `list_logs` do serviço `srv-dah043rl550s73d10v8g` (procurar `P1001`).

## Procedimento
1. Criar Postgres free no Render, região **Oregon**, versão **16** (MCP `create_postgres` ou painel). Nome sugerido: `navora-db-<n>`.
2. No painel do banco, **Inbound IP Rules**: adicionar `0.0.0.0/0` (temporário — a usuária faz no painel).
3. Pegar a **External Database URL** (com `?sslmode=require`). Nunca gravar em arquivo do repositório nem repetir no chat além do necessário.
4. Migrations e seed vêm do código que a produção roda (`main`), não da branch atual:
   ```bash
   git fetch origin
   git worktree add ../navora-main origin/main
   cd ../navora-main/backend-nest && npm ci && npx prisma generate
   DATABASE_URL="<url externa>" npx prisma migrate deploy
   DATABASE_URL="<url externa>" SEED_DEMO_PASSWORD="<senha da usuária>" npx prisma db seed
   ```
   O seed recusa banco não local sem `SEED_DEMO_PASSWORD`. As senhas de produção ficam com a usuária — pedir a ela.
5. No serviço web, trocar a env `DATABASE_URL` pela URL **interna** (MCP `update_environment_variables`) — isso dispara o deploy.
6. Validar: `/checar-producao` + login real feito pela usuária (`admin@navora.com`, `recepcao@navora.com`, `paciente@navora.com`) dando 201.
7. Remover a regra `0.0.0.0/0` do banco. Remover o worktree (`git worktree remove ../navora-main`).
8. Atualizar a data de expiração no `CLAUDE.md` (Prioridades item 2 e Ambientes) e em `docs/arquitetura.md` §7.

## Alternativa
Plano pago (sem expiração) — adiado pela usuária até pesquisar custos. Mencionar se for a 3ª recriação.
