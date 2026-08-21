from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CallRequest, CallStatus, CallType, Priority
from app.schemas import CallCreate, CallResponse, CallStatusUpdate

router = APIRouter(prefix="/calls", tags=["calls"])


def normalize_call_type(call_type: CallType) -> CallType:
    if call_type == CallType.HELP_REQUEST:
        return CallType.HELP
    if call_type == CallType.LOST_USER:
        return CallType.LOST
    return call_type


def create_call_record(db: Session, payload: CallCreate, call_type: CallType | None = None, priority: Priority | None = None):
    resolved_type = normalize_call_type(call_type or payload.call_type)
    resolved_priority = priority or payload.priority
    user_name = payload.user_name or payload.patient_name or "Paciente Navora"
    reason = payload.reason or payload.message or resolved_type.value
    call = CallRequest(
        user_type=payload.user_type,
        user_name=user_name,
        area=payload.area,
        area_name=payload.area_name,
        patient_name=user_name,
        call_type=resolved_type,
        reason=reason,
        location=payload.location,
        sector=payload.sector,
        beacon_code=payload.beacon_code,
        message=payload.message or reason,
        priority=resolved_priority,
        status=CallStatus.PENDING,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


@router.post("", response_model=CallResponse)
def create_call(payload: CallCreate, db: Session = Depends(get_db)):
    return create_call_record(db, payload)


@router.post("/help", response_model=CallResponse)
def create_help_call(payload: CallCreate, db: Session = Depends(get_db)):
    return create_call_record(db, payload, CallType.HELP, Priority.MEDIUM)


@router.post("/sos", response_model=CallResponse)
def create_sos_call(payload: CallCreate, db: Session = Depends(get_db)):
    return create_call_record(db, payload, CallType.SOS, Priority.CRITICAL)


@router.get("", response_model=list[CallResponse])
def list_calls(db: Session = Depends(get_db)):
    return db.query(CallRequest).order_by(CallRequest.created_at.desc()).all()


@router.patch("/{call_id}/status")
def update_call_status(call_id: int, payload: CallStatusUpdate, db: Session = Depends(get_db)):
    call = db.get(CallRequest, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Chamado nao encontrado")
    call.status = payload.status
    call.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(call)
    return {"id": call.id, "status": call.status, "message": "Status atualizado com sucesso"}
