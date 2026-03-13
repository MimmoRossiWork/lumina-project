from fastapi import APIRouter, HTTPException
from bson import ObjectId
from db import get_collection
from models import QuestionnaireIn
from datetime import datetime
router = APIRouter(prefix="/questionnaire", tags=["questionnaire"])


@router.post("/", status_code=201)
async def save_questionnaire(payload: QuestionnaireIn):
    users_col = get_collection("users")
    questionnaires_col = get_collection("questionnaires")

    try:
        user_oid = ObjectId(payload.userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")

    doc = {
        "userId": user_oid,
        "answers": payload.answers,
        "sectionScores": payload.sectionScores.dict(),
        "totalScore": payload.totalScore,
    }

    try:
        insert_result = await questionnaires_col.insert_one(doc)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not save questionnaire") from exc

    try:
        await users_col.update_one(
            {"_id": user_oid},
            {
                "$set": {
                    "sectionScores.nutriOmics": payload.sectionScores.nutriOmics,
                    "sectionScores.physioOmics": payload.sectionScores.physioOmics,
                    "sectionScores.psychoOmics": payload.sectionScores.psychoOmics,
                    "sectionScores.socioOmics": payload.sectionScores.socioOmics,
                    "sectionScores.ecoOmics": payload.sectionScores.ecoOmics,
                    "sectionScores.lifeOmics": payload.sectionScores.lifeOmics,
                    "totalScore": payload.totalScore,
                }
            },
        )
    except Exception as exc:
        # best-effort: questionnaire is saved; report update failure
        raise HTTPException(status_code=500, detail="Questionnaire saved but failed to update user") from exc

    # best-effort: append to score_history
    try:
        score_history_col = get_collection("score_history")
        hist_date = datetime.utcnow().strftime("%Y-%m-%d")
        hist_doc = {
            "userId": user_oid,
            "date": hist_date,
            "type": "daily_summary",
            "scores": payload.sectionScores.dict(),
            "totalScore": payload.totalScore,
            "updatedAt": datetime.utcnow(),
        }
        await score_history_col.update_one({"userId": user_oid, "date": hist_date, "type": "daily_summary"},
                                           {"$set": hist_doc}, upsert=True)
    except Exception:
        pass

    return {"id": str(insert_result.inserted_id)}
