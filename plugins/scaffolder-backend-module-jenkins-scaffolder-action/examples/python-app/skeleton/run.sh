#!/bin/bash

# {{ values.name }} Application Runner
# This script provides various commands to run and manage the application

set -e

# Configuration
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export ENVIRONMENT="${ENVIRONMENT:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 is required but not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    log_info "Installing dependencies..."
    pip install -r requirements.txt
    
    if [ -f "requirements-dev.txt" ]; then
        pip install -r requirements-dev.txt
    fi
    
    log_success "Environment setup complete"
}

run_migrations() {
    log_info "Running database migrations..."
    
{% if values.framework == 'fastapi' -%}
    # FastAPI with Alembic
    if [ -d "app/migrations" ]; then
        alembic upgrade head
    else
        log_warning "No migrations found"
    fi
{% elif values.framework == 'django' -%}
    # Django migrations
    python manage.py makemigrations
    python manage.py migrate
    
    # Create superuser if needed
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell
{% elif values.framework == 'flask' -%}
    # Flask-Migrate
    if [ -d "migrations" ]; then
        flask db upgrade
    else
        flask db init
        flask db migrate -m "Initial migration"
        flask db upgrade
    fi
    
    # Seed data
    flask seed-data
{% endif %}
    
    log_success "Migrations completed"
}

start_application() {
    log_info "Starting {{ values.name }} application..."
    
    # Source environment variables
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi
    
{% if values.framework == 'fastapi' -%}
    # Start FastAPI application
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
{% elif values.framework == 'django' -%}
    # Start Django application
    python manage.py runserver 0.0.0.0:8000
{% elif values.framework == 'flask' -%}
    # Start Flask application
    flask run --host 0.0.0.0 --port 8000 --debug
{% endif %}
}

start_celery_worker() {
    log_info "Starting Celery worker..."
    
    # Source environment variables
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi
    
{% if values.framework == 'fastapi' -%}
    celery -A app.celery_app worker --loglevel=info
{% elif values.framework == 'django' -%}
    celery -A app.celery_app worker --loglevel=info
{% elif values.framework == 'flask' -%}
    celery -A app.celery_app worker --loglevel=info
{% endif %}
}

start_celery_beat() {
    log_info "Starting Celery beat scheduler..."
    
    # Source environment variables
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi
    
{% if values.framework == 'fastapi' -%}
    celery -A app.celery_app beat --loglevel=info
{% elif values.framework == 'django' -%}
    celery -A app.celery_app beat --loglevel=info
{% elif values.framework == 'flask' -%}
    celery -A app.celery_app beat --loglevel=info
{% endif %}
}

run_tests() {
    log_info "Running tests..."
    
    # Source environment variables
    if [ -f ".env.test" ]; then
        set -a
        source .env.test
        set +a
    fi
    
    # Set test environment
    export ENVIRONMENT=test
    
    # Run tests with pytest
    python -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term
    
    log_success "Tests completed"
}

run_linting() {
    log_info "Running code linting..."
    
    # flake8
    flake8 app/ tests/
    
    # pylint
    pylint app/
    
    # mypy
    mypy app/
    
    log_success "Linting completed"
}

run_security_scan() {
    log_info "Running security scan..."
    
    # bandit
    bandit -r app/
    
    # safety
    safety check
    
    log_success "Security scan completed"
}

show_logs() {
    log_info "Showing application logs..."
    
    if [ -f "logs/app.log" ]; then
        tail -f logs/app.log
    else
        log_warning "No log file found"
    fi
}

show_help() {
    echo "{{ values.name }} Application Runner"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup         Setup development environment"
    echo "  migrate       Run database migrations"
    echo "  run           Start the application"
    echo "  worker        Start Celery worker"
    echo "  beat          Start Celery beat scheduler"
    echo "  test          Run tests"
    echo "  lint          Run code linting"
    echo "  security      Run security scan"
    echo "  logs          Show application logs"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup     # Setup environment and install dependencies"
    echo "  $0 run       # Start the application"
    echo "  $0 test      # Run the test suite"
}

# Main script logic
case "${1:-}" in
    "setup")
        check_dependencies
        setup_environment
        ;;
    "migrate")
        run_migrations
        ;;
    "run")
        start_application
        ;;
    "worker")
        start_celery_worker
        ;;
    "beat")
        start_celery_beat
        ;;
    "test")
        run_tests
        ;;
    "lint")
        run_linting
        ;;
    "security")
        run_security_scan
        ;;
    "logs")
        show_logs
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        log_warning "No command specified"
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
