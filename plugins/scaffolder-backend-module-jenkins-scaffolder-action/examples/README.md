# Python Application with Jenkins CI/CD

This example demonstrates a comprehensive, production-ready Python application template with Jenkins CI/CD pipelines. It supports multiple Python frameworks (FastAPI, Django, Flask) and provides enterprise-grade automation for building, testing, security scanning, and deployment.

## 🚀 Features

### **Application Framework Support**
- **FastAPI**: Modern, async web framework with automatic OpenAPI documentation
- **Django**: Full-featured web framework with ORM and admin interface
- **Flask**: Lightweight, flexible web framework
- **Custom/CLI**: For custom applications or command-line tools

### **Package Management**
- **pip + requirements.txt**: Traditional Python dependency management
- **Poetry**: Modern dependency management with lock files
- **Pipenv**: Virtual environment and package management

### **Development Tools**
- **Testing**: pytest, unittest, nose2 with coverage reporting
- **Code Quality**: flake8, pylint, black, isort, mypy
- **Security**: bandit, safety, semgrep, pip-audit
- **Documentation**: pydocstyle, automatic API docs

### **CI/CD Pipelines**

#### **Build Pipeline (`Jenkinsfile.build`)**
- Multi-version Python support (3.8-3.12)
- Automated dependency installation
- Comprehensive testing with coverage
- Code quality analysis and linting
- Security vulnerability scanning
- Docker image building and scanning
- Artifact publishing

#### **Release Pipeline (`Jenkinsfile.release`)**
- Multi-environment deployment (dev, staging, prod)
- Blue-green and canary deployment strategies
- Database migrations (Django/SQLAlchemy)
- Health checks and smoke tests
- Performance testing with Locust
- Automatic rollback on failure
- Monitoring setup (Prometheus, alerts)

#### **Quality Pipeline (`Jenkinsfile.quality`)**
- Static code analysis (flake8, pylint, mypy)
- Code formatting validation (black, isort)
- Security analysis (bandit, safety, semgrep)
- Documentation quality checks
- Test coverage and mutation testing
- Dependency analysis and license compliance
- SonarQube integration
- Technical debt assessment

### **Infrastructure & Deployment**
- **Containerization**: Multi-stage Docker builds with security best practices
- **Kubernetes**: Helm charts for orchestrated deployment
- **Monitoring**: Prometheus metrics, health checks, logging
- **Security**: Non-root containers, vulnerability scanning, secrets management

## 📁 Project Structure

```
python-app/
├── template.yaml              # Backstage scaffolder template
├── skeleton/                  # Template files
│   ├── Jenkinsfile.build     # Build pipeline
│   ├── Jenkinsfile.release   # Release pipeline
│   ├── Jenkinsfile.quality   # Quality analysis pipeline
│   ├── Dockerfile            # Multi-stage container build
│   ├── catalog-info.yaml     # Backstage service catalog
│   ├── requirements.txt      # Python dependencies
│   ├── pyproject.toml       # Poetry configuration
│   ├── Pipfile              # Pipenv configuration
│   ├── .flake8              # Flake8 configuration
│   ├── mypy.ini             # MyPy configuration
│   ├── pytest.ini          # Pytest configuration
│   ├── helm-chart/          # Kubernetes Helm chart
│   └── k8s/                 # Kubernetes manifests
```

## 🛠️ Usage

### **Creating a New Python Application**

1. **Navigate to Backstage Software Catalog**
2. **Click "Create Component"**
3. **Select "Python Application with Jenkins CI/CD"**
4. **Configure your application:**

   **Basic Information:**
   - Application name (lowercase, hyphen-separated)
   - Description
   - Owner (team or individual)

   **Python Configuration:**
   - Python version (3.8, 3.9, 3.10, 3.11, 3.12)
   - Framework (FastAPI, Django, Flask, or none)
   - Package manager (pip, poetry, pipenv)
   - Database support
   - Celery for async tasks

   **Testing & Quality:**
   - Test framework (pytest, unittest, nose2)
   - Type hints with mypy
   - Code linting and formatting
   - Coverage threshold

   **Jenkins Configuration:**
   - Jenkins server URL
   - Credentials ID
   - Build retention
   - Webhook configuration

   **Security & Scanning:**
   - Security vulnerability scanning
   - Dependency checking
   - Secrets scanning
   - SonarQube integration

   **Container & Deployment:**
   - Docker registry settings
   - Kubernetes configuration
   - Environment selection
   - Deployment strategy

5. **Review and Create**

### **Pipeline Execution**

#### **Automated Triggers**
- **Build Pipeline**: Triggered on git push/PR
- **Release Pipeline**: Manual trigger with environment selection
- **Quality Pipeline**: Scheduled daily + on code changes

#### **Manual Execution**
```bash
# Trigger build pipeline
curl -X POST "${JENKINS_URL}/job/${APP_NAME}-build/build" \
  --user "${USERNAME}:${API_TOKEN}"

# Trigger release pipeline with parameters
curl -X POST "${JENKINS_URL}/job/${APP_NAME}-release/buildWithParameters" \
  --user "${USERNAME}:${API_TOKEN}" \
  --data "ENVIRONMENT=staging&DEPLOYMENT_STRATEGY=blue-green"

# Trigger quality analysis
curl -X POST "${JENKINS_URL}/job/${APP_NAME}-quality/build" \
  --user "${USERNAME}:${API_TOKEN}"
```

### **Local Development**

#### **Setup Development Environment**
```bash
# Clone repository
git clone <your-repo-url>
cd <your-app>

# Setup Python environment (choose one)

# Option 1: pip + venv
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Option 2: Poetry
poetry install

# Option 3: Pipenv
pipenv install --dev
pipenv shell
```

#### **Run Application Locally**
```bash
# FastAPI
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Django
python manage.py runserver 0.0.0.0:8000

# Flask
flask run --host 0.0.0.0 --port 8000

# Access your application at http://localhost:8000
```

#### **Run Tests**
```bash
# Run all tests with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_api.py -v

# Run with parallel execution
pytest -n auto
```

#### **Code Quality Checks**
```bash
# Format code
black .
isort .

# Lint code
flake8 .
pylint .

# Type checking
mypy .

# Security scanning
bandit -r .
safety check
```

### **Docker Deployment**

#### **Build Container**
```bash
# Build image
docker build -t your-app:latest .

# Run container
docker run -p 8000:8000 your-app:latest

# Run with environment variables
docker run -p 8000:8000 \
  -e ENVIRONMENT=development \
  -e LOG_LEVEL=DEBUG \
  your-app:latest
```

#### **Docker Compose for Development**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=development
      - LOG_LEVEL=DEBUG
    volumes:
      - .:/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### **Kubernetes Deployment**

#### **Deploy with Helm**
```bash
# Add your Helm repository
helm repo add mycompany https://charts.company.com
helm repo update

# Deploy to development
helm install my-app mycompany/python-app \
  --namespace development \
  --set image.tag=v1.0.0 \
  --set environment=development

# Deploy to production with blue-green
helm install my-app-green mycompany/python-app \
  --namespace production \
  --set image.tag=v1.1.0 \
  --set color=green \
  --set environment=production
```

#### **Direct Kubernetes Deployment**
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n your-namespace
kubectl logs -f deployment/your-app -n your-namespace
```

## 📊 Monitoring & Observability

### **Health Checks**
```bash
# Application health
curl http://localhost:8000/health

# Readiness check
curl http://localhost:8000/ready

# Liveness check
curl http://localhost:8000/alive
```

### **Metrics (Prometheus)**
```bash
# Application metrics
curl http://localhost:8000/metrics

# Custom metrics examples
# - http_requests_total
# - http_request_duration_seconds
# - database_connections_active
# - celery_tasks_total
```

### **Logging**
- **Structured JSON logging** for easy parsing
- **Correlation IDs** for request tracing
- **Log levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Integration** with ELK stack (Elasticsearch, Logstash, Kibana)

### **Distributed Tracing (Optional)**
- **Jaeger integration** for microservices tracing
- **Request flow visualization**
- **Performance bottleneck identification**

## 🔒 Security Features

### **Container Security**
- **Non-root user** execution
- **Minimal base images** (Python slim)
- **Multi-stage builds** to reduce attack surface
- **Security scanning** with Trivy
- **Distroless option** for production

### **Application Security**
- **Dependency vulnerability scanning** (Safety, pip-audit)
- **Static security analysis** (Bandit, Semgrep)
- **Secrets management** (never in code)
- **HTTPS enforcement**
- **Security headers** (HSTS, CSP, etc.)

### **CI/CD Security**
- **Signed commits** verification
- **Dependency pinning** with lock files
- **Security gates** in pipelines
- **Container image signing**
- **RBAC** for deployment permissions

## 🎯 Best Practices

### **Code Organization**
```
your-app/
├── app/                    # Application code
│   ├── __init__.py
│   ├── main.py            # Application entry point
│   ├── api/               # API routes/views
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── config.py          # Configuration
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── conftest.py        # Test configuration
├── docs/                  # Documentation
├── scripts/               # Utility scripts
└── requirements/          # Split requirements
    ├── base.txt
    ├── development.txt
    └── production.txt
```

### **Configuration Management**
- **Environment variables** for configuration
- **Separate configs** per environment
- **Default values** for optional settings
- **Validation** of required configurations
- **Secrets** via external secret management

### **Error Handling**
- **Structured exceptions** with proper status codes
- **Comprehensive logging** of errors
- **Graceful degradation** for non-critical failures
- **Circuit breakers** for external dependencies
- **Retry mechanisms** with exponential backoff

### **Performance Optimization**
- **Async/await** for I/O operations (FastAPI)
- **Database query optimization**
- **Connection pooling**
- **Caching strategies** (Redis, in-memory)
- **Background task processing** (Celery)

## 🚨 Troubleshooting

### **Common Issues**

#### **Build Pipeline Failures**
```bash
# Check Python version compatibility
python --version

# Verify dependencies
pip check

# Run tests locally
pytest -v

# Check linting issues
flake8 .
black --check .
```

#### **Deployment Issues**
```bash
# Check Kubernetes resources
kubectl get pods -n your-namespace
kubectl describe pod <pod-name> -n your-namespace
kubectl logs <pod-name> -n your-namespace

# Check container health
docker run --rm -it your-app:latest /bin/bash
python /app/healthcheck.py
```

#### **Performance Issues**
```bash
# Monitor application metrics
curl http://localhost:8000/metrics

# Check database connections
# Check memory usage
# Profile with py-spy or similar tools
```

### **Debugging**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with Python debugger
python -m pdb main.py

# Attach to running container
kubectl exec -it <pod-name> -n your-namespace -- /bin/bash
```

## 📚 Additional Resources

### **Documentation**
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [Pytest Documentation](https://docs.pytest.org/)

### **Tools & Libraries**
- [Black Code Formatter](https://black.readthedocs.io/)
- [Flake8 Linter](https://flake8.pycqa.org/)
- [MyPy Type Checker](https://mypy.readthedocs.io/)
- [Bandit Security Linter](https://bandit.readthedocs.io/)
- [Safety Vulnerability Scanner](https://pypi.org/project/safety/)

### **Best Practices**
- [Python Best Practices](https://docs.python-guide.org/)
- [12-Factor App Methodology](https://12factor.net/)
- [Container Best Practices](https://developers.redhat.com/blog/2016/02/24/10-things-to-avoid-in-docker-containers)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: Run `black`, `flake8`, and `mypy`
4. **Add tests**: Ensure good test coverage
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Internal Documentation**: Check your company's internal docs
- **Slack/Teams**: #platform-engineering or #python-support
- **Issue Tracker**: Create issues in your internal repository
- **Office Hours**: Platform engineering team office hours

---

**Created with ❤️ by Platform Engineering Team**
