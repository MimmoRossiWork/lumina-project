from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from datetime import time as dtime

from models import DailyCheckInRaw, DailyLogResponse, SleepInput, SleepClearPayload
from db import get_collection
from ai_engine import get_emotional_ai

router = APIRouter(prefix="/api/v1/checkin", tags=["checkin"])


def calculate_sleep_score(duration_minutes: int, awakenings: int, bed_time: str) -> int:
    try:
        dur = max(0, int(duration_minutes))
        awk = max(0, int(awakenings))
    except Exception:
        return 0

    # Durata (max 60)
    if 420 <= dur <= 540:
        dur_score = 60
    elif 360 <= dur <= 419:
        dur_score = 45
    elif 300 <= dur <= 359:
        dur_score = 30
    elif dur < 300:
        dur_score = 10
    else:  # dur > 540
        dur_score = 50

    # Continuità (max 30)
    if awk == 0:
        cont_score = 30
    elif awk == 1:
        cont_score = 25
    elif awk == 2:
        cont_score = 15
    elif awk == 3:
        cont_score = 10
    else:
        cont_score = 0

    # Orario (max 10)
    bed_score = 0
    try:
        hh, mm = bed_time.split(":")
        bt = dtime(int(hh), int(mm))
        if dtime(21, 0) <= bt <= dtime(0, 30):
            bed_score = 10
        elif dtime(0, 31) <= bt <= dtime(1, 30):
            bed_score = 7
        elif dtime(1, 31) <= bt <= dtime(3, 0):
            bed_score = 4
        else:
            bed_score = 0
    except Exception:
        bed_score = 0

    total = dur_score + cont_score + bed_score
    return max(0, min(100, int(total)))


def _score_mood(mood: int | None) -> float:
    if mood is None:
        return 0.0
    return max(0.0, min(100.0, (mood - 1) * 25.0))


def _score_energy(level: int | None) -> float:
    if level is None:
        return 0.0
    # Mappa 1-10 direttamente a 10-100
    return float(max(0, min(10, level)) * 10)


def _score_sport(flag: bool | None) -> float:
    if flag is None:
        return 0.0
    return 100.0 if flag else 50.0


def _score_sleep(hours: float | None) -> float:

    try:
        if hours is None:
            return 0.0
        h = float(hours)
    except Exception:
        return 0.0

    if 7.0 <= h <= 9.0:
        return 100.0
    if 5.0 <= h <= 6.0:
        return 50.0
    if h < 5.0:
        return 0.0
    # 10 or more hours, treat as 60 (per spec)
    return 60.0


def _get_old_scores_from_user(user_doc: dict) -> dict:
    section_scores = user_doc.get("sectionScores") or {}
    return {
        "psychoOmics": float(section_scores.get("psychoOmics", 50)),
        "sleepOmics": float(section_scores.get("sleepOmics", 50)),
        "sportOmics": float(section_scores.get("sportOmics", 50)),
        "physioOmics": float(section_scores.get("physioOmics", 50)),
        "nutriOmics": float(section_scores.get("nutriOmics", 50)),
        "ecoOmics": float(section_scores.get("ecoOmics", 50)),
        "lifeOmics": float(section_scores.get("lifeOmics", 50)),
        "socioOmics": float(section_scores.get("socioOmics", 50)),
    }


def _weighted(old: float, daily: float) -> float:
    return (old * 0.9) + (daily * 0.1)


@router.post("/raw", response_model=DailyLogResponse, status_code=201)
async def save_daily_checkin_raw(payload: DailyCheckInRaw, debug: bool = False):
    daily_logs_col = get_collection("daily_logs")
    users_col = get_collection("users")
    score_history_col = get_collection("score_history")

    try:
        user_oid = ObjectId(payload.userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")

    user = await users_col.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)


    try:
        old_scores_user = _get_old_scores_from_user(user)
        # compute a sensible totalScore fallback if missing
        try:
            total_from_user = float(user.get("totalScore"))
        except Exception:
            total_from_user = (
                old_scores_user.get("psychoOmics", 50.0)
                + old_scores_user.get("physioOmics", 50.0)
                + old_scores_user.get("nutriOmics", 50.0)
                + old_scores_user.get("ecoOmics", 50.0)
                + old_scores_user.get("lifeOmics", 50.0)
                + old_scores_user.get("socioOmics", 50.0)
            ) / 6.0

        snapshot_before = {
            "userId": user_oid,
            "date": now,
            "type": "daily_snapshot",
            "scores": {
                "psychoOmics": float(old_scores_user.get("psychoOmics", 50.0)),
                "sleepOmics": float(old_scores_user.get("sleepOmics", 50.0)),
                "sportOmics": float(old_scores_user.get("sportOmics", 50.0)),
                "physioOmics": float(old_scores_user.get("physioOmics", 50.0)),
                "nutriOmics": float(old_scores_user.get("nutriOmics", 50.0)),
                "ecoOmics": float(old_scores_user.get("ecoOmics", 50.0)),
                "lifeOmics": float(old_scores_user.get("lifeOmics", 50.0)),
                "socioOmics": float(old_scores_user.get("socioOmics", 50.0)),
                "totalScore": float(total_from_user),
            },
        }

        try:
            snap_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
            snap_end = snap_start + timedelta(days=1)
            res = await score_history_col.update_one(
                {"userId": user_oid, "type": "daily_snapshot", "date": {"$gte": snap_start, "$lt": snap_end}},
                {"$set": snapshot_before},
                upsert=True,
            )
            if getattr(res, 'upserted_id', None):
                print("[checkin] Inserted snapshot BEFORE calculations (upsert)")
            else:
                print("[checkin] Updated existing snapshot BEFORE calculations")
        except Exception:

            await score_history_col.insert_one(snapshot_before)
            print("[checkin] Inserted snapshot BEFORE calculations:")
        try:
            import json
            print(json.dumps(snapshot_before["scores"], indent=2, ensure_ascii=False))
        except Exception:
            pass
    except Exception as _snap_e:
        print("[checkin] Warning: failed to write snapshot before calculations:", str(_snap_e))

    now = datetime.now(timezone.utc)


    if payload.date:
        try:
            target_dt = datetime.strptime(payload.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
        start_day = target_dt
    else:
        start_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end_day = start_day + timedelta(days=1)

    existing_log = await daily_logs_col.find_one({
        "userId": user_oid,
        "date": {"$gte": start_day, "$lt": end_day},
    })

    existing_inputs = (existing_log or {}).get("inputs", {}) if existing_log else {}

    is_edit = existing_log is not None


    effective_mood = payload.mood if payload.mood is not None else existing_inputs.get("mood")

    if getattr(payload, 'sleepHours', None) is not None:
        effective_energy = payload.sleepHours
    elif getattr(payload, 'energy', None) is not None:
        effective_energy = payload.energy
    else:
        effective_energy = existing_inputs.get("sleepHours") if existing_inputs.get("sleepHours") is not None else existing_inputs.get("energy")

    effective_sport = payload.sport if payload.sport is not None else existing_inputs.get("sport")

    effective_mood = effective_mood if effective_mood is not None else 0
    effective_energy = effective_energy if effective_energy is not None else 5
    effective_sport = effective_sport if effective_sport is not None else False

    if is_edit:

        latest_history = await score_history_col.find_one(
            {"userId": user_oid}, sort=[("date", -1)]
        )
        history_scores = (latest_history or {}).get("scores") or {}
        old_scores = {
            "psychoOmics": float(history_scores.get("psychoOmics", 50)),
            "sleepOmics": float(history_scores.get("sleepOmics", 50)),
            "sportOmics": float(history_scores.get("sportOmics", 50)),
            "physioOmics": float(history_scores.get("physioOmics", 50)),
            "nutriOmics": float(history_scores.get("nutriOmics", 50)),
            "ecoOmics": float(history_scores.get("ecoOmics", 50)),
            "lifeOmics": float(history_scores.get("lifeOmics", 50)),
            "socioOmics": float(history_scores.get("socioOmics", 50)),
        }
    else:

        old_scores = _get_old_scores_from_user(user)

    daily_psycho = _score_mood(effective_mood)

    daily_energy_score = _score_energy(effective_energy)  # Modificato

    daily_sport = _score_sport(effective_sport)

    # ensure floats
    daily_psycho = float(daily_psycho)
    daily_sleep = float(_score_sleep(effective_energy))
    daily_sport = float(daily_sport)

    new_psycho = _weighted(old_scores["psychoOmics"], daily_psycho)
    # Use the energy->sleepHours normalized score for updating sleepOmics
    new_sleep = _weighted(old_scores["sleepOmics"], daily_sleep)
    new_sport = _weighted(old_scores["sportOmics"], daily_sport)
    new_physio = (new_sleep + new_sport) / 2.0

    nutri_old = old_scores["nutriOmics"]
    eco_old = old_scores["ecoOmics"]
    life_old = old_scores["lifeOmics"]
    socio_old = old_scores["socioOmics"]

    new_total = (
        new_psycho
        + new_physio
        + nutri_old
        + eco_old
        + life_old
        + socio_old
    ) / 6.0

    # --- DEBUG BLOCK ---
    try:
        import json
        # Prendi i punteggi direttamente dalla collection User (sectionScores)
        old_scores_user = _get_old_scores_from_user(user)


        if payload.mood is not None:
            daily_psycho_dbg = _score_mood(payload.mood)
        elif existing_inputs.get('mood') is not None:
            daily_psycho_dbg = _score_mood(existing_inputs.get('mood'))
        else:
            daily_psycho_dbg = None


        if payload.sport is not None:
            daily_sport_dbg = _score_sport(payload.sport)
        elif existing_inputs.get('sport') is not None:
            daily_sport_dbg = _score_sport(existing_inputs.get('sport'))
        else:
            daily_sport_dbg = None


        daily_sleep_dbg = None
        try:
            if payload.sleep is not None and getattr(payload.sleep, 'calculatedScore', None) is not None:
                # Pydantic model may not include calculatedScore; check dict
                daily_sleep_dbg = float(payload.sleep.calculatedScore)
            elif payload.sleep is not None and payload.sleep.awakenings is not None and payload.sleep.bedTime is not None and payload.sleep.wakeTime is not None:
                # If payload provided times but no calculatedScore, try to compute duration-based score locally
                try:
                    bed_dt = datetime.strptime(f"{start_day.date()} {payload.sleep.bedTime}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
                    wake_dt = datetime.strptime(f"{start_day.date()} {payload.sleep.wakeTime}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
                    if wake_dt <= bed_dt:
                        wake_dt = wake_dt + timedelta(days=1)
                    duration_minutes = int((wake_dt - bed_dt).total_seconds() // 60)
                    daily_sleep_dbg = float(calculate_sleep_score(duration_minutes, payload.sleep.awakenings, payload.sleep.bedTime))
                except Exception:
                    daily_sleep_dbg = None
            elif payload.sleepHours is not None:
                daily_sleep_dbg = _score_sleep(payload.sleepHours)
            else:

                existing_sleep = existing_inputs.get('sleep') or {}
                if existing_sleep and existing_sleep.get('calculatedScore') is not None:
                    daily_sleep_dbg = float(existing_sleep.get('calculatedScore'))
                elif existing_inputs.get('sleepHours') is not None:
                    daily_sleep_dbg = _score_sleep(existing_inputs.get('sleepHours'))
                else:
                    daily_sleep_dbg = None
        except Exception:
            daily_sleep_dbg = None


        old_psycho = float(old_scores_user.get("psychoOmics", 50.0))
        old_sleep = float(old_scores_user.get("sleepOmics", 50.0))
        old_sport = float(old_scores_user.get("sportOmics", 50.0))
        old_nutri = float(old_scores_user.get("nutriOmics", 50.0))
        old_eco = float(old_scores_user.get("ecoOmics", 50.0))
        old_life = float(old_scores_user.get("lifeOmics", 50.0))
        old_socio = float(old_scores_user.get("socioOmics", 50.0))


        if daily_psycho_dbg is not None:
            new_psycho_user = _weighted(old_psycho, daily_psycho_dbg)
        else:
            new_psycho_user = old_psycho

        if daily_sleep_dbg is not None:
            new_sleep_user = _weighted(old_sleep, daily_sleep_dbg)
        else:
            new_sleep_user = old_sleep

        if daily_sport_dbg is not None:
            new_sport_user = _weighted(old_sport, daily_sport_dbg)
        else:
            new_sport_user = old_sport


        new_physio_user = (new_sleep_user + old_sport) / 2.0


        new_total_user = (
            new_psycho_user
            + new_physio_user
            + old_nutri
            + old_eco
            + old_life
            + old_socio
        ) / 6.0


        def _r(v):
            try:
                return round(float(v), 2)
            except Exception:
                return v

        debug_payload = {
            "old_scores_from_user": {k: _r(v) for k, v in old_scores_user.items()},
            "daily_scores_normalized": {
                "psycho": _r(daily_psycho_dbg) if daily_psycho_dbg is not None else None,
                "sleep": _r(daily_sleep_dbg) if daily_sleep_dbg is not None else None,
                "sport": _r(daily_sport_dbg) if daily_sport_dbg is not None else None,
            },
            "new_scores_based_on_user": {
                "psycho": _r(new_psycho_user),
                "sleep": _r(new_sleep_user),
                "sport": _r(new_sport_user),
                "physio": _r(new_physio_user),
            },
            "unchanged_sections_used_in_total": {
                "nutri": _r(old_nutri),
                "eco": _r(old_eco),
                "life": _r(old_life),
                "socio": _r(old_socio),
            },
            "new_total_based_on_user": _r(new_total_user),
        }

        print("--- DEBUG DAILY-CHECKIN (USER SOURCE) ---")
        print(json.dumps(debug_payload, indent=2, ensure_ascii=False))
        print("-----------------------------------------")
    except Exception as _dbg_e:
        try:
            print("DEBUG (daily-checkin) failed:", str(_dbg_e))
        except Exception:
            pass
    # --- end DEBUG BLOCK ---

    # --- MINDSET DRY-RUN BLOCK ---
    skip_user_update_for_mindset = False
    debug_mindset = None
    try:
        if getattr(payload, 'mindset', None) is not None:
            mm = payload.mindset
            # extract numeric values with sensible defaults
            try:
                s_val = int(mm.stressLevel) if getattr(mm, 'stressLevel', None) is not None else 5
            except Exception:
                s_val = 5
            try:
                a_val = int(mm.anxietyLevel) if getattr(mm, 'anxietyLevel', None) is not None else 5
            except Exception:
                a_val = 5
            try:
                c_val = int(mm.copingAbility) if getattr(mm, 'copingAbility', None) is not None else 5
            except Exception:
                c_val = 5


            stress_point = max(0, 10 - s_val)
            anxiety_point = max(0, 10 - a_val)
            coping_point = max(0, c_val)

            daily_mindset_score = (stress_point + anxiety_point + coping_point) / 3.0 * 10.0


            old_scores_user_for_mind = _get_old_scores_from_user(user)
            old_psycho = float(old_scores_user_for_mind.get('psychoOmics', 50.0))
            old_physio = float(old_scores_user_for_mind.get('physioOmics', 50.0))
            old_nutri = float(old_scores_user_for_mind.get('nutriOmics', 50.0))
            old_eco = float(old_scores_user_for_mind.get('ecoOmics', 50.0))
            old_life = float(old_scores_user_for_mind.get('lifeOmics', 50.0))
            old_socio = float(old_scores_user_for_mind.get('socioOmics', 50.0))


            new_psycho_mind = (old_psycho * 0.95) + (daily_mindset_score * 0.05)

            new_total_mind = (
                new_psycho_mind + old_physio + old_nutri + old_eco + old_life + old_socio
            ) / 6.0

            debug_mindset = {
                 "inputs": {"stress": s_val, "anxiety": a_val, "coping": c_val},
                 "daily_score_calculated": round(daily_mindset_score, 2),
                 "old_psycho": round(old_psycho, 2),
                 "new_psycho": round(new_psycho_mind, 2),
                 "old_total": round(float(user.get('totalScore', sum(old_scores_user_for_mind.values()) / 6.0)), 2),
                 "new_total": round(new_total_mind, 2),
             }

            # Ensure we do not persist the new scores in this dry-run mode
            skip_user_update_for_mindset = True
    except Exception as _mind_e:
        try:
            print("DEBUG MINDSET failed:", str(_mind_e))
        except Exception:
            pass
    # --- end MINDSET DRY-RUN BLOCK ---


    merged_inputs = {**existing_inputs}
    if payload.mood is not None:
        merged_inputs["mood"] = payload.mood
    if payload.sleepHours is not None:
        merged_inputs["sleepHours"] = payload.sleepHours
    if payload.sport is not None:
        merged_inputs["sport"] = payload.sport
    if payload.sleep is not None:
        merged_inputs["sleep"] = {
            "bedTime": payload.sleep.bedTime,
            "wakeTime": payload.sleep.wakeTime,
            "awakenings": payload.sleep.awakenings,
            "coffeeLog": payload.sleep.coffeeLog or [],
        }

        # Calcolo qualità sonno solo se orari presenti
        try:
            bed_dt = datetime.strptime(f"{start_day.date()} {payload.sleep.bedTime}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            wake_dt = datetime.strptime(f"{start_day.date()} {payload.sleep.wakeTime}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            if wake_dt <= bed_dt:
                wake_dt = wake_dt + timedelta(days=1)
            duration_minutes = int((wake_dt - bed_dt).total_seconds() // 60)
            merged_inputs["sleep"]["calculatedScore"] = calculate_sleep_score(
                duration_minutes,
                payload.sleep.awakenings,
                payload.sleep.bedTime,
            )
        except Exception:
            pass


    if getattr(payload, 'mindset', None) is not None:
        try:
            mm = payload.mindset
            # estrai il testo del diario se presente
            journal_text = getattr(mm, 'journalText', None) or getattr(mm, 'journalNote', None)

            # Esegui l'analisi AI solo se il testo del diario è fornito
            if journal_text:

                try:
                    ai = get_emotional_ai()
                    ai_result = ai.analyze(journal_text)
                except Exception:
                    ai_result = None

                # Estrai i risultati dall'output AI
                if ai_result and isinstance(ai_result, dict):
                    ai_emotion = ai_result.get('emotion')
                    ai_tags = ai_result.get('tags')
                    ai_confidence = ai_result.get('confidence')
                else:
                    ai_emotion = None
                    ai_tags = []
                    ai_confidence = None


                try:
                    print(f"[checkin][AI] result for user {str(user_oid)}: emotion={ai_emotion} tags={ai_tags} confidence={ai_confidence}")
                except Exception:
                    pass

                # Costruisci il dizionario dei dati mindset da salvare
                mindset_data = {
                    "stressLevel": mm.stressLevel,
                    "anxietyLevel": mm.anxietyLevel,
                    "copingAbility": mm.copingAbility,
                    "journalNote": journal_text,
                    "aiEmotion": ai_emotion,
                    "aiTags": ai_tags,
                    "aiConfidence": ai_confidence,
                }

                # Salva i dati mindset nell'input unificato
                merged_inputs["mindset"] = mindset_data
        except Exception as e:
            print("[checkin] Mindset AI analysis error:", str(e))
    # --- fine integrazione AI ---

    log_doc = {
        "userId": user_oid,
        "date": start_day,
        "inputs": merged_inputs,
    }

    if is_edit:
        await daily_logs_col.update_one(
            {"_id": existing_log["_id"]},
            {"$set": log_doc},
        )
        daily_log_id = existing_log["_id"]
    else:
        insert_res = await daily_logs_col.insert_one(log_doc)
        daily_log_id = insert_res.inserted_id

    # Debug del calcolo sonno
    try:
        sleep_dbg = merged_inputs.get("sleep", {})
        if "calculatedScore" in sleep_dbg:
            print("--- DEBUG SLEEP SCORE ---")
            print(f"DATE: {start_day.date()}")
            print(f"BED: {sleep_dbg.get('bedTime')} WAKE: {sleep_dbg.get('wakeTime')} AWK: {sleep_dbg.get('awakenings')}")
            print(f"SCORE: {sleep_dbg.get('calculatedScore')}")
            print("-------------------------")
    except Exception:
        pass


    try:
        import json
        print("[checkin] Computed new scores to apply to user:")
        print(json.dumps({
            "psychoOmics": round(float(new_psycho), 2),
            "sleepOmics": round(float(new_sleep), 2),
            "sportOmics": round(float(new_sport), 2),
            "physioOmics": round(float(new_physio), 2),
            "nutriOmics": round(float(nutri_old), 2),
            "ecoOmics": round(float(eco_old), 2),
            "lifeOmics": round(float(life_old), 2),
            "socioOmics": round(float(socio_old), 2),
            "totalScore": round(float(new_total), 2),
        }, indent=2, ensure_ascii=False))
    except Exception:
        pass


        if skip_user_update_for_mindset:
            print('[checkin] Mindset dry-run detected - skipping user sectionScores update (no persistence)')
        else:
            # Prepariamo l'oggetto con TUTTI i punteggi
            new_section_scores = {
                "psychoOmics": new_psycho,
                "sleepOmics": new_sleep,
                "sportOmics": new_sport,
                "physioOmics": new_physio,
                "nutriOmics": nutri_old,
                "ecoOmics": eco_old,
                "lifeOmics": life_old,
                "socioOmics": socio_old,
            }

            # Aggiorniamo l'utente completo + updatedAt
            await users_col.update_one(
                {"_id": user_oid},
                {
                    "$set": {
                        "sectionScores": new_section_scores,
                        "totalScore": new_total,
                        "updatedAt": datetime.now(timezone.utc),
                    }
                },
            )


            try:
                hist_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                hist_doc = {
                    "userId": user_oid,
                    "date": hist_date,
                    "type": "daily_summary",
                    "scores": {**new_section_scores, "totalScore": new_total},
                    "totalScore": new_total,
                    "updatedAt": datetime.now(timezone.utc),
                }
                # Upsert: se esiste già un summary per oggi, lo aggiorna
                await score_history_col.update_one(
                    {"userId": user_oid, "date": hist_date, "type": "daily_summary"},
                    {"$set": hist_doc},
                    upsert=True
                )
            except Exception as e:
                print(f"[checkin] Failed to save history summary: {e}")


    if debug and debug_mindset is not None:
        return {"dailyLogId": str(daily_log_id), "debug": debug_mindset}

    return DailyLogResponse(dailyLogId=str(daily_log_id))


@router.get("/status/today")
async def daily_checkin_status(userId: str):
    daily_logs_col = get_collection("daily_logs")
    try:
        user_oid = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")

    now = datetime.now(timezone.utc)
    start_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end_today = start_today + timedelta(days=1)

    log = await daily_logs_col.find_one({
        "userId": user_oid,
        "date": {"$gte": start_today, "$lt": end_today},
    })
    if not log:
        return {"exists": False}
    return {
        "exists": True,
        "dailyLogId": str(log.get("_id")),
        "inputs": log.get("inputs") or {}
    }


@router.get("/by-date")
async def daily_checkin_by_date(userId: str, date: str):
    daily_logs_col = get_collection("daily_logs")
    try:
        user_oid = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")

    try:
        target_dt = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    start_day = target_dt
    end_day = start_day + timedelta(days=1)

    log = await daily_logs_col.find_one({
        "userId": user_oid,
        "date": {"$gte": start_day, "$lt": end_day},
    })
    if not log:
        return {"exists": False}
    return {
        "exists": True,
        "dailyLogId": str(log.get("_id")),
        "inputs": log.get("inputs") or {},
    }


@router.get("/range")
async def daily_logs_range(userId: str, start_date: str, end_date: str):
    daily_logs_col = get_collection("daily_logs")
    try:
        user_oid = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId")

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    # Debug
    try:
        print(f"[checkin]/range query for user {str(user_oid)} start_dt={start_dt.isoformat()} end_dt={end_dt.isoformat()}")
    except Exception:
        pass

    cursor = daily_logs_col.find({
        "userId": user_oid,
        "date": {"$gte": start_dt, "$lt": end_dt},
    })
    docs = await cursor.to_list(length=None)

    try:
        print(f"[checkin]/range found {len(docs)} docs")
    except Exception:
        pass

    result = {}
    for doc in docs:
        try:
            d = doc.get("date")
            d_key = None
            raw_iso_for_return = None

            if isinstance(d, datetime):
                try:
                    if d.tzinfo is None:
                        d_utc = d.replace(tzinfo=timezone.utc)
                    else:
                        d_utc = d.astimezone(timezone.utc)
                    d_key = d_utc.strftime("%Y-%m-%d")
                    raw_iso_for_return = d_utc.isoformat()
                    print(f"[checkin]/range doc raw date (datetime): {d.isoformat()} -> key={d_key}")
                except Exception as _e:
                    try:
                        s = d.isoformat()
                        d_key = s[:10]
                        raw_iso_for_return = s
                        print(f"[checkin]/range date fallback iso: {s} -> key={d_key}")
                    except Exception:
                        d_key = None
            else:

                if isinstance(d, dict) and d.get("$date"):
                    try:
                        raw_iso = d.get("$date")
                        raw_iso_for_return = raw_iso if isinstance(raw_iso, str) else str(raw_iso)
                        # raw_iso might be nested
                        if isinstance(raw_iso, dict) and raw_iso.get("$numberLong"):
                            dt = datetime.fromtimestamp(int(raw_iso.get("$numberLong")) / 1000.0, tz=timezone.utc)
                            d_key = dt.strftime("%Y-%m-%d")
                        elif isinstance(raw_iso, str):
                            d_key = raw_iso[:10]
                        print(f"[checkin]/range doc raw date (dict $date): {raw_iso} -> key={d_key}")
                    except Exception as _e:
                        print(f"[checkin]/range parse $date failed: {_e}")
                        d_key = None
                elif isinstance(d, str):

                    try:
                        dt = datetime.fromisoformat(d.replace('Z', '+00:00'))
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        else:
                            dt = dt.astimezone(timezone.utc)
                        d_key = dt.strftime("%Y-%m-%d")
                        raw_iso_for_return = dt.isoformat()
                        print(f"[checkin]/range doc raw date (str): {d} -> key={d_key}")
                    except Exception:
                        d_key = d[:10]
                        raw_iso_for_return = d
                        print(f"[checkin]/range doc raw date (str fallback): {d} -> key={d_key}")
                else:
                    try:
                        s = str(d)
                        d_key = s[:10]
                        raw_iso_for_return = s
                        print(f"[checkin]/range doc raw date (other): {s} -> key={d_key}")
                    except Exception:
                        d_key = None

            if not d_key:
                print(f"[checkin]/range skipped doc without date key: {doc.get('_id')}")
                continue

            result[d_key] = {
                "dailyLogId": str(doc.get("_id")),
                "inputs": doc.get("inputs") or {},
                "rawDateISO": raw_iso_for_return,
            }
        except Exception as _e:
            print(f"[checkin]/range per-doc error: {_e}")
            continue

    return {"data": result}


@router.patch("/sleep/clear", status_code=200)
async def clear_sleep(payload: SleepClearPayload, debug: bool = False):
    daily_logs_col = get_collection("daily_logs")
    try:
        user_oid = ObjectId(payload.userId)
        log_oid = ObjectId(payload.dailyLogId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userId or dailyLogId")

    doc = await daily_logs_col.find_one({"_id": log_oid, "userId": user_oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Log not found")

    # Debug
    try:
        import json
        print('[checkin] clear_sleep called for user:', str(user_oid), 'log:', str(log_oid))
        print('[checkin] daily_log doc (partial):', json.dumps({
            '_id': str(doc.get('_id')),
            'date': (doc.get('date').isoformat() if isinstance(doc.get('date'), datetime) else str(doc.get('date'))),
            'has_sleep': bool(doc.get('inputs', {}).get('sleep'))
        }, ensure_ascii=False))
    except Exception:
        pass


    try:
        log_date = doc.get("date")
        if isinstance(log_date, datetime):
            log_day_str = log_date.isoformat()[:10]
        else:

            log_day_str = str(log_date)[:10]
    except Exception as e:
        try:
            print('[checkin] clear_sleep: failed to extract log date string:', str(e))
        except Exception:
            pass

        await daily_logs_col.update_one({"_id": log_oid}, {"$unset": {"inputs.sleep": 1}})
        return {"status": "ok", "note": "log date parse failed, sleep removed"}


    today_str = datetime.now().strftime("%Y-%m-%d")
    is_today = (log_day_str == today_str)


    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)

    users_col = get_collection("users")
    score_history_col = get_collection("score_history")

    # Debug
    try:
        print(f"[checkin] log date string: {log_day_str}, today_str: {today_str}, is_today: {is_today}")
    except Exception:
        pass


    if is_today:
        try:

            cursor = score_history_col.find({"userId": user_oid, "type": "daily_snapshot", "date": {"$lt": today_start}}).sort("date", -1).limit(1)
            docs = await cursor.to_list(length=1)
            prev_snapshot = docs[0] if docs else None


            try:
                if prev_snapshot:
                    ps = prev_snapshot.get('scores', {})
                    print('[checkin] prev_snapshot found date:', prev_snapshot.get('date').isoformat() if isinstance(prev_snapshot.get('date'), datetime) else str(prev_snapshot.get('date')))
                    print('[checkin] prev_snapshot.scores (partial):', json.dumps({
                         'psychoOmics': float(ps.get('psychoOmics', 0)),
                         'sleepOmics': float(ps.get('sleepOmics', 0)),
                         'sportOmics': float(ps.get('sportOmics', 0)),
                         'totalScore': float(ps.get('totalScore', 0))
                     }, indent=2, ensure_ascii=False))
                else:
                    print('[checkin] no prev_snapshot found (< today)')
            except Exception:
                pass


            if prev_snapshot and isinstance(prev_snapshot.get('scores'), dict):
                restored_sleep = float(prev_snapshot['scores'].get('sleepOmics', 50.0))
            else:
                # fallback
                user_doc = await users_col.find_one({"_id": user_oid})
                if user_doc:
                    restored_sleep = float((user_doc.get('sectionScores') or {}).get('sleepOmics', 50.0))
                else:
                    restored_sleep = 50.0


            user_doc = await users_col.find_one({"_id": user_oid})
            if not user_doc:
                raise HTTPException(status_code=404, detail="User not found")

            # Debug
            try:
                ss = user_doc.get('sectionScores') or {}
                print('[checkin] user.sectionScores before update (partial):', json.dumps({
                    'psychoOmics': float(ss.get('psychoOmics', 0)),
                    'sleepOmics': float(ss.get('sleepOmics', 0)),
                    'sportOmics': float(ss.get('sportOmics', 0)),
                    'physioOmics': float(ss.get('physioOmics', 0)),
                    'totalScore': float(user_doc.get('totalScore', 0))
                }, indent=2, ensure_ascii=False))
            except Exception:
                pass

            section_scores = user_doc.get('sectionScores') or {}
            current_sport = float(section_scores.get('sportOmics', 50.0))


            new_physio = (restored_sleep + current_sport) / 2.0

            # new total
            psycho = float(section_scores.get('psychoOmics', 50.0))
            nutri = float(section_scores.get('nutriOmics', 50.0))
            eco = float(section_scores.get('ecoOmics', 50.0))
            life = float(section_scores.get('lifeOmics', 50.0))
            socio = float(section_scores.get('socioOmics', 50.0))

            new_total = (psycho + new_physio + nutri + eco + life + socio) / 6.0

            # Debug
            try:
                print('[checkin] Restoring sleep from snapshot (or fallback):')
                print(json.dumps({
                    'restored_sleep': round(restored_sleep, 2),
                    'current_sport': round(current_sport, 2),
                    'new_physio': round(new_physio, 2),
                    'psycho': round(psycho, 2),
                    'nutri': round(nutri, 2),
                    'eco': round(eco, 2),
                    'life': round(life, 2),
                    'socio': round(socio, 2),
                    'new_total': round(new_total, 2),
                }, indent=2, ensure_ascii=False))
            except Exception:
                pass

            # Update users
            res_upd = await users_col.update_one(
                {"_id": user_oid},
                {"$set": {
                    "sectionScores.sleepOmics": float(restored_sleep),
                    "sectionScores.physioOmics": float(new_physio),
                    "totalScore": float(new_total)
                }}
            )
            try:
                print(f"[checkin] users.update_one matched_count={getattr(res_upd, 'matched_count', None)} modified_count={getattr(res_upd, 'modified_count', None)}")
            except Exception:
                pass


            try:
                updated_user = await users_col.find_one({"_id": user_oid})
                ss_after = updated_user.get('sectionScores') or {}
                print('[checkin] user.sectionScores after update (partial):', json.dumps({
                    'psychoOmics': float(ss_after.get('psychoOmics', 0)),
                    'sleepOmics': float(ss_after.get('sleepOmics', 0)),
                    'sportOmics': float(ss_after.get('sportOmics', 0)),
                    'physioOmics': float(ss_after.get('physioOmics', 0)),
                    'totalScore': float(updated_user.get('totalScore', 0))
                }, indent=2, ensure_ascii=False))
            except Exception:
                pass


            try:

                upd_res = await score_history_col.update_many(
                    {"userId": user_oid, "type": "daily_snapshot", "date": {"$gte": today_start, "$lt": today_end}},
                    {"$set": {
                        "scores.sleepOmics": float(restored_sleep),
                        "scores.physioOmics": float(new_physio),
                        "scores.totalScore": float(new_total)
                    }}
                )
                try:
                    print(f"[checkin] Updated {getattr(upd_res, 'modified_count', None)} snapshot(s) for today (preserved history)")
                except Exception:
                    pass
            except Exception:
                pass
        except HTTPException:
            raise
        except Exception as e:

            try:
                print('[checkin] Error restoring scores after sleep clear:', str(e))
            except Exception:
                pass



    unset_res = await daily_logs_col.update_one({"_id": log_oid}, {"$unset": {"inputs.sleep": 1}})


    if debug:
        debug_out = {
            "dailyLogId": str(log_oid),
            "userId": str(user_oid),
            "is_today": is_today,
            "prev_snapshot_id": str(prev_snapshot.get('_id')) if 'prev_snapshot' in locals() and prev_snapshot else None,
            "restored_sleep": float(restored_sleep) if 'restored_sleep' in locals() else None,
            "current_sport": float(current_sport) if 'current_sport' in locals() else None,
            "new_physio": float(new_physio) if 'new_physio' in locals() else None,
            "new_total": float(new_total) if 'new_total' in locals() else None,
            "users_update_matched": getattr(res_upd, 'matched_count', None) if 'res_upd' in locals() else getattr(res_upd, 'matched_count', None) if 'res_upd' in locals() else getattr(res_upd, 'matched_count', None) if 'res_upd' in locals() else None,
            "users_update_modified": getattr(res_upd, 'modified_count', None) if 'res_upd' in locals() else getattr(res_upd, 'modified_count', None) if 'res_upd' in locals() else getattr(res_upd, 'modified_count', None) if 'res_upd' in locals() else None,
            "today_snapshots_modified": getattr(upd_res, 'modified_count', None) if 'upd_res' in locals() else None,
            "daily_unset_matched": getattr(unset_res, 'matched_count', None),
            "daily_unset_modified": getattr(unset_res, 'modified_count', None),
        }
        try:

            if 'user_doc' in locals() and user_doc:
                debug_out['user_before'] = {
                    'sectionScores': user_doc.get('sectionScores'),
                    'totalScore': user_doc.get('totalScore')
                }
            if 'updated_user' in locals() and updated_user:
                debug_out['user_after'] = {
                    'sectionScores': updated_user.get('sectionScores'),
                    'totalScore': updated_user.get('totalScore')
                }
        except Exception:
            pass

        return debug_out

    return {"status": "ok"}
