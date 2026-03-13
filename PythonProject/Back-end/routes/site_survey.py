from fastapi import APIRouter, HTTPException
from bson import ObjectId
from db import get_collection
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter(prefix="/site-survey", tags=["site-survey"])

class SurveyAnswer(BaseModel):
    id_domanda: int
    testo: str
    voto: int = Field(..., ge=1, le=5)

class SiteSurveyIn(BaseModel):
    userId: str
    risposte: List[SurveyAnswer]
    timestamp: Optional[str] = None


@router.post("/", status_code=201)
async def save_site_survey(payload: SiteSurveyIn):
    surveys_col = get_collection("site_surveys")
    users_col = get_collection("users")

    try:
        user_oid = ObjectId(payload.userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")

    doc = {
        "userId": user_oid,
        "risposte": [r.dict() for r in payload.risposte],
        "timestamp": payload.timestamp or datetime.utcnow().isoformat(),
    }

    try:
        insert_result = await surveys_col.insert_one(doc)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save survey") from exc

    # optional: update user's questionnaireCompleted flag
    try:
        await users_col.update_one({"_id": user_oid}, {"$set": {"questionnaireCompleted": True}}, upsert=False)
    except Exception:
        pass

    return {"id": str(insert_result.inserted_id)}