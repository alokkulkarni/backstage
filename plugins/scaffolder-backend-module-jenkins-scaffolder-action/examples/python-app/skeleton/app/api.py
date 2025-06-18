"""
API routes and endpoints.
"""
{% if values.framework == "fastapi" -%}
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from .database import get_db
from .models import User, Role, Permission
from .schemas import (
    UserResponse, UserCreate, UserUpdate, UserLogin, Token,
    RoleResponse, RoleCreate, RoleUpdate,
    PermissionResponse, PermissionCreate,
    PaginatedResponse, PaginationParams,
    HealthCheck
)
from .auth import (
    authenticate_user, create_access_token, create_refresh_token,
    get_current_user, get_current_active_user, verify_token
)
from .crud import UserCRUD, RoleCRUD, PermissionCRUD

# Create router
router = APIRouter()
security = HTTPBearer()

# CRUD instances
user_crud = UserCRUD()
role_crud = RoleCRUD()
permission_crud = PermissionCRUD()


# Authentication endpoints
@router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return tokens."""
    user = authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 3600
    }


@router.post("/auth/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Refresh access token."""
    token_data = verify_token(credentials.credentials, verify_refresh=True)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = user_crud.get_by_email(db, token_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 3600
    }


# User endpoints
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new user."""
    if user_crud.get_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if user_crud.get_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    return user_crud.create(db, user)


@router.get("/users", response_model=PaginatedResponse)
async def get_users(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all users with pagination."""
    users, total = user_crud.get_multi(db, skip=(pagination.page - 1) * pagination.size, limit=pagination.size)
    
    return {
        "items": users,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
        "pages": (total + pagination.size - 1) // pagination.size
    }


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user by ID."""
    user = user_crud.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user."""
    user = user_crud.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user_crud.update(db, db_obj=user, obj_in=user_update)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete user."""
    user = user_crud.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_crud.remove(db, id=user_id)


# Role endpoints
@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new role."""
    return role_crud.create(db, role)


@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all roles."""
    return role_crud.get_multi(db)


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get role by ID."""
    role = role_crud.get(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role


# Permission endpoints
@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new permission."""
    return permission_crud.create(db, permission)


@router.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all permissions."""
    return permission_crud.get_multi(db)

{%- elif values.framework == "django" -%}
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login
from django.core.paginator import Paginator
from django.db.models import Q

from .models import User, Role, Permission
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, UserLoginSerializer,
    RoleSerializer, PermissionSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """User viewset."""
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return queryset
    
    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """Set user password."""
        user = self.get_object()
        password = request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
            return Response({'status': 'password set'})
        return Response({'error': 'password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        """Assign role to user."""
        user = self.get_object()
        role_id = request.data.get('role_id')
        try:
            role = Role.objects.get(id=role_id)
            user.roles.add(role)
            return Response({'status': 'role assigned'})
        except Role.DoesNotExist:
            return Response({'error': 'role not found'}, status=status.HTTP_404_NOT_FOUND)


class RoleViewSet(viewsets.ModelViewSet):
    """Role viewset."""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def assign_permission(self, request, pk=None):
        """Assign permission to role."""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        try:
            permission = Permission.objects.get(id=permission_id)
            role.permissions.add(permission)
            return Response({'status': 'permission assigned'})
        except Permission.DoesNotExist:
            return Response({'error': 'permission not found'}, status=status.HTTP_404_NOT_FOUND)


class PermissionViewSet(viewsets.ModelViewSet):
    """Permission viewset."""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint."""
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'token_type': 'bearer',
            'expires_in': 3600,
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration endpoint."""
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'token_type': 'bearer',
            'expires_in': 3600,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """Update current user profile."""
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

{%- elif values.framework == "flask" -%}
from flask import Blueprint, request, jsonify, current_app
from flask_restful import Api, Resource
from flask_jwt_extended import jwt_required, create_access_token, create_refresh_token, get_jwt_identity
from werkzeug.security import check_password_hash
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
import uuid

from .database import db
from .models import User, Role, Permission
from .schemas import (
    UserSchema, UserCreateSchema, UserUpdateSchema, UserLoginSchema,
    RoleSchema, PermissionSchema, TokenSchema, PaginatedResponseSchema
)

# Create blueprint
api_bp = Blueprint('api', __name__)
api = Api(api_bp)

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_create_schema = UserCreateSchema()
user_update_schema = UserUpdateSchema()
user_login_schema = UserLoginSchema()
role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)
permission_schema = PermissionSchema()
permissions_schema = PermissionSchema(many=True)
token_schema = TokenSchema()


class AuthResource(Resource):
    """Authentication resource."""
    
    def post(self):
        """User login."""
        try:
            data = user_login_schema.load(request.json)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']) and user.is_active:
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'bearer',
                'expires_in': 3600,
                'user': user_schema.dump(user)
            }
        
        return {'message': 'Invalid credentials'}, 401


class RefreshTokenResource(Resource):
    """Refresh token resource."""
    
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token."""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return {'message': 'User not found or inactive'}, 401
        
        access_token = create_access_token(identity=str(user.id))
        return {'access_token': access_token, 'token_type': 'bearer', 'expires_in': 3600}


class UserListResource(Resource):
    """User list resource."""
    
    @jwt_required()
    def get(self):
        """Get all users with pagination."""
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        
        query = User.query
        if search:
            query = query.filter(
                (User.email.contains(search)) |
                (User.username.contains(search)) |
                (User.first_name.contains(search)) |
                (User.last_name.contains(search))
            )
        
        paginated_users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return {
            'items': users_schema.dump(paginated_users.items),
            'total': paginated_users.total,
            'page': page,
            'per_page': per_page,
            'pages': paginated_users.pages,
            'has_next': paginated_users.has_next,
            'has_prev': paginated_users.has_prev
        }
    
    @jwt_required()
    def post(self):
        """Create a new user."""
        try:
            data = user_create_schema.load(request.json)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return {'message': 'Email already registered'}, 400
        
        if User.query.filter_by(username=data['username']).first():
            return {'message': 'Username already taken'}, 400
        
        # Create user
        user = User(
            email=data['email'],
            username=data['username'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        user.set_password(data['password'])
        
        try:
            db.session.add(user)
            db.session.commit()
            return user_schema.dump(user), 201
        except IntegrityError:
            db.session.rollback()
            return {'message': 'User creation failed'}, 400


class UserResource(Resource):
    """Individual user resource."""
    
    @jwt_required()
    def get(self, user_id):
        """Get user by ID."""
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        return user_schema.dump(user)
    
    @jwt_required()
    def put(self, user_id):
        """Update user."""
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        
        try:
            data = user_update_schema.load(request.json)
        except ValidationError as err:
            return {'errors': err.messages}, 400
        
        for key, value in data.items():
            setattr(user, key, value)
        
        try:
            db.session.commit()
            return user_schema.dump(user)
        except IntegrityError:
            db.session.rollback()
            return {'message': 'Update failed'}, 400
    
    @jwt_required()
    def delete(self, user_id):
        """Delete user."""
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        
        db.session.delete(user)
        db.session.commit()
        return '', 204


class RoleListResource(Resource):
    """Role list resource."""
    
    @jwt_required()
    def get(self):
        """Get all roles."""
        roles = Role.query.all()
        return roles_schema.dump(roles)
    
    @jwt_required()
    def post(self):
        """Create a new role."""
        try:
            data = role_schema.load(request.json)
            role = Role(**data)
            db.session.add(role)
            db.session.commit()
            return role_schema.dump(role), 201
        except ValidationError as err:
            return {'errors': err.messages}, 400
        except IntegrityError:
            db.session.rollback()
            return {'message': 'Role creation failed'}, 400


class RoleResource(Resource):
    """Individual role resource."""
    
    @jwt_required()
    def get(self, role_id):
        """Get role by ID."""
        role = Role.query.get(role_id)
        if not role:
            return {'message': 'Role not found'}, 404
        return role_schema.dump(role)


class PermissionListResource(Resource):
    """Permission list resource."""
    
    @jwt_required()
    def get(self):
        """Get all permissions."""
        permissions = Permission.query.all()
        return permissions_schema.dump(permissions)
    
    @jwt_required()
    def post(self):
        """Create a new permission."""
        try:
            data = permission_schema.load(request.json)
            permission = Permission(**data)
            db.session.add(permission)
            db.session.commit()
            return permission_schema.dump(permission), 201
        except ValidationError as err:
            return {'errors': err.messages}, 400
        except IntegrityError:
            db.session.rollback()
            return {'message': 'Permission creation failed'}, 400


# Register resources
api.add_resource(AuthResource, '/auth/login')
api.add_resource(RefreshTokenResource, '/auth/refresh')
api.add_resource(UserListResource, '/users')
api.add_resource(UserResource, '/users/<string:user_id>')
api.add_resource(RoleListResource, '/roles')
api.add_resource(RoleResource, '/roles/<string:role_id>')
api.add_resource(PermissionListResource, '/permissions')
{%- endif %}
