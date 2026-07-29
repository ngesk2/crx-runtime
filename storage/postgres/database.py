from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from config.settings import Settings

# Get configuration
settings = Settings()

# Create engine with connection pooling (Phase 14: REPLACE)
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Disable SQL echo in production
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout,
    pool_recycle=settings.database_pool_recycle,
    pool_pre_ping=True,  # Verify connections before using
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_database():
    """Initialize database tables"""
    from storage.postgres.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_database():
    """Drop all database tables"""
    from storage.postgres.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
