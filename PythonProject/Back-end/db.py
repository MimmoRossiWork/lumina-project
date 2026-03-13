import motor.motor_asyncio
from config import MONGODB_URI, MONGODB_DB

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
# explicitly select DB from env/config
db = client[MONGODB_DB]

# helper if code expects get_collection from db
def get_collection(name: str):
    return db.get_collection(name)
