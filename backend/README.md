# Navora Backend

API FastAPI para autenticação, usuários, pacientes, chamados, rotas, beacons, notificações e relatórios.

## Rodar localmente

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Por padrão usa SQLite local em `navora.db`. A variável `DATABASE_URL` pode apontar para PostgreSQL futuramente.
