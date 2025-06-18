# GitHub Repositories Contributors Plugin

A Backstage plugin that displays GitHub repository information and pull requests for a user, providing insights into their contributions and collaboration activities.

## Features

- **Repository Contributions**: View repositories you contribute to
- **Pull Request Management**: See your open pull requests across all repositories
- **Review Queue**: View pull requests that need your review
- **Homepage Integration**: Customizable UI components for the Backstage homepage
- **Real-time Data**: Live data from GitHub API with authentication support

## Installation

### 1. Install the Plugin

Add the plugin to your Backstage application:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @internal/plugin-github-repositories-contributors
```

### 2. Add to Frontend App

Add the plugin to your app's plugin configuration:

```typescript
// packages/app/src/plugins.ts
export { githubRepositoriesContributorsPlugin } from '@internal/plugin-github-repositories-contributors';
```

### 3. Configure in App.tsx

Import and configure the plugin in your main app file:

```typescript
// packages/app/src/App.tsx
import { createApp } from '@backstage/app-defaults';
import { githubAuthApiRef } from '@backstage/core-plugin-api';

const app = createApp({
  apis: [
    // ... other APIs
  ],
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        auto
        provider={{
          id: 'github-auth-provider',
          title: 'GitHub',
          message: 'Sign in using GitHub',
          apiRef: githubAuthApiRef,
        }}
      />
    ),
  },
  // ... other configurations
});
```

## Configuration

### GitHub Authentication Setup

This plugin uses Backstage's built-in GitHub authentication system for secure API access. The plugin will:

1. **Automatic Token Retrieval**: Automatically retrieve the GitHub access token from the current user's session via `githubAuthApi`
2. **Authenticated Requests**: Use this token for all GitHub API requests to access private repositories and avoid rate limiting
3. **Graceful Fallback**: Fall back to unauthenticated requests if no token is available (subject to GitHub's rate limiting)

### Step 1: Configure GitHub OAuth

Add GitHub OAuth configuration to your `app-config.yaml`:

```yaml
# app-config.yaml
auth:
  environment: development
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
        ## uncomment if using GitHub Enterprise
        # enterpriseInstanceUrl: ${GITHUB_URL}

integrations:
  github:
    - host: github.com
      ## uncomment if using GitHub Enterprise
      # host: your-github-enterprise.com
      ## Optional: specify organizations to limit access
      # organizations:
      #   - your-org-name
```

### Step 2: Set Environment Variables

Create a `.env` file in your Backstage root directory:

```bash
# .env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 3: GitHub App Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - **Application name**: Your Backstage App
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:7007/api/auth/github/handler/frame`
3. Copy the Client ID and Client Secret to your environment variables

> **Important**: The GitHub access token used by this plugin should have the `repo` scope to access private repositories and pull request data.

## Usage

### Homepage Integration

Add the plugin components to your Backstage homepage:

```tsx
// packages/app/src/components/home/HomePage.tsx
import { Grid } from '@material-ui/core';
import {
  MyPullRequestsCard,
  ActionRequiredPullRequestsCard,
  ContributorRepositoriesCard,
} from '@internal/plugin-github-repositories-contributors';

export const homePage = (
  <Page themeId="home">
    <Header title="Welcome to Backstage" />
    <Content>
      <Grid container spacing={3}>
        {/* Your Pull Requests */}
        <Grid item xs={12} md={4}>
          <MyPullRequestsCard />
        </Grid>
        
        {/* Pull Requests Requiring Your Review */}
        <Grid item xs={12} md={4}>
          <ActionRequiredPullRequestsCard />
        </Grid>
        
        {/* Repositories You Contribute To */}
        <Grid item xs={12} md={6}>
          <ContributorRepositoriesCard />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
```

### Available Components

- **`MyPullRequestsCard`**: Displays your open pull requests across all repositories
- **`ActionRequiredPullRequestsCard`**: Shows pull requests that need your review
- **`ContributorRepositoriesCard`**: Lists repositories you contribute to with activity metrics

## API Reference

The plugin exposes the following components for integration:

```typescript
import {
  MyPullRequestsCard,
  ActionRequiredPullRequestsCard,
  ContributorRepositoriesCard,
  githubRepositoriesContributorsPlugin,
} from '@internal/plugin-github-repositories-contributors';
```

## Advanced Configuration

### Custom GitHub Enterprise

For GitHub Enterprise installations:

```yaml
# app-config.yaml
integrations:
  github:
    - host: your-github-enterprise.com
      apiBaseUrl: https://your-github-enterprise.com/api/v3
      rawBaseUrl: https://your-github-enterprise.com/raw
```

### Rate Limiting

The plugin automatically handles GitHub API rate limiting by:
- Using authenticated requests when possible
- Implementing exponential backoff for rate-limited requests
- Caching responses to reduce API calls

## Troubleshooting

### Common Issues

**Authentication Errors**
- Ensure GitHub OAuth is properly configured in `app-config.yaml`
- Verify environment variables are set correctly
- Check that the GitHub OAuth app callback URL matches your setup

**Missing Pull Requests**
- Verify the user has the necessary permissions to access repositories
- Ensure the GitHub token has the `repo` scope
- Check organization access permissions

**Rate Limiting**
- Use authenticated requests to increase rate limits
- Consider implementing caching for frequently accessed data
- Monitor API usage in GitHub settings

### Debug Mode

Enable debug logging by setting:

```yaml
# app-config.yaml
backend:
  plugins:
    github-repositories-contributors:
      debug: true
```

## Development

### Local Development

You can serve the plugin in isolation:

```bash
# From the plugin directory
cd plugins/github-repositories-contributors
yarn start
```

This provides faster iteration during development with hot reloads.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This plugin is licensed under the Apache License 2.0.
