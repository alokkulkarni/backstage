"""
Seed data migration - Create default roles and permissions
"""
{% if values.framework == 'fastapi' -%}
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '002_seed_data'
down_revision = '001_initial'
branch_labels = None
depends_on = None

def upgrade():
    """Insert seed data"""
    # Get table references
    permissions_table = sa.table(
        'permissions',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('description', sa.String),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    roles_table = sa.table(
        'roles',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('description', sa.String),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    role_permissions_table = sa.table(
        'role_permissions',
        sa.column('role_id', sa.Integer),
        sa.column('permission_id', sa.Integer)
    )
    
    now = datetime.utcnow()
    
    # Insert permissions
    op.bulk_insert(permissions_table, [
        {'id': 1, 'name': 'read_users', 'description': 'Read user data', 'created_at': now, 'updated_at': now},
        {'id': 2, 'name': 'write_users', 'description': 'Create and update users', 'created_at': now, 'updated_at': now},
        {'id': 3, 'name': 'delete_users', 'description': 'Delete users', 'created_at': now, 'updated_at': now},
        {'id': 4, 'name': 'manage_roles', 'description': 'Manage roles and permissions', 'created_at': now, 'updated_at': now},
        {'id': 5, 'name': 'admin_access', 'description': 'Administrative access', 'created_at': now, 'updated_at': now},
    ])
    
    # Insert roles
    op.bulk_insert(roles_table, [
        {'id': 1, 'name': 'admin', 'description': 'Administrator role with full access', 'created_at': now, 'updated_at': now},
        {'id': 2, 'name': 'manager', 'description': 'Manager role with user management access', 'created_at': now, 'updated_at': now},
        {'id': 3, 'name': 'user', 'description': 'Standard user role', 'created_at': now, 'updated_at': now},
    ])
    
    # Assign permissions to roles
    op.bulk_insert(role_permissions_table, [
        # Admin role - all permissions
        {'role_id': 1, 'permission_id': 1},
        {'role_id': 1, 'permission_id': 2},
        {'role_id': 1, 'permission_id': 3},
        {'role_id': 1, 'permission_id': 4},
        {'role_id': 1, 'permission_id': 5},
        # Manager role - user management
        {'role_id': 2, 'permission_id': 1},
        {'role_id': 2, 'permission_id': 2},
        # User role - read only
        {'role_id': 3, 'permission_id': 1},
    ])

def downgrade():
    """Remove seed data"""
    op.execute("DELETE FROM role_permissions")
    op.execute("DELETE FROM roles")
    op.execute("DELETE FROM permissions")

{% elif values.framework == 'django' -%}
# Django data migration

from django.db import migrations

def create_seed_data(apps, schema_editor):
    """Create initial roles and permissions"""
    Permission = apps.get_model('app', 'Permission')
    Role = apps.get_model('app', 'Role')
    
    # Create permissions
    permissions = [
        Permission(name='read_users', description='Read user data'),
        Permission(name='write_users', description='Create and update users'),
        Permission(name='delete_users', description='Delete users'),
        Permission(name='manage_roles', description='Manage roles and permissions'),
        Permission(name='admin_access', description='Administrative access'),
    ]
    Permission.objects.bulk_create(permissions)
    
    # Create roles
    admin_role = Role.objects.create(
        name='admin',
        description='Administrator role with full access'
    )
    manager_role = Role.objects.create(
        name='manager',
        description='Manager role with user management access'
    )
    user_role = Role.objects.create(
        name='user',
        description='Standard user role'
    )
    
    # Assign permissions to roles
    admin_role.permissions.set(Permission.objects.all())
    manager_role.permissions.set(Permission.objects.filter(
        name__in=['read_users', 'write_users']
    ))
    user_role.permissions.set(Permission.objects.filter(
        name='read_users'
    ))

def remove_seed_data(apps, schema_editor):
    """Remove seed data"""
    Permission = apps.get_model('app', 'Permission')
    Role = apps.get_model('app', 'Role')
    
    Role.objects.all().delete()
    Permission.objects.all().delete()

class Migration(migrations.Migration):
    
    dependencies = [
        ('app', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(create_seed_data, remove_seed_data),
    ]

{% elif values.framework == 'flask' -%}
# Flask-Migrate data migration

"""Seed data migration

Revision ID: 002_seed_data
Revises: 001_initial
Create Date: 2024-01-01 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '002_seed_data'
down_revision = '001_initial'
branch_labels = None
depends_on = None

def upgrade():
    """Insert seed data"""
    # Get table references
    permissions_table = sa.table(
        'permissions',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('description', sa.String),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    roles_table = sa.table(
        'roles',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('description', sa.String),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    role_permissions_table = sa.table(
        'role_permissions',
        sa.column('role_id', sa.Integer),
        sa.column('permission_id', sa.Integer)
    )
    
    now = datetime.utcnow()
    
    # Insert permissions
    op.bulk_insert(permissions_table, [
        {'id': 1, 'name': 'read_users', 'description': 'Read user data', 'created_at': now, 'updated_at': now},
        {'id': 2, 'name': 'write_users', 'description': 'Create and update users', 'created_at': now, 'updated_at': now},
        {'id': 3, 'name': 'delete_users', 'description': 'Delete users', 'created_at': now, 'updated_at': now},
        {'id': 4, 'name': 'manage_roles', 'description': 'Manage roles and permissions', 'created_at': now, 'updated_at': now},
        {'id': 5, 'name': 'admin_access', 'description': 'Administrative access', 'created_at': now, 'updated_at': now},
    ])
    
    # Insert roles
    op.bulk_insert(roles_table, [
        {'id': 1, 'name': 'admin', 'description': 'Administrator role with full access', 'created_at': now, 'updated_at': now},
        {'id': 2, 'name': 'manager', 'description': 'Manager role with user management access', 'created_at': now, 'updated_at': now},
        {'id': 3, 'name': 'user', 'description': 'Standard user role', 'created_at': now, 'updated_at': now},
    ])
    
    # Assign permissions to roles
    op.bulk_insert(role_permissions_table, [
        # Admin role - all permissions
        {'role_id': 1, 'permission_id': 1},
        {'role_id': 1, 'permission_id': 2},
        {'role_id': 1, 'permission_id': 3},
        {'role_id': 1, 'permission_id': 4},
        {'role_id': 1, 'permission_id': 5},
        # Manager role - user management
        {'role_id': 2, 'permission_id': 1},
        {'role_id': 2, 'permission_id': 2},
        # User role - read only
        {'role_id': 3, 'permission_id': 1},
    ])

def downgrade():
    """Remove seed data"""
    op.execute("DELETE FROM role_permissions")
    op.execute("DELETE FROM roles")
    op.execute("DELETE FROM permissions")

{% endif %}
