"""
Unit tests for models
"""
import pytest
{% if values.framework == 'fastapi' -%}
from app.models import User, Role, Permission
from app.database import SessionLocal
{% elif values.framework == 'django' -%}
from django.test import TestCase
from django.contrib.auth import get_user_model
from app.models import Role, Permission
User = get_user_model()
{% elif values.framework == 'flask' -%}
from app.models import User, Role, Permission, db
{% endif %}

{% if values.framework == 'fastapi' -%}
class TestUserModel:
    """Test User model"""
    
    def test_create_user(self, test_db):
        """Test user creation"""
        db = SessionLocal()
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashedpassword",
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.is_admin is False
        
        db.close()
    
    def test_user_password_verification(self, test_db):
        """Test password verification"""
        from app.auth import verify_password, get_password_hash
        
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)
    
    def test_user_repr(self, test_db):
        """Test user string representation"""
        user = User(username="testuser", email="test@example.com")
        assert "testuser" in str(user)

class TestRoleModel:
    """Test Role model"""
    
    def test_create_role(self, test_db):
        """Test role creation"""
        db = SessionLocal()
        role = Role(name="admin", description="Administrator role")
        db.add(role)
        db.commit()
        db.refresh(role)
        
        assert role.id is not None
        assert role.name == "admin"
        assert role.description == "Administrator role"
        
        db.close()

class TestPermissionModel:
    """Test Permission model"""
    
    def test_create_permission(self, test_db):
        """Test permission creation"""
        db = SessionLocal()
        permission = Permission(
            name="read_users",
            description="Read user data"
        )
        db.add(permission)
        db.commit()
        db.refresh(permission)
        
        assert permission.id is not None
        assert permission.name == "read_users"
        assert permission.description == "Read user data"
        
        db.close()

{% elif values.framework == 'django' -%}
class TestUserModel(TestCase):
    """Test User model"""
    
    def test_create_user(self):
        """Test user creation"""
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            full_name="Test User"
        )
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.is_admin is False
    
    def test_create_superuser(self):
        """Test superuser creation"""
        user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpassword123"
        )
        
        assert user.is_admin is True
        assert user.is_superuser is True
    
    def test_user_str(self):
        """Test user string representation"""
        user = User(username="testuser", email="test@example.com")
        assert str(user) == "testuser"

class TestRoleModel(TestCase):
    """Test Role model"""
    
    def test_create_role(self):
        """Test role creation"""
        role = Role.objects.create(
            name="admin",
            description="Administrator role"
        )
        
        assert role.id is not None
        assert role.name == "admin"
        assert role.description == "Administrator role"
        assert str(role) == "admin"

class TestPermissionModel(TestCase):
    """Test Permission model"""
    
    def test_create_permission(self):
        """Test permission creation"""
        permission = Permission.objects.create(
            name="read_users",
            description="Read user data"
        )
        
        assert permission.id is not None
        assert permission.name == "read_users"
        assert permission.description == "Read user data"
        assert str(permission) == "read_users"

{% elif values.framework == 'flask' -%}
class TestUserModel:
    """Test User model"""
    
    def test_create_user(self, app):
        """Test user creation"""
        with app.app_context():
            user = User(
                username="testuser",
                email="test@example.com",
                full_name="Test User"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.commit()
            
            assert user.id is not None
            assert user.username == "testuser"
            assert user.email == "test@example.com"
            assert user.is_active is True
            assert user.is_admin is False
    
    def test_password_verification(self, app):
        """Test password verification"""
        with app.app_context():
            user = User(username="testuser", email="test@example.com")
            user.set_password("testpassword123")
            
            assert user.check_password("testpassword123")
            assert not user.check_password("wrongpassword")
    
    def test_user_repr(self, app):
        """Test user string representation"""
        user = User(username="testuser", email="test@example.com")
        assert "testuser" in repr(user)

class TestRoleModel:
    """Test Role model"""
    
    def test_create_role(self, app):
        """Test role creation"""
        with app.app_context():
            role = Role(name="admin", description="Administrator role")
            db.session.add(role)
            db.session.commit()
            
            assert role.id is not None
            assert role.name == "admin"
            assert role.description == "Administrator role"

class TestPermissionModel:
    """Test Permission model"""
    
    def test_create_permission(self, app):
        """Test permission creation"""
        with app.app_context():
            permission = Permission(
                name="read_users",
                description="Read user data"
            )
            db.session.add(permission)
            db.session.commit()
            
            assert permission.id is not None
            assert permission.name == "read_users"
            assert permission.description == "Read user data"

{% endif %}
