# Shell Execute Action - Quick Start Guide

This guide demonstrates how to use the `shell:execute` scaffolder action in your Backstage software templates.

## Quick Examples

### 1. Basic Script Execution

```yaml
steps:
  - id: hello-world
    name: Hello World
    action: shell:execute
    input:
      script: |
        echo "Hello from Backstage!"
        echo "Current directory: $(pwd)"
        echo "Date: $(date)"
```

### 2. Node.js Project Setup

```yaml
steps:
  - id: setup-nodejs
    name: Setup Node.js Project
    action: shell:execute
    input:
      script: |
        # Initialize Node.js project
        npm init -y
        
        # Install common dependencies
        npm install express cors helmet
        npm install --save-dev nodemon jest eslint
        
        # Create basic project structure
        mkdir -p src tests docs
        
        # Create basic Express server
        cat > src/index.js << 'EOF'
        const express = require('express');
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        app.get('/', (req, res) => {
          res.json({ message: 'Hello from ${{ parameters.name }}!' });
        });
        
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
        EOF
        
        echo "Node.js project setup completed!"
      workingDirectory: ${{ parameters.name }}
      timeout: 180000  # 3 minutes
```

### 3. Docker Configuration

```yaml
steps:
  - id: setup-docker
    name: Setup Docker
    action: shell:execute
    input:
      script: |
        # Create Dockerfile
        cat > Dockerfile << 'EOF'
        FROM node:18-alpine
        WORKDIR /app
        COPY package*.json ./
        RUN npm ci --only=production
        COPY . .
        EXPOSE 3000
        CMD ["npm", "start"]
        EOF
        
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
        
        # Create .dockerignore
        cat > .dockerignore << 'EOF'
        node_modules
        npm-debug.log
        .git
        .gitignore
        README.md
        .env
        tests
        docs
        EOF
```

### 4. Git Repository Initialization

```yaml
steps:
  - id: git-setup
    name: Initialize Git Repository
    action: shell:execute
    input:
      script: |
        # Initialize git repository
        git init
        
        # Create .gitignore
        cat > .gitignore << 'EOF'
        node_modules/
        npm-debug.log*
        .env
        .env.local
        .env.development.local
        .env.test.local
        .env.production.local
        coverage/
        .nyc_output
        logs
        *.log
        .DS_Store
        .vscode/
        .idea/
        EOF
        
        # Set git configuration
        git config user.name "${{ user.entity.metadata.name }}"
        git config user.email "${{ user.entity.spec.profile.email }}"
        
        # Add and commit files
        git add .
        git commit -m "Initial commit: ${{ parameters.description }}"
        
        echo "Git repository initialized!"
      environment:
        GIT_AUTHOR_NAME: ${{ user.entity.metadata.name }}
        GIT_AUTHOR_EMAIL: ${{ user.entity.spec.profile.email }}
```

### 5. Multi-Step Build Process

```yaml
steps:
  - id: full-build
    name: Full Build Process
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        set -e  # Exit on any error
        
        echo "🚀 Starting full build process for ${{ parameters.name }}"
        
        # Step 1: Install dependencies
        echo "📦 Installing dependencies..."
        npm ci
        
        # Step 2: Run linting
        echo "🔍 Running ESLint..."
        npm run lint
        
        # Step 3: Run tests
        echo "🧪 Running tests..."
        npm test
        
        # Step 4: Build application
        echo "🏗️  Building application..."
        npm run build
        
        # Step 5: Generate documentation
        echo "📚 Generating documentation..."
        npm run docs || echo "Documentation generation skipped"
        
        # Step 6: Create deployment package
        echo "📦 Creating deployment package..."
        tar -czf dist.tar.gz dist/
        
        echo "✅ Build process completed successfully!"
        echo "📋 Build summary:"
        echo "   - Dependencies installed"
        echo "   - Code linted"
        echo "   - Tests passed"
        echo "   - Application built"
        echo "   - Package created: dist.tar.gz"
      environment:
        NODE_ENV: production
        CI: true
      timeout: 600000  # 10 minutes
      logOutput: true
```

### 6. Database Migration

```yaml
steps:
  - id: db-migration
    name: Database Migration
    action: shell:execute
    input:
      script: |
        echo "🗄️  Starting database migration..."
        
        # Wait for database to be ready
        echo "⏳ Waiting for database connection..."
        until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
          echo "Database not ready, waiting 2 seconds..."
          sleep 2
        done
        
        echo "✅ Database is ready!"
        
        # Run migrations
        echo "🔄 Running database migrations..."
        npx prisma migrate deploy
        
        # Seed data if requested
        if [ "$SEED_DATA" = "true" ]; then
          echo "🌱 Seeding initial data..."
          npx prisma db seed
        fi
        
        echo "✅ Database migration completed!"
      environment:
        DB_HOST: ${{ parameters.database.host }}
        DB_PORT: ${{ parameters.database.port }}
        DB_USER: ${{ parameters.database.username }}
        DB_PASSWORD: ${{ secrets.databasePassword }}
        DATABASE_URL: ${{ parameters.database.connectionString }}
        SEED_DATA: ${{ parameters.database.seedData }}
      timeout: 300000  # 5 minutes
```

### 7. Cross-Platform Setup

```yaml
steps:
  - id: cross-platform
    name: Cross-Platform Environment Setup
    action: shell:execute
    input:
      script: |
        # Function to detect operating system
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
        echo "🖥️  Detected operating system: $OS"
        
        # OS-specific setup
        case $OS in
          "Linux")
            echo "🐧 Setting up for Linux..."
            # Update package manager
            if command -v apt-get &> /dev/null; then
              sudo apt-get update
              sudo apt-get install -y build-essential git curl
            elif command -v yum &> /dev/null; then
              sudo yum update -y
              sudo yum groupinstall -y "Development Tools"
              sudo yum install -y git curl
            fi
            ;;
          "macOS")
            echo "🍎 Setting up for macOS..."
            # Check if Homebrew is installed
            if ! command -v brew &> /dev/null; then
              echo "Installing Homebrew..."
              /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            brew install git node
            ;;
          "Windows")
            echo "🪟 Setting up for Windows..."
            # Windows-specific commands (assuming Git Bash or WSL)
            echo "Ensure you have Git Bash or WSL installed"
            ;;
        esac
        
        echo "✅ Environment setup completed for $OS"
      shell: /bin/bash
```

### 8. Security-Focused Script

```yaml
steps:
  - id: secure-setup
    name: Secure Application Setup
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        set -euo pipefail  # Strict error handling
        
        echo "🔒 Setting up secure application configuration..."
        
        # Validate required environment variables
        required_vars=("API_KEY" "JWT_SECRET" "DB_PASSWORD")
        for var in "${required_vars[@]}"; do
          if [ -z "${!var:-}" ]; then
            echo "❌ Error: Required environment variable $var is not set"
            exit 1
          fi
        done
        
        # Create secure .env file
        cat > .env << EOF
        # Application Configuration
        NODE_ENV=production
        PORT=3000
        
        # Database Configuration
        DATABASE_URL=postgresql://user:$DB_PASSWORD@localhost/app
        
        # Security Configuration
        JWT_SECRET=$JWT_SECRET
        API_KEY=$API_KEY
        SESSION_SECRET=$(openssl rand -base64 32)
        
        # Feature Flags
        ENABLE_LOGGING=true
        ENABLE_METRICS=true
        EOF
        
        # Set secure file permissions
        chmod 600 .env
        
        # Create security.md documentation
        cat > SECURITY.md << 'EOF'
        # Security Guidelines
        
        ## Environment Variables
        - Never commit .env files to version control
        - Use strong, randomly generated secrets
        - Rotate secrets regularly
        
        ## Dependencies
        - Regularly update dependencies
        - Run security audits: `npm audit`
        - Use `npm audit fix` to resolve vulnerabilities
        
        ## Best Practices
        - Enable HTTPS in production
        - Use helmet.js for security headers
        - Implement rate limiting
        - Validate all user inputs
        EOF
        
        echo "✅ Secure configuration completed!"
        echo "📋 Security checklist:"
        echo "   - Environment variables configured"
        echo "   - .env file permissions set to 600"
        echo "   - Security documentation created"
        echo "   - Random session secret generated"
      environment:
        API_KEY: ${{ secrets.apiKey }}
        JWT_SECRET: ${{ secrets.jwtSecret }}
        DB_PASSWORD: ${{ secrets.databasePassword }}
      logOutput: false  # Don't log secrets
      timeout: 60000
```

### 9. Testing and Quality Assurance

```yaml
steps:
  - id: qa-setup
    name: Quality Assurance Setup
    action: shell:execute
    input:
      script: |
        echo "🧪 Setting up quality assurance tools..."
        
        # Install testing and QA dependencies
        npm install --save-dev \
          jest \
          @testing-library/jest-dom \
          supertest \
          eslint \
          prettier \
          husky \
          lint-staged \
          @commitlint/cli \
          @commitlint/config-conventional
        
        # Create Jest configuration
        cat > jest.config.js << 'EOF'
        module.exports = {
          testEnvironment: 'node',
          collectCoverageFrom: [
            'src/**/*.js',
            '!src/**/*.test.js'
          ],
          coverageThreshold: {
            global: {
              branches: 80,
              functions: 80,
              lines: 80,
              statements: 80
            }
          }
        };
        EOF
        
        # Create Prettier configuration
        cat > .prettierrc << 'EOF'
        {
          "semi": true,
          "trailingComma": "es5",
          "singleQuote": true,
          "printWidth": 80,
          "tabWidth": 2
        }
        EOF
        
        # Create ESLint configuration
        cat > .eslintrc.js << 'EOF'
        module.exports = {
          env: {
            node: true,
            es2021: true,
            jest: true
          },
          extends: ['eslint:recommended'],
          parserOptions: {
            ecmaVersion: 12,
            sourceType: 'module'
          },
          rules: {
            'no-console': 'warn',
            'no-unused-vars': 'error',
            'prefer-const': 'error'
          }
        };
        EOF
        
        # Setup Husky for Git hooks
        npx husky-init
        
        # Configure pre-commit hook
        cat > .husky/pre-commit << 'EOF'
        #!/bin/sh
        . "$(dirname "$0")/_/husky.sh"
        
        npx lint-staged
        EOF
        
        # Configure lint-staged
        cat > .lintstagedrc << 'EOF'
        {
          "*.js": ["eslint --fix", "prettier --write"],
          "*.{json,md}": ["prettier --write"]
        }
        EOF
        
        # Update package.json scripts
        npm pkg set scripts.test="jest"
        npm pkg set scripts.test:watch="jest --watch"
        npm pkg set scripts.test:coverage="jest --coverage"
        npm pkg set scripts.lint="eslint src/**/*.js"
        npm pkg set scripts.lint:fix="eslint src/**/*.js --fix"
        npm pkg set scripts.format="prettier --write ."
        npm pkg set scripts.prepare="husky install"
        
        echo "✅ Quality assurance setup completed!"
        echo "📋 Available commands:"
        echo "   - npm test           # Run tests"
        echo "   - npm run test:watch # Run tests in watch mode"
        echo "   - npm run lint       # Check code style"
        echo "   - npm run lint:fix   # Fix code style issues"
        echo "   - npm run format     # Format code with Prettier"
      timeout: 180000
```

### 10. Deployment Preparation

```yaml
steps:
  - id: deployment-prep
    name: Deployment Preparation
    action: shell:execute
    input:
      script: |
        echo "🚀 Preparing application for deployment..."
        
        # Create production Dockerfile
        cat > Dockerfile.prod << 'EOF'
        # Multi-stage build for production
        FROM node:18-alpine AS builder
        
        WORKDIR /app
        COPY package*.json ./
        RUN npm ci --only=production
        
        FROM node:18-alpine AS runtime
        
        # Create app user
        RUN addgroup -g 1001 -S nodejs
        RUN adduser -S nextjs -u 1001
        
        WORKDIR /app
        
        # Copy production dependencies
        COPY --from=builder /app/node_modules ./node_modules
        COPY --chown=nextjs:nodejs . .
        
        USER nextjs
        
        EXPOSE 3000
        
        # Health check
        HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
          CMD curl -f http://localhost:3000/health || exit 1
        
        CMD ["npm", "start"]
        EOF
        
        # Create deployment docker-compose
        cat > docker-compose.prod.yml << 'EOF'
        version: '3.8'
        
        services:
          app:
            build:
              context: .
              dockerfile: Dockerfile.prod
            ports:
              - "3000:3000"
            environment:
              - NODE_ENV=production
            restart: unless-stopped
            networks:
              - app-network
        
        networks:
          app-network:
            driver: bridge
        EOF
        
        # Create deployment script
        cat > deploy.sh << 'EOF'
        #!/bin/bash
        set -e
        
        echo "🚀 Starting deployment..."
        
        # Build production image
        docker build -f Dockerfile.prod -t ${{ parameters.name }}:latest .
        
        # Stop existing containers
        docker-compose -f docker-compose.prod.yml down
        
        # Start new containers
        docker-compose -f docker-compose.prod.yml up -d
        
        # Wait for health check
        echo "⏳ Waiting for application to be healthy..."
        timeout 60s bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
        
        echo "✅ Deployment completed successfully!"
        EOF
        
        # Make deploy script executable
        chmod +x deploy.sh
        
        # Create CI/CD configuration for GitHub Actions
        mkdir -p .github/workflows
        cat > .github/workflows/ci.yml << 'EOF'
        name: CI/CD Pipeline
        
        on:
          push:
            branches: [ main, develop ]
          pull_request:
            branches: [ main ]
        
        jobs:
          test:
            runs-on: ubuntu-latest
            
            steps:
            - uses: actions/checkout@v3
            
            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                node-version: '18'
                cache: 'npm'
            
            - name: Install dependencies
              run: npm ci
            
            - name: Run linting
              run: npm run lint
            
            - name: Run tests
              run: npm test
            
            - name: Build application
              run: npm run build
        EOF
        
        echo "✅ Deployment preparation completed!"
        echo "📋 Created files:"
        echo "   - Dockerfile.prod         # Production Docker image"
        echo "   - docker-compose.prod.yml # Production compose file"
        echo "   - deploy.sh              # Deployment script"
        echo "   - .github/workflows/ci.yml # CI/CD pipeline"
      timeout: 120000
```

## Complete Template Example

Here's a complete software template that uses multiple shell execute actions:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: full-stack-app
  title: Full-Stack Application with Shell Actions
  description: Create a production-ready full-stack application
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Basic Information
      required: [name, description, owner]
      properties:
        name:
          title: Application Name
          type: string
          pattern: '^[a-zA-Z]([a-zA-Z0-9._-])*$'
        description:
          title: Description
          type: string
        owner:
          title: Owner
          type: string
          
    - title: Configuration
      properties:
        setupDatabase:
          title: Setup Database
          type: boolean
          default: true
        enableDocker:
          title: Enable Docker
          type: boolean
          default: true
        runTests:
          title: Run Tests
          type: boolean
          default: true

  steps:
    - id: fetch
      name: Fetch Template
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}

    - id: nodejs-setup
      name: Node.js Project Setup
      action: shell:execute
      input:
        script: |
          # Initialize and setup Node.js project
          npm init -y
          npm install express cors helmet dotenv
          npm install --save-dev nodemon jest eslint prettier
          
          # Create project structure
          mkdir -p src/{controllers,services,middleware} tests config docs
          
          # Update package.json
          npm pkg set main="src/index.js"
          npm pkg set scripts.start="node src/index.js"
          npm pkg set scripts.dev="nodemon src/index.js"
          npm pkg set scripts.test="jest"
          npm pkg set scripts.lint="eslint src/**/*.js"

    - id: docker-setup
      name: Docker Configuration
      if: ${{ parameters.enableDocker }}
      action: shell:execute
      input:
        script: |
          # Create comprehensive Docker setup
          # ... (docker configuration script)

    - id: database-setup
      name: Database Setup
      if: ${{ parameters.setupDatabase }}
      action: shell:execute
      input:
        script: |
          # Setup database configuration
          # ... (database setup script)

    - id: testing-setup
      name: Testing Setup
      if: ${{ parameters.runTests }}
      action: shell:execute
      input:
        script: |
          # Setup comprehensive testing
          # ... (testing setup script)

    - id: git-init
      name: Initialize Repository
      action: shell:execute
      input:
        script: |
          git init
          git add .
          git commit -m "Initial commit: ${{ parameters.name }}"

  output:
    text:
      - title: Next Steps
        content: |
          Your application ${{ parameters.name }} has been created successfully! 🎉
          
          To get started:
          1. cd ${{ parameters.name }}
          2. npm run dev
          3. Visit http://localhost:3000
```

This comprehensive guide demonstrates the power and flexibility of the `shell:execute` action for creating sophisticated, production-ready applications through Backstage software templates.
