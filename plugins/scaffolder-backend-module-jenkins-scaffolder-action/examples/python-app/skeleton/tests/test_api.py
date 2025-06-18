"""
API integration tests
"""
import pytest
import json
{% if values.framework == 'fastapi' -%}
from fastapi.testclient import TestClient
from app.models import User
from app.database import SessionLocal
from app.auth import get_password_hash
{% elif values.framework == 'django' -%}
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
User = get_user_model()
{% elif values.framework == 'flask' -%}
from app.models import User, db
from app.auth import get_password_hash
{% endif %}

{% if values.framework == 'fastapi' -%}
class TestUserAPI:
    """Test User API endpoints"""
    
    def test_create_user(self, client: TestClient, test_db):
        """Test user creation endpoint"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        }
        
        response = client.post("/api/v1/users/", json=user_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "password" not in data  # Password should not be returned
    
    def test_get_users(self, client: TestClient, test_db):
        """Test get users endpoint"""
        # Create test user first
        db = SessionLocal()
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword123"),
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        db.close()
        
        response = client.get("/api/v1/users/")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert any(user["username"] == "testuser" for user in data)
    
    def test_get_user_by_id(self, client: TestClient, test_db):
        """Test get user by ID endpoint"""
        # Create test user first
        db = SessionLocal()
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword123"),
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = user.id
        db.close()
        
        response = client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["username"] == "testuser"
        assert data["id"] == user_id

class TestAuthAPI:
    """Test Authentication API endpoints"""
    
    def test_login_success(self, client: TestClient, test_db):
        """Test successful login"""
        # Create test user first
        db = SessionLocal()
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword123"),
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        db.close()
        
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_failure(self, client: TestClient, test_db):
        """Test failed login"""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 401

{% elif values.framework == 'django' -%}
class TestUserAPI(TestCase):
    """Test User API endpoints"""
    
    def setUp(self):
        """Setup test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            full_name="Test User"
        )
    
    def test_create_user(self):
        """Test user creation endpoint"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        }
        
        url = reverse('user-list')
        response = self.client.post(url, user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        data = response.json()
        self.assertEqual(data["username"], "newuser")
        self.assertEqual(data["email"], "newuser@example.com")
        self.assertIn("id", data)
        self.assertNotIn("password", data)
    
    def test_get_users(self):
        """Test get users endpoint"""
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertTrue(any(user["username"] == "testuser" for user in data))
    
    def test_get_user_by_id(self):
        """Test get user by ID endpoint"""
        url = reverse('user-detail', kwargs={'pk': self.user.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data["username"], "testuser")
        self.assertEqual(data["id"], self.user.id)

class TestAuthAPI(TestCase):
    """Test Authentication API endpoints"""
    
    def setUp(self):
        """Setup test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            full_name="Test User"
        )
    
    def test_login_success(self):
        """Test successful login"""
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        
        url = reverse('auth-login')
        response = self.client.post(url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
    
    def test_login_failure(self):
        """Test failed login"""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpassword"
        }
        
        url = reverse('auth-login')
        response = self.client.post(url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

{% elif values.framework == 'flask' -%}
class TestUserAPI:
    """Test User API endpoints"""
    
    def test_create_user(self, client, app):
        """Test user creation endpoint"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        }
        
        response = client.post('/api/v1/users/', 
                             data=json.dumps(user_data),
                             content_type='application/json')
        assert response.status_code == 201
        
        data = response.get_json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert "password" not in data
    
    def test_get_users(self, client, app):
        """Test get users endpoint"""
        # Create test user first
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                full_name="Test User"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.commit()
        
        response = client.get('/api/v1/users/')
        assert response.status_code == 200
        
        data = response.get_json()
        assert len(data) >= 1
        assert any(user["username"] == "testuser" for user in data)
    
    def test_get_user_by_id(self, client, app):
        """Test get user by ID endpoint"""
        # Create test user first
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                full_name="Test User"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.commit()
            user_id = user.id
        
        response = client.get(f'/api/v1/users/{user_id}')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data["username"] == "testuser"
        assert data["id"] == user_id

class TestAuthAPI:
    """Test Authentication API endpoints"""
    
    def test_login_success(self, client, app):
        """Test successful login"""
        # Create test user first
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                full_name="Test User"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.commit()
        
        login_data = {
            "username": "testuser",
            "password": "testpassword123"
        }
        
        response = client.post('/api/v1/auth/login',
                             data=json.dumps(login_data),
                             content_type='application/json')
        assert response.status_code == 200
        
        data = response.get_json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_failure(self, client, app):
        """Test failed login"""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpassword"
        }
        
        response = client.post('/api/v1/auth/login',
                             data=json.dumps(login_data),
                             content_type='application/json')
        assert response.status_code == 401

{% endif %}
