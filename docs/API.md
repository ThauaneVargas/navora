# API Principal do Navora

Base local padrao: `http://localhost:8000`.

Use `Authorization: Bearer <token>` nas rotas protegidas.

## Auth

`POST /auth/login`

Request:

```json
{ "email": "paciente@navora.com", "password": "navora-demo-123" }
```

Resposta inclui `access_token` e dados do usuario.

`GET /auth/me`

Protegido por JWT. Retorna dados do usuario autenticado.

`POST /auth/google` — `{ "idToken": "..." }`. Só aceita token cujo `aud` esteja em `GOOGLE_CLIENT_IDS` (vírgula separa vários). Sem essa variável, responde `401` (login Google desligado).

## Patients

`POST /patients/register`

Campos principais: `email`, `password`, `name`, `phone`, `patientCode`, `birthDate`, `accessibility`, `emergencyContact`, `notes`.
Obrigatórios (LGPD): `acceptedPrivacyPolicy: true` e `privacyPolicyVersion` (ex.: `"2026-10-22"`). Sem o aceite → `400`. A resposta traz `privacyConsentAt` e `privacyPolicyVersion`.

`GET /patients/me`, `PUT /patients/me`, `PUT /patients/me/accessibility`

Protegidos por JWT e role `PATIENT`.

`DELETE /patients/me` — corpo `{ "password": "..." }`. Exclui a conta do paciente (cadastro, dados de saúde, notificações). Senha errada → `401`. Ver `docs/lgpd.md`.

## Navigation

`GET /navigation/bootstrap`

Retorna areas, destinos e entradas.

`GET /navigation/destinations`

Lista destinos.

`GET /navigation/map`

Protegido para `ADMIN`/`RECEPTION`. Retorna grafo operacional.

`POST /navigation/access-check`

Request real:

```json
{
  "destination_code": "private-tomografia",
  "subject": "PATIENT",
  "current_area_code": "private",
  "current_beacon_code": "FSC-01",
  "visitor_access_request_id": 1
}
```

`destination_id` pode substituir `destination_code`. `subject` aceita `PATIENT`, `VISITOR` ou `EXTERNAL_PATIENT`.

Resposta contem `allowed`, `decision`, `reason`, `requires_authorization`, `destination`, `matched_rule`, `redirect_destination` e `visitor_authorization`.

`POST /navigation/route-preview`

Request real:

```json
{
  "origin_node_code": "private-entry",
  "destination_code": "private-tomografia",
  "subject": "PATIENT",
  "current_area_code": "private",
  "current_beacon_code": "FSC-01",
  "accessibility": {
    "wheelchair": false,
    "needsStretcher": false,
    "avoidStairs": true,
    "preferElevator": true
  }
}
```

Resposta contem `route_found`, `decision`, `redirected`, `reason`, `accessible_route_found`, `accessibility`, `origin`, `requested_destination`, `effective_destination`, `access`, `total_distance`, `estimated_time_seconds`, `nodes`, `edges` e `steps`.

## Beacons

`GET /beacons`

Protegido para `ADMIN`/`RECEPTION`. Cada beacon inclui também `hardware_model`, `ibeacon_uuid`, `ibeacon_major`, `ibeacon_minor` e `measured_power` (nulos nos beacons só simulados; `measured_power` nulo até a calibração no local).

`POST /beacons/detect`

Público (sem JWT). Duas formas de identificar o beacon:

Pelo código interno:

```json
{ "beaconCode": "FSC-01" }
```

Também aceita `beacon_code`.

Pelo pacote iBeacon lido no celular (configuração real em `docs/beacons-configuracao.md`):

```json
{ "uuid": "7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17", "major": 1, "minor": 10, "rssi": -64 }
```

- `uuid` é comparado sem diferenciar maiúsculas/minúsculas e com ou sem hífens.
- `major` e `minor`: inteiros de 0 a 65535 (fora disso, ou como texto → `400`).
- `rssi` (opcional, -127 a 20): só registrado em log, não é gravado.
- Se vierem o código e o trio, o **código tem prioridade**.

Beacon conhecido retorna `detected: true`, `beacon_code` (código interno), dados de área, `navigation_node` e `origin_node_code`. Beacon desconhecido, trio incompleto ou UUID inválido retornam `{ "detected": false }` (não é erro).

## Calls

`POST /calls`, `POST /calls/help`, `POST /calls/sos`

Campos principais: `user_type`, `user_name`, `area`, `area_name`, `patient_name`, `call_type`, `reason`, `location`, `sector`, `beacon_code`, `message`, `priority`.

`GET /calls` e `PATCH /calls/:callId/status`

Protegidos para `ADMIN`/`RECEPTION`.

## Visitor Access

`POST /visitor-access`

Campos principais: `visitor_name`, `area`, `area_name`, `entrance`, `area_id`, `entry`, `current_location`, `current_beacon`, `requested_destination`, `reason`, `accessibility`, `status`, `beacon`.

A resposta do `POST` traz `access_token` (código secreto, mostrado só uma vez; o banco guarda o hash).

`GET /visitor-access/:requestId`

O visitante lê o próprio pedido mandando o header `X-Visitor-Token: <access_token>`; recepção/admin leem com o JWT. Sem um dos dois (ou com código errado) → `404`.

`GET /visitor-access`, `PATCH /visitor-access/:requestId/approve`, `PATCH /visitor-access/:requestId/authorize`, `PATCH /visitor-access/:requestId/deny`, `PATCH /visitor-access/:requestId/status`

Protegidos para `ADMIN`/`RECEPTION`.

### Regras de acesso (29/10)

- `POST /visitor-access` sempre cria o pedido como `PENDING` (o campo `status` do corpo é ignorado). Aceita também `companions` ([{name,type}], até 10), `group_total`, `visit_code`, `assistance_request`.
- `POST /navigation/access-check` e `/navigation/route-preview`: a liberação do visitante só vale com `visitor_access_request_id` **e** `visitor_access_token` (o `access_token` devolvido ao criar o pedido).
- Sem regra cadastrada que case: visitante só acessa `public`/`visitor_allowed` (o resto pede autorização); paciente em `visitor_authorization` é orientado à recepção; destino de outra unidade (Private ↔ SUS) vira `REDIRECT_TO_RECEPTION`.

## Check-ins

`GET /check-ins`, `GET /check-ins/:checkInId`, `POST /check-ins`, `PATCH /check-ins/:checkInId/status`

Protegidos para `ADMIN`/`RECEPTION`.

Campos de criacao: `patient`, `patient_name`, `document`, `destination`, `destination_label`, `accessibility`, `observations`, `user_id`, `destination_id`, `sector_id`, `visitor_access_request_id`.

## Operational Messages

`GET /operational-messages`, `POST /operational-messages`, `PATCH /operational-messages/:messageId/read`

Protegidos para `ADMIN`/`RECEPTION`.

Campos de criacao: `to`, `recipient`, `message`, `content`, `priority`.

## Reports e Dashboard

`POST /reports/admin`

Protegido para `ADMIN`/`RECEPTION`.

`GET /dashboard/summary`

Protegido para `ADMIN`/`RECEPTION`.

## Health

`GET /` e `GET /health`

Usados para smoke test do backend.
