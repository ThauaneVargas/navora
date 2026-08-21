# Demo do MVP

## Contas Demo

Credenciais apenas para desenvolvimento/demo, criadas pelo seed:

- ADMIN: `admin@navora.com`
- RECEPTION: `recepcao@navora.com`
- PATIENT: `paciente@navora.com`
- Senha demo: `navora-demo-123`

Nao usar essas credenciais fora de ambiente local/demo.

## Checklist Pre-demo

- Docker Desktop aberto.
- Postgres `navora-postgres` em execucao.
- `npx.cmd prisma migrate status` em dia.
- `npx.cmd prisma db seed` aplicado.
- Backend ativo em `http://localhost:8000`.
- Mobile Expo ativo.
- Web-admin ativo.

## Roteiro Principal, 5 a 10 Minutos

1. Entrar no mobile como `paciente@navora.com`.
2. Escolher um destino, por exemplo Tomografia.
3. Mostrar `access-check` e permissao.
4. Abrir pre-visualizacao de rota.
5. Mostrar mapa dinamico.
6. Abrir Mode3D.
7. Simular deteccao de beacon na tela de chegada ou controles de desenvolvimento.
8. Mostrar replanejamento ou atualizacao de origem quando houver rota ativa.
9. Simular chegada ao destino.
10. Abrir web-admin como `admin@navora.com` ou `recepcao@navora.com`.
11. Mostrar visitor access.
12. Mostrar Help/SOS.
13. Mostrar check-ins e mensagens operacionais.

Partes opcionais: relatorios, dashboard detalhado e setores/beacons no painel.

## Cenario Visitor

1. No mobile, entrar como visitante.
2. Escolher destino protegido de visita.
3. O access-check retorna `REQUIRE_AUTHORIZATION`.
4. Visitante cria pedido de acesso.
5. Recepcao aprova no web-admin.
6. Visitante consulta status.
7. Nova rota pode ser solicitada usando `visitor_access_request_id`.

## Cenario External Patient

1. Entrar como paciente externo.
2. Escolher destino de exame.
3. Dentro da janela 07:00-17:00, a regra permite acesso.
4. Fora da janela, a decisao esperada e `REDIRECT_TO_RECEPTION`.
5. A rota efetiva deve ser para a recepcao, nao para o destino original.

## Simulacao de Deteccao de Beacon

O MVP nao usa BLE real. Use simulacao de deteccao de beacon:

- Na tela `ArrivalDetectedScreen`, usar os botoes `Simular entrada Private` ou `Simular entrada Hospital Marco Capute`.
- Em desenvolvimento, o botao `Dev: simular beacon desconhecido` testa evento desconhecido.
- O servico usado e `indoorLocationService.emitSimulatedDetection`.
- O backend recebe `/beacons/detect` com `{ "beaconCode": "MBM04-01" }` ou equivalente.

Nao chamar esse fluxo de BLE real.

## O Que E Real

- Backend NestJS.
- Auth JWT e roles.
- Cadastro/login demo.
- Regras de acesso.
- Visitor authorization.
- Dijkstra.
- Route-preview.
- Instrucoes de navegacao.
- Dados persistidos em PostgreSQL.
- Help/SOS.
- Check-ins, mensagens, relatorios e dashboard.

## O Que E Simulado

- Entrada BLE.
- RSSI real.
- Selecao fisica de beacon.
- Mapa fisico em escala.
- Algumas metricas/heatmap locais do painel quando API nao fornece dado real.

## Preparado Mas Nao Validado

- Interface de provider BLE.
- Evento normalizado de indoor location.
- Pipeline de replanejamento a partir de `origin_node_code`.
- Calculo preliminar de janela RSSI em codigo utilitario.
- Validacao com MBM02 fisico.
