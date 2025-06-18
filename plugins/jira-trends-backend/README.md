# Jira Trends Backend Plugin

A robust Backstage backend plugin that provides comprehensive analytics and trend data for Jira issues, enabling teams to gain insights into their project performance, velocity, and issue resolution patterns.

## Features

- **Issue Analytics**: Comprehensive analysis of issue creation, resolution, and lifecycle trends
- **Velocity Tracking**: Sprint velocity and team performance metrics
- **Burndown Charts**: Sprint and epic burndown data
- **Custom Metrics**: Configurable KPIs and performance indicators
- **Historical Data**: Long-term trend analysis and reporting
- **Multi-Project Support**: Analytics across multiple Jira projects
- **API Endpoints**: RESTful APIs for frontend consumption
- **Caching**: Intelligent caching for improved performance
- **Scheduled Jobs**: Automated data collection and analysis

## Installation

### 1. Install the Plugin

Add the backend plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @internal/plugin-jira-trends-backend
```

### 2. Add to Backend

Add the plugin to your backend configuration:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';
import jiraTrendsBackendPlugin from '@internal/plugin-jira-trends-backend';

const backend = createBackend();

// Add the Jira Trends backend plugin
backend.add(jiraTrendsBackendPlugin);

backend.start();
```

### 3. Alternative: Legacy Backend Setup

For legacy backend setup:

```typescript
// packages/backend/src/plugins/jira-trends.ts
import { createRouter } from '@internal/plugin-jira-trends-backend';
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
  });
}
```

```typescript
// packages/backend/src/index.ts
import jiraTrends from './plugins/jira-trends';

async function main() {
  // ... existing setup
  
  const jiraTrendsEnv = useHotMemoize(module, () => createEnv('jira-trends'));
  apiRouter.use('/jira-trends', await jiraTrends(jiraTrendsEnv));
}
```

## Configuration

### Backend Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# app-config.yaml
jiraTrends:
  # Jira connection settings
  jira:
    baseUrl: ${JIRA_BASE_URL}
    username: ${JIRA_USERNAME}
    apiToken: ${JIRA_API_TOKEN}
    # Optional: Custom fields mapping
    customFields:
      storyPoints: 'customfield_10016'
      epicLink: 'customfield_10014'
      sprint: 'customfield_10020'
      
  # Data collection settings
  collection:
    # How often to sync data (in minutes)
    syncInterval: 60
    # Maximum number of issues to fetch per request
    batchSize: 100
    # Projects to analyze
    projects:
      - key: 'PROJ1'
        name: 'Project 1'
      - key: 'PROJ2'
        name: 'Project 2'
    # Issue types to include in analysis
    issueTypes:
      - 'Story'
      - 'Bug'
      - 'Epic'
      - 'Task'
      
  # Database settings
  database:
    # Retention period for historical data (in days)
    retentionDays: 365
    # Enable data compression
    compression: true
    
  # Caching configuration
  cache:
    # Cache TTL for trend data (in seconds)
    trendsTtl: 3600
    # Cache TTL for project data (in seconds)
    projectsTtl: 7200
    
  # Analytics settings
  analytics:
    # Enable advanced analytics features
    enabled: true
    # Custom metrics configuration
    metrics:
      - name: 'velocity'
        type: 'sprint_velocity'
        aggregation: 'average'
      - name: 'lead_time'
        type: 'cycle_time'
        aggregation: 'median'
      - name: 'defect_rate'
        type: 'bug_ratio'
        aggregation: 'percentage'
```

### Environment Variables

Set up the required environment variables:

```bash
# .env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your_generated_api_token

# Optional: Database configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=backstage
POSTGRES_PASSWORD=backstage_password
POSTGRES_DB=backstage_plugin_jira_trends
```

### Database Setup

The plugin requires a database to store trend data. Configure your database connection:

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
```

## API Endpoints

The plugin exposes the following REST API endpoints:

### Issue Trends

```http
GET /api/jira-trends/issues/trends
```

Query parameters:
- `project`: Jira project key
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `issueType`: Filter by issue type
- `groupBy`: Group by (day, week, month)

### Velocity Metrics

```http
GET /api/jira-trends/velocity
```

Query parameters:
- `project`: Jira project key
- `sprintCount`: Number of recent sprints to analyze
- `teamId`: Team identifier

### Burndown Data

```http
GET /api/jira-trends/burndown/{sprintId}
```

Path parameters:
- `sprintId`: Sprint identifier

### Custom Metrics

```http
GET /api/jira-trends/metrics/{metricName}
```

Path parameters:
- `metricName`: Name of the custom metric

Query parameters:
- `project`: Jira project key
- `timeframe`: Time period for analysis

## Advanced Configuration

### Custom Metrics

Define custom metrics for your organization:

```yaml
# app-config.yaml
jiraTrends:
  analytics:
    customMetrics:
      - name: 'bug_fix_time'
        description: 'Average time to fix bugs'
        query: |
          SELECT AVG(resolution_time) 
          FROM issues 
          WHERE issue_type = 'Bug' 
          AND status = 'Done'
        aggregation: 'average'
        unit: 'hours'
        
      - name: 'story_completion_rate'
        description: 'Percentage of stories completed on time'
        query: |
          SELECT 
            COUNT(CASE WHEN completed_date <= due_date THEN 1 END) * 100.0 / COUNT(*) 
          FROM issues 
          WHERE issue_type = 'Story'
        aggregation: 'percentage'
        unit: 'percent'
```

### Data Transformation

Configure data transformation rules:

```yaml
# app-config.yaml
jiraTrends:
  dataTransformation:
    # Status mapping for consistent analysis
    statusMapping:
      'To Do': 'todo'
      'In Progress': 'in_progress'
      'Done': 'done'
      'Closed': 'done'
      
    # Priority normalization
    priorityMapping:
      'Highest': 5
      'High': 4
      'Medium': 3
      'Low': 2
      'Lowest': 1
```

### Scheduled Jobs

Configure automated data collection:

```yaml
# app-config.yaml
jiraTrends:
  scheduler:
    jobs:
      - name: 'daily_sync'
        schedule: '0 0 * * *'  # Daily at midnight
        action: 'sync_issues'
        
      - name: 'weekly_analytics'
        schedule: '0 0 * * 0'  # Weekly on Sunday
        action: 'generate_analytics'
        
      - name: 'monthly_cleanup'
        schedule: '0 0 1 * *'  # Monthly on 1st
        action: 'cleanup_old_data'
```

## Usage with Frontend

This backend plugin is designed to work with the corresponding frontend plugin:

```typescript
// Frontend API client usage
import { jiraTrendsApiRef } from '@internal/plugin-jira-trends-frontend';
import { useApi } from '@backstage/core-plugin-api';

const MyComponent = () => {
  const jiraTrendsApi = useApi(jiraTrendsApiRef);
  
  const fetchTrends = async () => {
    const trends = await jiraTrendsApi.getIssueTrends({
      project: 'MYPROJ',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      groupBy: 'week'
    });
    return trends;
  };
};
```

## Performance Optimization

### Caching Strategy

The plugin implements multi-level caching:

1. **In-Memory Cache**: Fast access to frequently requested data
2. **Database Cache**: Persistent cache for computed metrics
3. **CDN Cache**: Optional CDN caching for static trend data

### Database Optimization

Recommended database optimizations:

```sql
-- Create indexes for better query performance
CREATE INDEX idx_issues_project_created ON issues(project_key, created_date);
CREATE INDEX idx_issues_project_resolved ON issues(project_key, resolved_date);
CREATE INDEX idx_issues_assignee_status ON issues(assignee, status);
CREATE INDEX idx_issues_sprint_id ON issues(sprint_id);

-- Partitioning for large datasets
CREATE TABLE issues_y2024m01 PARTITION OF issues 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Monitoring and Observability

### Health Checks

The plugin provides health check endpoints:

```http
GET /api/jira-trends/health
```

### Metrics

Monitor plugin performance with these metrics:

- `jira_trends_sync_duration`: Time taken for data synchronization
- `jira_trends_api_requests`: Number of API requests to Jira
- `jira_trends_cache_hits`: Cache hit ratio
- `jira_trends_database_queries`: Database query performance

### Logging

Configure logging levels:

```yaml
# app-config.yaml
backend:
  plugins:
    jira-trends-backend:
      logLevel: info
      logFormat: json
```

## Troubleshooting

### Common Issues

**Data Sync Failures**
- Check Jira API connectivity and credentials
- Verify project permissions and access
- Monitor rate limiting and API quotas

**Performance Issues**
- Review database query performance
- Check cache configuration and hit rates
- Monitor memory usage during data processing

**Missing Data**
- Verify project configuration in app-config.yaml
- Check issue type filters and field mappings
- Review data retention settings

### Debug Mode

Enable debug mode for detailed logging:

```yaml
# app-config.yaml
jiraTrends:
  debug: true
  verbose: true
```

## Security Considerations

### API Security

- Use secure API tokens with minimal required permissions
- Implement rate limiting to prevent abuse
- Use HTTPS for all communications
- Regularly rotate API credentials

### Data Security

- Encrypt sensitive data at rest
- Implement proper access controls
- Audit data access and modifications
- Follow data retention policies

## Development

### Local Development

Run the plugin in development mode:

```bash
# From the plugin directory
cd plugins/jira-trends-backend
yarn start
```

### Testing

Run tests for the plugin:

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# End-to-end tests
yarn test:e2e
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with comprehensive tests
4. Update documentation
5. Submit a pull request

## License

This plugin is licensed under the Apache License 2.0.
