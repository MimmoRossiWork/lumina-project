import bcrypt
from config import BCRYPT_ROUNDS

BCRYPT_ROUNDS = max(4, min(20, BCRYPT_ROUNDS))

def hash_password(password: str) -> str:
    pw = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    h = bcrypt.hashpw(pw, salt)
    return h.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

import secrets
import hashlib
from datetime import datetime, timezone, timedelta

def generate_reset_token():
    token = secrets.token_urlsafe(32)
    # store hashed token in DB
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    return token, token_hash

def token_expiry(hours: int = 1):
    return datetime.now(timezone.utc) + timedelta(hours=hours)
