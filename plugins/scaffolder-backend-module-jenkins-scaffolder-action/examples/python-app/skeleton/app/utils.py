"""
{% if values.framework == 'django' -%}
Django URL configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({"status": "healthy", "service": "{{ values.name }}"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('app.urls')),
    path('health/', health_check, name='health_check'),
]

# Add static file serving in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

{% elif values.framework == 'flask' -%}
Flask CLI commands and utilities
"""
import click
from flask.cli import with_appcontext
from app.models import db, User, Role, Permission
from app.auth import get_password_hash

@click.command()
@with_appcontext
def init_db():
    """Initialize the database."""
    click.echo('Initializing database...')
    db.create_all()
    click.echo('Database initialized.')

@click.command()
@with_appcontext
def create_admin():
    """Create an admin user."""
    username = click.prompt('Admin username')
    email = click.prompt('Admin email')
    password = click.prompt('Admin password', hide_input=True)
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        click.echo('Error: User already exists.')
        return
    
    # Create admin user
    admin_user = User(
        username=username,
        email=email,
        full_name='Administrator',
        is_admin=True
    )
    admin_user.set_password(password)
    
    # Assign admin role if it exists
    admin_role = Role.query.filter_by(name='admin').first()
    if admin_role:
        admin_user.roles.append(admin_role)
    
    db.session.add(admin_user)
    db.session.commit()
    
    click.echo(f'Admin user {username} created successfully.')

@click.command()
@with_appcontext
def seed_data():
    """Seed the database with initial data."""
    click.echo('Seeding database...')
    
    # Create permissions
    permissions = [
        Permission(name='read_users', description='Read user data'),
        Permission(name='write_users', description='Create and update users'),
        Permission(name='delete_users', description='Delete users'),
        Permission(name='manage_roles', description='Manage roles and permissions'),
        Permission(name='admin_access', description='Administrative access'),
    ]
    
    for perm in permissions:
        if not Permission.query.filter_by(name=perm.name).first():
            db.session.add(perm)
    
    # Create roles
    admin_role = Role.query.filter_by(name='admin').first()
    if not admin_role:
        admin_role = Role(name='admin', description='Administrator role with full access')
        db.session.add(admin_role)
    
    manager_role = Role.query.filter_by(name='manager').first()
    if not manager_role:
        manager_role = Role(name='manager', description='Manager role with user management access')
        db.session.add(manager_role)
    
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user', description='Standard user role')
        db.session.add(user_role)
    
    db.session.commit()
    
    # Assign permissions to roles
    admin_role.permissions = Permission.query.all()
    manager_role.permissions = Permission.query.filter(
        Permission.name.in_(['read_users', 'write_users'])
    ).all()
    user_role.permissions = Permission.query.filter_by(name='read_users').all()
    
    db.session.commit()
    click.echo('Database seeded successfully.')

# Register commands
def register_commands(app):
    """Register CLI commands with Flask app"""
    app.cli.add_command(init_db)
    app.cli.add_command(create_admin)
    app.cli.add_command(seed_data)

{% else -%}
# FastAPI utilities
"""
FastAPI startup and shutdown event handlers
"""
import logging
from contextlib import asynccontextmanager
from app.database import create_tables, engine

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting up application...")
    
    # Create database tables
    create_tables()
    
    # Add any other startup tasks here
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    # Close database connections
    engine.dispose()
    
    logger.info("Application shutdown complete")

{% endif %}
