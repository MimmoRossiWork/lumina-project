from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from fastapi.responses import JSONResponse

from db import get_collection
from models import WellbeingCreate, WellbeingOut
from ai_engine import get_emotional_ai

router = APIRouter(prefix="/api/v1/wellbeing", tags=["wellbeing"])


def _parse_user(user_id: str) -> ObjectId:
    try:
        return ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")


@router.post("/", response_model=WellbeingOut, status_code=201)
async def save_wellbeing(payload: WellbeingCreate, debug: bool = False):
    # Use daily_logs collection to store wellbeing under inputs.mindset
    daily_col = get_collection("daily_logs")
    user_oid = _parse_user(payload.userId)
    now = datetime.now(timezone.utc)

    # store date as midnight UTC for consistency with other daily logs
    try:
        date_dt = datetime.strptime(payload.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    mindset_obj = payload.moodMetrics.model_dump()
    # map dailyNote into mindset.journalNote
    if payload.dailyNote:
        mindset_obj["journalNote"] = payload.dailyNote

    # If a journalNote is present, run EmotionalAI analysis and attach results (defensive)
    if mindset_obj.get("journalNote"):
        try:
            ai = get_emotional_ai()
            ai_res = ai.analyze(mindset_obj.get("journalNote"))
            if isinstance(ai_res, dict):
                mindset_obj["aiEmotion"] = ai_res.get("emotion")
                mindset_obj["aiTags"] = ai_res.get("tags") or []
                mindset_obj["aiConfidence"] = ai_res.get("confidence")
            # minimal debug (no journal text)
            try:
                print(f"[wellbeing][AI] user {payload.userId} aiEmotion={mindset_obj.get('aiEmotion')} aiTags={mindset_obj.get('aiTags')} aiConfidence={mindset_obj.get('aiConfidence')}")
            except Exception:
                pass
        except Exception as _e:
            print('[wellbeing] AI analysis failed:', str(_e))

    # DEBUG MODE: compute mindset dry-run and return debug info without persisting
    if debug:
        # fetch user to get current sectionScores
        users_col = get_collection("users")
        user_doc = await users_col.find_one({"_id": user_oid})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        section_scores = user_doc.get("sectionScores") or {}
        old_psycho = float(section_scores.get("psychoOmics", 50.0))
        old_physio = float(section_scores.get("physioOmics", 50.0))
        old_nutri = float(section_scores.get("nutriOmics", 50.0))
        old_eco = float(section_scores.get("ecoOmics", 50.0))
        old_life = float(section_scores.get("lifeOmics", 50.0))
        old_socio = float(section_scores.get("socioOmics", 50.0))

        # Extract numeric mood metrics
        try:
            s = int(mindset_obj.get("stressLevel", 5))
        except Exception:
            s = 5
        try:
            a = int(mindset_obj.get("anxietyLevel", 5))
        except Exception:
            a = 5
        try:
            c = int(mindset_obj.get("copingAbility", 5))
        except Exception:
            c = 5

        stress_point = max(0, 10 - s)
        anxiety_point = max(0, 10 - a)
        coping_point = max(0, c)

        daily_mindset_score = (stress_point + anxiety_point + coping_point) / 3.0 * 10.0

        # low volatility update 5%
        new_psycho = (old_psycho * 0.95) + (daily_mindset_score * 0.05)
        new_total = (new_psycho + old_physio + old_nutri + old_eco + old_life + old_socio) / 6.0

        debug_obj = {
            "inputs": {"stress": s, "anxiety": a, "coping": c},
            "daily_score_calculated": round(daily_mindset_score, 2),
            "old_psycho": round(old_psycho, 2),
            "new_psycho": round(new_psycho, 2),
            "old_total": round(float(user_doc.get('totalScore', (old_psycho + old_physio + old_nutri + old_eco + old_life + old_socio) / 6.0)), 2),
            "new_total": round(new_total, 2),
        }
        try:
            import json
            print("--- DEBUG MINDSET (wellbeing endpoint) ---")
            print(json.dumps(debug_obj, indent=2, ensure_ascii=False))
            print("-----------------------------------------")
        except Exception:
            pass
        try:
            components = {
                "psycho (new)": round(new_psycho, 2),
                "physio (current)": round(old_physio, 2),
                "nutri (current)": round(old_nutri, 2),
                "eco (current)": round(old_eco, 2),
                "life (current)": round(old_life, 2),
                "socio (current)": round(old_socio, 2),
            }
            sum_val = sum(components.values())
            calc_mean = round(sum_val / 6.0, 2)
            total_debug = {**components, "SUM": round(sum_val, 2), "CALCULATED_MEAN (Sum/6)": calc_mean}
            print('--- DEBUG TOTAL COMPONENTS ---')
            print(json.dumps(total_debug, indent=2, ensure_ascii=False))
            print('------------------------------')
        except Exception:
            pass

        # Return raw JSON including debug (bypass response_model filtering)
        from bson import ObjectId as _Oid
        fake_id = str(_Oid())
        content = {
            "id": fake_id,
            "userId": payload.userId,
            "date": payload.date,
            "moodMetrics": mindset_obj,
            "dailyNote": mindset_obj.get('journalNote', ''),
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
            "debug": debug_obj,
        }
        return JSONResponse(content=content, status_code=200)

    update_doc = {
        "$set": {
            "userId": user_oid,
            "date": date_dt,
            "inputs.mindset": mindset_obj,
            "updatedAt": now,
        },
        "$setOnInsert": {"createdAt": now},
    }

    # Check if a wellbeing/mindset entry already exists for this user/date
    existing_doc = await daily_col.find_one({"userId": user_oid, "date": date_dt})
    existing_has_mindset = False
    if existing_doc and isinstance(existing_doc.get('inputs'), dict) and existing_doc.get('inputs').get('mindset'):
        existing_has_mindset = True

    await daily_col.update_one({"userId": user_oid, "date": date_dt}, update_doc, upsert=True)

    # fetch the latest doc (inserted or updated)
    doc = await daily_col.find_one({"userId": user_oid, "date": date_dt})
    if not doc:
        raise HTTPException(status_code=500, detail="Failed to save wellbeing data")

    # --- PERSIST SCORES: snapshot current user scores then compute new psychoOmics and totalScore and update users ---
    try:
        # If there's already a mindset entry in DB for this date, do NOT perform snapshot or update user scores
        if existing_has_mindset:
            print('[wellbeing] Existing mindset found for this date - skipping score calculations and user update')
        else:
            users_col = get_collection("users")
            score_history_col = get_collection("score_history")

            user_doc = await users_col.find_one({"_id": user_oid})
            if not user_doc:
                raise HTTPException(status_code=404, detail="User not found when saving scores")

            # current section scores
            section_scores = user_doc.get("sectionScores") or {}
            old_psycho = float(section_scores.get("psychoOmics", 50.0))
            old_physio = float(section_scores.get("physioOmics", 50.0))
            old_nutri = float(section_scores.get("nutriOmics", 50.0))
            old_eco = float(section_scores.get("ecoOmics", 50.0))
            old_life = float(section_scores.get("lifeOmics", 50.0))
            old_socio = float(section_scores.get("socioOmics", 50.0))

            # snapshot BEFORE updating user
            try:
                total_from_user = float(user_doc.get("totalScore", (old_psycho + old_physio + old_nutri + old_eco + old_life + old_socio) / 6.0))
            except Exception:
                total_from_user = (old_psycho + old_physio + old_nutri + old_eco + old_life + old_socio) / 6.0

            snapshot = {
                "userId": user_oid,
                "date": datetime.now(timezone.utc),
                "type": "daily_snapshot",
                "scores": {
                    "psychoOmics": old_psycho,
                    "sleepOmics": float(section_scores.get("sleepOmics", 50.0)),
                    "sportOmics": float(section_scores.get("sportOmics", 50.0)),
                    "physioOmics": old_physio,
                    "nutriOmics": old_nutri,
                    "ecoOmics": old_eco,
                    "lifeOmics": old_life,
                    "socioOmics": old_socio,
                    "totalScore": float(total_from_user),
                },
            }
            try:
                snap_now = datetime.now(timezone.utc)
                snap_start = datetime(snap_now.year, snap_now.month, snap_now.day, tzinfo=timezone.utc)
                snap_end = snap_start + timedelta(days=1)
                res = await score_history_col.update_one(
                    {"userId": user_oid, "type": "daily_snapshot", "date": {"$gte": snap_start, "$lt": snap_end}},
                    {"$set": snapshot},
                    upsert=True,
                )
                if getattr(res, 'upserted_id', None):
                    print('[wellbeing] Inserted snapshot BEFORE updating user (upsert)')
                else:
                    print('[wellbeing] Updated existing snapshot BEFORE updating user')
            except Exception:
                await score_history_col.insert_one(snapshot)
                try:
                    import json
                    print('[wellbeing] Inserted snapshot BEFORE updating user:')
                    print(json.dumps(snapshot['scores'], indent=2, ensure_ascii=False))
                except Exception:
                    pass

            # compute new scores based on mindset inputs saved in doc
            mm = doc.get("inputs", {}).get("mindset", {})
            try:
                s = int(mm.get("stressLevel", 5))
            except Exception:
                s = 5
            try:
                a = int(mm.get("anxietyLevel", 5))
            except Exception:
                a = 5
            try:
                c = int(mm.get("copingAbility", 5))
            except Exception:
                c = 5

            stress_point = max(0, 10 - s)
            anxiety_point = max(0, 10 - a)
            coping_point = max(0, c)
            daily_mindset_score = (stress_point + anxiety_point + coping_point) / 3.0 * 10.0

            new_psycho = (old_psycho * 0.95) + (daily_mindset_score * 0.05)
            new_total = (new_psycho + old_physio + old_nutri + old_eco + old_life + old_socio) / 6.0

            # persist update to users collection: only psychoOmics and totalScore
            await users_col.update_one(
                {"_id": user_oid},
                {"$set": {"sectionScores.psychoOmics": new_psycho, "totalScore": new_total}},
            )

            try:
                print('[wellbeing] Updated user with new psychoOmics and totalScore:')
                print(json.dumps({
                    'psychoOmics': round(new_psycho, 2),
                    'totalScore': round(new_total, 2),
                }, indent=2, ensure_ascii=False))
            except Exception:
                pass
        # end of else existing_has_mindset
    except HTTPException:
        raise
    except Exception as e:
        print('[wellbeing] Failed to persist scores:', str(e))
        # do not fail the request completely; return saved wellbeing but log the error
        pass

    # Return WellbeingOut (date as YYYY-MM-DD string to keep compatibility)
    return WellbeingOut(
        id=str(doc.get("_id")),
        userId=payload.userId,
        date=payload.date,
        moodMetrics=doc.get("inputs", {}).get("mindset", {}),
        dailyNote=(doc.get("inputs", {}).get("mindset", {}).get("journalNote") or ""),
        createdAt=doc.get("createdAt"),
        updatedAt=doc.get("updatedAt"),
    )


@router.get("/by-date", response_model=WellbeingOut | None)
async def get_wellbeing(userId: str, date: str):
    daily_col = get_collection("daily_logs")
    user_oid = _parse_user(userId)
    try:
        target_dt = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
    start_day = target_dt
    end_day = start_day + timedelta(days=1)

    doc = await daily_col.find_one({"userId": user_oid, "date": {"$gte": start_day, "$lt": end_day}})
    if not doc or not doc.get("inputs") or not doc.get("inputs").get("mindset"):
        return None

    mindset = doc.get("inputs").get("mindset")
    return WellbeingOut(
        id=str(doc.get("_id")),
        userId=userId,
        date=date,
        moodMetrics=mindset,
        dailyNote=(mindset.get("journalNote") or ""),
        createdAt=doc.get("createdAt"),
        updatedAt=doc.get("updatedAt"),
    )


@router.put("/{entry_id}", response_model=WellbeingOut)
async def update_wellbeing(entry_id: str, payload: WellbeingCreate):
    daily_col = get_collection("daily_logs")
    user_oid = _parse_user(payload.userId)
    try:
        entry_oid = ObjectId(entry_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid entry id")

    now = datetime.now(timezone.utc)

    mindset_obj = payload.moodMetrics.model_dump()
    if payload.dailyNote:
        mindset_obj["journalNote"] = payload.dailyNote

    update_doc = {
        "$set": {
            "inputs.mindset": mindset_obj,
            "updatedAt": now,
        }
    }

    result = await daily_col.update_one({"_id": entry_oid, "userId": user_oid}, update_doc)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Wellbeing entry not found")

    doc = await daily_col.find_one({"_id": entry_oid})
    return WellbeingOut(
        id=str(entry_oid),
        userId=str(doc.get("userId")),
        date=payload.date,
        moodMetrics=doc.get("inputs", {}).get("mindset"),
        dailyNote=(doc.get("inputs", {}).get("mindset", {}).get("journalNote") or ""),
        createdAt=doc.get("createdAt"),
        updatedAt=doc.get("updatedAt"),
    )
