# Arquitetura do Navora

## Visao Geral

```txt
mobile Expo -> backend NestJS -> Prisma -> PostgreSQL
web-admin Vite -> backend NestJS -> Prisma -> PostgreSQL
```

`backend-nest/` e o backend principal atual. `backend/` contem FastAPI legado e nao deve ser usado como fonte principal de contratos do MVP.

## Componentes

- `backend-nest`: API REST, autenticacao JWT, roles, regras de acesso, roteamento, beacons, operacao e relatorios.
- `mobile`: app Expo com fluxos de paciente, paciente externo e visitante.
- `web-admin`: painel operacional para recepcao e administracao.
- `database` e `backend-nest/prisma`: schema, migrations e seed.
- `docs`: documentacao operacional e handoff.

## Pipeline de Navegacao

1. Usuario escolhe destino.
2. Mobile monta payload com origem, destino, subject e acessibilidade.
3. `POST /navigation/access-check` avalia regras.
4. `POST /navigation/route-preview` chama `access-check`.
5. Se houver redirecionamento, o destino efetivo vira recepcao/fallback.
6. `NavigationRoutingService` executa Dijkstra.
7. `NavigationInstructionsService` gera passos.
8. Mobile normaliza resposta como `activeRoute`.
9. `deriveNavigationProgress` deriva progresso.
10. `MapScreen` e `Mode3DScreen` renderizam a rota.

## Access

Decisoes atuais:

- `ALLOW`: destino permitido.
- `BLOCK`: destino bloqueado.
- `REQUIRE_AUTHORIZATION`: visitante precisa de autorizacao.
- `REDIRECT_TO_RECEPTION`: usuario deve ser roteado para recepcao.

Visitor authorization e avaliada por `visitor_access_request_id`. A autorizacao precisa estar ativa, aprovada, nao expirada, nao finalizada e precisa corresponder ao destino.

## Acessibilidade

`RouteEdge` possui:

- `accessible`
- `routeType`
- `wheelchairAccessible`
- `stretcherAccessible`

`RouteType` possui:

- `CORRIDOR`
- `ELEVATOR`
- `RAMP`
- `STAIRS`
- `DOOR`
- `TRANSFER`

Estado seed atual:

- 21 arestas `CORRIDOR`.
- 2 arestas `ELEVATOR`.
- 0 `RAMP`, `STAIRS`, `DOOR` e `TRANSFER`.

As preferencias `wheelchair`, `needsStretcher`, `avoidStairs`, `mobility` e `mobilityDifficulty` alteram restricoes topologicas. `preferElevator`, `voiceGuidance`, `largerText` e `highContrast` sao preservadas no contrato, mas nao tem o mesmo efeito topologico no Dijkstra atual.

## Pipeline de Beacon

```txt
indoorLocationService
-> detection normalizada
-> /beacons/detect
-> origin_node_code
-> recalculateActiveRouteFromBeacon
-> activeRoute
-> navigationProgress
```

O provider ativo e simulado. BLE real ainda nao foi validado. O provider BLE futuro deve emitir o mesmo evento normalizado e nao deve alterar o Dijkstra.

## Grafo Atual

Seed atual:

- 25 navigation nodes.
- 23 route edges.
- 21 destinations.
- 2 entrances.
- 5 beacons.
- 2 floors.
- `surgery-center` esta isolado para representar destino restrito sem rota demonstravel.

As coordenadas `x`/`y` sao abstratas para demonstracao visual. Elas nao tem escala fisica validada.
