from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import VisitorAccessRequest, VisitorAccessStatus
from app.schemas import (
    VisitorAccessAuthorization,
    VisitorAccessCreate,
    VisitorAccessDenial,
    VisitorAccessResponse,
    VisitorAccessStatusUpdate,
)

router = APIRouter(prefix="/visitor-access", tags=["visitor-access"])


def normalize_status(status: VisitorAccessStatus) -> VisitorAccessStatus:
    if status == VisitorAccessStatus.WAITING_AUTHORIZATION:
        return VisitorAccessStatus.PENDING
    if status == VisitorAccessStatus.AUTHORIZED:
        return VisitorAccessStatus.APPROVED
    if status == VisitorAccessStatus.FINISHED:
        return VisitorAccessStatus.EXPIRED
    return status


def find_request(db: Session, request_id: int) -> VisitorAccessRequest:
    request = db.get(VisitorAccessRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Solicitacao de visitante nao encontrada")
    return request


def default_route(request: VisitorAccessRequest) -> str:
    reception = "Recepcao Private" if request.area_id == "private" else "Recepcao Hospital Marco Capute"
    return f"{reception} -> rota autorizada -> {request.requested_destination}"


@router.get("", response_model=list[VisitorAccessResponse])
def list_visitor_access_requests(status: VisitorAccessStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(VisitorAccessRequest)
    if status is not None:
        query = query.filter(VisitorAccessRequest.status == normalize_status(status))
    return query.order_by(VisitorAccessRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=VisitorAccessResponse)
def get_visitor_access_request(request_id: int, db: Session = Depends(get_db)):
    return find_request(db, request_id)


@router.post("", response_model=VisitorAccessResponse)
def create_visitor_access_request(payload: VisitorAccessCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    area_id = payload.area_id or payload.area
    area_name = payload.area_name if payload.area_name else ("HMC Private" if area_id == "private" else "Hospital Marco Capute")
    request = VisitorAccessRequest(
        visitor_name=payload.visitor_name,
        area_id=area_id,
        area=area_name,
        area_name=area_name,
        entrance=payload.entrance,
        entry=payload.entry or payload.entrance,
        current_location=payload.current_location,
        current_beacon=payload.current_beacon or payload.beacon,
        requested_destination=payload.requested_destination,
        reason=payload.reason,
        accessibility=payload.accessibility,
        status=normalize_status(payload.status),
        beacon=payload.beacon or payload.current_beacon,
        created_at=now,
        updated_at=now,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.patch("/{request_id}/approve", response_model=VisitorAccessResponse)
def approve_visitor_access(request_id: int, payload: VisitorAccessAuthorization, db: Session = Depends(get_db)):
    request = find_request(db, request_id)
    minutes = payload.permissionMinutes or payload.permission_minutes or 30
    route = payload.authorizedRoute or payload.authorized_route or payload.allowed_route or default_route(request)
    request.status = VisitorAccessStatus.APPROVED
    request.permission_minutes = minutes
    request.authorized_route = route
    request.allowed_route = route
    request.allowed_time = f"{minutes} minutos"
    request.release_type = payload.release_type
    request.denied_reason = None
    request.denial_reason = None
    request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return request


@router.patch("/{request_id}/authorize", response_model=VisitorAccessResponse)
def authorize_visitor_access(request_id: int, payload: VisitorAccessAuthorization, db: Session = Depends(get_db)):
    return approve_visitor_access(request_id, payload, db)


@router.patch("/{request_id}/deny", response_model=VisitorAccessResponse)
def deny_visitor_access(request_id: int, payload: VisitorAccessDenial, db: Session = Depends(get_db)):
    request = find_request(db, request_id)
    reason = payload.deniedReason or payload.denial_reason
    request.status = VisitorAccessStatus.DENIED
    request.denied_reason = reason
    request.denial_reason = reason
    request.authorized_route = None
    request.allowed_route = None
    request.allowed_time = None
    request.permission_minutes = None
    request.release_type = None
    request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return request


@router.patch("/{request_id}/status", response_model=VisitorAccessResponse)
def update_visitor_access_status(request_id: int, payload: VisitorAccessStatusUpdate, db: Session = Depends(get_db)):
    request = find_request(db, request_id)
    request.status = normalize_status(payload.status)
    request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return request
