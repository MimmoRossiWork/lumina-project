from fastapi import FastAPI
from routes import auth, questionnaire, checkin, foodtracker, fittracker, wellbeing, predictions, site_survey
from db import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Lumina Backend")

# Dev CORS (local only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    # Log validation errors and return summarized messages
    logger.error("Request validation error: %s", exc.errors())
    messages = []
    for err in exc.errors():
        loc = ".".join([str(x) for x in err.get('loc', [])])
        msg = err.get('msg', '')
        messages.append(f"{loc}: {msg}" if loc else msg)
    return JSONResponse(status_code=422, content={"detail": messages})


app.include_router(auth.router)
app.include_router(questionnaire.router)
app.include_router(checkin.router)
app.include_router(foodtracker.router)
app.include_router(fittracker.router)
app.include_router(wellbeing.router)
app.include_router(predictions.router)
app.include_router(site_survey.router)


@app.on_event("startup")
async def startup_event():
    # Ensure essential indexes (best-effort)
    try:
        users = db.get_collection("users")
        await users.create_index("email", unique=True)
        food_entries = db.get_collection("food_entries")
        await food_entries.create_index([("userId", 1), ("date", 1)], unique=True)
        await food_entries.create_index("date")
        fit_entries = db.get_collection("fit_entries")
        await fit_entries.create_index([("userId", 1), ("date", 1)], unique=True)
        await fit_entries.create_index("date")
        print("Ensured unique index on users.email and other indexes")
    except Exception as e:
        print("Warning: could not create index on startup:", e)

    try:
        wellbeing_entries = db.get_collection("wellbeing_entries")
        await wellbeing_entries.create_index([("userId", 1), ("date", 1)], unique=True)
    except Exception as e:
        print("Warning: could not create wellbeing index on startup:", e)


@app.get("/")
async def root():
    import os
    print("DEBUG URI:", os.getenv("MONGODB_URI"))
    return {"status": "ok"}
