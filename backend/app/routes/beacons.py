from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Beacon
from app.schemas import BeaconDetectRequest, BeaconDetectResponse

router = APIRouter(prefix="/beacons", tags=["beacons"])


@router.get("")
def list_beacons(db: Session = Depends(get_db)):
    return db.query(Beacon).order_by(Beacon.code.asc()).all()


@router.post("/detect", response_model=BeaconDetectResponse)
def detect_beacon(payload: BeaconDetectRequest, db: Session = Depends(get_db)):
    code = payload.beaconCode or payload.beacon_code
    beacon = db.query(Beacon).filter(Beacon.code == code).first()
    if not beacon:
        return BeaconDetectResponse(detected=False)
    beacon.last_signal_at = datetime.utcnow()
    db.commit()
    return BeaconDetectResponse(
        detected=True,
        area=beacon.area,
        areaName=beacon.area_name,
        entrance="Entrada pelos fundos" if beacon.area == "private" else "Entrada pela frente",
    )
