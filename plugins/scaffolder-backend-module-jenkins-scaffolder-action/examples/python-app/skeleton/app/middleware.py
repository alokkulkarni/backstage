{% if values.framework == "fastapi" -%}
"""
Custom middleware for FastAPI application.
"""
import time
import logging
from typing import Callable
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
REQUEST_SIZE = Histogram('http_request_size_bytes', 'HTTP request size')
RESPONSE_SIZE = Histogram('http_response_size_bytes', 'HTTP response size')


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request
        logger.info(
            "request_started",
            method=request.method,
            url=str(request.url),
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        logger.info(
            "request_completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration=duration,
            client_ip=request.client.host if request.client else None,
        )
        
        return response


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for Prometheus metrics collection."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Get request size
        request_size = int(request.headers.get("content-length", 0))
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration and response size
        duration = time.time() - start_time
        response_size = int(response.headers.get("content-length", 0))
        
        # Record metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        REQUEST_DURATION.observe(duration)
        REQUEST_SIZE.observe(request_size)
        RESPONSE_SIZE.observe(response_size)
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for security headers."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response

{%- elif values.framework == "django" -%}
"""
Custom middleware for Django application.
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest, HttpResponse
from prometheus_client import Counter, Histogram
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')


class LoggingMiddleware(MiddlewareMixin):
    """Middleware for request/response logging."""
    
    def process_request(self, request: HttpRequest):
        request.start_time = time.time()
        
        logger.info(
            "request_started",
            method=request.method,
            path=request.path,
            client_ip=self.get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )
    
    def process_response(self, request: HttpRequest, response: HttpResponse):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            logger.info(
                "request_completed",
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                duration=duration,
                client_ip=self.get_client_ip(request),
            )
            
            # Record Prometheus metrics
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.path,
                status=response.status_code
            ).inc()
            
            REQUEST_DURATION.observe(duration)
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Middleware for security headers."""
    
    def process_response(self, request: HttpRequest, response: HttpResponse):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Content-Security-Policy'] = "default-src 'self'"
        
        return response

{%- elif values.framework == "flask" -%}
"""
Custom middleware and decorators for Flask application.
"""
import time
import logging
from functools import wraps
from flask import request, g, current_app
from prometheus_client import Counter, Histogram
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')


def setup_logging_middleware(app):
    """Setup logging middleware for Flask app."""
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
        
        logger.info(
            "request_started",
            method=request.method,
            path=request.path,
            client_ip=get_client_ip(),
            user_agent=request.headers.get("User-Agent"),
        )
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            logger.info(
                "request_completed",
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                duration=duration,
                client_ip=get_client_ip(),
            )
            
            # Record Prometheus metrics
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=response.status_code
            ).inc()
            
            REQUEST_DURATION.observe(duration)
        
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Content-Security-Policy'] = "default-src 'self'"
        
        return response


def get_client_ip():
    """Get client IP address."""
    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip = request.remote_addr
    return ip


def log_execution_time(func):
    """Decorator to log function execution time."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        logger.info(
            "function_executed",
            function=func.__name__,
            execution_time=execution_time
        )
        
        return result
    return wrapper


def rate_limit(max_requests=100, window=3600):
    """Rate limiting decorator."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Simple in-memory rate limiting
            # In production, use Redis or similar
            client_ip = get_client_ip()
            key = f"rate_limit:{client_ip}:{f.__name__}"
            
            # This is a simplified implementation
            # In production, implement proper rate limiting with Redis
            
            return f(*args, **kwargs)
        return wrapper
    return decorator
{%- endif %}
