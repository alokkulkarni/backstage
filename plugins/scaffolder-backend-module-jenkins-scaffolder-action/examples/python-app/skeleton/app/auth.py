"""
Authentication and authorization utilities.
"""
{% if values.framework == "fastapi" -%}
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User
from .schemas import TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.jwt_access_token_expires)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.jwt_refresh_token_expires)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str, verify_refresh: bool = False) -> Optional[TokenData]:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None:
            return None
        
        if verify_refresh and token_type != "refresh":
            return None
        elif not verify_refresh and token_type != "access":
            return None
        
        token_data = TokenData(email=email)
        return token_data
    except JWTError:
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def check_permission(user: User, resource: str, action: str) -> bool:
    """Check if user has permission for resource and action."""
    if user.is_superuser:
        return True
    
    for role in user.roles:
        for permission in role.permissions:
            if permission.resource == resource and permission.action == action:
                return True
    
    return False


def require_permission(resource: str, action: str):
    """Decorator to require specific permission."""
    def permission_checker(current_user: User = Depends(get_current_active_user)):
        if not check_permission(current_user, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    
    return permission_checker

{%- elif values.framework == "django" -%}
from django.contrib.auth import authenticate
from django.contrib.auth.backends import BaseBackend
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class EmailBackend(BaseBackend):
    """Custom authentication backend that uses email instead of username."""
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(email=username)
            if user.check_password(password) and user.is_active:
                return user
        except User.DoesNotExist:
            return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


def create_tokens_for_user(user):
    """Create access and refresh tokens for user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'token_type': 'bearer',
        'expires_in': 3600
    }


def check_permission(user, resource, action):
    """Check if user has permission for resource and action."""
    if user.is_superuser:
        return True
    
    for role in user.roles.all():
        for permission in role.permissions.all():
            if permission.resource == resource and permission.action == action:
                return True
    
    return False

{%- elif values.framework == "flask" -%}
from functools import wraps
from flask import current_app, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt

from .models import User


def check_permission(user, resource, action):
    """Check if user has permission for resource and action."""
    if user.is_superuser:
        return True
    
    return user.has_permission(resource, action)


def require_permission(resource, action):
    """Decorator to require specific permission."""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'message': 'User not found or inactive'}), 401
            
            if not check_permission(user, resource, action):
                return jsonify({'message': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def hash_password(password):
    """Hash password."""
    return generate_password_hash(password)


def verify_password(password, hashed_password):
    """Verify password."""
    return check_password_hash(hashed_password, password)


def create_tokens(user):
    """Create access and refresh tokens for user."""
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES'])
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        expires_delta=timedelta(seconds=current_app.config['JWT_REFRESH_TOKEN_EXPIRES'])
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }
{%- endif %}
