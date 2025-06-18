# Multi-stage Dockerfile for Python Application
# Optimized for production deployment with security best practices

# Build stage - Install dependencies and build application
FROM python:${{ values.pythonVersion }}-slim as builder

# Set build arguments
ARG APP_NAME=${{ values.name }}
ARG BUILD_NUMBER
ARG GIT_COMMIT
ARG PYTHON_VERSION=${{ values.pythonVersion }}

# Set environment variables for build
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies required for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
WORKDIR /app

# Copy dependency files
{% if values.packageManager == 'poetry' %}
COPY pyproject.toml poetry.lock* ./
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --only=main --no-dev
{% elif values.packageManager == 'pipenv' %}
COPY Pipfile Pipfile.lock ./
RUN pip install pipenv && \
    pipenv install --system --deploy
{% else %}
COPY requirements.txt requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt
{% endif %}

# Copy application code
COPY . .

# Build application if needed
{% if values.framework == 'django' %}
RUN python manage.py collectstatic --noinput
{% endif %}

# Create wheel package
RUN pip install build && \
    python -m build --wheel && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /wheels .

# Production stage - Create minimal runtime image
FROM python:${{ values.pythonVersion }}-slim as production

# Set build arguments
ARG APP_NAME=${{ values.name }}
ARG BUILD_NUMBER
ARG GIT_COMMIT
ARG PYTHON_VERSION=${{ values.pythonVersion }}

# Add metadata labels
LABEL maintainer="${{ values.owner }}" \
      app.name="${APP_NAME}" \
      app.version="${BUILD_NUMBER}" \
      app.python.version="${PYTHON_VERSION}" \
      app.framework="${{ values.framework }}" \
      app.git.commit="${GIT_COMMIT}" \
      app.build.date="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
      org.opencontainers.image.title="${APP_NAME}" \
      org.opencontainers.image.description="${{ values.description }}" \
      org.opencontainers.image.version="${BUILD_NUMBER}" \
      org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
      org.opencontainers.image.source="${{ values.repoUrl }}" \
      org.opencontainers.image.revision="${GIT_COMMIT}"

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive \
    # Application environment
    APP_NAME=${APP_NAME} \
    APP_VERSION=${BUILD_NUMBER} \
    PYTHON_VERSION=${PYTHON_VERSION} \
    # Framework specific
    {% if values.framework == 'django' %}
    DJANGO_SETTINGS_MODULE=${APP_NAME}.settings \
    {% elif values.framework == 'fastapi' %}
    FASTAPI_ENV=production \
    {% elif values.framework == 'flask' %}
    FLASK_ENV=production \
    {% endif %}
    # Logging
    LOG_LEVEL=${{ values.logLevel | default('INFO') }} \
    LOG_FORMAT=json \
    # Security
    PYTHONHASHSEED=random \
    # Performance
    PYTHONOPTIMIZE=1

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Runtime libraries
    libpq5 \
    default-libmysqlclient21 \
    # Security and monitoring tools
    curl \
    wget \
    ca-certificates \
    # Clean up
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove

# Create non-root user for security
RUN groupadd -r appuser && \
    useradd -r -g appuser -d /app -s /bin/bash -c "Application User" appuser

# Create application directory structure
WORKDIR /app
RUN mkdir -p /app/logs /app/static /app/media /app/tmp && \
    chown -R appuser:appuser /app

# Copy wheels from builder stage and install
COPY --from=builder /wheels /wheels
COPY --from=builder /app/requirements.txt* ./
RUN pip install --no-cache-dir --find-links /wheels \
    {% if values.packageManager == 'pip' %}
    -r requirements.txt \
    {% endif %}
    /wheels/*.whl && \
    rm -rf /wheels

# Copy application code from builder
COPY --from=builder --chown=appuser:appuser /app .

# Install additional production dependencies
RUN pip install --no-cache-dir \
    # Monitoring and observability
    {% if values.enablePrometheus %}
    prometheus-client \
    {% endif %}
    {% if values.enableJaeger %}
    jaeger-client \
    opentracing \
    {% endif %}
    # WSGI/ASGI servers
    {% if values.framework == 'django' %}
    gunicorn \
    uvicorn[standard] \
    {% elif values.framework == 'fastapi' %}
    uvicorn[standard] \
    gunicorn \
    {% elif values.framework == 'flask' %}
    gunicorn \
    {% endif %}
    # Health checks
    psutil

# Create entrypoint script
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Function to check database connectivity
check_database() {
    {% if values.includeDatabase and values.framework == 'django' %}
    log "Checking database connectivity..."
    python manage.py check --database default
    {% endif %}
}

# Function to run database migrations
run_migrations() {
    {% if values.includeDatabase and values.framework == 'django' %}
    log "Running database migrations..."
    python manage.py migrate --noinput
    {% endif %}
}

# Function to collect static files
collect_static() {
    {% if values.framework == 'django' %}
    log "Collecting static files..."
    python manage.py collectstatic --noinput --clear
    {% endif %}
}

# Function to create superuser
create_superuser() {
    {% if values.framework == 'django' %}
    if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
        log "Creating Django superuser..."
        python manage.py createsuperuser --noinput || log "Superuser already exists"
    fi
    {% endif %}
}

# Main execution
log "Starting ${APP_NAME} v${APP_VERSION}"
log "Python version: $(python --version)"
log "Working directory: $(pwd)"

# Pre-startup checks and setup
if [ "$1" = "web" ] || [ "$1" = "server" ]; then
    check_database
    run_migrations
    collect_static
    create_superuser
    
    # Start web server
    {% if values.framework == 'fastapi' %}
    log "Starting FastAPI server with uvicorn..."
    exec uvicorn main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --workers ${WORKERS:-1} \
        --log-level ${LOG_LEVEL,,} \
        --access-log \
        --loop uvloop \
        --http httptools
    {% elif values.framework == 'django' %}
    log "Starting Django server with gunicorn..."
    exec gunicorn ${APP_NAME}.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers ${WORKERS:-2} \
        --timeout ${TIMEOUT:-30} \
        --keep-alive ${KEEP_ALIVE:-2} \
        --max-requests ${MAX_REQUESTS:-1000} \
        --max-requests-jitter ${MAX_REQUESTS_JITTER:-100} \
        --log-level ${LOG_LEVEL,,} \
        --access-logfile - \
        --error-logfile -
    {% elif values.framework == 'flask' %}
    log "Starting Flask server with gunicorn..."
    exec gunicorn app:app \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers ${WORKERS:-2} \
        --timeout ${TIMEOUT:-30} \
        --keep-alive ${KEEP_ALIVE:-2} \
        --max-requests ${MAX_REQUESTS:-1000} \
        --log-level ${LOG_LEVEL,,} \
        --access-logfile - \
        --error-logfile -
    {% else %}
    log "Starting application..."
    exec python main.py
    {% endif %}

{% if values.includeCelery %}
elif [ "$1" = "worker" ]; then
    log "Starting Celery worker..."
    exec celery -A ${APP_NAME} worker \
        --loglevel=${LOG_LEVEL,,} \
        --concurrency=${CELERY_WORKERS:-2} \
        --max-tasks-per-child=${CELERY_MAX_TASKS:-1000}

elif [ "$1" = "beat" ]; then
    log "Starting Celery beat scheduler..."
    exec celery -A ${APP_NAME} beat \
        --loglevel=${LOG_LEVEL,,} \
        --schedule=/tmp/celerybeat-schedule

elif [ "$1" = "flower" ]; then
    log "Starting Celery Flower monitoring..."
    exec celery -A ${APP_NAME} flower \
        --port=${FLOWER_PORT:-5555} \
        --basic_auth=${FLOWER_BASIC_AUTH}
{% endif %}

elif [ "$1" = "migrate" ]; then
    run_migrations
    exit 0

elif [ "$1" = "shell" ]; then
    {% if values.framework == 'django' %}
    exec python manage.py shell
    {% else %}
    exec python
    {% endif %}

elif [ "$1" = "test" ]; then
    log "Running tests..."
    exec pytest -v

else
    log "Available commands:"
    echo "  web/server - Start web server"
    {% if values.includeCelery %}
    echo "  worker     - Start Celery worker"
    echo "  beat       - Start Celery beat scheduler"
    echo "  flower     - Start Celery Flower monitoring"
    {% endif %}
    echo "  migrate    - Run database migrations"
    echo "  shell      - Start interactive shell"
    echo "  test       - Run tests"
    echo ""
    log "Executing command: $*"
    exec "$@"
fi
EOF

RUN chmod +x /app/entrypoint.sh

# Create health check script
RUN cat > /app/healthcheck.py << 'EOF'
#!/usr/bin/env python3
import sys
import urllib.request
import urllib.error

def health_check():
    try:
        url = f"http://localhost:{os.environ.get('PORT', '8000')}${{ values.healthCheckPath | default('/health') }}"
        response = urllib.request.urlopen(url, timeout=10)
        if response.getcode() == 200:
            print("Health check passed")
            return 0
        else:
            print(f"Health check failed with status: {response.getcode()}")
            return 1
    except Exception as e:
        print(f"Health check failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(health_check())
EOF

RUN chmod +x /app/healthcheck.py

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8000
{% if values.includeCelery %}
EXPOSE 5555
{% endif %}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python /app/healthcheck.py

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["web"]

# Security scanning metadata
LABEL security.scan.enabled="true" \
      security.scan.tools="trivy,snyk" \
      security.compliance.level="high"
