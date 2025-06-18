{% if values.framework == "fastapi" -%}
"""
FastAPI application main module.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import time
import logging
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client import start_http_server

from .config import settings
from .database import init_db
from .api import router
from .middleware import LoggingMiddleware, MetricsMiddleware

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting up {{ values.name }} application...")
    init_db()
    
    # Start Prometheus metrics server
    start_http_server(settings.metrics_port)
    logger.info(f"Prometheus metrics server started on port {settings.metrics_port}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down {{ values.name }} application...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else ["{{ values.name }}.{{ values.domain | default('example.com') }}"]
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(MetricsMiddleware)

# Include API routes
app.include_router(router, prefix="/api/v1")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "timestamp": time.time()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "timestamp": time.time()
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    from .database import engine
    from redis import Redis
    import asyncio
    
    # Check database
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        db_status = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = False
    
    # Check Redis
    try:
        redis_client = Redis.from_url(settings.redis_url)
        redis_client.ping()
        redis_status = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = False
    
    status_code = status.HTTP_200_OK if db_status and redis_status else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if db_status and redis_status else "unhealthy",
            "timestamp": time.time(),
            "version": settings.app_version,
            "database": db_status,
            "redis": redis_status
        }
    )


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation not available in production"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level="info" if not settings.debug else "debug"
    )

{%- elif values.framework == "django" -%}
"""
Django WSGI configuration for {{ values.name }} project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

application = get_wsgi_application()

{%- elif values.framework == "flask" -%}
"""
Flask application factory.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_redis import FlaskRedis
from flask_caching import Cache
import time
import logging
from datetime import datetime
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from .config import get_config
from .database import init_db, db
from .api import api_bp

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')


def create_app(config_name=None):
    """Create Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    config = get_config()
    app.config.from_object(config)
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    
    # Initialize extensions
    db.init_app(app)
    init_db(app)
    
    # CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # JWT
    jwt = JWTManager(app)
    
    # Redis
    redis_client = FlaskRedis(app)
    
    # Cache
    cache = Cache(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    
    # Middleware for metrics
    @app.before_request
    def before_request():
        request.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        # Record metrics
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            REQUEST_DURATION.observe(duration)
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=response.status_code
            ).inc()
        
        return response
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad request',
            'message': str(error),
            'timestamp': datetime.utcnow().isoformat()
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required',
            'timestamp': datetime.utcnow().isoformat()
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Insufficient permissions',
            'timestamp': datetime.utcnow().isoformat()
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': 'Resource not found',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred',
            'timestamp': datetime.utcnow().isoformat()
        }), 500
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Health check endpoint."""
        try:
            # Check database
            db.session.execute('SELECT 1')
            db_status = True
        except Exception as e:
            app.logger.error(f"Database health check failed: {e}")
            db_status = False
        
        try:
            # Check Redis
            redis_client.ping()
            redis_status = True
        except Exception as e:
            app.logger.error(f"Redis health check failed: {e}")
            redis_status = False
        
        status_code = 200 if db_status and redis_status else 503
        
        return jsonify({
            'status': 'healthy' if db_status and redis_status else 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': app.config['APP_VERSION'],
            'database': db_status,
            'redis': redis_status
        }), status_code
    
    # Metrics endpoint
    @app.route('/metrics')
    def metrics():
        """Prometheus metrics endpoint."""
        return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}
    
    # Root endpoint
    @app.route('/')
    def index():
        """Root endpoint."""
        return jsonify({
            'message': f"Welcome to {app.config['APP_NAME']}",
            'version': app.config['APP_VERSION'],
            'docs': '/docs' if app.debug else 'Documentation not available in production'
        })
    
    return app


# For development
if __name__ == '__main__':
    app = create_app()
    app.run(
        host=app.config.get('HOST', '0.0.0.0'),
        port=app.config.get('PORT', 5000),
        debug=app.config.get('DEBUG', False)
    )
{%- endif %}
