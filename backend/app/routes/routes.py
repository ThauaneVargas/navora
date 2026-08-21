from fastapi import APIRouter

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("")
def list_routes():
    return [
        {
            "id": 1,
            "origin": "Recepção",
            "destination": "Tomografia",
            "distance_meters": 72,
            "estimated_minutes": 3,
            "accessible": True,
        },
        {
            "id": 2,
            "origin": "Recepção",
            "destination": "Ultrassonografia 01",
            "distance_meters": 37,
            "estimated_minutes": 2,
            "accessible": True,
        },
    ]
