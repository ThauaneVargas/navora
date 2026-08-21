from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr

from .models import CallStatus, CallType, Priority, UserRole, VisitorAccessStatus


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class AccessibilityPayload(BaseModel):
    mobility_difficulty: bool = False
    wheelchair: bool = False
    needs_elevator: bool = False
    avoid_stairs: bool = False
    stretcher_support: bool = False
    companion_needed: bool = False
    visual_impairment: bool = False
    hearing_impairment: bool = False
    voice_guidance: bool = False


class PatientRegister(BaseModel):
    name: str
    birth_or_age: str | None = None
    document: str
    phone: str
    email: EmailStr
    password: str
    emergency_contact_name: str
    emergency_contact_phone: str
    accessibility: AccessibilityPayload = AccessibilityPayload()
    notes: str | None = None


class PatientProfileResponse(BaseModel):
    name: str
    document: str
    phone: str
    email: EmailStr
    accessibility: AccessibilityPayload
    emergency_contact: dict[str, str]


class CallCreate(BaseModel):
    user_type: str = "patient"
    user_name: str | None = None
    area: str = "private"
    area_name: str = "HMC Private"
    patient_name: str = "Paciente Navora"
    call_type: CallType = CallType.HELP
    reason: str | None = None
    location: str = "Recepcao"
    sector: str = "Entrada Principal"
    beacon_code: str | None = None
    message: str | None = None
    priority: Priority = Priority.MEDIUM


class CallResponse(CallCreate):
    id: int
    status: CallStatus
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CallStatusUpdate(BaseModel):
    status: CallStatus


class VisitorAccessCreate(BaseModel):
    visitor_name: str = "Visitante Navora"
    area: str = "private"
    area_name: str = "HMC Private"
    entrance: str = "Entrada pelos fundos"
    area_id: str = "private"
    entry: str = "Entrada Private"
    current_location: str = "Entrada"
    current_beacon: str | None = None
    requested_destination: str
    reason: str = "Visita"
    accessibility: str = "Nao"
    status: VisitorAccessStatus = VisitorAccessStatus.PENDING
    beacon: str | None = None


class VisitorAccessResponse(VisitorAccessCreate):
    id: int
    status: VisitorAccessStatus
    permission_minutes: int | None = None
    authorized_route: str | None = None
    denied_reason: str | None = None
    allowed_route: str | None = None
    allowed_time: str | None = None
    release_type: str | None = None
    denial_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VisitorAccessAuthorization(BaseModel):
    release_type: str = "Liberar rota ate o destino"
    release_time: str = "30 minutos"
    permissionMinutes: int | None = None
    permission_minutes: int | None = None
    authorizedRoute: str | None = None
    authorized_route: str | None = None
    allowed_route: str | None = None


class VisitorAccessDenial(BaseModel):
    denial_reason: str = "Orientar presencialmente na recepcao"
    deniedReason: str | None = None


class VisitorAccessStatusUpdate(BaseModel):
    status: VisitorAccessStatus


class BeaconDetectRequest(BaseModel):
    beaconCode: str | None = None
    beacon_code: str | None = None


class BeaconDetectResponse(BaseModel):
    detected: bool
    area: str | None = None
    areaName: str | None = None
    entrance: str | None = None


class DashboardSummaryResponse(BaseModel):
    totalCalls: int
    activeSOS: int
    pendingVisitorRequests: int
    approvedVisitors: int
    closedCalls: int
    privateUsers: int
    susUsers: int
    beaconsOnline: int


class NotificationCreate(BaseModel):
    notification_type: str
    title: str
    description: str
    read: bool = False


class AdminReportResponse(BaseModel):
    total_people: int
    active_routes: int
    active_sos: int
    help_requests: int
    beacons_online: int
    beacons_attention: int
    busiest_sector: str
    sector_with_most_calls: str
    average_route_time: str
    average_response_time: str
    accessible_routes_used: int
    critical_alerts: int
    movement_summary: str
    recommendations: list[str]


class GenericItem(BaseModel):
    id: int
    name: str | None = None
    code: str | None = None
    status: str | None = None
    data: dict[str, Any] = {}
