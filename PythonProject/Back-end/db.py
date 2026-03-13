import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI")

client = AsyncIOMotorClient(MONGODB_URI)

db = client.get_default_database()
# helper if code expects get_collection from db
def get_collection(name: str):
    return db.get_collection(name)

