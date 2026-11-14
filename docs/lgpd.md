# Navora — LGPD e segurança

Atualizado em 07/11/2026 (separação por hospital, auditoria, prazo de guarda, baixar dados). Antes: 29/10/2026 (cadastro mínimo e login obrigatório). Este documento descreve **o que o sistema faz hoje** com dados pessoais e **o que ainda falta** para operar com pacientes reais. Não é parecer jurídico: os itens marcados como "decisão" precisam de validação com o hospital e, de preferência, com um advogado.

## 1. Que dados existem e onde

| Dado | Quem informa | Onde fica | Sensível? |
|---|---|---|---|
| Nome, e-mail, telefone (obrigatórios) | paciente/visitante (cadastro — mesma conta) | `users` | não |
| Senha | paciente | `users.password_hash` (bcrypt, nunca em texto) | — |
| ~~Data de nascimento, CPF, observações (alergias)~~ | — | **removidos em 29/10**, inclusive o que já estava gravado (migration `20261029170000_remove_unused_personal_data`) | — |
| Acessibilidade (cadeirante, deficiência visual/auditiva, acompanhante…) — opcional | paciente | `patient_profiles.accessibility` | **sim — saúde (art. 5º, II)** |
| Contato de emergência (telefone) — opcional | paciente | `patient_profiles.emergency_contact` e em cada chamado | dado de terceiro |
| Consentimento (data + versão da política) | sistema | `patient_profiles.privacy_consent_at` / `privacy_policy_version` | — |
| Pedidos de ajuda / SOS (nome, local, telefone, contato de emergência, se precisa de cadeira/maca) — **só com login** desde 29/10, ligado à conta (`call_requests.user_id`). Não pergunta mais "o que está acontecendo" | paciente ou visitante | `call_requests` | pode revelar saúde |
| Pedido de visita (nome do visitante, destino, motivo) — **só com login** desde 29/10 | visitante (mesma conta do paciente) | `visitor_access_requests` | pode revelar internação de terceiro |
| Check-ins (nome, documento, observações) | recepção | `check_ins` | pode conter saúde |
| Localização interna | beacon Bluetooth | **não é guardada** por pessoa — o servidor só registra que o beacon foi visto (`beacons.last_signal_at`) | — |
| GPS ("Como chegar") | celular | só no aparelho, enquanto a tela está aberta | — |
| Foto de perfil | paciente | só no aparelho (`profilePhotoService`) | — |
| ~~Dados do visitante guardados no celular ("Lembrar meus dados")~~ | — | **removido em 29/10** (o visitante tem conta); o app apaga o que restou no aparelho ao abrir | — |
| Histórico de rotas (destinos iniciados) | sistema | só no aparelho (`routeHistoryStorage`), últimas 12; "Sair" apaga — o destino pode revelar saúde | pode revelar saúde |
| Visita em andamento (pedido + código secreto) | sistema | só no aparelho, até a visita terminar/expirar/ser negada (ou 24 h sem resposta); "Sair" apaga | — |

Hospedagem (desde 03/11): API no Render e banco no **Neon** (criptografado em disco), ambos em **Oregon, EUA**. Histórico: antes o Postgres também era do Render, região **Oregon, EUA** (confirmado no painel em 23/10 — o `backend-nest/render.yaml` diz `ohio`, mas os serviços reais foram criados em Oregon). Isso é **transferência internacional** (art. 33) — está informado na política do app; ver "decisões" abaixo.

## 2. O que já está implementado

**Separação por hospital, auditoria e prazo de guarda (07/11) — detalhes no item 29 de `docs/historico.md`**
- Cada hospital tem um `id`; chamados, visitas, check-ins, mensagens e todo o mapa pertencem a um hospital. A equipe só enxerga o hospital da própria conta (o header `X-Hospital` é ignorado para ela). Paciente usa a mesma conta em qualquer hospital.
- `audit_logs`: quem da equipe fez/abriu o quê, quando e de qual IP — sem dado pessoal no registro, e o banco não deixa editar (art. 37).
- Prazo de guarda automático em produção: visita apagada em 30 dias; chamado/check-in anonimizado em 180; notificação apagada em 90; auditoria em 5 anos (art. 15/16). Prazos mudam por variável de ambiente — **se o hospital definir outro prazo, mudar a env e a política juntas.**
- Baixar meus dados (art. 18, V): botão na tela Privacidade → JSON com conta, perfil, chamados, check-ins e notificações.
- Painel com cabeçalhos de segurança (CSP, HSTS, anti-iframe) no `web-admin/vercel.json`.

**Consentimento (art. 7º, I e art. 11, I)**
- Cadastro de paciente só cria conta com aceite explícito: caixa de seleção no fim do cadastro (`PatientRegisterScreen.js`), com a política legível ali mesmo. O backend recusa (`400`) cadastro sem `acceptedPrivacyPolicy: true` e grava data e versão aceita.
- Texto da política em um único arquivo: `mobile/src/data/privacyPolicy.js` (`PRIVACY_POLICY_VERSION`). Ao mudar o conteúdo, trocar a versão.

**Transparência (art. 6º, VI e art. 9º)**
- Tela Privacidade reescrita em 22/10. A versão anterior afirmava coisas falsas: "beacons Wi-Fi" (são Bluetooth), "dados armazenados de forma criptografada no servidor" (não há criptografia própria em repouso), um e-mail `privacidade@navora.com.br` que não existe, e "histórico salvo no dispositivo" (a tela de histórico é só exemplo).
- Visitante vê um aviso antes de enviar o pedido de visita.
- **Minimização (art. 6º, III), 29/10:** cadastro só com nome, e-mail, telefone e senha; contato de emergência e acessibilidade opcionais. CPF, nascimento, observações (alergias) e "o que está acontecendo" no SOS saíram do app e do banco (o que estava gravado foi apagado pela migration).
- **Base legal com login obrigatório:** como todo SOS/pedido agora vem de uma conta que aceitou a política, o consentimento cobre o dado de saúde (acessibilidade) que vai junto. Risco aceito pela usuária: quem não tem conta (ou está com a sessão vencida) não manda SOS pelo app — o app oferece "Ligar para a recepção" (falta o número do hospital) e manda entrar de novo.

**Direitos do titular (art. 18)**
- Acesso e correção: "Meu perfil" (já existia, `PUT /patients/me`).
- Eliminação também pela web, sem o app: `excluir-conta.html` (servida com o painel; e-mail + senha; exigência do Google Play), desde 29/10.
- Eliminação e revogação do consentimento: botão **Excluir minha conta** na tela Privacidade → `DELETE /patients/me` (pede a senha de novo). Apaga `users`, `patient_profiles`, `notifications`; desliga `check_ins` da conta. Chamados de SOS/ajuda já feitos **ficam** (registro de atendimento do hospital) — está dito na política.

**Segurança (art. 46) — corrigido em 22/10**
- **Login Google aceitava token de qualquer app** (não conferia o `aud`): um app de terceiro em que a pessoa entrou com Google podia reusar o token e entrar no Navora como ela. Agora só aceita token emitido para os IDs em `GOOGLE_CLIENT_IDS`; sem essa variável, o login Google fica desligado (o app ainda não usa).
- **Pedido de visita era público por id sequencial**: `GET /visitor-access/1, 2, 3…` mostrava nome e motivo de qualquer visita. Agora o criar devolve um código secreto (`access_token`, guardado só como hash SHA-256) e a leitura exige o header `X-Visitor-Token` ou JWT de recepção/admin. Sem isso, `404` (não revela quais ids existem).
- **Código de troca de senha** era guardado em texto e impresso no log também em produção. Agora o banco guarda só o hash e o log só mostra o código fora de produção.
- **Contas de demonstração**: o seed recusa rodar em banco que não seja local sem `SEED_DEMO_PASSWORD`; com ela, também troca a senha das contas demo existentes.
- Já existiam: senha com bcrypt, JWT com expiração (8 h), `helmet`, limite de tentativas de login (5/min), CORS restrito, validação com `whitelist` + `forbidNonWhitelisted`, token do app no `SecureStore` do celular, BLE só com o app aberto e sem localização em segundo plano.

## 3. Pendências — o que fazer antes de paciente real

**Produção (precisa do merge desta branch)**
1. ~~Fazer o merge~~ **Feito em 23/10** — migrations aplicadas no deploy.
2. ~~Trocar a senha das contas demo em produção~~ **Feito em 23/10** (senhas novas, só direto no banco — não estão no repositório; a usuária guarda). A `navora-demo-123` continua valendo só no banco local.
3. ~~Tirar a regra `0.0.0.0/0` do banco~~ **Feito em 23/10** — testado: conexão de fora é recusada, o backend continua acessando pela rede interna. (O `navora-db` antigo já não existia.) Para rodar script contra produção de novo, liberar temporariamente só o IP da máquina.
4. Trocar o `JWT_SECRET` de produção e a senha do banco (já circularam em conversas/prints).

**Decisões (com o hospital / jurídico)**
- **Papéis**: em geral o hospital é o **controlador** (decide para que os dados servem) e o Navora é o **operador**. Isso precisa estar num contrato entre os dois.
- **Encarregado (DPO)** e um canal de contato de privacidade de verdade (e-mail). Hoje a política manda falar com a recepção.
- **Transferência internacional**: manter servidor nos EUA (exige cláusulas contratuais/consentimento específico) ou migrar para região no Brasil (ex.: AWS São Paulo, Azure Brazil South) — junto da decisão de hospedagem paga.
- **Prazo de guarda**: implementado em 07/11 com padrões sugeridos (30/180/90 dias, auditoria 5 anos). Falta o hospital confirmar os prazos — prontuário/registro de atendimento pode ter prazo legal próprio.
- **RIPD** (relatório de impacto): hospital costuma pedir quando há dado de saúde.
- **Plano de incidente** (art. 48): a ANPD pede comunicação em até 3 dias úteis.
- **Termos de uso** (além da política).

**Melhorias técnicas (sem pressa)**
- Envio de e-mail para "Esqueci minha senha" (hoje o código não chega ao usuário em produção).
- ~~Registro de auditoria~~ **feito em 07/11** (`audit_logs`).
- Backup do banco (o Neon grátis guarda pouco histórico de restauração; aumentar no plano pago).
- ~~Exportar os dados do paciente~~ **feito em 07/11** (`GET /patients/me/export`).
- Criptografia de campo (documento do check-in, contato de emergência, acessibilidade) — maior, para quando houver contrato.
- 2FA (código de aplicativo autenticador) para administradores do painel.
- O backend antigo `backend/` (Python) não é usado — apagar para não ser publicado por engano.
