from datetime import datetime

from fastapi import APIRouter

from app.schemas import NotificationCreate

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications():
    return [
        {
            "id": 1,
            "notification_type": "Rota",
            "title": "Rota recalculada",
            "description": "Encontramos um caminho mais curto até Tomografia.",
            "time": "Agora",
            "read": False,
        },
        {
            "id": 2,
            "notification_type": "SOS",
            "title": "SOS enviado",
            "description": "A equipe foi notificada.",
            "time": "12 min",
            "read": True,
        },
    ]


@router.post("")
def create_notification(payload: NotificationCreate):
    return {"id": 100, "created_at": datetime.utcnow(), **payload.model_dump()}
