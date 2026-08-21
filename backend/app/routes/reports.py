from fastapi import APIRouter

from app.schemas import AdminReportResponse
from app.services.report_service import build_admin_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/admin", response_model=AdminReportResponse)
def generate_admin_report():
    return build_admin_report()
