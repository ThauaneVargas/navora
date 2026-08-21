from fastapi import APIRouter

from app.models import UserRole
from app.schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    role = UserRole.EMPLOYEE if "funcionario" in payload.email.lower() else UserRole.PATIENT
    return LoginResponse(access_token="dev-token-navora", role=role)
