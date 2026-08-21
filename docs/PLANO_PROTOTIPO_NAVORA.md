# Plano do Prototipo Navora

## Base decidida

- React Native com Expo no mobile.
- React/Vite no painel web interno.
- NestJS/TypeScript no backend principal do produto.
- FastAPI mantido como referencia da primeira versao.
- Dados simulados como fallback de demonstracao.
- Sem Flutter nesta versao.

## Escopo de pre-venda

### Mobile

- Paciente.
- Visitante.

O mobile nao deve expor telas de recepcao/admin para o usuario final.

### Painel interno

- Recepcao.
- Administracao.

O painel interno administra SOS, pedidos de ajuda, visitantes, liberacao de acesso, check-ins, beacons, setores, mensagens e relatorios.

## Fluxo para apresentacao

```txt
Splash
-> Escolha de entrada
-> Paciente ou Visitante
-> Home / Entrada do visitante
-> Busca de destino
-> Rota 2D
-> Ajuda/SOS ou solicitacao de acesso
-> Recepcao acompanha e responde no painel
-> Admin acompanha indicadores, beacons e relatorios
```

## Fluxo do visitante

```txt
Visitante escolhe area
-> Informa motivo e destino
-> Se destino for restrito, app cria solicitacao
-> Recepcao autoriza, nega ou orienta ate recepcao correta
-> Visitante atualiza status no app
-> Se autorizado, segue pela rota liberada
```

## Proximas fases

- Conectar backend NestJS ao PostgreSQL via Prisma.
- Testar fluxo ponta a ponta com backend NestJS ativo.
- Substituir repositorio em memoria por persistencia real.
- Integrar beacon MBM04 real.
- Adicionar IA real por voz.
- Evoluir 3D/AR real depois da venda inicial.
