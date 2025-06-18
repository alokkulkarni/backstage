# Shell Script Scaffolder Action Examples

This document provides comprehensive examples of how to use the `shell:execute` scaffolder action in Backstage software templates.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Template Integration](#template-integration)
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)

## Basic Usage

### Simple Script Execution

```yaml
steps:
  - id: hello-world
    name: Hello World
    action: shell:execute
    input:
      script: |
        echo "Hello, World!"
        echo "Current directory: $(pwd)"
        echo "Current user: $(whoami)"
```

### Script with Environment Variables

```yaml
steps:
  - id: build-with-env
    name: Build with Environment
    action: shell:execute
    input:
      script: |
        echo "Building application with environment: $BUILD_ENV"
        echo "API URL: $API_URL"
        npm run build:$BUILD_ENV
      environment:
        BUILD_ENV: production
        API_URL: https://api.example.com
        NODE_ENV: production
```

### Working Directory Specification

```yaml
steps:
  - id: install-dependencies
    name: Install Dependencies
    action: shell:execute
    input:
      script: |
        pwd
        ls -la
        npm install
        npm audit
      workingDirectory: ${{ parameters.componentId }}
```

## Advanced Examples

### Multi-Step Build Process

```yaml
steps:
  - id: complex-build
    name: Complex Build Process
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        set -e
        
        echo "Starting build process..."
        
        # Install dependencies
        echo "Installing dependencies..."
        npm ci
        
        # Run linting
        echo "Running linting..."
        npm run lint
        
        # Run tests
        echo "Running tests..."
        npm run test:coverage
        
        # Build application
        echo "Building application..."
        npm run build
        
        # Generate documentation
        echo "Generating documentation..."
        npm run docs:generate
        
        # Create deployment package
        echo "Creating deployment package..."
        tar -czf dist.tar.gz dist/
        
        echo "Build process completed successfully!"
      timeout: 600000  # 10 minutes
      environment:
        NODE_ENV: production
        CI: true
      logOutput: true
```

### Conditional Script Execution

```yaml
steps:
  - id: conditional-setup
    name: Conditional Setup
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Check if Docker is available
        if command -v docker &> /dev/null; then
            echo "Docker is available, setting up containerized environment..."
            docker --version
            docker-compose --version
            
            # Build Docker image
            docker build -t ${{ parameters.componentId }}:latest .
            
            # Start services
            docker-compose up -d
        else
            echo "Docker not available, setting up local environment..."
            
            # Install local dependencies
            npm install
            
            # Start local services
            npm run start:dev &
        fi
        
        echo "Environment setup completed"
      environment:
        COMPONENT_NAME: ${{ parameters.componentId }}
      continueOnError: false
```

### Cross-Platform Script

```yaml
steps:
  - id: cross-platform-setup
    name: Cross-Platform Setup
    action: shell:execute
    input:
      script: |
        # Cross-platform script that works on Windows, macOS, and Linux
        
        # Function to detect OS
        detect_os() {
            case "$(uname -s)" in
                Linux*)     echo "Linux";;
                Darwin*)    echo "macOS";;
                CYGWIN*)    echo "Windows";;
                MINGW*)     echo "Windows";;
                *)          echo "Unknown";;
            esac
        }
        
        OS=$(detect_os)
        echo "Detected OS: $OS"
        
        # OS-specific setup
        case $OS in
            "Linux")
                echo "Setting up for Linux..."
                sudo apt-get update
                sudo apt-get install -y build-essential
                ;;
            "macOS")
                echo "Setting up for macOS..."
                brew update
                brew install node
                ;;
            "Windows")
                echo "Setting up for Windows..."
                # Windows-specific commands
                ;;
        esac
        
        echo "Setup completed for $OS"
      shell: /bin/bash
      sudo: false
```

### Database Migration Script

```yaml
steps:
  - id: database-migration
    name: Database Migration
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        set -e
        
        echo "Starting database migration..."
        
        # Wait for database to be ready
        echo "Waiting for database connection..."
        until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
            echo "Database not ready, waiting..."
            sleep 2
        done
        
        echo "Database is ready, running migrations..."
        
        # Run database migrations
        npx prisma migrate deploy
        
        # Seed initial data if specified
        if [ "$SEED_DATA" = "true" ]; then
            echo "Seeding initial data..."
            npx prisma db seed
        fi
        
        echo "Database migration completed successfully!"
      environment:
        DB_HOST: ${{ parameters.dbHost }}
        DB_PORT: ${{ parameters.dbPort }}
        DB_USER: ${{ parameters.dbUser }}
        DB_PASSWORD: ${{ parameters.dbPassword }}
        DATABASE_URL: postgresql://${{ parameters.dbUser }}:${{ parameters.dbPassword }}@${{ parameters.dbHost }}:${{ parameters.dbPort }}/${{ parameters.dbName }}
        SEED_DATA: ${{ parameters.seedData }}
      timeout: 300000  # 5 minutes
```

### Git Repository Setup

```yaml
steps:
  - id: git-setup
    name: Git Repository Setup
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        set -e
        
        echo "Setting up Git repository..."
        
        # Initialize git repository
        git init
        
        # Set git configuration
        git config user.name "$GIT_USER_NAME"
        git config user.email "$GIT_USER_EMAIL"
        
        # Add all files
        git add .
        
        # Create initial commit
        git commit -m "Initial commit: Add ${{ parameters.componentId }}"
        
        # Add remote origin
        git remote add origin ${{ parameters.repoUrl }}
        
        # Create and checkout main branch
        git branch -M main
        
        # Push to remote repository
        git push -u origin main
        
        echo "Git repository setup completed!"
      environment:
        GIT_USER_NAME: ${{ parameters.owner }}
        GIT_USER_EMAIL: ${{ user.entity.spec.profile.email }}
      workingDirectory: ${{ parameters.repoPath }}
```

## Template Integration

### Complete Software Template Example

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: node-microservice-with-shell
  title: Node.js Microservice with Shell Actions
  description: Create a Node.js microservice with advanced shell script setup
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Basic Information
      required:
        - name
        - description
        - owner
      properties:
        name:
          title: Name
          type: string
          description: Unique name of the component
        description:
          title: Description
          type: string
          description: Help others understand what this service is for
        owner:
          title: Owner
          type: string
          description: Owner of the component
          
    - title: Infrastructure Options
      properties:
        useDocker:
          title: Use Docker
          type: boolean
          default: true
          description: Set up Docker containerization
        useDatabase:
          title: Use Database
          type: boolean
          default: false
          description: Set up database connectivity
        runTests:
          title: Run Tests
          type: boolean
          default: true
          description: Run test suite during setup

  steps:
    - id: fetch-base
      name: Fetch Base
      action: fetch:template
      input:
        url: ./content
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}

    - id: install-dependencies
      name: Install Dependencies
      action: shell:execute
      input:
        script: |
          echo "Installing Node.js dependencies..."
          npm install
          
          echo "Installed packages:"
          npm list --depth=0
        workingDirectory: .
        timeout: 180000  # 3 minutes

    - id: setup-docker
      name: Setup Docker
      if: ${{ parameters.useDocker }}
      action: shell:execute
      input:
        script: |
          echo "Setting up Docker configuration..."
          
          # Create Dockerfile if it doesn't exist
          if [ ! -f "Dockerfile" ]; then
            cat > Dockerfile << 'EOF'
          FROM node:18-alpine
          WORKDIR /app
          COPY package*.json ./
          RUN npm ci --only=production
          COPY . .
          EXPOSE 3000
          CMD ["npm", "start"]
          EOF
          fi
          
          # Create docker-compose.yml
          cat > docker-compose.yml << 'EOF'
          version: '3.8'
          services:
            app:
              build: .
              ports:
                - "3000:3000"
              environment:
                - NODE_ENV=development
          EOF
          
          echo "Docker setup completed!"

    - id: run-tests
      name: Run Tests
      if: ${{ parameters.runTests }}
      action: shell:execute
      input:
        script: |
          echo "Running test suite..."
          
          # Run linting
          npm run lint || echo "Linting failed, but continuing..."
          
          # Run unit tests
          npm test
          
          # Generate coverage report
          npm run test:coverage || echo "Coverage report generation failed"
          
          echo "Test suite completed!"
        continueOnError: false
        timeout: 300000  # 5 minutes

    - id: setup-git
      name: Setup Git Repository
      action: shell:execute
      input:
        script: |
          echo "Setting up Git repository..."
          
          git init
          git add .
          git commit -m "Initial commit: ${{ parameters.name }}"
          
          echo "Git repository initialized!"

    - id: register
      name: Register
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish'].output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'

  output:
    links:
      - title: Repository
        url: ${{ steps['publish'].output.remoteUrl }}
      - title: Open in catalog
        icon: catalog
        entityRef: ${{ steps['register'].output.entityRef }}
```

## Best Practices

### 1. Error Handling

```yaml
steps:
  - id: robust-script
    name: Robust Script with Error Handling
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Enable strict error handling
        set -euo pipefail
        
        # Function for error handling
        error_handler() {
            echo "Error occurred on line $1"
            echo "Command that failed: $2"
            exit 1
        }
        
        # Set up error trap
        trap 'error_handler $LINENO "$BASH_COMMAND"' ERR
        
        # Your script logic here
        echo "Starting robust script execution..."
        
        # Example of safe command execution
        if ! command -v node &> /dev/null; then
            echo "Node.js is not installed!"
            exit 1
        fi
        
        # Continue with script...
      continueOnError: false
```

### 2. Progress Reporting

```yaml
steps:
  - id: progress-script
    name: Script with Progress Reporting
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        total_steps=5
        current_step=0
        
        progress() {
            current_step=$((current_step + 1))
            echo "Progress: [$current_step/$total_steps] $1"
        }
        
        progress "Installing dependencies..."
        npm install
        
        progress "Running linting..."
        npm run lint
        
        progress "Running tests..."
        npm test
        
        progress "Building application..."
        npm run build
        
        progress "Setup completed!"
```

### 3. Resource Cleanup

```yaml
steps:
  - id: cleanup-script
    name: Script with Cleanup
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Cleanup function
        cleanup() {
            echo "Performing cleanup..."
            
            # Remove temporary files
            rm -rf /tmp/build-*
            
            # Stop background processes
            jobs -p | xargs -r kill
            
            echo "Cleanup completed"
        }
        
        # Set up cleanup trap
        trap cleanup EXIT
        
        # Your script logic here
        echo "Starting script with cleanup handling..."
        
        # Create temporary directory
        temp_dir=$(mktemp -d /tmp/build-XXXXXX)
        echo "Created temporary directory: $temp_dir"
        
        # Do work...
        
        # Cleanup will be called automatically on exit
```

## Error Handling

### Handling Different Types of Errors

```yaml
steps:
  - id: error-handling-examples
    name: Error Handling Examples
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Example 1: Continue on non-critical errors
        echo "Running optional linting..."
        npm run lint || echo "Linting failed, but continuing..."
        
        # Example 2: Fail fast on critical errors
        echo "Installing dependencies (critical)..."
        npm install  # This will fail the entire script if it fails
        
        # Example 3: Custom error handling
        echo "Running tests with custom error handling..."
        if ! npm test; then
            echo "Tests failed! Generating debug information..."
            npm run test:debug
            echo "Debug information generated"
            exit 1
        fi
        
        echo "All operations completed successfully!"
      continueOnError: false
```

### Retry Logic

```yaml
steps:
  - id: retry-script
    name: Script with Retry Logic
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Retry function
        retry() {
            local retries=$1
            local delay=$2
            local cmd="${@:3}"
            
            for ((i=1; i<=retries; i++)); do
                echo "Attempt $i of $retries: $cmd"
                if $cmd; then
                    return 0
                fi
                
                if [ $i -lt $retries ]; then
                    echo "Command failed, retrying in $delay seconds..."
                    sleep $delay
                fi
            done
            
            echo "Command failed after $retries attempts"
            return 1
        }
        
        # Example usage
        retry 3 5 npm install
        retry 2 10 npm test
```

## Security Considerations

### 1. Input Validation

```yaml
steps:
  - id: secure-script
    name: Secure Script with Input Validation
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Validate required environment variables
        required_vars=("PROJECT_NAME" "OWNER_EMAIL" "API_KEY")
        
        for var in "${required_vars[@]}"; do
            if [ -z "${!var:-}" ]; then
                echo "Error: Required environment variable $var is not set"
                exit 1
            fi
        done
        
        # Sanitize input values
        PROJECT_NAME=$(echo "$PROJECT_NAME" | tr -cd '[:alnum:]._-')
        
        echo "Using sanitized project name: $PROJECT_NAME"
        
        # Continue with validated inputs...
      environment:
        PROJECT_NAME: ${{ parameters.projectName }}
        OWNER_EMAIL: ${{ user.entity.spec.profile.email }}
        API_KEY: ${{ secrets.apiKey }}
```

### 2. Avoid Sudo When Possible

```yaml
steps:
  - id: non-privileged-script
    name: Non-Privileged Script
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Use user-local installations instead of system-wide
        # Install Node.js using Node Version Manager (nvm)
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        source ~/.bashrc
        nvm install 18
        nvm use 18
        
        # Install global packages to user directory
        npm config set prefix ~/.local
        npm install -g @backstage/cli
        
        echo "Setup completed without requiring sudo privileges"
      sudo: false
```

### 3. Secure Secret Handling

```yaml
steps:
  - id: secure-secrets
    name: Secure Secret Handling
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        
        # Ensure secrets are not logged
        set +x
        
        # Use secrets safely
        echo "Configuring application with secrets..."
        
        # Write config file with secrets
        cat > .env << EOF
        API_KEY=$API_KEY
        DATABASE_URL=$DATABASE_URL
        JWT_SECRET=$JWT_SECRET
        EOF
        
        # Set secure file permissions
        chmod 600 .env
        
        echo "Secrets configured securely"
      environment:
        API_KEY: ${{ secrets.apiKey }}
        DATABASE_URL: ${{ secrets.databaseUrl }}
        JWT_SECRET: ${{ secrets.jwtSecret }}
      logOutput: false  # Prevent secrets from appearing in logs
```

This comprehensive set of examples demonstrates the full capabilities of the `shell:execute` scaffolder action and provides practical guidance for implementing robust, secure, and maintainable shell script automation in Backstage software templates.
