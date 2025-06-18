"""
Database connection and session management.
"""
{% if values.framework == "fastapi" -%}
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import asyncio
from typing import AsyncGenerator

from .config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    echo=settings.db_echo,
    poolclass=StaticPool if "sqlite" in settings.database_url else None,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    pool_pre_ping=True,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database."""
    # Import all models here to ensure they are registered with SQLAlchemy
    from . import models  # noqa
    Base.metadata.create_all(bind=engine)

{%- elif values.framework == "django" -%}
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.cache import cache
import uuid

# Base model with common fields
class BaseModel(models.Model):
    """Base model with common fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


def init_db():
    """Initialize database - Django handles this automatically."""
    pass

{%- elif values.framework == "flask" -%}
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

# Initialize SQLAlchemy
db = SQLAlchemy()
migrate = Migrate()


class BaseModel(db.Model):
    """Base model with common fields."""
    __abstract__ = True
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def save(self):
        """Save model to database."""
        db.session.add(self)
        db.session.commit()
        return self

    def delete(self):
        """Delete model from database."""
        db.session.delete(self)
        db.session.commit()


def init_db(app):
    """Initialize database with Flask app."""
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        # Import all models here to ensure they are registered
        from . import models  # noqa
        db.create_all()
{%- endif %}
