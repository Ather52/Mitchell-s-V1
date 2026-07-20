import asyncio
import sys
sys.path.append('d:/Artificizen/Mitchells-fruit-limited/backend')
from src.utils.db import AsyncSessionLocal, CallLog
from sqlalchemy import select, update

async def fix():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(CallLog).where(CallLog.recall_at != None))
        logs = res.scalars().all()
        for log in logs:
            log.recall_at = None
        await db.commit()
        print(f"Cleared {len(logs)} old CallLog timers")

if __name__ == '__main__':
    asyncio.run(fix())
