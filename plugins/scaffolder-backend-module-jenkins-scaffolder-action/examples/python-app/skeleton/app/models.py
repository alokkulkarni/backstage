"""
Database models.
"""
{% if values.framework == "fastapi" -%}
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from .database import Base

# Association table for many-to-many relationship between User and Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True)
)

# Association table for many-to-many relationship between Role and Permission
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('permissions.id'), primary_key=True)
)


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Role(Base):
    """Role model for RBAC."""
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")


class Permission(Base):
    """Permission model for RBAC."""
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    resource = Column(String(100), nullable=False)  # e.g., 'user', 'order', 'product'
    action = Column(String(50), nullable=False)     # e.g., 'create', 'read', 'update', 'delete'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

{%- elif values.framework == "django" -%}
from django.contrib.auth.models import AbstractUser
from django.db import models
from .database import BaseModel


class User(AbstractUser, BaseModel):
    """Custom user model extending Django's AbstractUser."""
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Role(BaseModel):
    """Role model for RBAC."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    users = models.ManyToManyField(User, related_name='roles', blank=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name


class Permission(models.Model):
    """Permission model for RBAC."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    resource = models.CharField(max_length=100)  # e.g., 'user', 'order', 'product'
    action = models.CharField(max_length=50)     # e.g., 'create', 'read', 'update', 'delete'
    roles = models.ManyToManyField(Role, related_name='permissions', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        unique_together = ['resource', 'action']

    def __str__(self):
        return f"{self.resource}:{self.action}"

{%- elif values.framework == "flask" -%}
from flask_user import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from .database import db, BaseModel

# Association tables for many-to-many relationships
user_roles = db.Table('user_roles',
    db.Column('user_id', UUID(as_uuid=True), db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', UUID(as_uuid=True), db.ForeignKey('roles.id'), primary_key=True)
)

role_permissions = db.Table('role_permissions',
    db.Column('role_id', UUID(as_uuid=True), db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', UUID(as_uuid=True), db.ForeignKey('permissions.id'), primary_key=True)
)


class User(BaseModel, UserMixin):
    """User model."""
    __tablename__ = 'users'

    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_superuser = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    roles = db.relationship('Role', secondary=user_roles, back_populates='users')

    def set_password(self, password):
        """Set password hash."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password."""
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def has_permission(self, resource, action):
        """Check if user has specific permission."""
        for role in self.roles:
            for permission in role.permissions:
                if permission.resource == resource and permission.action == action:
                    return True
        return False

    def __repr__(self):
        return f'<User {self.username}>'


class Role(BaseModel):
    """Role model for RBAC."""
    __tablename__ = 'roles'

    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Relationships
    users = db.relationship('User', secondary=user_roles, back_populates='roles')
    permissions = db.relationship('Permission', secondary=role_permissions, back_populates='roles')

    def __repr__(self):
        return f'<Role {self.name}>'


class Permission(db.Model):
    """Permission model for RBAC."""
    __tablename__ = 'permissions'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    resource = db.Column(db.String(100), nullable=False)  # e.g., 'user', 'order', 'product'
    action = db.Column(db.String(50), nullable=False)     # e.g., 'create', 'read', 'update', 'delete'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    roles = db.relationship('Role', secondary=role_permissions, back_populates='permissions')

    __table_args__ = (db.UniqueConstraint('resource', 'action', name='unique_resource_action'),)

    def __repr__(self):
        return f'<Permission {self.resource}:{self.action}>'
{%- endif %}
