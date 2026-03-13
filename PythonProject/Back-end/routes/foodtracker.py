from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
import importlib
from .score_utils import restore_section_and_recompute_total, _get_fallback_with_source


def _load_get_collection():
    try:
        return importlib.import_module('..db', package=__package__).get_collection
    except Exception:
        return importlib.import_module('db').get_collection

_db_get_collection = _load_get_collection()

def get_collection(name: str):
    """Wrapper to resolve get_collection dynamically (keeps static analyzer quiet)."""
    return _db_get_collection(name)


_models = None
try:
    _models = importlib.import_module('..models', package=__package__)
except Exception:
    _models = importlib.import_module('models')

FoodDayCreate = _models.FoodDayCreate
FoodDayOut = _models.FoodDayOut
FoodEntryAdd = _models.FoodEntryAdd
WaterUpdate = _models.WaterUpdate
FoodDayQuery = _models.FoodDayQuery
FoodEntry = _models.FoodEntry
FoodHistoryResponse = _models.FoodHistoryResponse
FoodHistoryItem = _models.FoodHistoryItem


DEFAULT_CALORIE_TARGET = 2000
WATER_TARGET_GLASSES = 8

router = APIRouter(prefix="/api/v1/food", tags=["food"])

CATEGORY_RULES = [
    {"category": "fast food", "keywords": ["fritto", "fried", "nugget", "patatine", "fast food", "kebab", "hot dog", "tempura"]},
    {"category": "dolci", "keywords": ["cioc", "bisc", "dolce", "torta", "dessert"]},
    {"category": "carne rossa", "keywords": ["hamburger", "burger", "manzo", "bovino", "bistecca", "salsiccia", "agnello", "vitello"]},
    {"category": "carne bianca", "keywords": ["pollo", "tacchino", "coniglio"]},
    {"category": "pesce", "keywords": ["pesce", "salmone", "tonno", "merluzzo"]},
    {"category": "salumi/processati", "keywords": ["salume", "salame", "prosciutto", "wurstel", "mortadella"]},
    {"category": "cereali", "keywords": ["pane", "riso", "pasta", "cereali", "farro", "orzo"]},
    {"category": "frutta", "keywords": ["mela", "banana", "pera", "arancia", "fragola", "uva", "pesca", "albicocca"]},
    {"category": "verdura", "keywords": ["insalata", "carota", "zucchina", "pomodoro", "broccolo", "spinac", "cavolo"]},
    {"category": "latticini", "keywords": ["latte", "yogurt", "formaggio", "burro"]},
    {"category": "legumi", "keywords": ["fagioli", "ceci", "lenticchie", "piselli"]},
]

CATEGORY_SCORE = {
    "verdura": 5,
    "legumi": 4,
    "pesce": 4,
    "carne bianca": 3,
    "frutta": 3,
    "cereali": 2,
    "latticini": 1,
    "carne rossa": -2,
    "dolci": -3,
    "salumi/processati": -4,
    "fast food": -5,
}

PENALTY_FREE_QTY = 2.0
PENALTY_PER_UNIT = 1.5


def _classify_category(name: str) -> str:
    k = name.lower()
    for rule in CATEGORY_RULES:
        if any(word in k for word in rule["keywords"]):
            return rule["category"]
    return "altro"


def _score_for_category(category: str) -> int | None:
    return CATEGORY_SCORE.get(category, None)


def _quantity_penalized_score(base_score: float | int | None, cumulative_qty: float) -> float | int | None:
    """Reduce score as quantity grows; healthy foods can turn negative when overconsumed."""
    if base_score is None:
        return None
    if base_score <= 0:
        return base_score
    excess = max(0.0, cumulative_qty - PENALTY_FREE_QTY)
    penalty = PENALTY_PER_UNIT * excess
    return base_score - penalty


def _calculate_calorie_score(current_calories: float, target_calories: float | None) -> int:
    target = target_calories if target_calories and target_calories > 0 else DEFAULT_CALORIE_TARGET
    if target <= 0:
        return 0
    ratio = current_calories / target if target else 0
    if 0.85 <= ratio <= 1.15:
        return 100
    if ratio < 0.85:
        dist = 0.85 - ratio
    else:
        dist = ratio - 1.15
    raw_score = 100 - (dist * 200)
    return max(0, int(raw_score))


def _apply_quantity_penalties(entries: list[dict]) -> list[dict]:
    by_cat_qty: dict[str, float] = {}
    adjusted: list[dict] = []
    for e in entries:
        cat = e.get("category", "altro")
        qty = float(e.get("quantity", 0) or 0)
        by_cat_qty[cat] = by_cat_qty.get(cat, 0) + qty
        base_score = e.get("score") if e.get("score") is not None else _score_for_category(cat)
        adjusted.append({**e, "score": _quantity_penalized_score(base_score, by_cat_qty[cat])})
    return adjusted


def _ensure_oid(user_id: str) -> ObjectId:
    try:
        return ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")


async def _update_nutriomics(user_oid: ObjectId, daily_totals: dict, water_glasses: int) -> None:
    """Best-effort: update users.sectionScores.nutriOmics and totalScore by at most ±0.2% combining quality & calorie score."""
    users_col = get_collection("users")
    user = await users_col.find_one({"_id": user_oid}, {"sectionScores": 1, "totalScore": 1})
    if not user:
        return
    section_scores = user.get("sectionScores") if isinstance(user.get("sectionScores"), dict) else {}


    try:
        items_count = int(daily_totals.get("items_count", 0))
    except Exception:
        items_count = 0
    try:
        calories = float(daily_totals.get("calories", 0))
    except Exception:
        calories = 0.0
    if items_count == 0 and calories == 0:

        try:
            await restore_section_and_recompute_total(user_oid, "nutriOmics", source="food_cleared")
        except Exception:
            pass
        return

    current_nutriomics = float(section_scores.get("nutriOmics", 0))
    composite = _daily_composite_score(daily_totals, water_glasses)

    delta_pct = max(-0.002, min(0.002, (composite - 50) / 500.0))
    new_nutriomics = current_nutriomics * (1 + delta_pct)


    psycho = float(section_scores.get("psychoOmics", 50))
    physio = float(section_scores.get("physioOmics", 50))
    eco = float(section_scores.get("ecoOmics", 50))
    life = float(section_scores.get("lifeOmics", 50))
    socio = float(section_scores.get("socioOmics", 50))
    new_total = (psycho + physio + new_nutriomics + eco + life + socio) / 6.0

    await users_col.update_one(
        {"_id": user_oid},
        {"$set": {"sectionScores.nutriOmics": new_nutriomics, "totalScore": new_total}},
    )


    try:
        score_history_col = get_collection("score_history")
        hist_date = datetime.utcnow().strftime("%Y-%m-%d")
        change = {
            "when": datetime.utcnow(),
            "source": "food",
            "scores": {**section_scores, "nutriOmics": new_nutriomics},
            "totalScore": new_total,
        }
        hist_set = {
            "userId": user_oid,
            "date": hist_date,
            "type": "daily_summary",
            "scores": {**section_scores, "nutriOmics": new_nutriomics},
            "totalScore": new_total,
            "updatedAt": datetime.utcnow(),
        }
        await score_history_col.update_one({"userId": user_oid, "date": hist_date, "type": "daily_summary"}, {"$set": hist_set}, upsert=True)
    except Exception:
        pass


async def _get_day_doc(user_oid: ObjectId, date_str: str) -> dict | None:
    col = get_collection("food_entries")
    return await col.find_one({"userId": user_oid, "date": date_str})


def _today_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _yesterday_iso() -> str:
    return (datetime.utcnow().date()).strftime("%Y-%m-%d")


async def _ensure_day_doc(
    user_oid: ObjectId,
    date_str: str,
    water_glasses: int = 0,
    calorie_target: float | int | None = None,
    auto_roll_today: bool = False,
) -> dict:
    """Return existing day or create a fresh one; no auto-roll unless explicitly requested."""
    target_date = date_str
    if auto_roll_today:
        today = _today_iso()
        if target_date < today:
            target_date = today

    col = get_collection("food_entries")
    existing = await _get_day_doc(user_oid, target_date)
    if existing:
        return existing
    target = calorie_target or DEFAULT_CALORIE_TARGET
    base_doc = {
        "userId": user_oid,
        "date": target_date,
        "waterGlasses": water_glasses,
        "foodEntries": [],
        "dailyTotals": _recompute_totals([], target),
    }
    res = await col.insert_one(base_doc)
    return await col.find_one({"_id": res.inserted_id})


def _enrich_entries(entries: list[dict]) -> list[dict]:
    enriched = []
    for e in entries:
        cat = e.get("category") or _classify_category(e.get("name", ""))
        base_score = e.get("score") if e.get("score") is not None else _score_for_category(cat)
        enriched.append({**e, "category": cat, "score": base_score})
    return _apply_quantity_penalties(enriched)


def _recompute_totals(entries: list[dict], calorie_target: float | int | None = None) -> dict:
    totals = {
        "calories": 0.0,
        "protein": 0.0,
        "carbs": 0.0,
        "fat": 0.0,
        "score": 0.0,
        "calorie_score": 0,
        "quality_score_sum": 0.0,
        "items_count": 0,
        "calorie_target": calorie_target,
    }
    for e in entries:
        totals["calories"] += float(e.get("calories", 0))
        totals["protein"] += float(e.get("protein", 0))
        totals["carbs"] += float(e.get("carbs", 0))
        totals["fat"] += float(e.get("fat", 0))
        if e.get("score") is not None:
            totals["score"] += float(e.get("score"))
            totals["quality_score_sum"] += float(e.get("score"))
            totals["items_count"] += 1
    totals["calorie_score"] = _calculate_calorie_score(totals["calories"], calorie_target)
    return totals


def _water_score(glasses: int | float | None, target: int | float = WATER_TARGET_GLASSES) -> float:
    """Score water: negative below half target, 0 at half, 100 at/above target."""
    g = 0 if glasses is None else float(glasses)
    t = float(target) if target else WATER_TARGET_GLASSES
    half = t / 2.0
    if g >= t:
        return 100.0
    if g <= half:
        # map 0..half to -100..0
        return -100.0 + (g / max(half, 1e-6)) * 100.0
    # map half..target to 0..100
    return (g - half) / max((t - half), 1e-6) * 100.0


def _daily_composite_score(daily_totals: dict, water_glasses: int) -> float:
    # 50% quality, 30% calorie adherence, 20% water (water can be negative if < half target)
    if daily_totals.get("items_count", 0) > 0:
        quality_score = float(daily_totals.get("quality_score_sum", 0)) / max(1.0, float(daily_totals.get("items_count", 1)))
        # use floats to avoid type-checker warnings
        quality_score = max(0.0, min(100.0, quality_score))
    else:
        quality_score = 50.0
    cal_score = float(daily_totals.get("calorie_score", 0))
    water_score = float(_water_score(water_glasses))
    final_daily = (quality_score * 0.50) + (cal_score * 0.30) + (water_score * 0.20)
    return round(final_daily, 1)


@router.post("/day", response_model=FoodDayOut, status_code=201)
async def create_or_replace_day(payload: FoodDayCreate):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("food_entries")
    existing = await _get_day_doc(user_oid, payload.date)
    # use Pydantic v2 model_dump instead of deprecated dict()
    doc = payload.model_dump()
    doc["userId"] = user_oid
    doc["foodEntries"] = _enrich_entries([
        {**e, "category": e.get("category") or _classify_category(e.get("name", ""))}
        for e in doc.get("foodEntries", [])
    ])
    calorie_target = doc.get("dailyTotals", {}).get("calorie_target") or getattr(payload.dailyTotals, "calorie_target", None) or DEFAULT_CALORIE_TARGET
    doc["dailyTotals"] = _recompute_totals(doc.get("foodEntries", []), calorie_target)
    if existing:
        await col.update_one({"_id": existing["_id"]}, {"$set": doc})
        stored_id = existing["_id"]
    else:
        res = await col.insert_one(doc)
        stored_id = res.inserted_id
    await _update_nutriomics(user_oid, doc.get("dailyTotals", {}), doc.get("waterGlasses", 0))
    return FoodDayOut(
        id=str(stored_id),
        userId=str(user_oid),
        date=payload.date,
        waterGlasses=doc.get("waterGlasses", 0),
        dailyTotals=doc.get("dailyTotals", {}),
        foodEntries=doc.get("foodEntries", []),
    )


@router.get("/day", response_model=FoodDayOut)
async def get_day(query: FoodDayQuery):
    user_oid = _ensure_oid(query.userId)
    today = _today_iso()
    doc = await _get_day_doc(user_oid, query.date)

    # if document exists and date is before today, create today's fresh day and return it (reset UI) but keep history intact
    if doc and doc.get("date") < today:
        doc = await _ensure_day_doc(user_oid, today, auto_roll_today=False)
    else:
        doc = await _ensure_day_doc(user_oid, query.date, auto_roll_today=False)

    entries = _enrich_entries(doc.get("foodEntries", []))
    calorie_target = doc.get("dailyTotals", {}).get("calorie_target") or DEFAULT_CALORIE_TARGET
    totals = _recompute_totals(entries, calorie_target)
    return FoodDayOut(
        id=str(doc["_id"]),
        userId=str(doc["userId"]),
        date=doc["date"],
        waterGlasses=doc.get("waterGlasses", 0),
        dailyTotals=totals,
        foodEntries=entries,
    )


@router.post("/day/query", response_model=FoodDayOut)
async def query_day(payload: FoodDayQuery):
    """POST variant to fetch a day document (used by frontend)."""
    return await get_day(payload)


@router.delete("/day")
async def delete_day(payload: FoodDayQuery):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("food_entries")
    res = await col.delete_one({"userId": user_oid, "date": payload.date})
    # if we deleted something, restore nutriOmics from history so totalScore reflects removal
    if res.deleted_count > 0:
        try:
            await restore_section_and_recompute_total(user_oid, "nutriOmics", source="food_delete")
        except Exception:
            pass
    return {"deleted": res.deleted_count > 0}


@router.post("/entry", response_model=FoodDayOut)
async def add_entry(payload: FoodEntryAdd):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("food_entries")
    doc = await _ensure_day_doc(user_oid, payload.date)
    entry = payload.entry.model_dump()
    entry["category"] = entry.get("category") or _classify_category(entry.get("name", ""))
    entry["score"] = entry.get("score") if entry.get("score") is not None else _score_for_category(entry.get("category"))

    if doc:
        existing_target = doc.get("dailyTotals", {}).get("calorie_target")
        new_entries = _enrich_entries(doc.get("foodEntries", []) + [entry])
        totals = _recompute_totals(new_entries, existing_target or DEFAULT_CALORIE_TARGET)
        update = {"foodEntries": new_entries, "dailyTotals": totals}
        await col.update_one({"_id": doc["_id"]}, {"$set": update})
        stored = await _get_day_doc(user_oid, payload.date)
    else:
        calorie_target = payload.entry.model_dump().get("calorie_target") or DEFAULT_CALORIE_TARGET
        new_doc = {
            "userId": user_oid,
            "date": payload.date,
            "waterGlasses": 0,
            "foodEntries": _enrich_entries([entry]),
        }
        new_doc["dailyTotals"] = _recompute_totals(new_doc["foodEntries"], calorie_target)
        res = await col.insert_one(new_doc)
        stored = await col.find_one({"_id": res.inserted_id})

    entries = _enrich_entries(stored.get("foodEntries", []))
    calorie_target = stored.get("dailyTotals", {}).get("calorie_target") or DEFAULT_CALORIE_TARGET
    totals = _recompute_totals(entries, calorie_target)
    await _update_nutriomics(user_oid, totals, stored.get("waterGlasses", 0))
    return FoodDayOut(
        id=str(stored["_id"]),
        userId=str(stored["userId"]),
        date=stored["date"],
        waterGlasses=stored.get("waterGlasses", 0),
        dailyTotals=totals,
        foodEntries=entries,
    )


@router.patch("/water", response_model=FoodDayOut)
async def update_water(payload: WaterUpdate):
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("food_entries")
    # ensure there is a day doc; if none, create a fresh one
    doc = await _ensure_day_doc(user_oid, payload.date)

    await col.update_one({"_id": doc["_id"]}, {"$set": {"waterGlasses": payload.waterGlasses}})
    doc = await _get_day_doc(user_oid, payload.date)
    entries = _enrich_entries(doc.get("foodEntries", []))
    calorie_target = doc.get("dailyTotals", {}).get("calorie_target") or DEFAULT_CALORIE_TARGET
    totals = _recompute_totals(entries, calorie_target)
    await _update_nutriomics(user_oid, totals, doc.get("waterGlasses", 0))
    return FoodDayOut(
        id=str(doc["_id"]),
        userId=str(doc["userId"]),
        date=doc["date"],
        waterGlasses=doc.get("waterGlasses", 0),
        dailyTotals=totals,
        foodEntries=entries,
    )


@router.get("/history", response_model=FoodHistoryResponse)
async def get_history(userId: str, limit: int = Query(7, ge=1, le=30)):
    """Return the latest N days (including today) with calories, macros, water and food list."""
    user_oid = _ensure_oid(userId)
    col = get_collection("food_entries")
    cursor = col.find({"userId": user_oid}).sort("date", -1).limit(limit)
    days: list[FoodHistoryItem] = []
    async for doc in cursor:
        entries = _enrich_entries(doc.get("foodEntries", []))
        totals = _recompute_totals(entries, doc.get("dailyTotals", {}).get("calorie_target") or DEFAULT_CALORIE_TARGET)
        days.append(
            FoodHistoryItem(
                date=doc.get("date"),
                waterGlasses=int(doc.get("waterGlasses", 0) or 0),
                calories=totals.get("calories", 0),
                protein=totals.get("protein", 0),
                carbs=totals.get("carbs", 0),
                fat=totals.get("fat", 0),
                foods=[
                    {
                        "name": e.get("name"),
                        "calories": e.get("calories"),
                        "meal": e.get("meal"),
                        "quantity": e.get("quantity"),
                        "unit": e.get("unit"),
                        "category": e.get("category"),
                    }
                    for e in entries
                ],
            )
        )
    return FoodHistoryResponse(days=list(reversed(days)))


@router.post("/restore_section")
async def restore_section_endpoint(userId: str, section: str = "nutriOmics"):
    """Utility endpoint to force restore a given section score for a user (useful for testing).
    Returns the restored value and its source (yesterday/latest/questionnaire/default).
    """
    user_oid = _ensure_oid(userId)
    try:
        fallback_value, fallback_source = await _get_fallback_with_source(user_oid, section)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not determine fallback: {exc}")
    try:
        await restore_section_and_recompute_total(user_oid, section, source="manual_restore")
        return {"restored": True, "section": section, "restoredValue": fallback_value, "source": fallback_source}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/recompute", response_model=FoodDayOut)
async def recompute_day(payload: FoodDayQuery):
    """Force recompute nutriOmics for the given day: if day empty -> restore, else recompute normally."""
    user_oid = _ensure_oid(payload.userId)
    col = get_collection("food_entries")
    doc = await _get_day_doc(user_oid, payload.date)
    if not doc:
        # if no doc, create an empty day and restore
        doc = await _ensure_day_doc(user_oid, payload.date)
    entries = _enrich_entries(doc.get("foodEntries", []))
    calorie_target = doc.get("dailyTotals", {}).get("calorie_target") or DEFAULT_CALORIE_TARGET
    totals = _recompute_totals(entries, calorie_target)
    # if day empty, restore; else update nutriomics using totals
    items_count = int(totals.get("items_count", 0) or 0)
    calories = float(totals.get("calories", 0) or 0.0)
    if items_count == 0 and calories == 0:
        try:
            await restore_section_and_recompute_total(user_oid, "nutriOmics", source="manual_recompute")
        except Exception:
            pass
    else:
        await _update_nutriomics(user_oid, totals, doc.get("waterGlasses", 0))
    # return latest day view
    entries = _enrich_entries((await _get_day_doc(user_oid, payload.date)).get("foodEntries", []))
    calorie_target = (await _get_day_doc(user_oid, payload.date)).get("dailyTotals", {}).get("calorie_target") or DEFAULT_CALORIE_TARGET
    totals = _recompute_totals(entries, calorie_target)
    return FoodDayOut(
        id=str((await _get_day_doc(user_oid, payload.date)).get("_id")),
        userId=str(user_oid),
        date=payload.date,
        waterGlasses=(await _get_day_doc(user_oid, payload.date)).get("waterGlasses", 0),
        dailyTotals=totals,
        foodEntries=entries,
    )
