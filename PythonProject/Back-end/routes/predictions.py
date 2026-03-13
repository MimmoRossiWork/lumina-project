from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Any, Dict
from bson import ObjectId

from db import get_collection
from ai_engine import get_emotional_ai
from ai_sleep_engine import get_sleep_predictor

router = APIRouter(prefix="/api/v1/predict", tags=["predict"])


def _safe_get(d: Dict[str, Any], path: str, default: Any = None):
    """Recupera un valore annidato usando una path con punti (es. 'dailyTotals.calories')."""
    if not d:
        return default
    cur: Any = d
    for part in path.split('.'):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return default
    return cur


@router.get("/sleep-risk/{user_id}")
async def predict_sleep_risk(user_id: str):
    """Predice il rischio sonno per stasera usando i dati di oggi."""

    # --- 1. GESTIONE DATE (Il cuore del problema) ---
    now = datetime.now()

    # Per fit_entries e food_entries (che usano stringhe "YYYY-MM-DD")
    today_str = now.strftime("%Y-%m-%d")

    # Per daily_logs (che usa ISODate)
    # Creiamo un range: dalle 00:00:00 alle 23:59:59 di oggi
    start_of_day = datetime(now.year, now.month, now.day)
    end_of_day = start_of_day + timedelta(days=1)

    # Conversione ObjectId (per gestire userId salvato come ObjectId)
    user_oid = None
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        print(f"[predict_sleep_risk] user_id '{user_id}' non convertibile in ObjectId")

    user_keys = [user_id]
    if user_oid:
        user_keys.append(user_oid)

    try:
        # --- 2. COLLEZIONI CORRETTE ---
        fit_col = get_collection("fit_entries")
        food_col = get_collection("food_entries")
        daily_col = get_collection("daily_logs")  # <--- Era wellbeing_entries, corretto in daily_logs

        # --- 3. QUERIES DIVERSIFICATE ---

        # Query per Stringhe (Fit/Food)
        query_str = {"userId": {"$in": user_keys}, "date": today_str}

        # Query per ISODate (Daily Logs)
        query_iso = {
            "userId": {"$in": user_keys},
            "date": {"$gte": start_of_day, "$lt": end_of_day}
        }

        print(f"[predict_sleep_risk] query fit_entries: {query_str}")
        fit_doc = await fit_col.find_one(query_str)
        print(f"[predict_sleep_risk] fit_doc found: {fit_doc is not None}")

        print(f"[predict_sleep_risk] query food_entries: {query_str}")
        food_doc = await food_col.find_one(query_str)  # Spesso food usa stringhe, verifica se fallisce
        print(f"[predict_sleep_risk] food_doc found: {food_doc is not None}")

        print(f"[predict_sleep_risk] query daily_logs: {query_iso}")
        daily_doc = await daily_col.find_one(query_iso)
        print(f"[predict_sleep_risk] daily_doc found: {daily_doc is not None}")

        # --- 4. ESTRAZIONE DATI (Path corretti dai tuoi JSON) ---

        # Steps (da fit_entries)
        steps = _safe_get(fit_doc, "steps.count", 0)
        active_minutes = _safe_get(fit_doc, "dailyTotals.activeMinutes", 0)

        # Calories (da food_entries o fit_entries per quelle bruciate?)
        # Qui prendiamo quelle mangiate (food_entries)
        calories_intake = _safe_get(food_doc, "dailyTotals.calories", 0)

        # Stress e Ansia (da daily_logs -> inputs -> mindset)
        stress = _safe_get(daily_doc, "inputs.mindset.stressLevel", 5)
        anxiety = _safe_get(daily_doc, "inputs.mindset.anxietyLevel", 5)

        # Caffeina (Non la vedo nei tuoi log, assumiamo 0 se manca)
        caffeine = 0

        # --- 5. EMOZIONE (Recupero intelligente) ---
        # Nel tuo DB l'emozione è salvata dentro inputs.mindset.aiEmotion O a livello radice aiEmotion?
        # Dal tuo JSON sembra inputs -> mindset -> aiEmotion. Proviamo entrambi.

        ai_emotion = _safe_get(daily_doc, "inputs.mindset.aiEmotion")
        if not ai_emotion:
            ai_emotion = _safe_get(daily_doc, "aiEmotion", "neutral")

        # Se ancora non c'è, analizziamo la nota al volo
        if ai_emotion == "neutral" or not ai_emotion:
            journal_note = _safe_get(daily_doc, "inputs.mindset.journalNote")
            if journal_note:
                try:
                    ai_text = get_emotional_ai()
                    analysis = ai_text.analyze(journal_note)
                    ai_emotion = analysis.get("emotion", "neutral")
                except:
                    pass

        # --- 6. PREDIZIONE ---
        predictor = get_sleep_predictor()
        risk_score = predictor.predict_risk(
            stress=int(stress),
            anxiety=int(anxiety),
            steps=int(steps),
            active_minutes=int(active_minutes),
            calories=int(calories_intake),
            caffeine=int(caffeine),
            ai_emotion=str(ai_emotion),
        )

        # --- 7. RISPOSTA ---
        risk_label = "Basso"
        if risk_score == 1:
            risk_label = "Alto"

        return {
            "risk_score": risk_score,
            "risk_label": risk_label,
            "message": "Dormirai bene!" if risk_score == 0 else "Attenzione: rischio sonno disturbato.",
            "factors": {
                "date": today_str,
                "stress": stress,
                "anxiety": anxiety,
                "steps": steps,
                "calories_intake": calories_intake,
                "ai_emotion": ai_emotion,
            },
        }

    except Exception as e:
        print(f"Errore predizione: {e}")
        raise HTTPException(status_code=500, detail=f"Errore interno predizione: {e}")