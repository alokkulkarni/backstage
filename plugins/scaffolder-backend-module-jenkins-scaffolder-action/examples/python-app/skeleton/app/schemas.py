"""
Pydantic schemas for request/response validation.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

{% if values.framework == "fastapi" -%}
from pydantic import BaseModel, EmailStr, Field, validator

# Base schemas
class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    class Config:
        from_attributes = True
        validate_assignment = True
        arbitrary_types_allowed = True


# User schemas
class UserBase(BaseSchema):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True
    is_verified: bool = False


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseSchema):
    """User update schema."""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserResponse(UserBase):
    """User response schema."""
    id: uuid.UUID
    full_name: str
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    roles: List['RoleResponse'] = []


class UserLogin(BaseSchema):
    """User login schema."""
    email: EmailStr
    password: str


class Token(BaseSchema):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseSchema):
    """Token data schema."""
    email: Optional[str] = None
    scopes: List[str] = []


# Role schemas
class RoleBase(BaseSchema):
    """Base role schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class RoleCreate(RoleBase):
    """Role creation schema."""
    pass


class RoleUpdate(BaseSchema):
    """Role update schema."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleResponse(RoleBase):
    """Role response schema."""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    permissions: List['PermissionResponse'] = []


# Permission schemas
class PermissionBase(BaseSchema):
    """Base permission schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    resource: str = Field(..., min_length=1, max_length=100)
    action: str = Field(..., min_length=1, max_length=50)


class PermissionCreate(PermissionBase):
    """Permission creation schema."""
    pass


class PermissionResponse(PermissionBase):
    """Permission response schema."""
    id: uuid.UUID
    created_at: datetime


# Common schemas
class PaginationParams(BaseSchema):
    """Pagination parameters."""
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseSchema):
    """Paginated response schema."""
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class HealthCheck(BaseSchema):
    """Health check response."""
    status: str
    timestamp: datetime
    version: str
    database: bool
    redis: bool


class ErrorResponse(BaseSchema):
    """Error response schema."""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime


# Update forward references
UserResponse.model_rebuild()
RoleResponse.model_rebuild()

{%- elif values.framework == "django" -%}
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Role, Permission


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""
    full_name = serializers.ReadOnlyField()
    roles = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'is_active', 'is_verified', 'is_superuser',
            'created_at', 'updated_at', 'last_login', 'roles'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    """User creation serializer."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """User update serializer."""
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'is_active', 'is_verified']


class UserLoginSerializer(serializers.Serializer):
    """User login serializer."""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class RoleSerializer(serializers.ModelSerializer):
    """Role serializer."""
    permissions = serializers.StringRelatedField(many=True, read_only=True)
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at', 'permissions', 'users_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_users_count(self, obj):
        return obj.users.count()


class PermissionSerializer(serializers.ModelSerializer):
    """Permission serializer."""
    
    class Meta:
        model = Permission
        fields = ['id', 'name', 'description', 'resource', 'action', 'created_at']
        read_only_fields = ['id', 'created_at']


class PaginationSerializer(serializers.Serializer):
    """Pagination serializer."""
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = serializers.ListField()

{%- elif values.framework == "flask" -%}
from marshmallow import Schema, fields, validate, validates, ValidationError, post_load
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from .models import User, Role, Permission


class BaseSchema(Schema):
    """Base schema with common configuration."""
    
    class Meta:
        load_instance = True
        sqla_session = None  # Will be set in the application factory


class UserSchema(SQLAlchemyAutoSchema):
    """User schema."""
    full_name = fields.Method("get_full_name")
    password = fields.Str(load_only=True, validate=validate.Length(min=8))
    roles = fields.Nested('RoleSchema', many=True, exclude=['users'], dump_only=True)
    
    class Meta:
        model = User
        load_instance = True
        exclude = ['password_hash']
        dump_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_full_name(self, obj):
        return obj.full_name
    
    @validates('password')
    def validate_password(self, value):
        if len(value) < 8:
            raise ValidationError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in value):
            raise ValidationError('Password must contain at least one digit')


class UserCreateSchema(Schema):
    """User creation schema."""
    email = fields.Email(required=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    password = fields.Str(required=True, validate=validate.Length(min=8))
    password_confirm = fields.Str(required=True)
    
    @validates('password')
    def validate_password(self, value):
        if len(value) < 8:
            raise ValidationError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in value):
            raise ValidationError('Password must contain at least one digit')
    
    @validates('password_confirm')
    def validate_password_confirm(self, value):
        if 'password' in self.context and value != self.context['password']:
            raise ValidationError("Passwords don't match")


class UserUpdateSchema(Schema):
    """User update schema."""
    email = fields.Email()
    username = fields.Str(validate=validate.Length(min=3, max=100))
    first_name = fields.Str(validate=validate.Length(min=1, max=100))
    last_name = fields.Str(validate=validate.Length(min=1, max=100))
    is_active = fields.Bool()
    is_verified = fields.Bool()


class UserLoginSchema(Schema):
    """User login schema."""
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class RoleSchema(SQLAlchemyAutoSchema):
    """Role schema."""
    permissions = fields.Nested('PermissionSchema', many=True, exclude=['roles'], dump_only=True)
    users_count = fields.Method("get_users_count")
    
    class Meta:
        model = Role
        load_instance = True
        dump_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_users_count(self, obj):
        return len(obj.users)


class PermissionSchema(SQLAlchemyAutoSchema):
    """Permission schema."""
    
    class Meta:
        model = Permission
        load_instance = True
        dump_only_fields = ['id', 'created_at']


class TokenSchema(Schema):
    """Token schema."""
    access_token = fields.Str(required=True)
    refresh_token = fields.Str(required=True)
    token_type = fields.Str(default="bearer")
    expires_in = fields.Int(required=True)


class PaginationSchema(Schema):
    """Pagination schema."""
    page = fields.Int(validate=validate.Range(min=1), default=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), default=20)


class PaginatedResponseSchema(Schema):
    """Paginated response schema."""
    items = fields.List(fields.Raw())
    total = fields.Int()
    page = fields.Int()
    per_page = fields.Int()
    pages = fields.Int()
    has_next = fields.Bool()
    has_prev = fields.Bool()


class HealthCheckSchema(Schema):
    """Health check schema."""
    status = fields.Str()
    timestamp = fields.DateTime()
    version = fields.Str()
    database = fields.Bool()
    redis = fields.Bool()


class ErrorSchema(Schema):
    """Error response schema."""
    message = fields.Str(required=True)
    error_code = fields.Str()
    timestamp = fields.DateTime()
    details = fields.Dict()
{%- endif %}
