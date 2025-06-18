{% if values.framework == 'django' -%}
"""
Django app-specific URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.api import UserViewSet, RoleViewSet, AuthViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include([
        path('login/', AuthViewSet.as_view({'post': 'login'}), name='auth-login'),
        path('logout/', AuthViewSet.as_view({'post': 'logout'}), name='auth-logout'),
        path('me/', AuthViewSet.as_view({'get': 'me'}), name='auth-me'),
    ])),
]

{% elif values.framework == 'flask' -%}
"""
Flask error handlers
"""
from flask import jsonify
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):
    """Register error handlers with Flask app"""
    
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found.",
            "status_code": 404
        }), 404
    
    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            "error": "Bad Request",
            "message": "The request was invalid.",
            "status_code": 400
        }), 400
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required.",
            "status_code": 401
        }), 401
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            "error": "Forbidden",
            "message": "You don't have permission to access this resource.",
            "status_code": 403
        }), 403
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "An internal server error occurred.",
            "status_code": 500
        }), 500
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({
            "error": error.name,
            "message": error.description,
            "status_code": error.code
        }), error.code

{% else -%}
"""
FastAPI exception handlers
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation exceptions"""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "details": exc.errors(),
            "status_code": 422
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An internal server error occurred",
            "status_code": 500
        }
    )

{% endif %}
