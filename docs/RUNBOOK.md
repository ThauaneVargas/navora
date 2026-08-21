# Runbook Operacional

Este runbook prioriza recuperacao sem destruir dados locais. Nao use `prisma migrate reset`, `prisma db push`, `DROP`, `TRUNCATE` ou deletes em massa para resolver problemas gerais.

## Docker Offline

Sintomas comuns:

- `failed to connect to docker API`
- `dockerDesktopLinuxEngine`
- `P1001`
- erro em `localhost:5432`

Procedimento:

1. Abrir Docker Desktop.
2. Esperar a engine ficar pronta.
3. Em `backend-nest`, rodar `docker compose up -d`.
4. Conferir `docker compose ps`.
5. Rodar Prisma apenas depois do Postgres ficar disponivel.

## Database e Migrations

- Migration pendente em `npx.cmd prisma migrate status`: rodar `npx.cmd prisma migrate deploy`.
- Banco inacessivel: nao rodar seed.
- Migration falhou: parar e investigar o erro especifico.
- Nao resetar o banco como resposta padrao.

## Prisma Generate

Fluxo normal:

```powershell
cd backend-nest
npx.cmd prisma generate
```

Nao use `--no-engine` para a configuracao local atual.

Se houver `EPERM` ou arquivo Prisma bloqueado, pare processos Node/Nest que possam estar segurando o client, feche terminais com servidores antigos e rode `npx.cmd prisma generate` novamente.

## Porta 8000 Ocupada

Sintoma:

```txt
EADDRINUSE
```

Pode existir backend ja rodando. Antes de iniciar outra instancia, verifique o endpoint:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8000/health
```

Se for preciso encerrar processo, identifique o PID com ferramentas do Windows e pare apenas o processo confirmado.

## Auth

- `401`: sessao ausente, invalida ou expirada.
- `403`: usuario autenticado sem permissao para a rota.

`401` e `403` nao sao offline. Nao use fallback mock para mascarar erro de permissao.

## Rota e Acesso

- `BLOCK`: acesso negado para o destino.
- `REQUIRE_AUTHORIZATION`: visitante precisa de autorizacao da recepcao.
- `REDIRECT_TO_RECEPTION`: destino efetivo vira recepcao/fallback.
- `route_found=false`: nao ha rota no grafo para origem/destino efetivo.
- `accessible_route_found=false`: ha rota sem restricao, mas nao ha rota que respeite as preferencias topologicas.

Nenhum desses estados deve gerar rota inventada.

## Beacons

O provider atual e `simulated`. Eventos passam por normalizacao e, se possivel, por `/beacons/detect`.

- Beacon conhecido com node retorna `origin_node_code`.
- Beacon desconhecido retorna `detected: false`.
- Evento desconhecido preserva `activeRoute`.
- Backend offline nao deve inventar origem.
