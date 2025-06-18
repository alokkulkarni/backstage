# GitHub Insights Plugin

A Backstage plugin that provides comprehensive GitHub repository insights and analytics.

## Overview

The GitHub Insights plugin enhances your Backstage experience by providing detailed analytics and insights for GitHub repositories, including contribution metrics, pull request analytics, and repository health indicators.

## Features

- **Repository Analytics**: Comprehensive metrics for GitHub repositories
- **Contributor Insights**: Detailed contributor statistics and activity
- **Pull Request Analytics**: PR metrics, review times, and merge statistics
- **Code Quality Metrics**: Repository health indicators
- **Real-time Data**: Live updates from GitHub API

## Installation

### Step 1: Install the Plugin

```bash
# From your Backstage root directory
yarn add @internal/plugin-github-insights
```

### Step 2: Add the Plugin to Your App

#### Frontend Integration

Add the plugin to your `packages/app/src/App.tsx`:

```tsx
import { GithubInsightsPage } from '@internal/plugin-github-insights';

// In your app routes
<Route path="/github-insights" element={<GithubInsightsPage />} />
```

Add the route to your sidebar in `packages/app/src/components/Root/Root.tsx`:

```tsx
import GitHubIcon from '@material-ui/icons/GitHub';

// In your sidebar
<SidebarItem icon={GitHubIcon} to="github-insights" text="GitHub Insights" />
```

### Step 3: Configure GitHub Integration

Add the following configuration to your `app-config.yaml`:

```yaml
# GitHub integration
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}  # GitHub personal access token with repo access

# GitHub authentication
auth:
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}

# GitHub Insights configuration
githubInsights:
  organizations:
    - your-org-name
  refreshInterval: 300000  # 5 minutes in milliseconds
  cacheEnabled: true
  cacheTtl: 600  # 10 minutes
```

### Step 4: Set Up Entity Annotations

Add GitHub annotations to your catalog entities in `catalog-info.yaml`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component
  annotations:
    github.com/project-slug: your-org/your-repo
    backstage.io/source-location: url:https://github.com/your-org/your-repo
spec:
  type: service
  lifecycle: production
  owner: team-a
```

## Usage

### Viewing Repository Insights

1. Navigate to the "GitHub Insights" page (`/github-insights`)
2. Select a repository from the dropdown or search
3. View comprehensive analytics including:
   - Repository overview and statistics
   - Contributor activity and rankings
   - Pull request metrics and trends
   - Code frequency and commit activity
   - Issue tracking and resolution times

### Entity-Specific Insights

1. Navigate to any catalog entity with GitHub annotations
2. Look for the "GitHub Insights" tab
3. View repository-specific metrics and analytics

## Features in Detail

### Repository Metrics
- **Stars, Forks, Issues**: Basic repository statistics
- **Commit Activity**: Frequency and patterns over time
- **Language Breakdown**: Code composition analysis
- **Repository Health**: Overall health score

### Contributor Analytics
- **Top Contributors**: Most active contributors by commits
- **Contribution Patterns**: Activity over time
- **New vs Returning**: Contributor retention metrics
- **Collaboration Metrics**: Cross-team collaboration insights

### Pull Request Insights
- **Merge Times**: Average time from creation to merge
- **Review Coverage**: Percentage of PRs with reviews
- **PR Size Distribution**: Small, medium, large PR breakdown
- **Approval Patterns**: Review and approval trends

### Performance Metrics
- **Build Success Rate**: CI/CD pipeline success metrics
- **Test Coverage**: Code coverage trends
- **Security Alerts**: Vulnerability and security findings
- **Dependencies**: Dependency health and updates

## Configuration Options

### Advanced Configuration

```yaml
githubInsights:
  # Organization settings
  organizations:
    - primary-org
    - secondary-org
  
  # Data refresh settings
  refreshInterval: 300000  # 5 minutes
  batchSize: 10
  
  # Caching configuration
  cacheEnabled: true
  cacheTtl: 600  # 10 minutes
  
  # API rate limiting
  rateLimit:
    requestsPerHour: 5000
    concurrentRequests: 10
  
  # Metrics configuration
  metrics:
    enableDetailed: true
    historicalDays: 90
    excludeBots: true
    excludeForks: false
  
  # Display settings
  ui:
    defaultTimeRange: "30d"
    maxRepositories: 100
    enableExport: true
```

## Permissions

Ensure your GitHub token has the following permissions:
- `repo` - Full control of private repositories
- `read:org` - Read org and team membership
- `user:email` - Access user email addresses

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**: Reduce refresh interval or increase rate limit settings
2. **Authentication Failed**: Verify GitHub token and permissions
3. **No Data Displayed**: Check repository annotations and access permissions
4. **Slow Loading**: Enable caching and adjust batch sizes

### Debugging

Enable debug logging by setting the log level in your backend configuration:

```yaml
backend:
  logging:
    level: debug
```

## Development

### Local Development

```bash
yarn install
yarn start
```

### Building

```bash
yarn build
```

### Testing

```bash
yarn test
```

## API Reference

The plugin exposes REST API endpoints for programmatic access:

- `GET /api/github-insights/repositories` - List repositories
- `GET /api/github-insights/repository/{owner}/{repo}` - Get repository details
- `GET /api/github-insights/contributors/{owner}/{repo}` - Get contributor metrics
- `GET /api/github-insights/pullrequests/{owner}/{repo}` - Get PR analytics

## License

Apache-2.0
