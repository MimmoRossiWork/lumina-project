from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserOut, EmailCheckOut, UserLogin, UserAuthOut, VerifyPasswordIn, UserUpdate
from auth_utils import hash_password, verify_password
from db import db
from datetime import datetime
import pymongo
import logging
from bson import ObjectId

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

DICEBEAR_BASE = "https://api.dicebear.com/9.x/micah/svg?seed="


def build_default_avatar(name: str | None) -> str:
    seed = name.strip() if name and name.strip() else "marione"
    return f"{DICEBEAR_BASE}{seed}"


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def register(user: UserCreate):
    try:
        # normalize email
        normalized_email = user.email.strip().lower()
        logger.info("Register endpoint received user: %s", user.dict())
        users = db.get_collection("users")
        # check existence using normalized email
        existing = await users.find_one({"email": normalized_email})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        password_hash = hash_password(user.password)
        now = datetime.utcnow()
        avatar_url = user.avatarUrl if user.avatarUrl else build_default_avatar(user.name)
        doc = {
            "name": user.name.strip() if user.name else None,
            "surname": user.surname.strip() if user.surname else None,
            "email": normalized_email,
            "passwordHash": password_hash,
            "avatarUrl": avatar_url,
            "isVerified": False,
            "createdAt": now,
            "updatedAt": now
        }
        result = await users.insert_one(doc)
        return UserOut(id=str(result.inserted_id), email=normalized_email, createdAt=now)
    except pymongo.errors.PyMongoError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/check-email", response_model=EmailCheckOut)
async def check_email(email: str):
    try:
        users = db.get_collection("users")
        existing = await users.find_one({"email": email})
        return EmailCheckOut(exists=bool(existing))
    except pymongo.errors.PyMongoError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/login", response_model=UserAuthOut)
async def login(body: UserLogin):
    try:
        email_norm = body.email.strip().lower()
        users = db.get_collection("users")
        user = await users.find_one({"email": email_norm})
        if not user:

            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        hashed = user.get('passwordHash')
        if not verify_password(body.password, hashed):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        return UserAuthOut(
            id=str(user.get('_id')),
            email=user.get('email'),
            name=user.get('name'),
            surname=user.get('surname'),
            avatarUrl=user.get('avatarUrl') or build_default_avatar(user.get('name')),
            totalScore=user.get('totalScore', 0),
            questionnaireCompleted=bool(user.get('questionnaireCompleted', False)),
            sectionScores=user.get('sectionScores'),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/verify-password", status_code=status.HTTP_200_OK)
async def verify_user_password(body: VerifyPasswordIn):
    try:
        users = db.get_collection("users")
        try:
            oid = ObjectId(body.userId)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid userId")
        user = await users.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        hashed = user.get("passwordHash")
        if not verify_password(body.password, hashed):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")
        return {"valid": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/update-user", response_model=UserAuthOut)
async def update_user(body: UserUpdate):
    try:
        users = db.get_collection("users")
        try:
            oid = ObjectId(body.userId)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid userId")

        update_doc = {}
        if body.name is not None:
            update_doc["name"] = body.name.strip()
        if body.surname is not None:
            update_doc["surname"] = body.surname.strip()
        if body.email is not None:
            normalized_email = body.email.strip().lower()
            # ensure email uniqueness excluding current user
            existing = await users.find_one({"email": normalized_email, "_id": {"$ne": oid}})
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            update_doc["email"] = normalized_email
        if body.password:
            update_doc["passwordHash"] = hash_password(body.password)
        if body.avatarUrl is not None:
            update_doc["avatarUrl"] = body.avatarUrl if body.avatarUrl.strip() else build_default_avatar(body.name)
        if not update_doc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

        update_doc["updatedAt"] = datetime.utcnow()
        result = await users.update_one({"_id": oid}, {"$set": update_doc})
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user = await users.find_one({"_id": oid})
        return UserAuthOut(
            id=str(user.get('_id')),
            email=user.get('email'),
            name=user.get('name'),
            surname=user.get('surname'),
            avatarUrl=user.get('avatarUrl') or build_default_avatar(user.get('name')),
            totalScore=user.get('totalScore', 0),
            questionnaireCompleted=bool(user.get('questionnaireCompleted', False)),
            sectionScores=user.get('sectionScores'),
            height=user.get('height'),
            weight=user.get('weight'),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
