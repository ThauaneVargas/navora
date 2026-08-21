from fastapi import APIRouter

from app.models import UserRole

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users():
    return [
        {"id": 1, "name": "Paciente Navora", "role": UserRole.PATIENT},
        {"id": 2, "name": "Funcionario Navora", "role": UserRole.EMPLOYEE},
        {"id": 3, "name": "Juliana Lima", "role": UserRole.RECEPTION},
        {"id": 4, "name": "Amanda Souza", "role": UserRole.ADMIN},
    ]
