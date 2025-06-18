{% if values.framework == "fastapi" -%}
"""
CRUD operations for database models.
"""
from typing import Any, Dict, Optional, Union, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from .models import User, Role, Permission
from .schemas import UserCreate, UserUpdate, RoleCreate, RoleUpdate, PermissionCreate
from .auth import get_password_hash


class BaseCRUD:
    """Base CRUD class."""
    
    def __init__(self, model):
        self.model = model
    
    def get(self, db: Session, id: Any) -> Optional[Any]:
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Any], int]:
        query = db.query(self.model)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
    
    def create(self, db: Session, *, obj_in: Any) -> Any:
        obj_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Any,
        obj_in: Union[Any, Dict[str, Any]]
    ) -> Any:
        obj_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        for field in obj_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, obj_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: Any) -> Any:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj


class UserCRUD(BaseCRUD):
    """User CRUD operations."""
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        obj_data = obj_in.dict()
        password = obj_data.pop("password")
        db_obj = User(**obj_data)
        db_obj.hashed_password = get_password_hash(password)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        return super().update(db, db_obj=db_obj, obj_in=update_data)
    
    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        from .auth import verify_password
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def is_active(self, user: User) -> bool:
        return user.is_active
    
    def is_superuser(self, user: User) -> bool:
        return user.is_superuser


class RoleCRUD(BaseCRUD):
    """Role CRUD operations."""
    
    def __init__(self):
        super().__init__(Role)
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Role]:
        return db.query(Role).filter(Role.name == name).first()
    
    def add_permission(self, db: Session, *, role: Role, permission: Permission) -> Role:
        role.permissions.append(permission)
        db.add(role)
        db.commit()
        db.refresh(role)
        return role
    
    def remove_permission(self, db: Session, *, role: Role, permission: Permission) -> Role:
        role.permissions.remove(permission)
        db.add(role)
        db.commit()
        db.refresh(role)
        return role


class PermissionCRUD(BaseCRUD):
    """Permission CRUD operations."""
    
    def __init__(self):
        super().__init__(Permission)
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Permission]:
        return db.query(Permission).filter(Permission.name == name).first()
    
    def get_by_resource_action(
        self, db: Session, *, resource: str, action: str
    ) -> Optional[Permission]:
        return db.query(Permission).filter(
            Permission.resource == resource,
            Permission.action == action
        ).first()

{%- elif values.framework == "django" -%}
"""
Service layer for business logic.
"""
from typing import Optional, List, Dict, Any
from django.contrib.auth import authenticate
from django.core.paginator import Paginator
from django.db.models import Q, QuerySet
from django.contrib.auth.hashers import make_password

from .models import User, Role, Permission


class UserService:
    """User service for business logic."""
    
    @staticmethod
    def create_user(data: Dict[str, Any]) -> User:
        """Create a new user."""
        password = data.pop('password', None)
        user = User(**data)
        if password:
            user.set_password(password)
        user.save()
        return user
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email."""
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def get_user_by_username(username: str) -> Optional[User]:
        """Get user by username."""
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[User]:
        """Authenticate user."""
        return authenticate(username=email, password=password)
    
    @staticmethod
    def get_paginated_users(page: int = 1, per_page: int = 20, search: str = '') -> Dict[str, Any]:
        """Get paginated users."""
        queryset = User.objects.all()
        
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        paginator = Paginator(queryset, per_page)
        page_obj = paginator.get_page(page)
        
        return {
            'items': page_obj.object_list,
            'total': paginator.count,
            'page': page,
            'per_page': per_page,
            'pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_prev': page_obj.has_previous()
        }
    
    @staticmethod
    def assign_role_to_user(user: User, role: Role) -> bool:
        """Assign role to user."""
        try:
            user.roles.add(role)
            return True
        except Exception:
            return False
    
    @staticmethod
    def remove_role_from_user(user: User, role: Role) -> bool:
        """Remove role from user."""
        try:
            user.roles.remove(role)
            return True
        except Exception:
            return False


class RoleService:
    """Role service for business logic."""
    
    @staticmethod
    def create_role(data: Dict[str, Any]) -> Role:
        """Create a new role."""
        role = Role(**data)
        role.save()
        return role
    
    @staticmethod
    def get_role_by_name(name: str) -> Optional[Role]:
        """Get role by name."""
        try:
            return Role.objects.get(name=name)
        except Role.DoesNotExist:
            return None
    
    @staticmethod
    def assign_permission_to_role(role: Role, permission: Permission) -> bool:
        """Assign permission to role."""
        try:
            role.permissions.add(permission)
            return True
        except Exception:
            return False
    
    @staticmethod
    def remove_permission_from_role(role: Role, permission: Permission) -> bool:
        """Remove permission from role."""
        try:
            role.permissions.remove(permission)
            return True
        except Exception:
            return False


class PermissionService:
    """Permission service for business logic."""
    
    @staticmethod
    def create_permission(data: Dict[str, Any]) -> Permission:
        """Create a new permission."""
        permission = Permission(**data)
        permission.save()
        return permission
    
    @staticmethod
    def get_permission_by_resource_action(resource: str, action: str) -> Optional[Permission]:
        """Get permission by resource and action."""
        try:
            return Permission.objects.get(resource=resource, action=action)
        except Permission.DoesNotExist:
            return None
    
    @staticmethod
    def check_user_permission(user: User, resource: str, action: str) -> bool:
        """Check if user has specific permission."""
        if user.is_superuser:
            return True
        
        for role in user.roles.all():
            for permission in role.permissions.all():
                if permission.resource == resource and permission.action == action:
                    return True
        
        return False

{%- elif values.framework == "flask" -%}
"""
Service layer for business logic.
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from .database import db
from .models import User, Role, Permission


class UserService:
    """User service for business logic."""
    
    @staticmethod
    def create_user(data: Dict[str, Any]) -> User:
        """Create a new user."""
        password = data.pop('password', None)
        user = User(**data)
        if password:
            user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            return user
        except IntegrityError:
            db.session.rollback()
            raise
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Get user by ID."""
        return User.query.get(user_id)
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email."""
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def get_user_by_username(username: str) -> Optional[User]:
        """Get user by username."""
        return User.query.filter_by(username=username).first()
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[User]:
        """Authenticate user."""
        user = UserService.get_user_by_email(email)
        if user and user.check_password(password) and user.is_active:
            return user
        return None
    
    @staticmethod
    def get_paginated_users(page: int = 1, per_page: int = 20, search: str = '') -> Dict[str, Any]:
        """Get paginated users."""
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
            'items': paginated_users.items,
            'total': paginated_users.total,
            'page': page,
            'per_page': per_page,
            'pages': paginated_users.pages,
            'has_next': paginated_users.has_next,
            'has_prev': paginated_users.has_prev
        }
    
    @staticmethod
    def update_user(user: User, data: Dict[str, Any]) -> User:
        """Update user."""
        for key, value in data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        try:
            db.session.commit()
            return user
        except IntegrityError:
            db.session.rollback()
            raise
    
    @staticmethod
    def delete_user(user: User) -> bool:
        """Delete user."""
        try:
            db.session.delete(user)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    
    @staticmethod
    def assign_role_to_user(user: User, role: Role) -> bool:
        """Assign role to user."""
        try:
            user.roles.append(role)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    
    @staticmethod
    def remove_role_from_user(user: User, role: Role) -> bool:
        """Remove role from user."""
        try:
            user.roles.remove(role)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False


class RoleService:
    """Role service for business logic."""
    
    @staticmethod
    def create_role(data: Dict[str, Any]) -> Role:
        """Create a new role."""
        role = Role(**data)
        
        try:
            db.session.add(role)
            db.session.commit()
            return role
        except IntegrityError:
            db.session.rollback()
            raise
    
    @staticmethod
    def get_role_by_id(role_id: str) -> Optional[Role]:
        """Get role by ID."""
        return Role.query.get(role_id)
    
    @staticmethod
    def get_role_by_name(name: str) -> Optional[Role]:
        """Get role by name."""
        return Role.query.filter_by(name=name).first()
    
    @staticmethod
    def get_all_roles() -> List[Role]:
        """Get all roles."""
        return Role.query.all()
    
    @staticmethod
    def update_role(role: Role, data: Dict[str, Any]) -> Role:
        """Update role."""
        for key, value in data.items():
            if hasattr(role, key):
                setattr(role, key, value)
        
        try:
            db.session.commit()
            return role
        except IntegrityError:
            db.session.rollback()
            raise
    
    @staticmethod
    def delete_role(role: Role) -> bool:
        """Delete role."""
        try:
            db.session.delete(role)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    
    @staticmethod
    def assign_permission_to_role(role: Role, permission: Permission) -> bool:
        """Assign permission to role."""
        try:
            role.permissions.append(permission)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    
    @staticmethod
    def remove_permission_from_role(role: Role, permission: Permission) -> bool:
        """Remove permission from role."""
        try:
            role.permissions.remove(permission)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False


class PermissionService:
    """Permission service for business logic."""
    
    @staticmethod
    def create_permission(data: Dict[str, Any]) -> Permission:
        """Create a new permission."""
        permission = Permission(**data)
        
        try:
            db.session.add(permission)
            db.session.commit()
            return permission
        except IntegrityError:
            db.session.rollback()
            raise
    
    @staticmethod
    def get_permission_by_id(permission_id: str) -> Optional[Permission]:
        """Get permission by ID."""
        return Permission.query.get(permission_id)
    
    @staticmethod
    def get_permission_by_name(name: str) -> Optional[Permission]:
        """Get permission by name."""
        return Permission.query.filter_by(name=name).first()
    
    @staticmethod
    def get_permission_by_resource_action(resource: str, action: str) -> Optional[Permission]:
        """Get permission by resource and action."""
        return Permission.query.filter_by(resource=resource, action=action).first()
    
    @staticmethod
    def get_all_permissions() -> List[Permission]:
        """Get all permissions."""
        return Permission.query.all()
    
    @staticmethod
    def update_permission(permission: Permission, data: Dict[str, Any]) -> Permission:
        """Update permission."""
        for key, value in data.items():
            if hasattr(permission, key):
                setattr(permission, key, value)
        
        try:
            db.session.commit()
            return permission
        except IntegrityError:
            db.session.rollback()
            raise
    
    @staticmethod
    def delete_permission(permission: Permission) -> bool:
        """Delete permission."""
        try:
            db.session.delete(permission)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    
    @staticmethod
    def check_user_permission(user: User, resource: str, action: str) -> bool:
        """Check if user has specific permission."""
        if user.is_superuser:
            return True
        
        return user.has_permission(resource, action)
{%- endif %}
