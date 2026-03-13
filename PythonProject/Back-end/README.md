# Backend - User Registration (FastAPI + MongoDB)

Piccolo backend per registrare utenti su MongoDB.

Requisiti
- Python 3.8+
- MongoDB (Atlas o locale)

Installazione
1. Creare un virtualenv
   python -m venv .venv
   .\.venv\Scripts\activate
2. Installare dipendenze
   python -m pip install -r requirements.txt

Variabili d'ambiente
- MONGODB_URI: connection string a MongoDB

Avvio (sviluppo)
uvicorn main:app --reload --port 8000

Endpoins:
- POST /api/v1/auth/register
- GET /api/v1/auth/check-email?email=...

Note
- Password hashing con bcrypt
- Index unico su email creato all'avvio

