"""
Application configuration module.
Handles environment variables and settings for different frameworks.
"""
import os
from typing import Optional, List
from pathlib import Path

{% if values.framework == "fastapi" -%}
from pydantic_settings import BaseSettings
from pydantic import Field, validator
{%- elif values.framework == "django" -%}
from django.conf import settings as django_settings
{%- endif %}

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

{% if values.framework == "fastapi" -%}
class Settings(BaseSettings):
    """FastAPI application settings."""
    
    # Application settings
    app_name: str = Field(default="{{ values.name }}", env="APP_NAME")
    app_version: str = Field(default="{{ values.version | default('0.1.0') }}", env="APP_VERSION")
    app_description: str = Field(default="{{ values.description }}", env="APP_DESCRIPTION")
    debug: bool = Field(default=False, env="DEBUG")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    reload: bool = Field(default=False, env="RELOAD")
    
    # Database settings
    database_url: str = Field(env="DATABASE_URL")
    db_echo: bool = Field(default=False, env="DB_ECHO")
    
    # Redis settings
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # Cache settings
    cache_type: str = Field(default="redis", env="CACHE_TYPE")
    cache_redis_url: str = Field(default="redis://localhost:6379/1", env="CACHE_REDIS_URL")
    cache_default_timeout: int = Field(default=300, env="CACHE_DEFAULT_TIMEOUT")
    
    # Celery settings
    celery_broker_url: str = Field(default="redis://localhost:6379/2", env="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/3", env="CELERY_RESULT_BACKEND")
    
    # Security settings
    secret_key: str = Field(env="SECRET_KEY")
    jwt_secret_key: str = Field(env="JWT_SECRET_KEY")
    jwt_access_token_expires: int = Field(default=3600, env="JWT_ACCESS_TOKEN_EXPIRES")
    jwt_refresh_token_expires: int = Field(default=2592000, env="JWT_REFRESH_TOKEN_EXPIRES")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    
    # CORS settings
    cors_origins: List[str] = Field(default=["*"], env="CORS_ORIGINS")
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    
    # Monitoring
    prometheus_multiproc_dir: str = Field(default="/tmp/prometheus_multiproc", env="PROMETHEUS_MULTIPROC_DIR")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    
    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False

{%- elif values.framework == "django" -%}
# Django settings
import sys
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_extensions",
    "django_filters",
    "health_check",
    "django_prometheus",
]

LOCAL_APPS = [
    "app.users",
    "app.core",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "app.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "app.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "{{ values.name }}_dev"),
        "USER": os.getenv("DB_USER", "{{ values.name }}"),
        "PASSWORD": os.getenv("DB_PASSWORD", "password"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# Cache configuration
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_URL", "redis://localhost:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

# JWT configuration
from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# CORS configuration
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "True").lower() in ("true", "1", "yes")

# Celery configuration
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/2")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/3")
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["application/json"]
CELERY_TIMEZONE = TIME_ZONE

{%- elif values.framework == "flask" -%}
class Config:
    """Base configuration class."""
    
    # Application settings
    APP_NAME = os.getenv("APP_NAME", "{{ values.name }}")
    APP_VERSION = os.getenv("APP_VERSION", "{{ values.version | default('0.1.0') }}")
    APP_DESCRIPTION = os.getenv("APP_DESCRIPTION", "{{ values.description }}")
    
    # Security settings
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000"))
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://{{ values.name }}:password@localhost:5432/{{ values.name }}_dev")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("DB_ECHO", "False").lower() in ("true", "1", "yes")
    
    # Redis settings
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Cache settings
    CACHE_TYPE = os.getenv("CACHE_TYPE", "redis")
    CACHE_REDIS_URL = os.getenv("CACHE_REDIS_URL", "redis://localhost:6379/1")
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", "300"))
    
    # Celery settings
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/2")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/3")
    
    # CORS settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # File upload settings
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", "16777216"))  # 16MB


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


# Configuration mapping
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
{%- endif %}

{% if values.framework == "fastapi" -%}
# Create settings instance
settings = Settings()
{%- elif values.framework == "flask" -%}
# Get configuration based on environment
def get_config():
    """Get configuration based on environment."""
    env = os.getenv("FLASK_ENV", "development")
    return config.get(env, config["default"])

settings = get_config()
{%- endif %}
