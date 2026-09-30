from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

db_url = settings.async_database_url
engine_kwargs = {"echo": settings.DEBUG}

if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True
    })

# Khởi tạo Async Engine
engine = create_async_engine(db_url, **engine_kwargs)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    """Lớp nền tảng cho toàn bộ Entity Models trong hệ thống"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency Injection cung cấp database session cho mỗi request"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
