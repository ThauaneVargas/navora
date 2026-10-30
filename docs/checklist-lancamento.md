# Navora — checklist para sair do papel

Criado em 29/10/2026. Marque `[x]` conforme for fazendo. Quem faz: **(você)**, **(hospital)**, **(Claude)** — o que está com Claude pode ser pedido a qualquer momento.
Custos: calculadora em https://claude.ai/artifact/AvwkdZvAL9EHcHLVhMwAAs. Decisões já tomadas (não reabrir sem motivo): servidor próprio NestJS + PostgreSQL, sem Firebase; login obrigatório; cadastro mínimo.

---

## 1. Banco de dados e hospedagem — recomendação

**Banco: continuar no PostgreSQL.** É o certo para o Navora: dados relacionais (contas, chamados, regras de acesso, grafo de rotas), transações seguras, maduro e usado em sistemas de saúde. O que deixa um banco *seguro* não é a marca, é **como ele é hospedado e cuidado**:

- [ ] Banco **gerenciado e pago** (o grátis não tem backup e expira — o atual expira **19/11/2026**).
- [ ] **Backup automático diário + restauração para um momento exato** (PITR) — conferir se o plano escolhido inclui.
- [ ] **Testar uma restauração** de verdade uma vez (backup que nunca foi restaurado não é garantia).
- [ ] Criptografia em repouso (os provedores gerenciados já fazem) e conexão só com TLS.
- [ ] **Sem acesso pela internet** (hoje já está fechado — manter) — o servidor fala com o banco pela rede interna.
- [ ] Senha forte do banco, trocada (a atual circulou em conversa).

**Onde hospedar:**

| Situação | Servidor (API) | Banco | Painel web | Observação |
|---|---|---|---|---|
| **Piloto, dados podem ficar fora do Brasil** (recomendado para começar) | Render, plano pago (não dorme) | Render Postgres pago | Render, site estático (grátis) | Já é o que roda hoje; menos trabalho. Região EUA = transferência internacional (LGPD art. 33): já está na política, precisa estar no contrato com o hospital. |
| **Hospital exige dados no Brasil** | Fly.io, região São Paulo | Supabase Pro, região São Paulo | Render ou Cloudflare Pages (grátis) | Decidido em 29/10 como plano B. Exige migrar o banco (Claude faz o roteiro). |
| **Hospital tem TI e contrato de nuvem próprio** | Na nuvem dele (AWS, Azure ou Google, região São Paulo) | Banco gerenciado da mesma nuvem | Idem | Mais caro e mais trabalhoso; só se o hospital pedir. |

- [ ] **Perguntar ao hospital: os dados precisam ficar no Brasil?** (define a linha da tabela) **(hospital)**
- [ ] **Até 19/11/2026:** contratar servidor e banco pagos **(você)** — procedimento de troca do banco em `docs/arquitetura.md` §7 (skill `/recriar-banco`).
- [ ] Tirar o painel da Vercel (o plano grátis proíbe uso comercial) → site estático no Render **(você + Claude)**.
- [ ] **Domínio próprio** (ex.: `navora.com.br`, no Registro.br): links fixos para API, painel, política e exclusão de conta. Trocar de hospedagem depois não quebra os links cadastrados nas lojas **(você)**.
- [x] Corrigir `backend-nest/render.yaml` (região Oregon, nome do banco `navora-db-2`, `healthCheckPath`) — 29/10. Falta trocar `plan` quando contratar **(Claude)**.

---

## 2. Antes do piloto — obrigatório

**Servidor e produção**
- [ ] Revisar e juntar o PR #1 (`fix/seguranca-entrega` → `main`). Lembrar: a migration apaga CPF/nascimento/observações do banco de produção (sem volta) **(você)**.
- [ ] Trocar `JWT_SECRET` (botão "Generate" no Render) e a senha do banco **(você)**.
- [ ] Configurar e-mail do "Esqueci minha senha": `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` (Gmail com "senha de app" serve para o piloto; tem limite diário de envio) **(você)**. Sem isso, quem esquece a senha fica sem o app — inclusive sem SOS.
- [ ] Monitor externo grátis (UptimeRobot ou Better Stack) avisando por e-mail/celular se a produção cair — ela já ficou 10 dias fora sem ninguém ver **(você)**.
- [x] `/health` consulta o banco: responde 503 se o banco cair — 29/10. Use `https://<api>/health` no monitor.
- [ ] Testar produção com a skill `/checar-producao` depois de cada deploy **(Claude)**.

**Contas e acessos**
- [ ] Verificação em 2 etapas (2FA) em: GitHub, Render, Expo, Google Cloud, Google Play, Apple, e-mail usado no SMTP **(você)**.
- [ ] Proteger a branch `main` no GitHub (push na `main` = deploy de produção): exigir PR **(você)**.
- [x] Testes automáticos no GitHub a cada PR (`.github/workflows/ci.yml`) e alertas de dependência (`.github/dependabot.yml`) — criados em 29/10.
- [ ] Ligar no GitHub: Settings › Code security › **Dependabot alerts** e **Dependabot security updates**; e na proteção da `main`, exigir o CI passando **(você)**.
- [ ] Restringir a chave do Google Maps no Google Cloud ao app `com.navora.app` + SHA-1 da assinatura (ela está aberta no repositório) **(você)**.
- [ ] Contas individuais para cada pessoa da recepção (nunca senha compartilhada); desativar quem sair **(hospital + você no painel)**.

**Dados do hospital**
- [ ] Telefones das recepções Private e SUS → `eas.json` (perfil `production`) **(hospital → Claude)**. Sem eles, some o botão "Ligar para a recepção" — que é o plano B do SOS.
- [ ] Conferir com o hospital nomes de setores, salas, andares e rotas do mapa (dados reais, não de exemplo) **(hospital + você)**.
- [ ] Autorização por escrito para usar os nomes "HMC Private" / "Hospital Marco Capute" e as fotos **(hospital)**.

**Operação do SOS (sem isso o SOS não serve)**
- [ ] Definir **um computador fixo na recepção** com o painel sempre aberto, som ligado (clicar uma vez na página libera o alerta sonoro) e sem entrar em descanso de tela **(hospital)**.
- [ ] Combinar quem atende o SOS em cada turno e em quanto tempo **(hospital)**.
- [x] Guia de 1 página: `docs/guia-recepcao.md` (29/10) — preencher endereço do painel e responsável técnico e imprimir.
- [ ] Treinar a recepção no painel com o guia **(hospital)**.
- [ ] Teste de SOS ponta a ponta no hospital (celular → painel → "Equipe a caminho" aparece no celular) **(você)**.

**Testes no celular (Android)** — APK de produção pelo EAS (`/build-apk`)
- [ ] Cadastro mínimo (com e sem contato de emergência), login como Paciente e como Visitante.
- [ ] Pedido de visita → aprovar no painel → visitante recebe.
- [ ] SOS e "Preciso de ajuda": chegam no painel, andamento aparece no celular.
- [ ] Esqueci a senha (com SMTP ligado), editar perfil, excluir conta (no app e em `excluir-conta.html`).
- [ ] Teclado não cobre nenhum campo; textos em pt/en/es; tema claro.
- [ ] Sem internet: SOS avisa que não foi e oferece tentar de novo/ligar.
- [ ] Beacons: calibrar no local (`measuredPower`, `BEACON_STABILITY`), "Localização inicial" (CTM-13/14) **(você, no hospital)**.

---

## 3. LGPD e jurídico

- [ ] Contrato hospital (controlador) × Navora (operador), incluindo onde ficam os dados **(você + hospital, idealmente com advogado)**.
- [ ] Encarregado de dados (DPO) e um e-mail de privacidade de verdade — hoje a política manda falar com a recepção **(hospital)**.
- [ ] Relatório de Impacto à Proteção de Dados (RIPD) — recomendado para dado de saúde **(hospital/advogado; Claude rascunha)**.
- [ ] Termos de uso (além da política) **(Claude rascunha, advogado revisa)**.
- [ ] Prazo de guarda: apagar pedidos de visita depois de X dias e anonimizar chamados depois do prazo que o hospital definir — rotina automática **(hospital decide o prazo, Claude implementa)**.
- [ ] Citar na política o provedor de e-mail (Gmail/Google recebe o e-mail de quem pede "Esqueci minha senha") **(Claude)**.
- [ ] Registro de auditoria: quem da equipe viu/alterou o quê **(Claude, depois do piloto)**.
- [ ] Plano de incidente (vazamento): quem avisa, em quanto tempo, ANPD e pacientes (art. 48) **(você + hospital; Claude rascunha)**.

---

## 4. Distribuição

**Piloto Android por APK (mais rápido)**
- [ ] `npx eas-cli login` + `npx eas-cli build -p android --profile apk` **(você)**; guardar cópia da chave (`npx eas-cli credentials`).
- [x] Página de download com instruções: `web-admin/public/baixar.html` (29/10).
- [ ] Colar o link do APK no `navora-apk-url` da página e gerar o QR: `npm run qr-download -- https://<painel>/baixar.html` (no `web-admin`) **(você ou Claude, quando houver o link)**.

**Google Play**
- [ ] Conta de desenvolvedor — de **organização** (do hospital) evita o teste fechado de 12 testadores por 14 dias exigido de conta pessoal; conferir se app de saúde exige conta de organização **(hospital/você)**.
- [ ] Ficha: ícone 512×512, imagem 1024×500, prints, descrição; formulário "Segurança dos dados" (acessibilidade = dado de saúde), declaração de app de saúde, classificação etária **(você; Claude escreve os textos)**.
- [ ] URLs públicas: política (`privacidade.html`) e exclusão de conta (`excluir-conta.html`) — de preferência no domínio próprio.
- [ ] Conta demo para o revisor (login é obrigatório) **(você)**.

**App Store (iPhone)**
- [ ] Conta Apple Developer de **organização** (app de saúde; regra 5.1.1(ix)) ou ficar só no TestFlight **(hospital)**.
- [ ] Testar num iPhone (nunca testado) **(você)**.
- [ ] Risco: a Apple pode reprovar app que exige login para recursos que não precisam de conta, como navegar (regra 5.1.1(v)). Se reprovar, liberar só a navegação sem login **(decisão sua)**.
- [ ] Conta demo + vídeo curto da rota para o revisor **(você)**.

---

## 5. Melhorias — depois do piloto começar

- [ ] Notificação no celular (push, Expo — grátis): "visita aprovada", "equipe a caminho" mesmo com o app fechado.
- [ ] Alerta se o painel da recepção ficar fechado/sem conexão enquanto houver SOS pendente.
- [ ] Registro de erros do app e do servidor (ex.: Sentry, plano grátis) **sem dados pessoais** nos relatórios.
- [ ] Teste de usabilidade com pacientes idosos no hospital (5 pessoas já mostram os maiores problemas); leitor de tela (TalkBack/VoiceOver).
- [ ] Seletor de andar com dados reais; mapa conferido no local.
- [ ] Voz (reconhecimento do aparelho) e, depois, IA no assistente (modelo misto, ~R$ 5/mês — decisão de 29/10).
- [ ] Ambiente de homologação (staging) separado da produção para testar antes de publicar (`docs/STAGING.md`).
- [ ] Dividir as telas gigantes (`VisitorEntryScreen`, `PatientHomeScreen`, `App.js`) quando for mexer nelas.
- [ ] Métricas do piloto para o hospital: nº de usuários, pedidos de visita, tempo de resposta do SOS (o painel já tem relatórios).
- [ ] Revisão de segurança externa (pentest) antes de expandir para outros hospitais.
