from datetime import datetime, timedelta
from bson import ObjectId
from db import get_collection

async def _get_fallback_with_source(user_oid: ObjectId, section_key: str) -> tuple[float, str]:
    """Return (value, source) where source is one of: 'yesterday', 'latest_daily_summary', 'questionnaire', 'default'."""
    score_history_col = get_collection("score_history")
    questionnaires_col = get_collection("questionnaires")

    # 1) try yesterday
    yesterday = (datetime.utcnow().date() - timedelta(days=1)).strftime("%Y-%m-%d")
    doc = await score_history_col.find_one({"userId": user_oid, "date": yesterday, "type": "daily_summary"})
    if doc:
        s = (doc.get("scores") or {}).get(section_key)
        if s is not None:
            try:
                return float(s), "yesterday"
            except Exception:
                pass

    # 2) latest daily_summary (ignore today's entry to avoid picking up today's modified value)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    doc = await score_history_col.find_one({"userId": user_oid, "type": "daily_summary", "date": {"$lt": today}}, sort=[("date", -1)])
    if doc:
        s = (doc.get("scores") or {}).get(section_key)
        if s is not None:
            try:
                return float(s), "latest_daily_summary"
            except Exception:
                pass

    # 3) last questionnaire
    q = await questionnaires_col.find_one({"userId": user_oid}, sort=[("_id", -1)])
    if q:
        scores = q.get("sectionScores") or {}
        s = scores.get(section_key)
        if s is not None:
            try:
                return float(s), "questionnaire"
            except Exception:
                pass

    # fallback default
    return 50.0, "default"


# keep existing _get_fallback_score for compatibility
async def _get_fallback_score(user_oid: ObjectId, section_key: str) -> float:
    v, _ = await _get_fallback_with_source(user_oid, section_key)
    return v


async def restore_section_and_recompute_total(user_oid: ObjectId, section_key: str, source: str = "restore") -> tuple[float, str]:
    """Restore a single section score using fallback and recompute totalScore, then persist and append change to daily_summary.
    Returns (restored_value, restored_source)
    """
    users_col = get_collection("users")
    score_history_col = get_collection("score_history")

    user = await users_col.find_one({"_id": user_oid})
    if not user:
        print(f"[score_utils] restore: user not found {user_oid}")
        return 50.0, "default"
    section_scores = user.get("sectionScores") if isinstance(user.get("sectionScores"), dict) else {}

    fallback, fallback_source = await _get_fallback_with_source(user_oid, section_key)
    print(f"[score_utils] restore: user={user_oid} section={section_key} fallback={fallback} source={fallback_source}")

    # If restoring sportOmics also align physioOmics (do NOT write legacy fisioOmics)
    if section_key == "sportOmics":
        section_scores["sportOmics"] = round(fallback, 1)
        # physioOmics should be the average between restored sport and current sleepOmics
        sleep_val = float(section_scores.get("sleepOmics", 50))
        section_scores["physioOmics"] = round((float(fallback) + sleep_val) / 2.0, 1)
    else:
        section_scores[section_key] = round(fallback, 1)

    # Recompute totalScore: keep the same formula used elsewhere
    psycho = float(section_scores.get("psychoOmics", 50))
    physio = float(section_scores.get("physioOmics", 50))
    nutri = float(section_scores.get("nutriOmics", 50))
    eco = float(section_scores.get("ecoOmics", 50))
    life = float(section_scores.get("lifeOmics", 50))
    socio = float(section_scores.get("socioOmics", 50))

    new_total = (psycho + physio + nutri + eco + life + socio) / 6.0

    print(f"[score_utils] restore: new_total={new_total} for user={user_oid}")

    # Persist user
    await users_col.update_one({"_id": user_oid}, {"$set": {"sectionScores": section_scores, "totalScore": new_total}})

    # Append to daily_summary (one record per day) with change entry
    try:
        hist_date = datetime.utcnow().strftime("%Y-%m-%d")
        change = {
            "when": datetime.utcnow(),
            "source": source,
            "restoredSection": section_key,
            "restoredValue": fallback,
            "scores": section_scores,
            "totalScore": new_total,
        }
        hist_set = {
            "userId": user_oid,
            "date": hist_date,
            "type": "daily_summary",
            "scores": section_scores,
            "totalScore": new_total,
            "updatedAt": datetime.utcnow(),
        }
        await score_history_col.update_one(
            {"userId": user_oid, "date": hist_date, "type": "daily_summary"},
            {"$set": hist_set},
            upsert=True,
        )
    except Exception:
        pass

    return fallback, fallback_source
