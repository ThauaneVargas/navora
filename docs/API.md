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

## Patients

`POST /patients/register`

Campos principais: `email`, `password`, `name`, `phone`, `patient_code`, `birth_date`, `accessibility`.

`GET /patients/me`, `PUT /patients/me`, `PUT /patients/me/accessibility`

Protegidos por JWT e role `PATIENT`.

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
  "current_beacon_code": "MBM04-01",
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
  "current_beacon_code": "MBM04-01",
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

Protegido para `ADMIN`/`RECEPTION`.

`POST /beacons/detect`

Request:

```json
{ "beaconCode": "MBM04-01" }
```

Tambem aceita `beacon_code`. Beacon conhecido retorna `detected: true`, dados de area, `navigation_node` e `origin_node_code`. Beacon desconhecido retorna `{ "detected": false }`.

## Calls

`POST /calls`, `POST /calls/help`, `POST /calls/sos`

Campos principais: `user_type`, `user_name`, `area`, `area_name`, `patient_name`, `call_type`, `reason`, `location`, `sector`, `beacon_code`, `message`, `priority`.

`GET /calls` e `PATCH /calls/:callId/status`

Protegidos para `ADMIN`/`RECEPTION`.

## Visitor Access

`POST /visitor-access`

Campos principais: `visitor_name`, `area`, `area_name`, `entrance`, `area_id`, `entry`, `current_location`, `current_beacon`, `requested_destination`, `reason`, `accessibility`, `status`, `beacon`.

`GET /visitor-access/:requestId`

Consulta publica do pedido.

`GET /visitor-access`, `PATCH /visitor-access/:requestId/approve`, `PATCH /visitor-access/:requestId/authorize`, `PATCH /visitor-access/:requestId/deny`, `PATCH /visitor-access/:requestId/status`

Protegidos para `ADMIN`/`RECEPTION`.

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
