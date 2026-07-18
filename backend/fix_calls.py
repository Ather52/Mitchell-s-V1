import asyncio
import sys
sys.path.append('d:/Artificizen/Mitchells-fruit-limited/backend')
from src.utils.db import AsyncSessionLocal, OutboundCall, OutboundContact
from sqlalchemy import select

async def fix():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(OutboundCall).where(OutboundCall.call_status == 'calling'))
        calls = res.scalars().all()
        print(f'Found {len(calls)} calls stuck in calling')
        for c in calls:
            c.call_status = 'completed'
        await db.commit()

        res2 = await db.execute(select(OutboundContact).where(OutboundContact.status == 'calling'))
        contacts = res2.scalars().all()
        print(f'Found {len(contacts)} contacts stuck in calling')
        for ct in contacts:
            ct.status = 'completed'
        await db.commit()
        print('Fixed!')

if __name__ == '__main__':
    asyncio.run(fix())
