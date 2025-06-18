"""
Background tasks using Celery
"""
import logging
import time
from typing import Dict, Any, List
from celery import shared_task
{% if values.framework == 'fastapi' -%}
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import User
from app.crud import UserService
{% elif values.framework == 'django' -%}
from app.celery_app import celery_app
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
User = get_user_model()
{% elif values.framework == 'flask' -%}
from app.celery_app import celery_app
from app.models import User, db
from app.crud import UserService
{% endif %}

logger = logging.getLogger(__name__)

{% if values.framework == 'fastapi' -%}
@celery_app.task(bind=True)
def send_welcome_email(self, user_id: int):
    """Send welcome email to new user"""
    try:
        db = SessionLocal()
        user_service = UserService(db)
        user = user_service.get_user(user_id)
        
        if not user:
            logger.error(f"User with ID {user_id} not found")
            return {"status": "error", "message": "User not found"}
        
        # Simulate email sending
        logger.info(f"Sending welcome email to {user.email}")
        time.sleep(2)  # Simulate email processing time
        
        logger.info(f"Welcome email sent successfully to {user.email}")
        db.close()
        
        return {
            "status": "success",
            "message": f"Welcome email sent to {user.email}",
            "user_id": user_id
        }
        
    except Exception as exc:
        logger.error(f"Failed to send welcome email: {str(exc)}")
        self.retry(countdown=60, max_retries=3)

@celery_app.task
def generate_user_report():
    """Generate user statistics report"""
    try:
        db = SessionLocal()
        user_service = UserService(db)
        
        users = user_service.get_users()
        total_users = len(users)
        active_users = len([u for u in users if u.is_active])
        admin_users = len([u for u in users if u.is_admin])
        
        report = {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "inactive_users": total_users - active_users,
            "generated_at": time.time()
        }
        
        logger.info(f"User report generated: {report}")
        db.close()
        
        return report
        
    except Exception as exc:
        logger.error(f"Failed to generate user report: {str(exc)}")
        raise

@celery_app.task(bind=True)
def cleanup_inactive_users(self, days_inactive: int = 30):
    """Cleanup users inactive for specified days"""
    try:
        db = SessionLocal()
        user_service = UserService(db)
        
        # This is a simulation - in real app, you'd check last_login dates
        inactive_users = [u for u in user_service.get_users() if not u.is_active]
        
        cleanup_count = 0
        for user in inactive_users:
            # In real app, you'd have proper cleanup logic
            logger.info(f"Would cleanup inactive user: {user.username}")
            cleanup_count += 1
        
        db.close()
        
        return {
            "status": "success",
            "cleaned_up": cleanup_count,
            "message": f"Cleaned up {cleanup_count} inactive users"
        }
        
    except Exception as exc:
        logger.error(f"Failed to cleanup inactive users: {str(exc)}")
        self.retry(countdown=300, max_retries=2)

{% elif values.framework == 'django' -%}
@shared_task(bind=True)
def send_welcome_email(self, user_id: int):
    """Send welcome email to new user"""
    try:
        user = User.objects.get(id=user_id)
        
        # Send email using Django's email backend
        send_mail(
            subject='Welcome to our platform!',
            message=f'Hello {user.full_name or user.username}, welcome to our platform!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f"Welcome email sent successfully to {user.email}")
        
        return {
            "status": "success",
            "message": f"Welcome email sent to {user.email}",
            "user_id": user_id
        }
        
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found")
        return {"status": "error", "message": "User not found"}
    except Exception as exc:
        logger.error(f"Failed to send welcome email: {str(exc)}")
        self.retry(countdown=60, max_retries=3)

@shared_task
def generate_user_report():
    """Generate user statistics report"""
    try:
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        admin_users = User.objects.filter(is_admin=True).count()
        
        report = {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "inactive_users": total_users - active_users,
            "generated_at": time.time()
        }
        
        logger.info(f"User report generated: {report}")
        return report
        
    except Exception as exc:
        logger.error(f"Failed to generate user report: {str(exc)}")
        raise

@shared_task(bind=True)
def cleanup_inactive_users(self, days_inactive: int = 30):
    """Cleanup users inactive for specified days"""
    try:
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.now() - timedelta(days=days_inactive)
        inactive_users = User.objects.filter(
            is_active=False,
            last_login__lt=cutoff_date
        )
        
        cleanup_count = inactive_users.count()
        
        # In production, you might want to soft-delete or archive
        # inactive_users.delete()
        
        logger.info(f"Would cleanup {cleanup_count} inactive users")
        
        return {
            "status": "success",
            "cleaned_up": cleanup_count,
            "message": f"Cleaned up {cleanup_count} inactive users"
        }
        
    except Exception as exc:
        logger.error(f"Failed to cleanup inactive users: {str(exc)}")
        self.retry(countdown=300, max_retries=2)

{% elif values.framework == 'flask' -%}
@celery_app.task(bind=True)
def send_welcome_email(self, user_id: int):
    """Send welcome email to new user"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            logger.error(f"User with ID {user_id} not found")
            return {"status": "error", "message": "User not found"}
        
        # Simulate email sending
        logger.info(f"Sending welcome email to {user.email}")
        time.sleep(2)  # Simulate email processing time
        
        logger.info(f"Welcome email sent successfully to {user.email}")
        
        return {
            "status": "success",
            "message": f"Welcome email sent to {user.email}",
            "user_id": user_id
        }
        
    except Exception as exc:
        logger.error(f"Failed to send welcome email: {str(exc)}")
        self.retry(countdown=60, max_retries=3)

@celery_app.task
def generate_user_report():
    """Generate user statistics report"""
    try:
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        admin_users = User.query.filter_by(is_admin=True).count()
        
        report = {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "inactive_users": total_users - active_users,
            "generated_at": time.time()
        }
        
        logger.info(f"User report generated: {report}")
        return report
        
    except Exception as exc:
        logger.error(f"Failed to generate user report: {str(exc)}")
        raise

@celery_app.task(bind=True)
def cleanup_inactive_users(self, days_inactive: int = 30):
    """Cleanup users inactive for specified days"""
    try:
        inactive_users = User.query.filter_by(is_active=False).all()
        
        cleanup_count = 0
        for user in inactive_users:
            # In real app, you'd have proper cleanup logic
            logger.info(f"Would cleanup inactive user: {user.username}")
            cleanup_count += 1
        
        return {
            "status": "success",
            "cleaned_up": cleanup_count,
            "message": f"Cleaned up {cleanup_count} inactive users"
        }
        
    except Exception as exc:
        logger.error(f"Failed to cleanup inactive users: {str(exc)}")
        self.retry(countdown=300, max_retries=2)

{% endif %}

# Periodic tasks (configured via celery beat)
{% if values.framework == 'fastapi' -%}
@celery_app.task
def scheduled_user_report():
    """Scheduled task to generate daily user report"""
    return generate_user_report.delay()

@celery_app.task
def scheduled_cleanup():
    """Scheduled task to cleanup inactive users weekly"""
    return cleanup_inactive_users.delay(days_inactive=30)

{% elif values.framework == 'django' -%}
@shared_task
def scheduled_user_report():
    """Scheduled task to generate daily user report"""
    return generate_user_report.delay()

@shared_task
def scheduled_cleanup():
    """Scheduled task to cleanup inactive users weekly"""
    return cleanup_inactive_users.delay(days_inactive=30)

{% elif values.framework == 'flask' -%}
@celery_app.task
def scheduled_user_report():
    """Scheduled task to generate daily user report"""
    return generate_user_report.delay()

@celery_app.task
def scheduled_cleanup():
    """Scheduled task to cleanup inactive users weekly"""
    return cleanup_inactive_users.delay(days_inactive=30)

{% endif %}

# Task monitoring and utilities
{% if values.framework == 'fastapi' -%}
@celery_app.task
def health_check():
    """Health check task for monitoring"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "worker": "celery"
    }

{% elif values.framework == 'django' -%}
@shared_task
def health_check():
    """Health check task for monitoring"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "worker": "celery"
    }

{% elif values.framework == 'flask' -%}
@celery_app.task
def health_check():
    """Health check task for monitoring"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "worker": "celery"
    }

{% endif %}
