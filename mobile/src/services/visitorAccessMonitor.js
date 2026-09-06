import { navoraApi } from './api';

let intervalId = null;
let refreshing = false;

let currentRequest = null;
let currentConfig = {};

let warned15 = false;
let warned5 = false;
let expiredNotified = false;

const APPROVED_STATUSES = new Set([
  'APPROVED',
  'AUTHORIZED',
]);

const TERMINAL_STATUSES = new Set([
  'DENIED',
  'CANCELED',
  'REVOKED',
  'EXPIRED',
  'FINISHED',
]);

function normalizeRequest(updated, fallback = {}) {
  return {
    id: updated?.id || fallback?.id,

    visitorName:
      updated?.visitor_name ||
      fallback?.visitorName,

    area:
      updated?.area_id ||
      updated?.area ||
      fallback?.area,

    areaName:
      updated?.area_name ||
      fallback?.areaName,

    entry:
      updated?.entry ||
      fallback?.entry,

    entrance:
      updated?.entrance ||
      fallback?.entrance,

    currentLocation:
      updated?.current_location ||
      fallback?.currentLocation,

    requestedDestination:
      updated?.requested_destination ||
      fallback?.requestedDestination,

    destinationCode:
      updated?.destination_code ||
      fallback?.destinationCode,

    destinationId:
      updated?.destination_id ||
      fallback?.destinationId,

    reason:
      updated?.reason ||
      fallback?.reason,

    accessibility:
      updated?.accessibility ||
      fallback?.accessibility,

    status:
      updated?.status ||
      fallback?.status ||
      'PENDING',

    allowedRoute:
      updated?.authorized_route ||
      updated?.allowed_route ||
      fallback?.allowedRoute,

    allowedTime:
      updated?.permission_minutes
        ? `${updated.permission_minutes} minutos`
        : updated?.allowed_time ||
          fallback?.allowedTime,

    permissionMinutes:
      updated?.permission_minutes ??
      fallback?.permissionMinutes,

    authorizedAt:
      updated?.authorized_at ||
      fallback?.authorizedAt,

    expiresAt:
      updated?.expires_at ||
      fallback?.expiresAt,

    validUntil:
      updated?.expires_at ||
      fallback?.validUntil,

    floor:
      updated?.floor ||
      updated?.destination_floor ||
      fallback?.floor ||
      fallback?.destinationFloor,

    sector:
      updated?.sector ||
      fallback?.sector,
  };
}

function getExpiryTimestamp(request) {
  if (!request) return null;

  const directExpiry =
    request.expiresAt ||
    request.validUntil;

  if (directExpiry) {
    const timestamp =
      new Date(directExpiry).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  if (
    request.authorizedAt &&
    request.permissionMinutes
  ) {
    const start =
      new Date(
        request.authorizedAt
      ).getTime();

    if (Number.isFinite(start)) {
      return (
        start +
        Number(
          request.permissionMinutes
        ) *
          60 *
          1000
      );
    }
  }

  return null;
}

function updateRequest(nextRequest) {
  const previousStatus =
    currentRequest?.status;

  currentRequest = nextRequest;

  currentConfig.onUpdate?.(
    nextRequest
  );

  const becameApproved =
    APPROVED_STATUSES.has(
      nextRequest?.status
    ) &&
    !APPROVED_STATUSES.has(
      previousStatus
    );

  if (becameApproved) {
    warned15 = false;
    warned5 = false;
    expiredNotified = false;

    currentConfig.onApproved?.(
      nextRequest
    );
  }
}

function checkVisitTime() {
  if (
    !currentRequest ||
    !APPROVED_STATUSES.has(
      currentRequest.status
    )
  ) {
    return;
  }

  const expiry =
    getExpiryTimestamp(
      currentRequest
    );

  if (!expiry) return;

  const remainingMs =
    expiry - Date.now();

  const remainingMinutes =
    Math.ceil(
      remainingMs / 60000
    );

  if (remainingMs <= 0) {
    if (!expiredNotified) {
      expiredNotified = true;

      const expiredRequest = {
        ...currentRequest,
        status: 'EXPIRED',
      };

      currentRequest =
        expiredRequest;

      currentConfig.onUpdate?.(
        expiredRequest
      );

      currentConfig.onExpired?.(
        expiredRequest
      );
    }

    return;
  }

  if (
    remainingMinutes <= 5 &&
    !warned5
  ) {
    warned5 = true;
    warned15 = true;

    currentConfig.onWarning?.({
      minutes: 5,
      request: currentRequest,
    });

    return;
  }

  if (
    remainingMinutes <= 15 &&
    !warned15
  ) {
    warned15 = true;

    currentConfig.onWarning?.({
      minutes: 15,
      request: currentRequest,
    });
  }
}

export async function refreshVisitorAccessMonitor() {
  if (
    refreshing ||
    !currentRequest?.id
  ) {
    checkVisitTime();
    return;
  }

  refreshing = true;

  try {
    const updated =
      await navoraApi.getVisitorAccessRequest(
        currentRequest.id
      );

    if (
      updated &&
      !updated.demoMode
    ) {
      const normalized =
        normalizeRequest(
          updated,
          currentRequest
        );

      updateRequest(normalized);

      if (
        TERMINAL_STATUSES.has(
          normalized.status
        )
      ) {
        if (
          normalized.status ===
          'EXPIRED'
        ) {
          currentConfig.onExpired?.(
            normalized
          );
        }
      }
    }
  } catch (error) {
    currentConfig.onError?.(
      error
    );
  } finally {
    refreshing = false;

    checkVisitTime();
  }
}

export function startVisitorAccessMonitor({
  request,
  onUpdate,
  onApproved,
  onWarning,
  onExpired,
  onError,
  intervalMs = 3000,
}) {
  stopVisitorAccessMonitor();

  currentRequest = request;

  currentConfig = {
    onUpdate,
    onApproved,
    onWarning,
    onExpired,
    onError,
  };

  warned15 = false;
  warned5 = false;
  expiredNotified = false;

  if (!request?.id) {
    return;
  }

  refreshVisitorAccessMonitor();

  intervalId = setInterval(() => {
    refreshVisitorAccessMonitor();
    checkVisitTime();
  }, intervalMs);
}

export function updateVisitorAccessMonitorRequest(
  request
) {
  if (!request) return;

  currentRequest = {
    ...(currentRequest || {}),
    ...request,
  };

  checkVisitTime();
}

export function stopVisitorAccessMonitor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  refreshing = false;
  currentRequest = null;
  currentConfig = {};

  warned15 = false;
  warned5 = false;
  expiredNotified = false;
}