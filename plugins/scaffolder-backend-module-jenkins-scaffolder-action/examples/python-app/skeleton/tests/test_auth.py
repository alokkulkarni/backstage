"""
Unit tests for authentication
"""
import pytest
{% if values.framework == 'fastapi' -%}
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, authenticate_user
)
from app.models import User
from app.database import SessionLocal
{% elif values.framework == 'django' -%}
from django.test import TestCase
from django.contrib.auth import get_user_model
from app.auth import create_access_token, decode_access_token, authenticate_user
User = get_user_model()
{% elif values.framework == 'flask' -%}
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, authenticate_user
)
from app.models import User, db
{% endif %}
from datetime import datetime, timedelta

{% if values.framework == 'fastapi' -%}
class TestPasswordHashing:
    """Test password hashing functions"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

class TestTokens:
    """Test JWT token functions"""
    
    def test_create_access_token(self):
        """Test access token creation"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_access_token(self):
        """Test access token decoding"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        decoded = decode_access_token(token)
        assert decoded["sub"] == "testuser"
    
    def test_expired_token(self):
        """Test expired token handling"""
        data = {"sub": "testuser"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        decoded = decode_access_token(token)
        assert decoded is None

class TestAuthentication:
    """Test authentication functions"""
    
    def test_authenticate_user_success(self, test_db):
        """Test successful user authentication"""
        db = SessionLocal()
        
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword123"),
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        
        # Test authentication
        authenticated_user = authenticate_user(db, "testuser", "testpassword123")
        assert authenticated_user is not None
        assert authenticated_user.username == "testuser"
        
        db.close()
    
    def test_authenticate_user_failure(self, test_db):
        """Test failed user authentication"""
        db = SessionLocal()
        
        # Test with non-existent user
        authenticated_user = authenticate_user(db, "nonexistent", "password")
        assert authenticated_user is None
        
        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword123"),
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        
        # Test with wrong password
        authenticated_user = authenticate_user(db, "testuser", "wrongpassword")
        assert authenticated_user is None
        
        db.close()

{% elif values.framework == 'django' -%}
class TestAuthentication(TestCase):
    """Test authentication functions"""
    
    def test_create_access_token(self):
        """Test access token creation"""
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        
        token = create_access_token(user)
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_access_token(self):
        """Test access token decoding"""
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        
        token = create_access_token(user)
        decoded_user = decode_access_token(token)
        
        assert decoded_user is not None
        assert decoded_user.username == "testuser"
    
    def test_authenticate_user_success(self):
        """Test successful user authentication"""
        User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        
        authenticated_user = authenticate_user("testuser", "testpassword123")
        assert authenticated_user is not None
        assert authenticated_user.username == "testuser"
    
    def test_authenticate_user_failure(self):
        """Test failed user authentication"""
        User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123"
        )
        
        # Test with wrong password
        authenticated_user = authenticate_user("testuser", "wrongpassword")
        assert authenticated_user is None
        
        # Test with non-existent user
        authenticated_user = authenticate_user("nonexistent", "password")
        assert authenticated_user is None

{% elif values.framework == 'flask' -%}
class TestPasswordHashing:
    """Test password hashing functions"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

class TestTokens:
    """Test JWT token functions"""
    
    def test_create_access_token(self, app):
        """Test access token creation"""
        with app.app_context():
            data = {"sub": "testuser"}
            token = create_access_token(data)
            
            assert token is not None
            assert isinstance(token, str)
            assert len(token) > 0
    
    def test_decode_access_token(self, app):
        """Test access token decoding"""
        with app.app_context():
            data = {"sub": "testuser"}
            token = create_access_token(data)
            
            decoded = decode_access_token(token)
            assert decoded["sub"] == "testuser"

class TestAuthentication:
    """Test authentication functions"""
    
    def test_authenticate_user_success(self, app):
        """Test successful user authentication"""
        with app.app_context():
            # Create test user
            user = User(
                username="testuser",
                email="test@example.com",
                full_name="Test User"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.commit()
            
            # Test authentication
            authenticated_user = authenticate_user("testuser", "testpassword123")
            assert authenticated_user is not None
            assert authenticated_user.username == "testuser"
    
    def test_authenticate_user_failure(self, app):
        """Test failed user authentication"""
        with app.app_context():
            # Test with non-existent user
            authenticated_user = authenticate_user("nonexistent", "password")
            assert authenticated_user is None
            
            # Create test user
            user = User(
                username="testuser",
                email="test@example.com",
                full_name="Test User"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.commit()
            
            # Test with wrong password
            authenticated_user = authenticate_user("testuser", "wrongpassword")
            assert authenticated_user is None

{% endif %}
