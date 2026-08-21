import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    EMPLOYEE = "EMPLOYEE"
    RECEPTION = "RECEPTION"
    ADMIN = "ADMIN"


class CallType(str, enum.Enum):
    HELP = "HELP"
    HELP_REQUEST = "HELP_REQUEST"
    SOS = "SOS"
    DOCTOR = "DOCTOR"
    LOST = "LOST"
    MOBILITY_HELP = "MOBILITY_HELP"
    LOST_USER = "LOST_USER"


class CallStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    TEAM_DISPATCHED = "TEAM_DISPATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"
    CANCELED = "CANCELED"


class VisitorAccessStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"
    WAITING_AUTHORIZATION = "WAITING_AUTHORIZATION"
    AUTHORIZED = "AUTHORIZED"
    IN_ROUTE = "IN_ROUTE"
    ARRIVED = "ARRIVED"
    OFF_ROUTE = "OFF_ROUTE"
    DENIED = "DENIED"
    FINISHED = "FINISHED"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(180))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.PATIENT)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient_profile: Mapped["PatientProfile"] = relationship(back_populates="user", uselist=False)
    employee_profile: Mapped["EmployeeProfile"] = relationship(back_populates="user", uselist=False)


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    birth_or_age: Mapped[str | None] = mapped_column(String(80))
    document: Mapped[str] = mapped_column(String(80), index=True)
    phone: Mapped[str] = mapped_column(String(40))
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="patient_profile")
    accessibility: Mapped["AccessibilityProfile"] = relationship(back_populates="patient", uselist=False)
    emergency_contact: Mapped["EmergencyContact"] = relationship(back_populates="patient", uselist=False)


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    department: Mapped[str | None] = mapped_column(String(120))

    user: Mapped[User] = relationship(back_populates="employee_profile")


class AccessibilityProfile(Base):
    __tablename__ = "accessibility_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id"))
    mobility_difficulty: Mapped[bool] = mapped_column(Boolean, default=False)
    wheelchair: Mapped[bool] = mapped_column(Boolean, default=False)
    needs_elevator: Mapped[bool] = mapped_column(Boolean, default=False)
    avoid_stairs: Mapped[bool] = mapped_column(Boolean, default=False)
    stretcher_support: Mapped[bool] = mapped_column(Boolean, default=False)
    companion_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    visual_impairment: Mapped[bool] = mapped_column(Boolean, default=False)
    hearing_impairment: Mapped[bool] = mapped_column(Boolean, default=False)
    voice_guidance: Mapped[bool] = mapped_column(Boolean, default=False)

    patient: Mapped[PatientProfile] = relationship(back_populates="accessibility")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patient_profiles.id"))
    name: Mapped[str] = mapped_column(String(180))
    phone: Mapped[str] = mapped_column(String(40))

    patient: Mapped[PatientProfile] = relationship(back_populates="emergency_contact")


class CallRequest(Base):
    __tablename__ = "call_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_type: Mapped[str] = mapped_column(String(20), default="patient")
    user_name: Mapped[str] = mapped_column(String(180), default="Paciente Navora")
    area: Mapped[str] = mapped_column(String(20), default="private")
    area_name: Mapped[str] = mapped_column(String(120), default="HMC Private")
    patient_name: Mapped[str] = mapped_column(String(180))
    call_type: Mapped[CallType] = mapped_column(Enum(CallType))
    reason: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(180))
    sector: Mapped[str] = mapped_column(String(120))
    beacon_code: Mapped[str | None] = mapped_column(String(80))
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[CallStatus] = mapped_column(Enum(CallStatus), default=CallStatus.PENDING)
    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.MEDIUM)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class VisitorAccessRequest(Base):
    __tablename__ = "visitor_access_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visitor_name: Mapped[str] = mapped_column(String(180))
    area_name: Mapped[str] = mapped_column(String(120), default="HMC Private")
    entrance: Mapped[str] = mapped_column(String(120), default="Entrada pelos fundos")
    area_id: Mapped[str] = mapped_column(String(40))
    area: Mapped[str] = mapped_column(String(120))
    entry: Mapped[str] = mapped_column(String(120))
    current_location: Mapped[str] = mapped_column(String(180))
    current_beacon: Mapped[str | None] = mapped_column(String(80))
    requested_destination: Mapped[str] = mapped_column(String(180))
    reason: Mapped[str] = mapped_column(String(180))
    accessibility: Mapped[str] = mapped_column(String(40), default="Nao")
    status: Mapped[VisitorAccessStatus] = mapped_column(
        Enum(VisitorAccessStatus),
        default=VisitorAccessStatus.WAITING_AUTHORIZATION,
    )
    beacon: Mapped[str | None] = mapped_column(String(80))
    permission_minutes: Mapped[int | None] = mapped_column(Integer)
    authorized_route: Mapped[str | None] = mapped_column(String(255))
    denied_reason: Mapped[str | None] = mapped_column(String(180))
    allowed_route: Mapped[str | None] = mapped_column(String(255))
    allowed_time: Mapped[str | None] = mapped_column(String(80))
    release_type: Mapped[str | None] = mapped_column(String(120))
    denial_reason: Mapped[str | None] = mapped_column(String(180))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    notification_type: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Beacon(Base):
    __tablename__ = "beacons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    area: Mapped[str] = mapped_column(String(40), default="shared")
    area_name: Mapped[str] = mapped_column(String(120), default="Compartilhado")
    location: Mapped[str] = mapped_column(String(180), default="")
    battery: Mapped[int] = mapped_column(Integer, default=100)
    sector: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(40), default="ACTIVE")
    last_signal_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Sector(Base):
    __tablename__ = "sectors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    floor: Mapped[str] = mapped_column(String(40))
    flow_status: Mapped[str] = mapped_column(String(40), default="LOW")


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    origin: Mapped[str] = mapped_column(String(120))
    destination: Mapped[str] = mapped_column(String(120))
    distance_meters: Mapped[int] = mapped_column(Integer)
    estimated_minutes: Mapped[int] = mapped_column(Integer)
    accessible: Mapped[bool] = mapped_column(Boolean, default=False)


class AdminReport(Base):
    __tablename__ = "admin_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    payload: Mapped[str] = mapped_column(Text)
