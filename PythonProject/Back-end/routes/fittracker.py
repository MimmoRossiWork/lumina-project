from fastapi import APIRouter, HTTPException
from bson import ObjectId
from db import get_collection
from models import FitDayCreate, FitDayOut, ExerciseAdd, StepsPayload, FitDayQuery, ExerciseDelete
from datetime import datetime
from .score_utils import restore_section_and_recompute_total

# --- SportOmics configuration ---
DAILY_STEPS_TARGET = 10000
DAILY_ACTIVE_MIN_TARGET = 60
DAILY_ACTIVE_CAL_TARGET = 600
EMA_ALPHA_SPORT = 0.10

SPORT_TOTAL_IMPACT_MAX = 0.1

SPORTOMICS_DELTA_CAP = SPORT_TOTAL_IMPACT_MAX * 6.0

STEPS_WEIGHT = 0.50
BURN_WEIGHT = 0.35
DURATION_WEIGHT = 0.15


def _calculate_step_score(steps: int) -> int:
    if steps < 0:
        steps = 0
    ratio = steps / DAILY_STEPS_TARGET if DAILY_STEPS_TARGET > 0 else 0
    if ratio <= 1:
        return int(max(0, min(100, ratio * 100)))
    if ratio <= 1.3:
        return 100
    # penalità per over-steps: scende di 80 punti per 100% extra oltre 1.3x
    dist = ratio - 1.3
    score = 100 - (dist * 80)
    return int(max(0, min(100, score)))


def _calculate_duration_score(minutes: int) -> int:
    if minutes < 0:
        minutes = 0
    ratio = minutes / DAILY_ACTIVE_MIN_TARGET if DAILY_ACTIVE_MIN_TARGET > 0 else 0
    if ratio <= 1:
        return int(max(0, min(100, ratio * 100)))
    if ratio <= 1.5:
        return 100
    # penalità per over-duration: scende di 120 punti per 100% extra oltre 1.5x
    dist = ratio - 1.5
    score = 100 - (dist * 120)
    return int(max(0, min(100, score)))


def _calculate_burn_score(burned_kcal: float) -> int:
    if burned_kcal <= 0:
        return 0
    ratio = burned_kcal / DAILY_ACTIVE_CAL_TARGET

    if 0.75 <= ratio <= 1.15:
        return 100
    if ratio < 0.75:
        dist = 0.75 - ratio
        penalty = dist * 140
    else:
        dist = ratio - 1.15
        penalty = dist * 150
    return int(max(0, 100 - penalty))


def calculate_daily_sport_score(daily_totals: dict, steps_obj: dict) -> float:
    steps = steps_obj.get("count", 0) if isinstance(steps_obj, dict) else 0
    burned = daily_totals.get("caloriesBurned", 0) if isinstance(daily_totals, dict) else 0
    minutes = daily_totals.get("activeMinutes", 0) if isinstance(daily_totals, dict) else 0
    s_score = _calculate_step_score(int(steps or 0))
    b_score = _calculate_burn_score(float(burned or 0))
    m_score = _calculate_duration_score(int(minutes or 0))
    final_score = (s_score * STEPS_WEIGHT) + (b_score * BURN_WEIGHT) + (m_score * DURATION_WEIGHT)
    return round(final_score, 1)


def _apply_capped_delta(current: float, target: float, cap: float = SPORTOMICS_DELTA_CAP) -> float:
    delta = target - current
    if delta > cap:
        delta = cap
    elif delta < -cap:
        delta = -cap
    return round(current + delta, 1)


async def update_user_sportomics(user_id: str, daily_sport_score: float):
    users_col = get_collection("users")
    score_history_col = get_collection("score_history")
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return
    user = await users_col.find_one({"_id": user_oid})
    if not user:
        return
    section_scores = user.get("sectionScores", {}) or {}
    current_sport = section_scores.get("sportOmics", 50)
    current_physio = section_scores.get("physioOmics", 50)

    ema_target = (current_sport * (1 - EMA_ALPHA_SPORT)) + (daily_sport_score * EMA_ALPHA_SPORT)
    new_sport = _apply_capped_delta(current_sport, ema_target)

    sleep_val = float(section_scores.get("sleepOmics", 50))

    new_physio = round((float(new_sport) + sleep_val) / 2.0, 1)
    section_scores["sportOmics"] = new_sport
    section_scores["physioOmics"] = new_physio
    # totalScore: usa physioOmics come rappresentante e non sommare sportOmics
    valid_scores = [
        v for k, v in section_scores.items()
        if k not in ("totalScore", "sportOmics") and isinstance(v, (int, float))
    ]
    if valid_scores:
        new_total = round(sum(valid_scores) / len(valid_scores), 1)
    else:
        new_total = float(user.get("totalScore", 50))
    await users_col.update_one({"_id": user_oid}, {"$set": {"sectionScores": section_scores, "totalScore": new_total}})


    try:
        hist_date = datetime.utcnow().strftime("%Y-%m-%d")
        change = {
            "when": datetime.utcnow(),
            "source": "fit",
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
        # ignore history failures
        pass


router = APIRouter(prefix="/api/v1/fit", tags=["fit"])


def _ensure_oid(user_id: str) -> ObjectId:
    try:
        return ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")


def _recompute_totals(doc: dict) -> dict:
    exercises = doc.get("exercises", []) or []
    calories_from_ex = sum(float(x.get("caloriesCalculated", 0)) for x in exercises)
    active_minutes = sum(float(x.get("durationMinutes", 0)) for x in exercises)
    steps_cal = float(doc.get("steps", {}).get("caloriesFromSteps", 0))
    return {
        "caloriesBurned": calories_from_ex + steps_cal,
        "activeMinutes": active_minutes,
    }


async def _get_day(user_oid: ObjectId, date_str: str) -> dict | None:
    col = get_collection("fit_entries")
    return await col.find_one({"userId": user_oid, "date": date_str})


def _build_out(doc: dict) -> FitDayOut:
    return FitDayOut(
        id=str(doc["_id"]),
        userId=str(doc["userId"]),
        date=doc["date"],
        steps=doc.get("steps", {"count": 0, "caloriesFromSteps": 0}),
        dailyTotals=doc.get("dailyTotals", {"caloriesBurned": 0, "activeMinutes": 0}),
        exercises=doc.get("exercises", []),
    )


@router.post("/day", response_model=FitDayOut, status_code=201)
async def create_or_replace_day(payload: FitDayCreate):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("fit_entries")
    doc = payload.dict()
    doc["userId"] = user_oid
    existing = await _get_day(user_oid, payload.date)
    if existing:
        await col.update_one({"_id": existing["_id"]}, {"$set": doc})
        stored_id = existing["_id"]
    else:
        res = await col.insert_one(doc)
        stored_id = res.inserted_id
    return FitDayOut(id=str(stored_id), **payload.dict())


@router.get("/day", response_model=FitDayOut)
async def get_day(query: FitDayQuery):
    user_oid = _ensure_oid(query.userId)
    doc = await _get_day(user_oid, query.date)
    if not doc:
        raise HTTPException(status_code=404, detail="Day not found")
    return _build_out(doc)


@router.post("/day/query", response_model=FitDayOut)
async def post_get_day(payload: FitDayQuery):
    user_oid = _ensure_oid(payload.userId)
    doc = await _get_day(user_oid, payload.date)
    if not doc:
        raise HTTPException(status_code=404, detail="Day not found")
    return _build_out(doc)


@router.patch("/steps", response_model=FitDayOut)
async def update_steps(payload: StepsPayload):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("fit_entries")
    doc = await _get_day(user_oid, payload.date)
    prev_count = doc.get("steps", {}).get("count", 0) if doc else 0
    steps_obj = {"count": payload.count, "caloriesFromSteps": payload.caloriesFromSteps}
    if doc:
        update = {"steps": steps_obj}
        col_totals = _recompute_totals({**doc, "steps": steps_obj})
        update["dailyTotals"] = col_totals
        await col.update_one({"_id": doc["_id"]}, {"$set": update})
        stored = await _get_day(user_oid, payload.date)
    else:
        new_doc = {
            "userId": user_oid,
            "date": payload.date,
            "steps": steps_obj,
            "exercises": [],
            "dailyTotals": {"caloriesBurned": payload.caloriesFromSteps, "activeMinutes": 0},
        }
        res = await col.insert_one(new_doc)
        stored = await col.find_one({"_id": res.inserted_id})

    if payload.count == 0 and prev_count and prev_count > 0:
        try:
            await restore_section_and_recompute_total(user_oid, "sportOmics", source="fit_reset")
        except Exception:
            pass

        stored = await _get_day(user_oid, payload.date)
        return _build_out(stored)

    if stored:
        daily_score = calculate_daily_sport_score(stored.get("dailyTotals", {}), stored.get("steps", {}))
        await update_user_sportomics(str(user_oid), daily_score)
    return _build_out(stored)


@router.post("/exercise", response_model=FitDayOut)
async def add_exercise(payload: ExerciseAdd):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("fit_entries")
    doc = await _get_day(user_oid, payload.date)
    ex = payload.exercise.dict()
    if doc:
        new_ex = doc.get("exercises", []) + [ex]
        totals = _recompute_totals({**doc, "exercises": new_ex})
        await col.update_one({"_id": doc["_id"]}, {"$set": {"exercises": new_ex, "dailyTotals": totals}})
        stored = await _get_day(user_oid, payload.date)
    else:
        totals = _recompute_totals({"exercises": [ex], "steps": {"count": 0, "caloriesFromSteps": 0}})
        new_doc = {
            "userId": user_oid,
            "date": payload.date,
            "steps": {"count": 0, "caloriesFromSteps": 0},
            "dailyTotals": totals,
            "exercises": [ex],
        }
        res = await col.insert_one(new_doc)
        stored = await col.find_one({"_id": res.inserted_id})

    if stored:
        daily_score = calculate_daily_sport_score(stored.get("dailyTotals", {}), stored.get("steps", {}))
        await update_user_sportomics(str(user_oid), daily_score)
    return _build_out(stored)


@router.delete("/exercise", response_model=FitDayOut)
async def delete_exercise(payload: ExerciseDelete):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("fit_entries")
    doc = await _get_day(user_oid, payload.date)
    if not doc:
        raise HTTPException(status_code=404, detail="Day not found")
    exercises = doc.get("exercises", []) or []
    if payload.index < 0 or payload.index >= len(exercises):
        raise HTTPException(status_code=400, detail="Invalid exercise index")
    new_ex = exercises[:payload.index] + exercises[payload.index+1:]
    totals = _recompute_totals({**doc, "exercises": new_ex})
    await col.update_one({"_id": doc["_id"]}, {"$set": {"exercises": new_ex, "dailyTotals": totals}})
    stored = await _get_day(user_oid, payload.date)

    try:
        steps_count = stored.get("steps", {}).get("count", 0)
        calories_burned = stored.get("dailyTotals", {}).get("caloriesBurned", 0)
        if (not steps_count or steps_count == 0) and (not calories_burned or calories_burned == 0):
            await restore_section_and_recompute_total(user_oid, "sportOmics", source="exercise_delete")
            stored = await _get_day(user_oid, payload.date)
            return _build_out(stored)
    except Exception:
        pass
    # update sportOmics
    if stored:
        daily_score = calculate_daily_sport_score(stored.get("dailyTotals", {}), stored.get("steps", {}))
        await update_user_sportomics(str(user_oid), daily_score)
    return _build_out(stored)
