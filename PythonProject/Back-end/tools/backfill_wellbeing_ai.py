import sys, json
sys.path.insert(0, r'C:\Users\Nama\PycharmProjects\PythonProject\Back-end')
from db import get_collection
from bson import ObjectId
from ai_engine import get_emotional_ai
from datetime import datetime

col = get_collection('daily_logs')
ai = get_emotional_ai()

import asyncio

async def run():
    cursor = col.find({'inputs.mindset.journalNote': {'$exists': True}})
    docs = await cursor.to_list(length=None)
    updated = []
    for d in docs:
        mind = (d.get('inputs') or {}).get('mindset') or {}
        # check if ai fields present
        if mind.get('aiEmotion') is not None or mind.get('aiTags') is not None or mind.get('aiConfidence') is not None:
            continue
        j = mind.get('journalNote')
        if not j:
            continue
        try:
            res = ai.analyze(j)
            upd = {}
            if isinstance(res, dict):
                if res.get('emotion') is not None:
                    upd['inputs.mindset.aiEmotion'] = res.get('emotion')
                if res.get('tags') is not None:
                    upd['inputs.mindset.aiTags'] = res.get('tags')
                if res.get('confidence') is not None:
                    upd['inputs.mindset.aiConfidence'] = res.get('confidence')
            if upd:
                await col.update_one({'_id': d.get('_id')}, {'$set': upd})
                updated.append({'id': str(d.get('_id')), 'set': upd})
        except Exception as e:
            print('AI analyze failed for doc', d.get('_id'), str(e))
    print(json.dumps({'updated': updated}, indent=2, ensure_ascii=False))

asyncio.run(run())

