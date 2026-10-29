import { Beacon, CallRequest, VisitorAccessRequest } from '@prisma/client';

export function mapCallToApi(call: CallRequest) {
  return {
    id: call.id,
    // false = enviado sem conta (Acesso rapido/visitante): conferir antes de mobilizar equipe.
    registered_patient: Boolean(call.userId),
    user_type: call.userType,
    user_name: call.userName,
    area: call.area,
    area_name: call.areaName,
    patient_name: call.patientName,
    call_type: call.callType,
    reason: call.reason,
    location: call.location,
    sector: call.sector,
    beacon_code: call.beaconCode,
    message: call.message,
    emergency_contact: call.emergencyContact,
    caller_phone: call.callerPhone ?? null,
    needs: Array.isArray(call.needs) ? call.needs : [],
    problems: Array.isArray(call.problems) ? call.problems : [],
    problem_note: call.problemNote ?? null,
    status: call.status,
    priority: call.priority,
    created_at: call.createdAt.toISOString(),
    updated_at: call.updatedAt.toISOString(),
  };
}

export function mapVisitorAccessToApi(request: VisitorAccessRequest) {
  return {
    id: request.id,
    visitor_name: request.visitorName,
    area: request.area,
    area_name: request.areaName,
    entrance: request.entrance,
    area_id: request.areaId,
    entry: request.entry,
    current_location: request.currentLocation,
    current_beacon: request.currentBeacon,
    requested_destination: request.requestedDestination,
    reason: request.reason,
    accessibility: request.accessibility,
    status: request.status,
    beacon: request.beacon,
    permission_minutes: request.permissionMinutes,
    authorized_route: request.authorizedRoute,
    denied_reason: request.deniedReason,
    allowed_route: request.allowedRoute,
    allowed_time: request.allowedTime,
    release_type: request.releaseType,
    denial_reason: request.denialReason,
    destination_id: request.destinationId,
    companions: Array.isArray(request.companions) ? request.companions : [],
    group_total: request.groupTotal ?? 1,
    visit_code: request.visitCode ?? null,
    assistance_request: request.assistanceRequest ?? null,
    authorized_at: request.authorizedAt?.toISOString() ?? null,
    expires_at: request.expiresAt?.toISOString() ?? null,
    finished_at: request.finishedAt?.toISOString() ?? null,
    decided_by_id: request.decidedById ?? null,
    decided_at: request.decidedAt?.toISOString() ?? null,
    created_at: request.createdAt.toISOString(),
    updated_at: request.updatedAt.toISOString(),
  };
}

import { beaconHealth, isPhysicalBeacon } from './beacon-health';

export function mapBeaconToApi(beacon: Beacon & { navigationNode?: { id: number; code: string; label: string; floor: string | null } | null }) {
  const health = beaconHealth(beacon);
  return {
    id: beacon.id,
    code: beacon.code,
    name: beacon.name,
    area: beacon.area,
    area_name: beacon.areaName,
    location: beacon.location,
    battery: health.battery,
    sector: beacon.sector,
    status: health.status,
    physical: isPhysicalBeacon(beacon),
    navigation_node: beacon.navigationNode
      ? {
          id: beacon.navigationNode.id,
          code: beacon.navigationNode.code,
          label: beacon.navigationNode.label,
          floor: beacon.navigationNode.floor,
        }
      : null,
    origin_node_code: beacon.navigationNode?.code ?? null,
    last_signal_at: beacon.lastSignalAt.toISOString(),
    hardware_model: beacon.hardwareModel ?? null,
    ibeacon_uuid: beacon.ibeaconUuid ?? null,
    ibeacon_major: beacon.ibeaconMajor ?? null,
    ibeacon_minor: beacon.ibeaconMinor ?? null,
    measured_power: beacon.measuredPower ?? null,
  };
}
