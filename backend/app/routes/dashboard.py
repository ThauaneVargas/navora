from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Beacon, CallRequest, CallStatus, CallType, VisitorAccessRequest, VisitorAccessStatus
from app.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(db: Session = Depends(get_db)):
    return DashboardSummaryResponse(
        totalCalls=db.query(CallRequest).count(),
        activeSOS=db.query(CallRequest)
        .filter(CallRequest.call_type == CallType.SOS, CallRequest.status != CallStatus.CLOSED)
        .count(),
        pendingVisitorRequests=db.query(VisitorAccessRequest)
        .filter(VisitorAccessRequest.status == VisitorAccessStatus.PENDING)
        .count(),
        approvedVisitors=db.query(VisitorAccessRequest)
        .filter(VisitorAccessRequest.status == VisitorAccessStatus.APPROVED)
        .count(),
        closedCalls=db.query(CallRequest).filter(CallRequest.status == CallStatus.CLOSED).count(),
        privateUsers=db.query(VisitorAccessRequest).filter(VisitorAccessRequest.area_id == "private").count(),
        susUsers=db.query(VisitorAccessRequest).filter(VisitorAccessRequest.area_id == "sus").count(),
        beaconsOnline=db.query(Beacon).filter(Beacon.status == "Online").count(),
    )
