# Source Control Trends Backend Plugin

A comprehensive Backstage backend plugin that provides advanced analytics and compliance tracking for source control repositories. This plugin delivers deep insights into development patterns, security compliance, and team productivity metrics across your organization's repositories.

## Features

- **Multi-Platform Integration**: Support for GitHub, GitLab, Bitbucket, and Azure DevOps
- **Advanced Analytics**: Comprehensive metrics including velocity, quality, and security trends
- **Automated Data Ingestion**: Scheduled data collection with configurable intervals
- **Compliance Monitoring**: Track security vulnerabilities, branch protection, and policy compliance
- **Performance Metrics**: Calculate repository health scores and team productivity indicators
- **API Rate Management**: Intelligent rate limiting and request optimization
- **Database Management**: Robust data schema with automated migrations and optimizations
- **RESTful APIs**: Complete REST endpoints for frontend integration and external systems
- **Real-time Updates**: WebSocket support for live data streaming
- **Audit Trail**: Complete audit logging for compliance and debugging

## Installation

### 1. Install the Plugin

Add the backend plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @internal/plugin-sourcecontrol-trends-backend
```

### 2. Add to Backend

Add the plugin to your backend configuration:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';
import sourceControlTrendsBackendPlugin from '@internal/plugin-sourcecontrol-trends-backend';

const backend = createBackend();

// Add the Source Control Trends backend plugin
backend.add(sourceControlTrendsBackendPlugin);

backend.start();
```

### 3. Alternative: Legacy Backend Setup

For legacy backend setup:

```typescript
// packages/backend/src/plugins/sourcecontrol-trends.ts
import { createRouter } from '@internal/plugin-sourcecontrol-trends-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    scheduler: env.scheduler,
  });
}
```

```typescript
// packages/backend/src/index.ts
import sourceControlTrends from './plugins/sourcecontrol-trends';

async function main() {
  // ... existing setup
  
  const sourceControlTrendsEnv = useHotMemoize(module, () => createEnv('sourcecontrol-trends'));
  apiRouter.use('/sourcecontrol-trends', await sourceControlTrends(sourceControlTrendsEnv));
}
```

## Architecture

### Core Services

#### GitHubApiService
- **GitHub API Integration**: Complete GitHub API client with Octokit
- **Authentication Management**: Support for multiple auth methods (tokens, apps, OAuth)
- **Rate Limiting**: Intelligent rate limiting with queue management
- **Error Handling**: Comprehensive error handling and retry logic
- **Data Collection**: Repository, PR, issue, and vulnerability data collection

#### SourceControlTrendsService
- **Business Logic Layer**: Core analytics and metrics calculation
- **Data Processing**: Complex algorithms for health scoring and trend analysis
- **API Implementation**: RESTful endpoint implementations
- **Caching Strategy**: Multi-level caching for performance optimization

#### DataIngestionService
- **Automated Data Import**: Scheduled data collection from source control APIs
- **Batch Processing**: Efficient batch operations for large datasets
- **Data Consistency**: Upsert operations to maintain data integrity
- **Incremental Updates**: Smart incremental data updates to reduce API calls

#### ComplianceService
- **Security Scanning**: Vulnerability detection and tracking
- **Policy Enforcement**: Branch protection and repository policy compliance
- **Audit Reporting**: Generate compliance reports and audit trails
- **Alert Management**: Configurable alerts for compliance violations

#### MetricsCalculationService
- **Health Score Calculations**: Complex algorithms for repository health assessment
- **Compliance Evaluation**: Automated evaluation against configurable benchmarks
- **Historical Trend Analysis**: Time-series analysis for pattern recognition
- **Performance Metrics**: Team productivity and code quality indicators

#### DataRefreshService
- **Scheduled Data Refresh**: Configurable intervals (default: every 6 hours)
- **Monitoring and Logging**: Comprehensive data ingestion monitoring
- **Error Handling**: Robust error recovery and retry mechanisms
- **Performance Optimization**: Intelligent incremental updates

### Database Schema

The plugin uses 8 normalized tables optimized for analytics:

1. **repositories**: Repository metadata, settings, and calculated health scores
2. **repository_metrics**: Time-series metrics data for trend analysis
3. **pull_requests**: Pull request lifecycle and review analytics
4. **vulnerabilities**: Security vulnerability tracking and remediation status
5. **compliance_reports**: Automated compliance evaluation results
6. **benchmarks**: Configurable compliance standards and thresholds
7. **data_refresh_logs**: Data ingestion monitoring and audit trail
8. **github_rate_limits**: API rate limit tracking and optimization

## Configuration

### Step 1: GitHub Authentication

Configure GitHub integration in your `app-config.yaml`:

```yaml
# app-config.yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
      # Optional: GitHub App configuration for higher rate limits
      apps:
        - appId: ${GITHUB_APP_ID}
          clientId: ${GITHUB_CLIENT_ID}
          clientSecret: ${GITHUB_CLIENT_SECRET}
          privateKey: ${GITHUB_PRIVATE_KEY}
          installationId: ${GITHUB_INSTALLATION_ID}

# Alternative: Multiple GitHub instances
integrations:
  github:
    - host: github.com
      token: ${GITHUB_PUBLIC_TOKEN}
    - host: github.enterprise.com
      token: ${GITHUB_ENTERPRISE_TOKEN}
      apiBaseUrl: https://github.enterprise.com/api/v3
```

### Step 2: Database Configuration

The plugin uses the default Backstage database. Ensure proper configuration:

```yaml
# app-config.yaml
backend:
  database:
    client: pg
    connection:
      host: ${POSTGRES_HOST}
      port: ${POSTGRES_PORT}
      user: ${POSTGRES_USER}
      password: ${POSTGRES_PASSWORD}
      database: ${POSTGRES_DB}
      # Enable SSL for production
      ssl:
        rejectUnauthorized: false
    # Connection pool configuration
    pool:
      min: 2
      max: 10
      idleTimeoutMillis: 30000
      acquireTimeoutMillis: 30000
```

### Step 3: Plugin Configuration

Configure advanced plugin settings:

```yaml
# app-config.yaml
sourceControlTrends:
  # Data refresh configuration
  refreshInterval: '6h'  # Options: 1h, 2h, 6h, 12h, 24h
  
  # GitHub API configuration
  github:
    maxRequestsPerHour: 5000
    # Enable advanced features
    enableDependencyGraph: true
    enableSecurityAlerts: true
    enableVulnerabilityAlerts: true
    
  # Repository filtering
  repositories:
    # Include repositories matching patterns
    include:
      - 'company-org/*'
      - 'platform-team/*'
    # Exclude repositories matching patterns
    exclude:
      - '*/archived-*'
      - '*/deprecated-*'
    # Minimum activity threshold (days)
    minActivityDays: 30
    
  # Metrics configuration
  metrics:
    # Health score weights
    healthScore:
      hasReadme: 10
      hasLicense: 5
      branchProtection: 25
      requiredReviews: 20
      hasTests: 15
      recentActivity: 15
      vulnerabilities: -30
    
    # Compliance benchmarks
    benchmarks:
      minimum:
        branchProtectionEnabled: true
        requiredReviewers: 1
        maxHighVulnerabilities: 0
        maxCriticalVulnerabilities: 0
      recommended:
        branchProtectionEnabled: true
        requiredReviewers: 2
        hasReadme: true
        hasLicense: true
        automatedTesting: true
        
  # Performance settings
  performance:
    # Cache settings
    cache:
      repositories: '1h'
      metrics: '30m'
      vulnerabilities: '15m'
    
    # Database query optimization
    batchSize: 100
    maxConcurrentRequests: 10
    
  # Notification settings
  notifications:
    enabled: true
    # Slack webhook for critical alerts
    slack:
      webhookUrl: ${SLACK_WEBHOOK_URL}
      channel: '#security-alerts'
    # Email notifications
    email:
      enabled: false
      smtpHost: ${SMTP_HOST}
      smtpPort: ${SMTP_PORT}
```

### Step 4: Environment Variables

Set up the required environment variables:

```bash
# .env
# GitHub Authentication
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_INSTALLATION_ID=12345678

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=backstage
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=backstage_plugin_sourcecontrol_trends

# Optional: Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SMTP_HOST=smtp.company.com
SMTP_PORT=587
```

## API Endpoints

### Repositories
- `GET /api/sourcecontrol-trends/repositories` - List repositories with filtering
- `GET /api/sourcecontrol-trends/repositories/:id` - Get repository details
- `POST /api/sourcecontrol-trends/repositories/refresh` - Trigger data refresh

### Metrics
- `GET /api/sourcecontrol-trends/metrics` - Get metrics with filtering
- `GET /api/sourcecontrol-trends/metrics/dashboard` - Dashboard overview
- `GET /api/sourcecontrol-trends/metrics/trends` - Historical trends

### Compliance
- `GET /api/sourcecontrol-trends/compliance` - Compliance reports
- `GET /api/sourcecontrol-trends/compliance/:repositoryId` - Repository compliance

### Vulnerabilities
- `GET /api/sourcecontrol-trends/vulnerabilities` - Security vulnerabilities
- `GET /api/sourcecontrol-trends/vulnerabilities/:repositoryId` - Repository vulnerabilities

### Pull Requests
- `GET /api/sourcecontrol-trends/pull-requests` - PR analytics
- `GET /api/sourcecontrol-trends/pull-requests/:repositoryId` - Repository PRs

### Benchmarks
- `GET /api/sourcecontrol-trends/benchmarks` - List benchmarks
- `POST /api/sourcecontrol-trends/benchmarks` - Create benchmark
- `PUT /api/sourcecontrol-trends/benchmarks/:id` - Update benchmark
- `DELETE /api/sourcecontrol-trends/benchmarks/:id` - Delete benchmark

## Development

### Setup
```bash
cd plugins/sourcecontrol-trends-backend
yarn install
```

### Running in Development
```bash
yarn start
```

### Testing
```bash
yarn test
```

### Database Migrations
The plugin automatically runs migrations on startup. Manual migration:
```bash
yarn knex migrate:latest
```

## Data Collection

### Repository Data
- Basic repository information (name, description, owner)
- Repository settings (branch protection, required reviews)
- Language and technology stack
- Activity metrics (commits, contributors)

### Pull Request Data
- PR lifecycle (created, merged, closed dates)
- Review information (reviewers, comments)
- Author and assignee data
- PR size and complexity metrics

### Security Data
- Dependabot alerts and vulnerabilities
- Security advisory information
- Dependency scan results
- Code scanning alerts

### Metrics Calculation
- **Health Score**: Composite score based on multiple factors
- **Compliance Rate**: Percentage of benchmarks met
- **Security Score**: Based on vulnerability severity and count
- **Quality Score**: Code quality and best practices adherence

## Monitoring

### Data Refresh Logs
Monitor data ingestion with the `data_refresh_logs` table:
```sql
SELECT * FROM data_refresh_logs ORDER BY started_at DESC LIMIT 10;
```

### Rate Limit Monitoring
Track GitHub API usage:
```sql
SELECT * FROM github_rate_limits ORDER BY timestamp DESC LIMIT 10;
```

### Health Checks
The plugin exposes health check endpoints:
- `GET /api/sourcecontrol-trends/health` - Service health
- `GET /api/sourcecontrol-trends/health/database` - Database connectivity

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limits**
   ```
   Error: API rate limit exceeded
   ```
   Solution: Check your GitHub token permissions and consider using a GitHub App

2. **Database Connection**
   ```
   Error: Connection terminated unexpectedly
   ```
   Solution: Verify database configuration and connectivity

3. **Missing Repository Data**
   ```
   No repositories found
   ```
   Solution: Trigger manual data refresh or check GitHub token access

### Debugging

Enable debug logging:
```yaml
backend:
  logger:
    level: debug
    format: coloredText
```

Check service logs:
```bash
# View recent logs
yarn backstage-cli package start --config ../../app-config.yaml --verbose
```

## Performance

### Database Optimization
- Indexes on commonly queried fields
- Batch operations for large datasets
- Connection pooling for concurrent requests

### API Rate Limiting
- Intelligent rate limiting based on GitHub API quotas
- Request batching and caching
- Graceful degradation when limits are approached

### Caching Strategy
- Repository data cached for 1 hour
- Metrics data cached for 30 minutes
- Vulnerability data cached for 15 minutes

## Security

### Data Protection
- Secure token storage
- Encrypted database connections
- Input validation and sanitization

### Access Control
- Integration with Backstage permission system
- Role-based access to sensitive data
- Audit logging for compliance

## Contributing

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure database migrations are backward compatible

## License

Part of the internal Backstage ecosystem.
