# Jenkins Scaffolder Actions for Backstage

A powerful Backstage scaffolder backend module that provides comprehensive Jenkins integration for template scaffolding. This plugin enables automatic creation and execution of Jenkins pipeline jobs directly from Backstage templates, streamlining your CI/CD workflow setup.

## Features

- **Automated Job Creation**: Create Jenkins pipeline jobs from Jenkinsfiles in your template skeleton directories
- **Build Execution**: Trigger Jenkins builds with parameters and monitor completion status
- **Multi-Pipeline Support**: Process multiple Jenkinsfiles to create related jobs (build, test, deploy, release)
- **Parameter Management**: Full support for Jenkins job parameters (string, boolean, choice, password)
- **Build Monitoring**: Wait for build completion with configurable timeouts and status reporting
- **Error Handling**: Comprehensive error handling and logging for production environments
- **Security Features**: CSRF protection, XML escaping, and secure authentication
- **Template Integration**: Seamless integration with Backstage software templates

## Installation

### 1. Install the Plugin

Add the scaffolder backend module to your Backstage backend:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @internal/plugin-scaffolder-backend-module-jenkins-scaffolder-action
```

### 2. Add to Backend (New Backend System)

Add the module to your backend in `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other plugins

// Add Jenkins scaffolder actions
backend.add(import('@internal/plugin-scaffolder-backend-module-jenkins-scaffolder-action'));

backend.start();
```

### 3. Alternative: Legacy Backend Setup

For legacy backend systems:

```typescript
// packages/backend/src/plugins/scaffolder.ts
import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { createJenkinsActions } from '@internal/plugin-scaffolder-backend-module-jenkins-scaffolder-action';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  // Create Jenkins actions
  const jenkinsActions = createJenkinsActions({
    config: env.config,
    logger: env.logger,
  });

  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
    // Add Jenkins actions to scaffolder
    additionalTemplateFilters: {},
    additionalTemplateGlobals: {},
    actions: [...jenkinsActions],
  });
}
```

## Configuration

### Step 1: Jenkins Server Setup

Configure your Jenkins server connection in `app-config.yaml`:

```yaml
# app-config.yaml
jenkins:
  baseUrl: ${JENKINS_BASE_URL}  # Your Jenkins server URL
  username: ${JENKINS_USERNAME} # Jenkins username
  apiKey: ${JENKINS_API_KEY}    # Jenkins API token
  # Optional: For Jenkins with CSRF protection
  crumbIssuer: true
  # Optional: For self-signed certificates
  skipTlsVerify: false
  
# Proxy configuration for Jenkins API access
proxy:
  endpoints:
    '/jenkins/api':
      target: ${JENKINS_BASE_URL}
      changeOrigin: true
      headers:
        Authorization: Basic ${JENKINS_BASIC_AUTH_HEADER}
        # Disable CSRF for API calls
        'Jenkins-Crumb': 'ignore'
      # Optional: Add custom headers
      # X-Custom-Header: 'custom-value'
```

### Step 2: Environment Variables

Set up the required environment variables:

```bash
# .env
JENKINS_BASE_URL=https://jenkins.company.com
JENKINS_USERNAME=backstage-service-account
JENKINS_API_KEY=your_jenkins_api_key_here
JENKINS_BASIC_AUTH_HEADER=$(echo -n "$JENKINS_USERNAME:$JENKINS_API_KEY" | base64)
```

### Step 3: Jenkins API Token Setup

1. **Login to Jenkins** → Go to your Jenkins server
2. **User Profile** → Click on your username in the top right
3. **Configure** → Click "Configure" in the left sidebar
4. **API Token** → Click "Add new Token" and generate a new API key
5. **Copy Token** → Save the generated token securely

> **Note**: The Jenkins user should have appropriate permissions to create jobs, trigger builds, and access build logs.

### Step 4: Jenkins Permissions

Ensure your Jenkins user has the following permissions:
- **Job/Create**: Create new jobs
- **Job/Configure**: Configure job settings
- **Job/Build**: Trigger job builds
- **Job/Read**: Read job configurations and build history
- **Job/Workspace**: Access job workspace (optional)

### Advanced Configuration

For more advanced setups, you can configure additional options:

```yaml
# app-config.yaml
jenkins:
  baseUrl: ${JENKINS_BASE_URL}
  username: ${JENKINS_USERNAME}
  apiKey: ${JENKINS_API_KEY}
  
  # Advanced settings
  timeout: 30000  # Request timeout in milliseconds
  maxRedirects: 5 # Maximum number of redirects to follow
  
  # Multiple Jenkins instances
  instances:
    production:
      baseUrl: https://jenkins-prod.company.com
      username: ${JENKINS_PROD_USERNAME}
      apiKey: ${JENKINS_PROD_API_KEY}
    staging:
      baseUrl: https://jenkins-staging.company.com
      username: ${JENKINS_STAGING_USERNAME}
      apiKey: ${JENKINS_STAGING_API_KEY}
      
  # Default job configuration
  defaults:
    # Default build parameters
    parameters:
      BRANCH: 'main'
      ENVIRONMENT: 'dev'
    
    # Default job properties
    properties:
      keepBuildsForDays: 30
      maxBuildsToKeep: 10
      
  # Security settings
  security:
    # Validate SSL certificates
    validateCertificates: true
    # Allowed job name patterns (regex)
    allowedJobNamePatterns:
      - '^[a-zA-Z0-9-_]+$'
    # Blocked job name patterns
    blockedJobNamePatterns:
      - '^admin-.*'
      - '^system-.*'
```

## Actions

### jenkins:create-job

Creates Jenkins pipeline jobs based on Jenkinsfiles found in skeleton directories.

#### Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifactId` | string | Yes | Artifact ID from scaffolding template, used as base for job names |
| `skeletonPath` | string | Yes | Path to skeleton directory containing Jenkinsfiles |
| `baseJobName` | string | No | Optional base name for jobs. If not provided, artifactId will be used |
| `description` | string | No | Description for the Jenkins jobs |
| `parameters` | object | No | Default parameters for the Jenkins jobs |

#### Outputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `createdJobs` | array | List of created Jenkins jobs with name, URL, and Jenkinsfile info |

#### Job Naming Convention

- `Jenkinsfile` → `{artifactId}` or `{baseJobName}`
- `Jenkinsfile.deploy` → `{artifactId}-deploy` or `{baseJobName}-deploy`
- `Jenkinsfile.test` → `{artifactId}-test` or `{baseJobName}-test`

#### Example Usage

```yaml
steps:
  - id: create-jenkins-jobs
    name: Create Jenkins Pipeline Jobs
    action: jenkins:create-job
    input:
      artifactId: ${{ parameters.name }}
      skeletonPath: ./skeleton
      description: "Pipeline jobs for ${{ parameters.name }}"
      parameters:
        branch:
          type: string
          defaultValue: main
          description: Git branch to build
        environment:
          type: choice
          choices: [dev, staging, prod]
          description: Target environment
        notify:
          type: boolean
          defaultValue: true
          description: Send notifications
```

### jenkins:execute-job

Executes a Jenkins job by name with optional parameters.

#### Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `jobName` | string | Yes | - | Name of the Jenkins job to execute |
| `parameters` | object | No | {} | Parameters to pass to the Jenkins job |
| `waitForCompletion` | boolean | No | true | Whether to wait for build completion |
| `timeout` | number | No | 600 | Maximum time to wait for completion (seconds) |

#### Outputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `buildNumber` | number | Build number of the triggered job |
| `buildUrl` | string | URL to the build in Jenkins |
| `result` | string | Build result (SUCCESS, FAILURE, UNSTABLE, etc.) |
| `building` | boolean | Whether the build is still in progress |
| `queueId` | number | Queue ID if the job was queued |

#### Example Usage

```yaml
steps:
  - id: execute-build
    name: Execute Build Job
    action: jenkins:execute-job
    input:
      jobName: ${{ parameters.name }}-build
      parameters:
        branch: ${{ parameters.branch }}
        environment: ${{ parameters.environment }}
      waitForCompletion: true
      timeout: 1200

  - id: execute-deploy
    name: Trigger Deployment
    action: jenkins:execute-job
    input:
      jobName: ${{ parameters.name }}-deploy
      parameters:
        buildNumber: ${{ steps['execute-build'].output.buildNumber }}
        environment: ${{ parameters.environment }}
      waitForCompletion: false  # Fire and forget
```

## Skeleton Directory Structure

Your scaffolding template skeleton directory can contain multiple Jenkinsfiles:

```
skeleton/
├── src/
│   └── main/
│       └── java/
├── Jenkinsfile              # Main build pipeline
├── Jenkinsfile.deploy       # Deployment pipeline
├── Jenkinsfile.test         # Test pipeline
├── Jenkinsfile.release      # Release pipeline
└── README.md
```

Each Jenkinsfile will create a separate Jenkins job with the naming convention described above.

## Security Features

- **CSRF Protection**: Automatically handles Jenkins CSRF tokens
- **XML Escaping**: Prevents XML injection in job configurations
- **Authentication**: Uses Jenkins API tokens for secure authentication
- **Input Validation**: Comprehensive validation of all inputs

## Error Handling

The actions provide comprehensive error handling:

- **Configuration Errors**: Missing Jenkins credentials or configuration
- **Network Errors**: Connection failures to Jenkins server
- **Jenkins Errors**: Job creation failures, build failures, timeouts
- **File System Errors**: Missing skeleton directories or Jenkinsfiles

All errors are logged with detailed context for debugging.

## Development

### Running Tests

```bash
yarn test
```

### Building

```bash
yarn build
```

### Linting

```bash
yarn lint
```

## Example Template

Here's a complete example of a Backstage template using these actions:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: java-service-with-jenkins
  title: Java Service with Jenkins Pipelines
  description: Create a Java service with automated Jenkins pipelines
spec:
  owner: platform-team
  type: service
  parameters:
    - title: Service Information
      required:
        - name
        - owner
      properties:
        name:
          title: Name
          type: string
          description: Unique name of the service
        owner:
          title: Owner
          type: string
          description: Owner of the service
        branch:
          title: Default Branch
          type: string
          default: main
          description: Default git branch
        environment:
          title: Target Environment
          type: string
          enum: [dev, staging, prod]
          default: dev
          description: Initial target environment

  steps:
    - id: fetch-base
      name: Fetch Base
      action: fetch:template
      input:
        url: ./content
        values:
          name: ${{ parameters.name }}
          owner: ${{ parameters.owner }}

    - id: publish
      name: Publish to GitHub
      action: publish:github
      input:
        allowedHosts: ['github.com']
        description: ${{ parameters.name }} service
        repoUrl: github.com?owner=my-org&repo=${{ parameters.name }}

    - id: create-jenkins-jobs
      name: Create Jenkins Pipeline Jobs
      action: jenkins:create-job
      input:
        artifactId: ${{ parameters.name }}
        skeletonPath: ./skeleton
        description: "Pipeline jobs for ${{ parameters.name }} service"
        parameters:
          branch:
            type: string
            defaultValue: ${{ parameters.branch }}
            description: Git branch to build
          environment:
            type: choice
            choices: [dev, staging, prod]
            description: Target environment

    - id: execute-initial-build
      name: Execute Initial Build
      action: jenkins:execute-job
      input:
        jobName: ${{ parameters.name }}
        parameters:
          branch: ${{ parameters.branch }}
          environment: ${{ parameters.environment }}
        waitForCompletion: true
        timeout: 900

    - id: register
      name: Register in Catalog
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'

  output:
    links:
      - title: Repository
        url: ${{ steps.publish.output.remoteUrl }}
      - title: Build Job
        url: ${{ steps['create-jenkins-jobs'].output.createdJobs[0].url }}
      - title: Initial Build
        url: ${{ steps['execute-initial-build'].output.buildUrl }}
      - title: Open in catalog
        icon: catalog
        entityRef: ${{ steps.register.output.entityRef }}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
