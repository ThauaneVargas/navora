# Navora — LGPD e segurança

Atualizado em 22/10/2026. Este documento descreve **o que o sistema faz hoje** com dados pessoais e **o que ainda falta** para operar com pacientes reais. Não é parecer jurídico: os itens marcados como "decisão" precisam de validação com o hospital e, de preferência, com um advogado.

## 1. Que dados existem e onde

| Dado | Quem informa | Onde fica | Sensível? |
|---|---|---|---|
| Nome, e-mail, telefone | paciente (cadastro) | `users` | não |
| Senha | paciente | `users.password_hash` (bcrypt, nunca em texto) | — |
| Data de nascimento, CPF (`patient_code`) | paciente, opcional | `patient_profiles` | não (mas é identificador forte) |
| Acessibilidade (cadeirante, deficiência visual/auditiva, acompanhante…) | paciente | `patient_profiles.accessibility` | **sim — saúde (art. 5º, II)** |
| Observações (alergias, restrições) | paciente | `patient_profiles.notes` | **sim — saúde** |
| Contato de emergência | paciente | `patient_profiles.emergency_contact` e em cada chamado | dado de terceiro |
| Consentimento (data + versão da política) | sistema | `patient_profiles.privacy_consent_at` / `privacy_policy_version` | — |
| Pedidos de ajuda / SOS (nome, local, contato de emergência) | paciente ou visitante | `call_requests` | pode revelar saúde |
| Pedido de visita (nome do visitante, destino, motivo) | visitante, sem conta | `visitor_access_requests` | pode revelar internação de terceiro |
| Check-ins (nome, documento, observações) | recepção | `check_ins` | pode conter saúde |
| Localização interna | beacon Bluetooth | **não é guardada** por pessoa — o servidor só registra que o beacon foi visto (`beacons.last_signal_at`) | — |
| GPS ("Como chegar") | celular | só no aparelho, enquanto a tela está aberta | — |
| Foto de perfil | paciente | só no aparelho (`profilePhotoService`) | — |

Hospedagem: Render (backend e Postgres), região **Oregon, EUA** (confirmado no painel em 23/10 — o `backend-nest/render.yaml` diz `ohio`, mas os serviços reais foram criados em Oregon). Isso é **transferência internacional** (art. 33) — está informado na política do app; ver "decisões" abaixo.

## 2. O que já está implementado

**Consentimento (art. 7º, I e art. 11, I)**
- Cadastro de paciente só cria conta com aceite explícito: caixa de seleção no fim do cadastro (`PatientRegisterScreen.js`), com a política legível ali mesmo. O backend recusa (`400`) cadastro sem `acceptedPrivacyPolicy: true` e grava data e versão aceita.
- Texto da política em um único arquivo: `mobile/src/data/privacyPolicy.js` (`PRIVACY_POLICY_VERSION`). Ao mudar o conteúdo, trocar a versão.

**Transparência (art. 6º, VI e art. 9º)**
- Tela Privacidade reescrita em 22/10. A versão anterior afirmava coisas falsas: "beacons Wi-Fi" (são Bluetooth), "dados armazenados de forma criptografada no servidor" (não há criptografia própria em repouso), um e-mail `privacidade@navora.com.br` que não existe, e "histórico salvo no dispositivo" (a tela de histórico é só exemplo).
- Visitante (sem conta) vê um aviso antes de enviar o pedido de visita.

**Direitos do titular (art. 18)**
- Acesso e correção: "Meu perfil" (já existia, `PUT /patients/me`).
- Eliminação e revogação do consentimento: botão **Excluir minha conta** na tela Privacidade → `DELETE /patients/me` (pede a senha de novo). Apaga `users`, `patient_profiles`, `notifications`; desliga `check_ins` da conta. Chamados de SOS/ajuda já feitos **ficam** (registro de atendimento do hospital) — está dito na política.

**Segurança (art. 46) — corrigido em 22/10**
- **Login Google aceitava token de qualquer app** (não conferia o `aud`): um app de terceiro em que a pessoa entrou com Google podia reusar o token e entrar no Navora como ela. Agora só aceita token emitido para os IDs em `GOOGLE_CLIENT_IDS`; sem essa variável, o login Google fica desligado (o app ainda não usa).
- **Pedido de visita era público por id sequencial**: `GET /visitor-access/1, 2, 3…` mostrava nome e motivo de qualquer visita. Agora o criar devolve um código secreto (`access_token`, guardado só como hash SHA-256) e a leitura exige o header `X-Visitor-Token` ou JWT de recepção/admin. Sem isso, `404` (não revela quais ids existem).
- **Código de troca de senha** era guardado em texto e impresso no log também em produção. Agora o banco guarda só o hash e o log só mostra o código fora de produção.
- **Contas de demonstração**: o seed recusa rodar em banco que não seja local sem `SEED_DEMO_PASSWORD`; com ela, também troca a senha das contas demo existentes.
- Já existiam: senha com bcrypt, JWT com expiração (8 h), `helmet`, limite de tentativas de login (5/min), CORS restrito, validação com `whitelist` + `forbidNonWhitelisted`, token do app no `SecureStore` do celular, BLE só com o app aberto e sem localização em segundo plano.

## 3. Pendências — o que fazer antes de paciente real

**Produção (precisa do merge desta branch)**
1. Fazer o merge → as migrations `add_visitor_access_token` e `add_patient_privacy_consent` rodam sozinhas no deploy.
2. **Trocar a senha das contas demo em produção**: rodar o seed contra a produção com `SEED_DEMO_PASSWORD=<senha forte>` — ou apagar `paciente@`, `recepcao@`, `admin@navora.com` e criar contas reais da equipe (`POST /auth/register-staff`).
3. No painel do Render: tirar a regra de acesso `0.0.0.0/0` do banco `navora-db-2` e apagar o `navora-db` antigo.
4. Trocar o `JWT_SECRET` de produção e a senha do banco (já circularam em conversas/prints).

**Decisões (com o hospital / jurídico)**
- **Papéis**: em geral o hospital é o **controlador** (decide para que os dados servem) e o Navora é o **operador**. Isso precisa estar num contrato entre os dois.
- **Encarregado (DPO)** e um canal de contato de privacidade de verdade (e-mail). Hoje a política manda falar com a recepção.
- **Transferência internacional**: manter servidor nos EUA (exige cláusulas contratuais/consentimento específico) ou migrar para região no Brasil (ex.: AWS São Paulo, Azure Brazil South) — junto da decisão de hospedagem paga.
- **Prazo de guarda**: quanto tempo manter pedidos de visita, chamados e check-ins. Sugestão: apagar pedidos de visita após 30 dias e anonimizar chamados após o prazo que o hospital exigir. Hoje nada é apagado automaticamente.
- **Termos de uso** (além da política).

**Melhorias técnicas (sem pressa)**
- Envio de e-mail para "Esqueci minha senha" (hoje o código não chega ao usuário em produção).
- Registro de auditoria: quem da equipe viu/alterou o quê.
- Backup do banco e plano de resposta a incidente (art. 48: comunicar ANPD e titulares).
- Exportar os dados do paciente num arquivo (portabilidade, art. 18, V).
- O backend antigo `backend/` (Python) não é usado — apagar para não ser publicado por engano.
