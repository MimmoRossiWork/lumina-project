import sys, json
sys.path.insert(0, r'C:\Users\Nama\PycharmProjects\PythonProject\Back-end')
from db import get_collection
from bson import ObjectId
from datetime import datetime, timedelta, timezone

user_id = '697a096c006925a24912f029'
try:
    user_oid = ObjectId(user_id)
except Exception:
    print('invalid user id')
    raise SystemExit(1)

col = get_collection('daily_logs')

# fetch last 14 days
now = datetime.now(timezone.utc)
start = now - timedelta(days=14)

import asyncio

async def run():
    docs = await col.find({'userId': user_oid}).to_list(length=100)
    out = []
    for d in docs:
        date = d.get('date')
        if isinstance(date, datetime):
            date_str = date.astimezone(timezone.utc).strftime('%Y-%m-%d')
        else:
            date_str = str(date)[:10]
        out.append({
            'id': str(d.get('_id')),
            'date': date_str,
            'inputs': d.get('inputs') or {}
        })
    print(json.dumps(out, indent=2, ensure_ascii=False))

asyncio.run(run())

