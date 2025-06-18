"""
Test configuration and fixtures
"""
import os
import pytest
from typing import AsyncGenerator, Generator
{% if values.framework == 'fastapi' -%}
from fastapi.testclient import TestClient
from httpx import AsyncClient
from app.main import app
from app.database import get_database
{% elif values.framework == 'django' -%}
import django
from django.test import TestCase, Client
from django.conf import settings
from django.core.management import execute_from_command_line
{% elif values.framework == 'flask' -%}
from app.main import create_app
from app.database import init_db
{% endif %}

# Set test environment
os.environ["ENVIRONMENT"] = "test"

{% if values.framework == 'fastapi' -%}
# FastAPI test fixtures
@pytest.fixture
def client() -> TestClient:
    """Create test client"""
    return TestClient(app)

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def test_db():
    """Test database fixture"""
    # Use in-memory SQLite for tests
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

{% elif values.framework == 'django' -%}
# Django test configuration
@pytest.fixture(scope='session')
def django_db_setup():
    """Setup test database"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

@pytest.fixture
def client():
    """Django test client"""
    return Client()

class BaseTestCase(TestCase):
    """Base test case with common setup"""
    
    def setUp(self):
        """Setup test data"""
        super().setUp()
        
    def tearDown(self):
        """Cleanup test data"""
        super().tearDown()

{% elif values.framework == 'flask' -%}
# Flask test fixtures
@pytest.fixture
def app():
    """Create test app"""
    app = create_app({'TESTING': True, 'DATABASE_URL': 'sqlite:///:memory:'})
    with app.app_context():
        init_db()
        yield app

@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Test CLI runner"""
    return app.test_cli_runner()

{% endif %}

@pytest.fixture
def sample_user_data():
    """Sample user test data"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }

@pytest.fixture
def sample_admin_data():
    """Sample admin test data"""
    return {
        "username": "admin",
        "email": "admin@example.com",
        "password": "adminpassword123",
        "full_name": "Admin User",
        "is_admin": True
    }
