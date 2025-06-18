# GitHub Contributors Plugin Troubleshooting

## Common Issues and Solutions

### 401 Unauthorized Error

**Problem:** GitHub API returns a 401 Unauthorized error when trying to access GitHub data.

**Possible Solutions:**

1. **GitHub Authentication Issues**:
   - You're not signed in to Backstage with GitHub
   - Your Backstage session has expired
   - The GitHub Auth API is not properly configured

2. **Fix**:
   - Sign in to Backstage using GitHub authentication
   - Make sure GitHub OAuth is properly configured in your app-config.yaml:
     ```yaml
     auth:
       environment: development
       providers:
         github:
           development:
             clientId: ${GITHUB_CLIENT_ID}
             clientSecret: ${GITHUB_CLIENT_SECRET}
     ```
   - Check that your GitHub OAuth app has the correct scopes (needs `repo` scope)
   - If using a GitHub App instead of OAuth, ensure it has the necessary permissions

3. **Legacy Token Fallback**:
   - While the plugin now uses Backstage's auth system instead of directly reading tokens, 
     you can still set a token as an environment variable as a fallback mechanism:
   - Generate a token at https://github.com/settings/tokens with the `repo` scope
   - Set the token as an environment variable: `export GITHUB_TOKEN=your_token_here`

### Unable to Find GitHub Organization

**Problem:** The plugin can't find repositories because it can't identify the correct GitHub organization.

**Possible Solutions:**
1. **Configuration Issues**:
   - Organization names are not properly configured
   - Case sensitivity issues with organization names

2. **Fix**:
   - Specify your organization names in app-config.yaml:
     ```yaml
     integrations:
       github:
         - host: github.com
           # Token is not required here since we use githubAuthApi
           organizations:
             - YourOrgName
     ```
   - Or set as an environment variable: `export GITHUB_ORGANIZATIONS=YourOrgName`

### User Authentication Problems

**Problem:** The plugin can't determine the current GitHub user.

**Possible Solutions:**
1. **Identity Resolution**:
   - The plugin now tries to determine your GitHub username in the following order:
     1. From GitHub authentication (via githubAuthApi)
     2. From your Backstage identity
     3. From your email address (as a fallback)
     4. Falls back to "unknown-user" as a last resort

2. **Fix**:
   - Sign in to Backstage with GitHub authentication (preferred method)
   - Manually specify GitHub username: `export GITHUB_USERNAME=your_username`
   - Check your Backstage identity configuration

## Using the API Validation Tool

The plugin includes an API validation tool to help diagnose connection issues:

```typescript
const githubApi = useGitHubContributorsApi();
const validationResult = await githubApi.validateApiConfig();
console.log(validationResult);
```

This will provide information about:
- Authentication status
- Current user detection
- Organization configuration
- API connectivity

## Environment Variables

While the plugin now primarily uses Backstage's GitHub authentication, it still supports these environment variables as fallbacks:

- `GITHUB_TOKEN`: Your GitHub personal access token (legacy method)
- `GITHUB_USERNAME`: Your GitHub username (optional)
- `GITHUB_ORGANIZATIONS`: Comma-separated list of GitHub organizations (optional)

Use the provided `setup-github-env.sh` script to easily set these variables:

```bash
source scripts/setup-github-env.sh your_token YourOrgName
```

## Client-Side Debugging

To see detailed logs of the authentication process, open your browser's developer console while using the plugin. The plugin logs each step of the authentication and API request processes to help with debugging.
