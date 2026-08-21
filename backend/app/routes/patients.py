from fastapi import APIRouter

from app.schemas import AccessibilityPayload, PatientProfileResponse, PatientRegister

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("/register")
def register_patient(payload: PatientRegister):
    return {
        "message": "Paciente cadastrado com sucesso",
        "patient": {
            "name": payload.name,
            "document": payload.document,
            "email": payload.email,
        },
    }


@router.get("/me", response_model=PatientProfileResponse)
def get_my_patient_profile():
    return PatientProfileResponse(
        name="Paciente Navora",
        document="CPF cadastrado",
        phone="(11) 99999-0000",
        email="paciente@navora.com",
        accessibility=AccessibilityPayload(needs_elevator=True, avoid_stairs=True, voice_guidance=True),
        emergency_contact={"name": "Maria Souza", "phone": "(11) 98888-0000"},
    )


@router.put("/me/accessibility")
def update_accessibility(payload: AccessibilityPayload):
    return {"message": "Preferências de acessibilidade atualizadas", "accessibility": payload}
