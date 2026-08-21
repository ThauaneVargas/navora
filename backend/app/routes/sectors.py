from fastapi import APIRouter

router = APIRouter(prefix="/sectors", tags=["sectors"])


@router.get("")
def list_sectors():
    return [
        {"id": 1, "name": "Recepção Principal", "floor": "Térreo", "flow_status": "HIGH"},
        {"id": 2, "name": "Setor de Imagem", "floor": "1º Andar", "flow_status": "MEDIUM"},
        {"id": 3, "name": "Corredor B", "floor": "Térreo", "flow_status": "LOW"},
    ]
