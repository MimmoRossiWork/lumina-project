from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://dorossi_db_user:uiSpH8YnAjGWkKZC@cluster0.n9rsqxm.mongodb.net/LuminaDB")
MONGODB_DB = os.getenv("MONGODB_DB", "LuminaDB")
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
