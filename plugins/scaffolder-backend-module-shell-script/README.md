# Scaffolder Backend Module: Shell Script

A comprehensive Backstage scaffolder backend module that provides powerful shell script execution capabilities for software templates.

## Features

- **Cross-platform support** - Works on Windows, macOS, and Linux
- **Comprehensive error handling** - Built-in validation, timeout support, and graceful error recovery
- **Security-focused** - Input validation, secure temporary file handling, and configurable privilege levels
- **Rich configuration** - Environment variables, working directory control, shell selection, and more
- **Detailed logging** - Comprehensive output capture and progress reporting
- **Template integration** - Seamless integration with Backstage software templates

## Actions

### `shell:execute`

Executes shell scripts with comprehensive options and error handling.

#### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `script` | string | ✓ | - | The shell script content to execute |
| `workingDirectory` | string | ✗ | `.` | Directory to execute the script in |
| `environment` | object | ✗ | `{}` | Additional environment variables |
| `timeout` | number | ✗ | `300000` | Maximum execution time in milliseconds |
| `shell` | string | ✗ | `/bin/bash` (Unix) / `cmd` (Windows) | Shell to use for execution |
| `args` | array | ✗ | `[]` | Additional arguments to pass to the script |
| `sudo` | boolean | ✗ | `false` | Whether to execute with sudo privileges (Unix only) |
| `interactive` | boolean | ✗ | `false` | Whether to run in interactive mode |
| `logOutput` | boolean | ✗ | `true` | Whether to log script output |
| `continueOnError` | boolean | ✗ | `false` | Whether to continue on script failure |
| `encoding` | string | ✗ | `utf8` | Character encoding for output |

#### Output Values

| Output | Type | Description |
|--------|------|-------------|
| `exitCode` | number | The exit code returned by the script |
| `stdout` | string | Standard output from the script |
| `stderr` | string | Standard error output from the script |
| `command` | string | The actual command that was executed |
| `duration` | number | Execution time in milliseconds |
| `success` | boolean | Whether the script executed successfully |

## Installation

Add the module to your backend package:

```bash
# From the root of your Backstage app
yarn --cwd packages/backend add @internal/plugin-scaffolder-backend-module-shell-script
```

## Registration

Register the module in your backend:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other plugins

// Register the shell script actions
backend.add(import('@internal/plugin-scaffolder-backend-module-shell-script'));

backend.start();
```

## Configuration

The `shell:execute` action supports environment variable mapping from your `app-config.yaml` file. This allows you to centrally manage common environment variables used across all your scaffolder templates.

### App Configuration

Add environment variables to your `app-config.yaml`:

```yaml
# app-config.yaml
scaffolder:
  # Global environment variables for all scaffolder actions
  environment:
    # Common build and deployment variables
    NODE_ENV: development
    DOCKER_REGISTRY: docker.io
    HELM_REPO_URL: https://charts.example.com
    
    # Platform specific variables
    PLATFORM_NAME: My Company Backstage Platform
    PLATFORM_OWNER: platform-team
    PLATFORM_ENVIRONMENT: development
  
  # Action-specific environment variables
  actions:
    shell:execute:
      environment:
        # Shell-specific variables
        SHELL_TIMEOUT_DEFAULT: "300000"
        SHELL_LOG_OUTPUT: "true"
        SHELL_ENCODING: "utf8"
        
        # Build tool specific variables
        MAVEN_OPTS: "-Xmx1024m"
        GRADLE_OPTS: "-Xmx1024m"
        NPM_CONFIG_REGISTRY: "https://registry.npmjs.org/"
        
        # Docker build variables
        DOCKER_BUILDKIT: "1"
        BUILDKIT_PROGRESS: "plain"
        
        # Kubernetes variables
        KUBECTL_TIMEOUT: "300s"
        HELM_TIMEOUT: "300s"

# Integration configurations are automatically mapped to environment variables
jenkins:
  baseUrl: ${JENKINS_BASE_URL}
  username: ${JENKINS_USERNAME}
  apiKey: ${JENKINS_API_KEY}

integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}

jira:
  instances:
    - name: default
      baseUrl: ${JIRA_BASE_URL}
      apiToken: ${JIRA_API_TOKEN}
      email: ${JIRA_USERNAME}

sonarqube:
  baseUrl: ${SONARQUBE_BASE_URL}
  apiKey: ${SONARQUBE_API_KEY}
```

### Automatic Environment Variable Mapping

The action automatically maps common configuration values to environment variables:

| Configuration Source | Environment Variable | Description |
|---------------------|---------------------|-------------|
| `integrations.github[0].token` | `GITHUB_TOKEN` | GitHub integration token |
| `jenkins.baseUrl` | `JENKINS_BASE_URL` | Jenkins server URL |
| `jenkins.username` | `JENKINS_USERNAME` | Jenkins username |
| `jenkins.apiKey` | `JENKINS_API_KEY` | Jenkins API key |
| `jira.instances[0].baseUrl` | `JIRA_BASE_URL` | Jira instance URL |
| `jira.instances[0].apiToken` | `JIRA_API_TOKEN` | Jira API token |
| `jira.instances[0].email` | `JIRA_USERNAME` | Jira username/email |
| `sonarqube.baseUrl` | `SONARQUBE_BASE_URL` | SonarQube server URL |
| `sonarqube.apiKey` | `SONARQUBE_API_KEY` | SonarQube API key |
| `app.baseUrl` | `BACKSTAGE_BASE_URL` | Backstage frontend URL |
| `backend.baseUrl` | `BACKSTAGE_BACKEND_URL` | Backstage backend URL |
| `app.terraformEnvironments.defaultOwner` | `TERRAFORM_DEFAULT_OWNER` | Default Terraform owner |
| `app.terraformEnvironments.defaultRepo` | `TERRAFORM_DEFAULT_REPO` | Default Terraform repository |

### Environment Variable Precedence

Environment variables are merged in the following order (later values override earlier ones):

1. **Global scaffolder environment** (`scaffolder.environment`)
2. **Action-specific environment** (`scaffolder.actions.shell:execute.environment`)
3. **Automatically mapped variables** (from integrations, jenkins, jira, etc.)
4. **Template input environment** (specified in the `environment` parameter)

This allows you to set defaults globally while still overriding them at the template level when needed.

## Usage Examples

### Basic Script Execution

```yaml
steps:
  - id: basic-setup
    name: Basic Setup
    action: shell:execute
    input:
      script: |
        echo "Setting up project..."
        mkdir -p src tests docs
        echo "Project setup complete!"
```

### Using Environment Variables from Configuration

```yaml
steps:
  - id: deploy-with-config-vars
    name: Deploy with Configuration Variables
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        echo "🚀 Deploying to $PLATFORM_ENVIRONMENT"
        echo "Platform: $PLATFORM_NAME"
        echo "Owner: $PLATFORM_OWNER"
        
        # Use automatically mapped Jenkins credentials
        if [ -n "$JENKINS_BASE_URL" ]; then
          echo "Jenkins available at: $JENKINS_BASE_URL"
          echo "Triggering build for user: $JENKINS_USERNAME"
        fi
        
        # Use automatically mapped GitHub token
        if [ -n "$GITHUB_TOKEN" ]; then
          echo "GitHub integration configured"
          # Token automatically available for git operations
        fi
        
        # Use Docker registry from global config
        docker build -t $DOCKER_REGISTRY/${{ parameters.name }}:latest .
        
        # Use npm registry from action config
        npm install --registry=$NPM_CONFIG_REGISTRY
      # Additional variables can still be passed via input
      environment:
        CUSTOM_VAR: ${{ parameters.customValue }}
        BUILD_NUMBER: ${{ parameters.buildNumber }}
```

### Environment Variable Precedence Example

```yaml
steps:
  - id: environment-precedence
    name: Environment Variable Precedence Demo
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        echo "Environment variable precedence demonstration:"
        echo "NODE_ENV (from global): $NODE_ENV"
        echo "DOCKER_REGISTRY (from global): $DOCKER_REGISTRY" 
        echo "MAVEN_OPTS (from action config): $MAVEN_OPTS"
        echo "GITHUB_TOKEN (auto-mapped): ${GITHUB_TOKEN:+(configured)}"
        echo "CUSTOM_BUILD_VAR (from input): $CUSTOM_BUILD_VAR"
        echo "OVERRIDE_VAR (input overrides config): $OVERRIDE_VAR"
      environment:
        # These variables override any config-based values
        CUSTOM_BUILD_VAR: "custom-value-from-template"
        OVERRIDE_VAR: "input-takes-precedence"
        NODE_ENV: "production"  # This overrides the global config value
```
        npm init -y
        echo "Setup completed!"
```

### Advanced Configuration

```yaml
steps:
  - id: advanced-build
    name: Advanced Build
    action: shell:execute
    input:
      script: |
        #!/bin/bash
        set -e
        
        echo "Starting build process..."
        npm ci
        npm run lint
        npm run test
        npm run build
        
        echo "Build completed successfully!"
      workingDirectory: ${{ parameters.repoPath }}
      environment:
        NODE_ENV: production
        CI: true
      timeout: 600000  # 10 minutes
      continueOnError: false
```

### Cross-Platform Script

```yaml
steps:
  - id: cross-platform
    name: Cross-Platform Setup
    action: shell:execute
    input:
      script: |
        # Detect OS and run appropriate commands
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Linux detected"
            sudo apt-get update
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "macOS detected"
            brew update
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            echo "Windows detected"
            # Windows commands here
        fi
      shell: /bin/bash
```

### Docker Setup

```yaml
steps:
  - id: docker-setup
    name: Docker Setup
    action: shell:execute
    input:
      script: |
        echo "Setting up Docker configuration..."
        
        cat > Dockerfile << 'EOF'
        FROM node:18-alpine
        WORKDIR /app
        COPY package*.json ./
        RUN npm ci --only=production
        COPY . .
        EXPOSE 3000
        CMD ["npm", "start"]
        EOF
        
        cat > docker-compose.yml << 'EOF'
        version: '3.8'
        services:
          app:
            build: .
            ports:
              - "3000:3000"
        EOF
        
        echo "Docker setup completed!"
```

### Error Handling and Retry Logic

```yaml
steps:
  - id: robust-script
    name: Robust Script with Retries
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
                    echo "Retrying in $delay seconds..."
                    sleep $delay
                fi
            done
            
            return 1
        }
        
        # Use retry for flaky operations
        retry 3 5 npm install
        retry 2 10 npm test
      continueOnError: false
```

## Security Considerations

### Input Validation

The action performs comprehensive input validation:

- Script content cannot be empty
- Working directory must exist
- Environment variables are sanitized
- Timeout values are bounded

### Temporary File Handling

- Scripts are written to secure temporary files
- Temporary files are automatically cleaned up
- File permissions are set appropriately (0755 for executables)

### Privilege Management

- Sudo usage is explicitly controlled
- Scripts run with minimal necessary privileges
- User-local installations are preferred over system-wide

### Secret Handling

```yaml
steps:
  - id: secure-secrets
    name: Handle Secrets Securely
    action: shell:execute
    input:
      script: |
        # Secrets are not logged when logOutput is false
        echo "Configuring application..."
        echo "API_KEY=$API_KEY" > .env
        chmod 600 .env
      environment:
        API_KEY: ${{ secrets.apiKey }}
      logOutput: false  # Prevent secrets in logs
```

## Best Practices

### 1. Use Error Handling

```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Your script logic here
```

### 2. Validate Environment

```bash
# Check required tools
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed"
    exit 1
fi
```

### 3. Progress Reporting

```bash
total_steps=5
current_step=0

progress() {
    current_step=$((current_step + 1))
    echo "Progress: [$current_step/$total_steps] $1"
}

progress "Installing dependencies..."
npm install

progress "Running tests..."
npm test
```

### 4. Cleanup on Exit

```bash
cleanup() {
    echo "Cleaning up temporary files..."
    rm -rf /tmp/build-*
}

trap cleanup EXIT
```

## Template Integration

See the [examples directory](./examples/) for complete template examples that demonstrate various use cases of the `shell:execute` action.

## Development

### Building

```bash
yarn build
```

### Linting

```bash
yarn lint
```

### Testing

```bash
yarn test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

Apache-2.0

## Support

For issues and questions, please file an issue in the repository or contact the platform team.
