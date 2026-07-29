import asyncio
from storage.postgres.database import init_database

async def main():
    await init_database()
    print("Database initialized successfully")

if __name__ == "__main__":
    asyncio.run(main())
