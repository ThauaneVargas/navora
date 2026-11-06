# Casos de teste — apresentação ao hospital (06/11/2026)

Para rodar **no celular que vai ser usado na apresentação**, contra a produção (servidor no Render, banco no Neon e painel em https://navora-nine.vercel.app). Marque ✅ ou ❌ em cada caso. Se um caso falhar, use o plano B dele.

Situação conferida em 06/11: servidor no ar, painel apontando para o servidor certo e destinos carregando do banco. **O servidor levou 51 s para acordar.**

---

## Parte A — Preparação (30 min antes)

| # | O que fazer | Resultado esperado | ✅/❌ |
|---|---|---|---|
| A1 | Abrir o painel no notebook e entrar como **recepção** | Entra em até 1 min (servidor acordando). Se aparecer "Não foi possível conectar", espere 30 s e tente de novo | |
| A2 | **Deixar o painel aberto e logado** até o fim da apresentação | O painel busca dados a cada 15 s, e isso mantém o servidor acordado. Se fechar, o servidor dorme depois de 15 min e o próximo uso demora ~50 s | |
| A3 | Celular: internet móvel (4G/5G) ligada, bateria acima de 50% | O Wi-Fi do hospital pode bloquear o app. Prefira o 4G ou o roteador do seu celular | |
| A4 | Celular: já entrar no app com a **conta de paciente de demonstração** | Chega na tela inicial sem pedir login durante a apresentação | |
| A5 | Ter uma 2ª conta de teste (visitante) com a senha anotada | Para o caso do visitante sem precisar criar conta na frente de todos | |
| A6 | Trocar a senha do admin (apareceu num print) e não digitar senha com a tela projetada | — | |
| A7 | Ajustar brilho no máximo, desligar notificações (modo "Não perturbe") | Nada aparece por cima do app | |

---

## Parte B — App do paciente

| # | Caso | Passos | Resultado esperado | ✅/❌ | Plano B |
|---|---|---|---|---|---|
| CTA-01 | Abertura | Fechar e abrir o app | Abertura com o pino e tela inicial em até ~4 s, já logado | | Se pedir login, entrar com a conta de demonstração |
| CTA-02 | Buscar destino | Tela inicial → busca → "Tomografia" | Destino aparece na lista com distância e tempo | | Buscar "Banheiro" |
| CTA-03 | Rota no mapa | Escolher o destino → **Iniciar rota** | Mapa com o caminho e as instruções passo a passo | | — |
| CTA-04 | Rota com acessibilidade | Perfil → Acessibilidade → ligar **cadeira de rodas** → pedir a mesma rota | Rota sem escada (usa elevador ou rampa) | | Explicar verbalmente o recurso |
| CTA-05 | Como chegar ao hospital | Ajuda → "Como chegar ao hospital" | Abre Google Maps ou Waze com o endereço | | — |
| CTA-06 | Estou perdido | Ajuda → "Estou perdido" | Mostra onde a pessoa está e opções para voltar à recepção | | — |
| CTA-07 | Assistente | Abrir o assistente e digitar as frases abaixo | Respostas com o destino certo e um botão de rota | | Usar só as frases da lista |
| CTA-08 | Idioma | Configurações → Idioma → **English** → voltar para Português | Textos mudam na hora | | — |
| CTA-09 | Sem beacon | Bluetooth **desligado**, usar o app | Nada trava; a localização pode ser escolhida à mão | | — |

**Frases do assistente que os testes automáticos garantem:**
- "onde fica o banheiro?"
- "onde fica a tomografia"
- "onde tiro sangue"
- "tenho tomografia marcada"
- "onde é a recepção"
- "estou perdido"
- "tem elevador?"
- "como chego no hospital"
- "estou com dor no peito" → deve sugerir o SOS (bom para mostrar)

Evite perguntas fora do hospital ("qual a capital da França?"). O assistente responde que não sabe; é o comportamento certo, mas não impressiona.

---

## Parte C — SOS e ajuda (celular + painel juntos)

| # | Caso | Passos | Resultado esperado | ✅/❌ | Plano B |
|---|---|---|---|---|---|
| CTA-10 | SOS chega ao painel | Celular: Ajuda → **SOS** → confirmar. **Não mexer no painel** | Chamado aparece no painel da recepção em até ~15 s, com nome, local e contato de emergência | | Clicar em "Atualizar dados" no painel |
| CTA-11 | Recepção atende o SOS | Painel: no chamado → **Aceitar** → **Em atendimento** → **Encerrar** | Status muda no painel a cada clique | | — |
| CTA-12 | Pedido de ajuda chega ao painel | Celular: Ajuda → **Preciso de ajuda** → escolher o motivo → enviar | Chamado aparece no painel em até ~15 s | | — |
| CTA-13 | Falar com a recepção | Celular: Ajuda → **Falar com a recepção** | **Versão nova:** pergunta "Ligar para a recepção" ((24) 2471-8381) ou "Pedir que venham até mim" (cria chamado e abre o andamento). **Versão atual:** só cria um chamado no painel | | — |

| CTA-13b | Andamento no celular (**só versão nova**) | Depois de CTA-12 ou CTA-13, no painel clicar **Aceitar** → **Em atendimento** → **Encerrar** | O celular abre sozinho a tela de andamento e cada passo marca em poucos segundos | | Mostrar no painel |

⚠️ **Só com a versão nova** (PR #1 na produção + APK novo): o andamento no celular e o botão de ligar para a recepção. Com a versão atual, mostre o chamado chegando no **painel** e diga que o acompanhamento no celular entra na próxima versão.

---

## Parte D — Visitante

| # | Caso | Passos | Resultado esperado | ✅/❌ | Plano B |
|---|---|---|---|---|---|
| CTA-14 | Pedido de visita chega | Entrar com a conta de visitante → pedir acesso a um setor (ex.: internação) | Pedido aparece no painel → Visitantes, com nome e setor | | — |
| CTA-15 | Recepção aprova | Painel → no pedido → **Aprovar** | Painel marca como aprovado | | — |
| CTA-16 | Celular recebe a aprovação | Esperar até 10 s no celular | Celular mostra "Autorização confirmada" e libera a rota | | **Teste antes. Se falhar, não demonstrar esta parte**: mostre a aprovação no painel e diga que o aviso no celular está em ajuste |

⚠️ CTA-16 foi relatado com problema em 05/11 (o painel aprova, mas o celular não atualiza). Testado em 06/11 com o servidor da versão nova: aprovação salva e o app recebe "aprovado". Sem o código do pedido (APK de antes de 23/10) o servidor responde 404 e o celular fica esperando para sempre → precisa do APK novo. O painel também mostrava "autorizado" quando a chamada falhava sem ter salvo nada; corrigido na versão nova (agora mostra erro).

---

## Parte E — Painel (admin)

| # | Caso | Passos | Resultado esperado | ✅/❌ | Plano B |
|---|---|---|---|---|---|
| CTA-17 | Dashboard | Entrar como admin → Dashboard | Contadores e chamados recentes com dados reais | | — |
| CTA-18 | Mapa de calor | Menu → Mapa de calor → "Atualizar dados" | Mapa com os setores e o horário atualizado | | — |
| CTA-19 | Beacons | Menu → Beacons | Lista FSC-01/02/10/11 com status | | — |

---

## Não demonstrar hoje

Funciona só na versão nova (PR #1), que ainda não está na produção:
- **"Esqueci minha senha"**: o envio de e-mail não está configurado.
- **Cadastrar funcionário** no painel: na versão atual o formulário falha.
- **Andamento do chamado no celular**, som de alerta do SOS no painel e selo "Sem conta".
- **SOS sem internet**: dependendo da versão do APK, pode dizer "enviado" sem ter enviado.

## Se algo der errado na hora

- **Tudo lento ou "não foi possível conectar":** o servidor dormiu. Espere 1 min e tente de novo. Mantenha o painel aberto (A2) para evitar.
- **Rota não carrega sem internet:** o app tem rota de reserva no próprio celular. Continue a demonstração.
- **Celular travou:** feche e abra o app. A sessão fica salva por 30 dias.
