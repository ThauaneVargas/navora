from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routes import auth, beacons, calls, dashboard, notifications, patients, reports, routes, sectors, users, visitor_access
from app.seed import seed_initial_data

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_initial_data(db)

app = FastAPI(
    title="Navora API",
    description="API comercial do Navora para mobile, recepcao e administracao hospitalar.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(calls.router)
app.include_router(notifications.router)
app.include_router(beacons.router)
app.include_router(sectors.router)
app.include_router(routes.router)
app.include_router(reports.router)
app.include_router(visitor_access.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"status": "online", "service": "Navora API"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "Navora Backend"}
