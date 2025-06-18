# Jira Plugin for Backstage

A powerful Backstage plugin that seamlessly integrates Atlassian Jira with your developer portal, enabling teams to view, manage, and track their Jira issues directly from Backstage without leaving their development workflow.

## Features

- **Issue Management**: View all issues assigned to you in Jira with real-time updates
- **Project Organization**: Group issues by project, issue type, and status
- **Issue Creation**: Create new issues directly from Backstage with customizable templates
- **Status Updates**: Update issue status and assignee without leaving Backstage
- **Comment Management**: Add comments and collaborate on issues
- **Advanced Filtering**: Use JQL (Jira Query Language) for complex issue searches
- **Entity Integration**: Link Jira issues to Backstage entities (services, components)
- **Dashboard Views**: Multiple pre-configured views for different team needs
- **Bulk Operations**: Perform bulk actions on multiple issues

## Installation

### 1. Install the Plugin

Add the plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-jira-plugin
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { jiraPlugin } from '@internal/plugin-jira-plugin';
```

### 3. Configure in App.tsx

Import and configure the plugin in your main app file:

```typescript
// packages/app/src/App.tsx
import { Route } from 'react-router';
import { JiraPluginWrapper } from '@internal/plugin-jira-plugin';

// Add to your app routes if you want a dedicated page
const routes = (
  <FlatRoutes>
    {/* ...existing routes... */}
    <Route path="/jira" element={<JiraPluginWrapper />} />
  </FlatRoutes>
);
```

## Configuration

### Step 1: Jira API Token Setup

1. **Login to Jira** → Go to your Jira instance
2. **Account Settings** → Click on your profile → Account Settings
3. **Security** → Navigate to Security tab
4. **API Tokens** → Click "Create API token"
5. **Generate Token** → Provide a label and create the token
6. **Copy Token** → Save the generated token securely

### Step 2: App Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# app-config.yaml
proxy:
  endpoints:
    '/jira/api':
      target: ${JIRA_BASE_URL}
      changeOrigin: true
      allowedHeaders: 
        - 'Authorization'
        - 'Content-Type' 
        - 'Accept'
        - 'X-Atlassian-Token'
        - 'User-Agent'
      headers:
        Authorization: "Basic ${JIRA_AUTH_TOKEN}"
        Accept: 'application/json'
        Content-Type: 'application/json'
        X-Atlassian-Token: 'nocheck'
        User-Agent: "Backstage"

jira:
  annotationPrefix: jira
  changeOrigin: true
  proxy-paths:
    - /jira/api
  instances:
    - name: default
      baseUrl: ${JIRA_BASE_URL}
      apiToken: "${JIRA_API_TOKEN}"
      email: "${JIRA_USERNAME}"
      # Default filters for quick access
      defaultFilters:
        - name: 'My Issues'
          shortName: 'Assigned'
          query: 'assignee = currentUser() ORDER BY updated DESC'
        - name: 'Recently Updated'
          shortName: 'Recent'
          query: 'updated >= -7d ORDER BY updated DESC'
        - name: 'In Progress'
          shortName: 'Active'
          query: 'assignee = currentUser() AND status = "In Progress" ORDER BY updated DESC'
      # Custom fields mapping (optional)
      customFields:
        epicLink: 'customfield_10014'
        storyPoints: 'customfield_10016'
        sprint: 'customfield_10020'
```

### Step 3: Environment Variables

Set up the required environment variables:

```bash
# .env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your_generated_api_token
JIRA_AUTH_TOKEN=$(echo -n "$JIRA_USERNAME:$JIRA_API_TOKEN" | base64)
```

### Step 4: Alternative Setup Script

Use the provided setup script for easier configuration:

```bash
# From your Backstage root directory
chmod +x scripts/setup-jira-credentials.sh
./scripts/setup-jira-credentials.sh
```

This script will guide you through the setup process and generate the required environment variables.

## Usage

### Homepage Integration

Add Jira components to your Backstage homepage:

```tsx
// packages/app/src/components/home/HomePage.tsx
import { Grid } from '@material-ui/core';
import { JiraPluginWrapper, JiraIssueCard } from '@internal/plugin-jira-plugin';

export const homePage = (
  <Page themeId="home">
    <Header title="Welcome to Backstage" />
    <Content>
      <Grid container spacing={3}>
        {/* Main Jira Plugin Component */}
        <Grid item xs={12} md={8}>
          <InfoCard title="My Jira Tasks">
            <JiraPluginWrapper />
          </InfoCard>
        </Grid>
        
        {/* Quick Issue Card */}
        <Grid item xs={12} md={4}>
          <JiraIssueCard filter="assignee = currentUser() AND status != Done" />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
```

### Entity Integration

Link Jira projects to your Backstage entities:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Link to a specific Jira project
    jira.io/project-key: "MYPROJ"
    # Link to specific issues
    jira.io/filter-id: "12345"
    # Custom JQL query
    jira.io/query: "project = MYPROJ AND component = backend"
spec:
  type: service
  lifecycle: production
```

### Available Components

- **`JiraPluginWrapper`**: Main plugin component with full functionality
- **`JiraIssueCard`**: Compact card showing filtered issues
- **`JiraCreateIssue`**: Component for creating new issues
- **`JiraIssueList`**: Customizable list of issues with filtering

## Advanced Configuration

### Multiple Jira Instances

Configure multiple Jira instances:

```yaml
# app-config.yaml
jira:
  instances:
    - name: production
      baseUrl: https://company.atlassian.net
      apiToken: "${JIRA_PROD_API_TOKEN}"
      email: "${JIRA_PROD_USERNAME}"
    - name: staging
      baseUrl: https://company-staging.atlassian.net
      apiToken: "${JIRA_STAGING_API_TOKEN}"
      email: "${JIRA_STAGING_USERNAME}"
```

### Custom Issue Templates

Define custom issue templates:

```yaml
# app-config.yaml
jira:
  instances:
    - name: default
      # ... other config
      issueTemplates:
        - name: "Bug Report"
          issueType: "Bug"
          fields:
            priority: "High"
            labels: ["bug", "backstage"]
        - name: "Feature Request"
          issueType: "Story"
          fields:
            labels: ["enhancement", "feature"]
```

### Performance Optimization

Configure caching and performance settings:

```yaml
# app-config.yaml
jira:
  cache:
    # Cache duration for issue data (in seconds)
    issuesTtl: 300
    # Cache duration for project data (in seconds)
    projectsTtl: 3600
    # Maximum number of issues to fetch per request
    maxResults: 100
```

## API Reference

The plugin exposes the following components and APIs:

```typescript
import {
  jiraPlugin,
  JiraPluginWrapper,
  JiraIssueCard,
  JiraCreateIssue,
  JiraIssueList,
  jiraApiRef,
  type JiraApi,
  type JiraIssue,
  type JiraProject,
  type JiraIssueType
} from '@internal/plugin-jira-plugin';
```

### Custom Component Example

```tsx
import React from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { jiraApiRef } from '@internal/plugin-jira-plugin';

const MyCustomJiraComponent = () => {
  const jiraApi = useApi(jiraApiRef);
  
  const fetchMyIssues = async () => {
    const issues = await jiraApi.getIssues({
      jql: 'assignee = currentUser() AND status != Done',
      maxResults: 50
    });
    return issues;
  };
  
  // ... component implementation
};
```

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify your Jira API token is valid and not expired
- Check that the email address matches your Jira account
- Ensure the base64 encoding of credentials is correct

**Connection Errors**
- Verify the Jira base URL is correct and accessible
- Check network connectivity and firewall settings
- Ensure CORS headers are properly configured

**Permission Errors**
- Verify the Jira user has necessary project permissions
- Check that the user can access the projects and issues
- Ensure API access is enabled for the user account

**Proxy Configuration Issues**
- Verify proxy endpoints are correctly configured
- Check that all required headers are allowed
- Ensure the proxy target URL matches your Jira instance

### Debug Mode

Enable detailed logging for troubleshooting:

```yaml
# app-config.yaml
backend:
  plugins:
    jira-plugin:
      debug: true
      logLevel: debug
```

### Health Check

Test your Jira connection:

```bash
# Test API connection
curl -u "your-email:your-api-token" \
  "https://your-company.atlassian.net/rest/api/3/myself"
```

### Quick Restart Script

Use the provided restart script for development:

```bash
# From your Backstage root directory
chmod +x restart-jira.sh
./restart-jira.sh
```

## Development

### Local Development

Run the plugin in isolation for development:

```bash
# From the plugin directory
cd plugins/jira-plugin
yarn start
```

This provides faster iteration with hot reloads.

### Testing

Run tests for the plugin:

```bash
# Unit tests
yarn test

# Integration tests with Jira
yarn test:integration
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper tests
4. Update documentation
5. Submit a pull request

## Best Practices

### Security
- Never commit API tokens to version control
- Use environment variables for sensitive data
- Regularly rotate API tokens
- Limit API token permissions in Jira

### Performance
- Use appropriate cache settings for your workload
- Implement pagination for large result sets
- Consider rate limiting for heavy usage
- Monitor API usage in Jira admin console

### User Experience
- Configure meaningful default filters
- Provide clear error messages
- Implement loading states for better UX
- Use appropriate refresh intervals

## License

This plugin is licensed under the Apache License 2.0.
