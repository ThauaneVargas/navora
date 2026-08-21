from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Beacon, CallRequest, CallStatus, CallType, Priority, VisitorAccessRequest, VisitorAccessStatus


def seed_initial_data(db: Session):
    if db.query(Beacon).count() == 0:
        db.add_all(
            [
                Beacon(code="MBM04-01", name="Entrada Private", area="private", area_name="HMC Private", location="Entrada pelos fundos", sector="Entrada Private", battery=92, status="Online"),
                Beacon(code="MBM04-02", name="Recepcao Private", area="private", area_name="HMC Private", location="Recepcao Private", sector="Recepcao Private", battery=88, status="Online"),
                Beacon(code="MBM04-10", name="Entrada Hospital Marco Capute", area="sus", area_name="Hospital Marco Capute", location="Entrada pela frente", sector="Entrada Hospital Marco Capute", battery=90, status="Online"),
                Beacon(code="MBM04-11", name="Recepcao Hospital Marco Capute", area="sus", area_name="Hospital Marco Capute", location="Recepcao Hospital Marco Capute", sector="Recepcao Hospital Marco Capute", battery=84, status="Online"),
                Beacon(code="MBM04-20", name="Corredor compartilhado", area="shared", area_name="Compartilhado", location="Corredor compartilhado", sector="Corredor compartilhado", battery=70, status="Online"),
            ]
        )

    if db.query(CallRequest).count() == 0:
        db.add_all(
            [
                CallRequest(
                    user_type="patient",
                    user_name="Mariana Souza",
                    patient_name="Mariana Souza",
                    area="private",
                    area_name="HMC Private",
                    call_type=CallType.SOS,
                    reason="SOS paciente Private pendente",
                    location="Recepcao Private",
                    sector="Recepcao Private",
                    beacon_code="MBM04-02",
                    message="SOS paciente Private pendente",
                    priority=Priority.CRITICAL,
                    status=CallStatus.PENDING,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
                CallRequest(
                    user_type="visitor",
                    user_name="Visitante SUS",
                    patient_name="Visitante SUS",
                    area="sus",
                    area_name="Hospital Marco Capute",
                    call_type=CallType.HELP,
                    reason="Pedido de ajuda visitante SUS pendente",
                    location="Recepcao Hospital Marco Capute",
                    sector="Recepcao Hospital Marco Capute",
                    beacon_code="MBM04-11",
                    message="Pedido de ajuda visitante SUS pendente",
                    priority=Priority.MEDIUM,
                    status=CallStatus.PENDING,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
            ]
        )

    if db.query(VisitorAccessRequest).count() == 0:
        db.add_all(
            [
                VisitorAccessRequest(
                    visitor_name="Maria Souza",
                    area_id="private",
                    area="HMC Private",
                    area_name="HMC Private",
                    entrance="Entrada pelos fundos",
                    entry="Entrada pelos fundos",
                    reason="Visitar paciente",
                    requested_destination="Visita / Internacao Private",
                    accessibility="Nao",
                    current_location="Entrada Private",
                    current_beacon="MBM04-01",
                    beacon="MBM04-01",
                    status=VisitorAccessStatus.PENDING,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
                VisitorAccessRequest(
                    visitor_name="Joao Lima",
                    area_id="sus",
                    area="Hospital Marco Capute",
                    area_name="Hospital Marco Capute",
                    entrance="Entrada pela frente",
                    entry="Entrada pela frente",
                    reason="Acompanhar paciente",
                    requested_destination="Visita / Internacao Hospital Marco Capute",
                    accessibility="Sim",
                    current_location="Recepcao Hospital Marco Capute",
                    current_beacon="MBM04-11",
                    beacon="MBM04-11",
                    status=VisitorAccessStatus.APPROVED,
                    permission_minutes=30,
                    authorized_route="Recepcao Hospital Marco Capute -> rota autorizada -> destino",
                    allowed_route="Recepcao Hospital Marco Capute -> rota autorizada -> destino",
                    allowed_time="30 minutos",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                ),
            ]
        )

    db.commit()
