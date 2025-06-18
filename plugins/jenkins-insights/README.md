# Jenkins Insights Plugin

A comprehensive Backstage plugin that provides deep insights into Jenkins CI/CD pipeline activities, build statuses, and performance metrics. This plugin helps development teams monitor their continuous integration pipelines directly from Backstage.

## Features

- **Pipeline Overview**: View all Jenkins jobs and their current status
- **Build History**: Access detailed build history with success/failure rates
- **Real-time Monitoring**: Live updates on build progress and queue status
- **Failure Analysis**: Detailed failure analysis with console logs and error details
- **Performance Metrics**: Build duration trends and performance insights
- **Test Results**: Integration with Jenkins test reporting
- **Artifacts Management**: Access to build artifacts and deployment packages
- **Homepage Integration**: Customizable cards for Backstage homepage

## Installation

### 1. Install the Plugin

Add the plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-jenkins-insights
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { jenkinsInsightsPlugin } from '@internal/plugin-jenkins-insights';
```

### 3. Configure in App.tsx

Import and add the plugin route to your main app file:

```typescript
// packages/app/src/App.tsx
import { Route } from 'react-router';
import { JenkinsInsightsPage } from '@internal/plugin-jenkins-insights';

// Add to your app routes
const routes = (
  <FlatRoutes>
    {/* ...existing routes... */}
    <Route path="/jenkins-insights" element={<JenkinsInsightsPage />} />
  </FlatRoutes>
);
```

### 4. Add to Navigation (Optional)

Add Jenkins Insights to your sidebar navigation:

```typescript
// packages/app/src/components/Root/Root.tsx
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';
import BuildIcon from '@material-ui/icons/Build';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ...existing items... */}
      <SidebarItem icon={BuildIcon} to="jenkins-insights" text="Jenkins" />
    </Sidebar>
    {children}
  </SidebarPage>
);
```

## Configuration

### Jenkins Server Setup

Configure your Jenkins server connection in `app-config.yaml`:

```yaml
# app-config.yaml
jenkins:
  servers:
    - name: default
      baseUrl: ${JENKINS_BASE_URL}
      username: ${JENKINS_USERNAME}
      apiKey: ${JENKINS_API_KEY}
      # Optional: For Jenkins with CSRF protection enabled
      crumbIssuer: true
      # Optional: For self-signed certificates
      skipTlsVerify: false

# Alternative configuration for multiple Jenkins servers
jenkins:
  servers:
    - name: production
      baseUrl: https://jenkins-prod.example.com
      username: ${JENKINS_PROD_USERNAME}
      apiKey: ${JENKINS_PROD_API_KEY}
    - name: staging
      baseUrl: https://jenkins-staging.example.com
      username: ${JENKINS_STAGING_USERNAME}
      apiKey: ${JENKINS_STAGING_API_KEY}
```

### Environment Variables

Set up the required environment variables:

```bash
# .env
JENKINS_BASE_URL=https://your-jenkins-server.com
JENKINS_USERNAME=your_jenkins_username
JENKINS_API_KEY=your_jenkins_api_key
```

### Jenkins API Key Setup

1. **Login to Jenkins** → Go to your Jenkins server
2. **User Profile** → Click on your username in the top right
3. **Configure** → Click "Configure" in the left sidebar
4. **API Token** → Click "Add new Token" and generate a new API key
5. **Copy Token** → Save the generated token securely

> **Note**: The Jenkins user should have appropriate permissions to read job configurations, build history, and access console outputs.

## Usage

### Homepage Integration

Add Jenkins insights to your Backstage homepage:

```tsx
// packages/app/src/components/home/HomePage.tsx
import { Grid } from '@material-ui/core';
import { 
  JenkinsJobsCard,
  EnhancedJenkinsJobsCardComponent 
} from '@internal/plugin-jenkins-insights';

export const homePage = (
  <Page themeId="home">
    <Header title="Welcome to Backstage" />
    <Content>
      <Grid container spacing={3}>
        {/* Basic Jenkins Jobs Card */}
        <Grid item xs={12} md={6}>
          <JenkinsJobsCard />
        </Grid>
        
        {/* Enhanced Jenkins Jobs Card with more details */}
        <Grid item xs={12} md={6}>
          <EnhancedJenkinsJobsCardComponent />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
```

### Entity Integration

Add Jenkins information to your entity pages by configuring annotations:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    jenkins.io/job-full-name: "folder/my-service-pipeline"
    # Alternative: specify multiple jobs
    jenkins.io/jobs: "folder/my-service-build,folder/my-service-deploy"
spec:
  type: service
  lifecycle: production
```

### Available Components

- **`JenkinsJobsCard`**: Basic overview of Jenkins jobs and their status
- **`EnhancedJenkinsJobsCardComponent`**: Advanced card with build trends and detailed metrics
- **`JenkinsInsightsPage`**: Full-page Jenkins dashboard with comprehensive insights

## API Reference

The plugin exposes the following APIs and components:

```typescript
import {
  jenkinsInsightsPlugin,
  JenkinsInsightsPage,
  JenkinsJobsCard,
  jenkinsApiRef,
  createJenkinsApi,
  type JenkinsApi,
  type JenkinsJob,
  type JenkinsBuild,
  type JenkinsFailureDetails,
  type JenkinsBuildArtifact,
  type JenkinsConsoleOutput,
  type JenkinsTestCase
} from '@internal/plugin-jenkins-insights';
```

### API Usage

```typescript
// Using the Jenkins API in custom components
import { useApi } from '@backstage/core-plugin-api';
import { jenkinsApiRef } from '@internal/plugin-jenkins-insights';

const MyComponent = () => {
  const jenkinsApi = useApi(jenkinsApiRef);
  
  const fetchJobs = async () => {
    const jobs = await jenkinsApi.getJobs();
    // Process jobs data
  };
  
  const fetchBuild = async (jobName: string, buildNumber: number) => {
    const build = await jenkinsApi.getBuild(jobName, buildNumber);
    // Process build data
  };
};
```

## Advanced Configuration

### Custom Job Filtering

Configure job filtering and grouping:

```yaml
# app-config.yaml
jenkins:
  servers:
    - name: default
      baseUrl: ${JENKINS_BASE_URL}
      username: ${JENKINS_USERNAME}
      apiKey: ${JENKINS_API_KEY}
      # Filter jobs by regex pattern
      jobFilter: "^(frontend|backend|api).*"
      # Group jobs by folder structure
      groupByFolder: true
      # Exclude specific job types
      excludeJobTypes: ["maven2-moduleset"]
```

### Build Notification Webhooks

Set up webhooks for real-time build notifications:

```yaml
# app-config.yaml
jenkins:
  webhooks:
    enabled: true
    path: "/api/jenkins/webhooks"
    # Optional: Webhook authentication
    secret: ${JENKINS_WEBHOOK_SECRET}
```

### Performance Optimization

Configure caching and performance settings:

```yaml
# app-config.yaml
jenkins:
  cache:
    # Cache duration for job data (in seconds)
    jobsTtl: 300
    # Cache duration for build data (in seconds)
    buildsTtl: 600
    # Maximum number of builds to fetch per job
    maxBuildsPerJob: 50
```

## Troubleshooting

### Common Issues

**Connection Errors**
- Verify Jenkins server URL is accessible from Backstage backend
- Check firewall and network connectivity
- Ensure Jenkins is running and responsive

**Authentication Issues**
- Verify Jenkins username and API key are correct
- Check that the Jenkins user has necessary permissions
- Ensure API key hasn't expired

**Permission Errors**
- Grant the Jenkins user read access to jobs
- Ensure user can access build history and console logs
- Check folder-level permissions for organized jobs

**CSRF Protection Issues**
- Enable `crumbIssuer: true` in configuration
- Update Jenkins security settings if needed

### Debug Mode

Enable detailed logging for troubleshooting:

```yaml
# app-config.yaml
backend:
  plugins:
    jenkins-insights:
      debug: true
      logLevel: debug
```

### Health Check

Test your Jenkins connection:

```bash
# From your Backstage backend
curl -u "username:api_key" "https://your-jenkins-server.com/api/json"
```

## Development

### Local Development

Run the plugin in isolation for development:

```bash
# From the plugin directory
cd plugins/jenkins-insights
yarn start
```

This provides faster iteration with hot reloads and isolated testing.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Update documentation
5. Submit a pull request

### Testing

Run tests for the plugin:

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e
```

## License

This plugin is licensed under the Apache License 2.0.
