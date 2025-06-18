# Source Control Trends Frontend Plugin

A comprehensive Backstage frontend plugin that provides rich analytics and compliance dashboards for source control repositories. This plugin delivers actionable insights into development patterns, security compliance, and team productivity across your organization's codebase.

## Features

### 📊 Interactive Dashboard
- **Repository Health Scores**: Real-time composite scores based on security, quality, and compliance metrics
- **Trend Visualization**: Historical tracking with interactive charts and graphs
- **Compliance Monitoring**: Live compliance status against configurable organizational benchmarks
- **Performance Metrics**: Team productivity indicators and development velocity analytics
- **Customizable Views**: Flexible filtering and sorting across all data dimensions

### 🔍 Advanced Repository Analytics
- **Repository Portfolio**: Comprehensive overview of all tracked repositories with health indicators
- **Detailed Health Scoring**: Multi-factor health assessment including:
  - Branch protection enforcement
  - Pull request review requirements
  - Security scanning enablement
  - Documentation coverage and quality
  - License compliance tracking
  - Test coverage metrics
  - Dependency management and update frequency
  - Code quality indicators

### ✅ Compliance Management Dashboard
- **Configurable Benchmarks**: Define and manage custom compliance standards
- **Real-time Compliance Tracking**: Visual monitoring of compliance rates across repository portfolio
- **Historical Analysis**: Trend analysis for compliance performance over time
- **Risk Assessment**: Automated identification of repositories requiring immediate attention
- **Compliance Reporting**: Exportable compliance reports for auditing and governance

### 🔒 Security Monitoring Interface
- **Vulnerability Dashboard**: Comprehensive security vulnerability tracking and visualization
- **Severity Analysis**: Categorized views by critical, high, medium, and low severity levels
- **Repository Risk Assessment**: Identification and prioritization of most vulnerable repositories
- **Remediation Tracking**: Monitor security issue resolution progress and timelines
- **Security Trends**: Historical analysis of security posture improvements

### 🔄 Pull Request Analytics
- **PR Performance Metrics**: Track merge velocity, review cycles, and approval times
- **Team Collaboration Insights**: Understand development workflow patterns and bottlenecks
- **Cross-Repository Comparison**: Compare PR activity and performance across different repositories
- **Developer Productivity**: Individual and team productivity metrics and trends

### ⚙️ Benchmark Configuration
- **Custom Standards Definition**: Create organization-specific compliance requirements
- **Flexible Operators**: Support for >=, >, <=, <, = operators across all metrics
- **Multi-dimensional Metrics**: Configure benchmarks for various quality and security dimensions
- **Dynamic Management**: Real-time enable/disable of specific benchmarks with immediate effect

## Installation

### 1. Install the Plugin

Add the frontend plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-sourcecontrol-trends-frontend
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { sourceControlTrendsFrontendPlugin } from '@internal/plugin-sourcecontrol-trends-frontend';
```

### 3. Configure in App.tsx

Import and configure the plugin in your main app file:

```typescript
// packages/app/src/App.tsx
import { Route } from 'react-router';
import { SourceControlTrendsPage } from '@internal/plugin-sourcecontrol-trends-frontend';

// Add to your app routes
const routes = (
  <FlatRoutes>
    {/* ...existing routes... */}
    <Route path="/sourcecontrol-trends" element={<SourceControlTrendsPage />} />
  </FlatRoutes>
);
```

### 4. Add to Navigation

Add Source Control Trends to your sidebar navigation:

```typescript
// packages/app/src/components/Root/Root.tsx
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ...existing items... */}
      <SidebarItem icon={TrendingUpIcon} to="sourcecontrol-trends" text="Source Control" />
    </Sidebar>
    {children}
  </SidebarPage>
);
```

## Prerequisites

This frontend plugin requires the corresponding backend plugin to be installed and configured:

```bash
# Install the backend plugin
yarn add --cwd packages/backend @internal/plugin-sourcecontrol-trends-backend
```

See the [Source Control Trends Backend Plugin README](../sourcecontrol-trends-backend/README.md) for backend setup instructions.

## Plugin Architecture

### Backend Integration (`sourcecontrol-trends-backend`)
- **Multi-Platform API Integration**: GitHub, GitLab, Bitbucket, and Azure DevOps support
- **Robust Database Schema**: Normalized schema with 8 optimized tables for analytics
- **Automated Data Ingestion**: Intelligent scheduled data refresh with configurable intervals
- **Advanced Metrics Calculation**: Complex algorithms for health scoring and compliance evaluation
- **Comprehensive RESTful APIs**: Complete API coverage for all frontend functionality
- **Performance Optimization**: Intelligent caching and query optimization

### Frontend Components (`sourcecontrol-trends-frontend`)
- **Modern React Architecture**: Hooks-based components with TypeScript support
- **Material-UI Design System**: Consistent, accessible, and responsive user interface
- **Interactive Data Visualization**: Advanced charts and graphs using Recharts and D3.js
- **Modular Navigation**: Organized tabbed interface with dedicated sections for different analytics
- **Real-time Updates**: Live data synchronization with WebSocket support and optimistic updates

## Configuration

### Database Setup
The plugin automatically creates the required database tables on startup:
- `repositories`: Repository metadata and health scores
- `repository_metrics`: Historical metrics data
- `pull_requests`: Pull request analytics
- `vulnerabilities`: Security vulnerability tracking
- `compliance_reports`: Compliance evaluation results
- `benchmarks`: Configurable compliance standards
- `data_refresh_logs`: Data ingestion monitoring
- `github_rate_limits`: API rate limit tracking

### GitHub Authentication
Configure GitHub authentication in your `app-config.yaml`:
```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
```

### Default Benchmarks
The plugin creates default benchmarks for:
- Branch Protection Enabled (≥ 1)
- PR Review Required (≥ 1)
- Security Scanning Enabled (≥ 1)
- License Compliance (≥ 1)
- Documentation Coverage (≥ 60%)
- Test Coverage (≥ 80%)
- Dependency Updates (≥ 1)

## API Endpoints

### Repositories
- `GET /api/sourcecontrol-trends/repositories` - List all repositories
- `GET /api/sourcecontrol-trends/repositories/:id` - Get repository details
- `POST /api/sourcecontrol-trends/repositories/refresh` - Trigger data refresh

### Metrics
- `GET /api/sourcecontrol-trends/metrics` - Get metrics data
- `GET /api/sourcecontrol-trends/metrics/dashboard` - Dashboard overview data
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

## Usage

### Accessing the Dashboard
1. Navigate to `/sourcecontrol-trends` in your Backstage instance
2. Use the tabbed interface to explore different views:
   - **Overview**: Dashboard summary with key metrics
   - **Repositories**: Detailed repository list and health scores
   - **Compliance**: Compliance tracking and trends
   - **Security**: Vulnerability monitoring and analysis
   - **Pull Requests**: PR analytics and workflow insights
   - **Benchmarks**: Compliance standards management

### Configuring Benchmarks
1. Go to the **Benchmarks** tab
2. Click **Add Benchmark** to create new compliance standards
3. Configure:
   - **Metric Type**: Choose from available metrics
   - **Operator**: Set comparison operator (≥, >, ≤, <, =)
   - **Target Value**: Define the compliance threshold
   - **Description**: Add context for the benchmark

### Monitoring Compliance
- Use the **Compliance** tab to view overall compliance rates
- Review trend charts to understand compliance evolution
- Identify non-compliant repositories requiring attention
- Track progress over time with historical data

### Security Analysis
- Monitor vulnerabilities by severity in the **Security** tab
- Use pie charts to understand vulnerability distribution
- Track remediation progress with status indicators
- Identify repositories with the highest security risks

## Development

### Backend Development
```bash
cd plugins/sourcecontrol-trends-backend
yarn install
yarn start
```

### Frontend Development
```bash
cd plugins/sourcecontrol-trends-frontend
yarn install
yarn start
```

### Testing
```bash
# Run backend tests
cd plugins/sourcecontrol-trends-backend
yarn test

# Run frontend tests
cd plugins/sourcecontrol-trends-frontend
yarn test
```

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limits**
   - Monitor rate limits in the data refresh logs
   - Consider using a GitHub App for higher rate limits
   - Adjust refresh frequency if needed

2. **Database Connection Issues**
   - Ensure database is properly configured
   - Check migration status
   - Verify database permissions

3. **Missing Data**
   - Trigger manual data refresh
   - Check GitHub token permissions
   - Review data refresh logs for errors

### Logs and Monitoring
- Backend logs: Check data ingestion and API performance
- Database logs: Monitor query performance and errors
- Frontend console: Debug UI issues and API responses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Open an issue with detailed reproduction steps

## License

This plugin is part of the internal Backstage ecosystem and follows the same licensing terms as the main Backstage installation.
