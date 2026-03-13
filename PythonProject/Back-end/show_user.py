from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/LuminaDB')
client = MongoClient(uri)
db = client.get_default_database()
print('DB:', db.name)
user = db.users.find_one({'email':'autotest+py@example.com'})
print(user)

