# Handoff Tecnico do MVP

## Componentes Principais

- `backend-nest`: API principal, auth, dominio de navegacao, operacao e persistencia Prisma.
- `mobile`: app Expo, fluxos de paciente/visitante, rota ativa e provider indoor simulado.
- `web-admin`: painel Vite para administracao e recepcao.
- `database`: SQL legado/reference.
- `docs`: documentacao operacional da Fase 10.

## Servicos Criticos

- `NavigationAccessService`: avalia regras de acesso e autorizacao de visitante.
- `NavigationRoutingService`: chama access-check, resolve destino efetivo e calcula menor caminho.
- `NavigationInstructionsService`: transforma nodes/edges em passos.
- `deriveNavigationProgress`: deriva estado de progresso no mobile a partir de `activeRoute`.
- `recalculateActiveRouteFromBeacon`: recalcula rota ativa quando um beacon conhecido informa nova origem.
- `indoorLocationService`: provider atual simulado e contrato para provider futuro.
- `handleIndoorLocationDetection`: normaliza deteccao, chama `/beacons/detect` e preserva rota quando a deteccao nao e confiavel.

## Regras Arquiteturais

- `access-check` e central.
- `route-preview` chama `access-check`.
- Mobile nao deve recriar regras de acesso do backend.
- `activeRoute` e a fonte da rota atual no mobile.
- `navigationProgress` e derivado, nao fonte primaria.
- Scanner nao escolhe rota.
- Dijkstra nao conhece BLE.
- Hardware nao deve apontar direto para `NavigationNode` sem resolucao via backend/dados cadastrados.

## Backlog P0 Antes de Piloto Real

- Implementar e validar BLE real em aparelho fisico.
- Validar permissoes Android/iOS.
- Medir RSSI real.
- Calibrar thresholds/hysteresis com dados reais.
- Levantar planta real e pontos fisicos.
- Validar o grafo com equipe/hospital.
- Definir procedimento de seguranca operacional para piloto.

## Backlog P1 Produto

- Melhorar mapa com base em planta real.
- Enriquecer metricas operacionais reais.
- Acessibilidade mais rica.
- Tratar `preferElevator` como preferencia de peso quando houver alternativas reais.
- Melhorar observabilidade do backend e painel.
- Revisar fallback offline para separar claramente demo de producao.

## Backlog P2 Futuro

- AR.
- Voz operacional completa.
- Direcao geometrica mais avancada.
- Analytics avancados.
- Algoritmos alternativos como A* apenas se houver necessidade comprovada.

## Dividas Tecnicas e Riscos

- `package.json#prisma` tera deprecacao no Prisma 7.
- Mode3D e pseudo-3D, nao AR nem render 3D fisico validado.
- Coordenadas `x`/`y` sao abstratas.
- `surgery-center` esta isolado.
- Heatmap/metricas do painel podem usar dados locais/fallback.
- `mobile/src/data/routes.js` ainda existe como fallback.
- Rate limiting nao esta implementado no backend atual.
- BLE real e MBM02 fisico ainda nao foram validados.
- Planta hospitalar real nao foi importada.
