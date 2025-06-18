# GitHub Repositories Contributors Plugin - Authentication Fix

This document outlines the changes needed to fix the GitHub API authentication issues in the GitHub Repositories Contributors plugin.

## Issue Summary

The GitHub Repositories Contributors plugin is currently experiencing authentication issues when making GitHub API calls:

1. The plugin attempts to find GitHub tokens from various sources, but doesn't properly use Backstage's GitHub authentication system
2. This leads to 401 Unauthorized errors or rate limiting when calling GitHub APIs
3. There's an infinite loop issue in the initialization logic that can exacerbate the rate limiting

## Solution

The solution is to modify the plugin to use Backstage's built-in GitHub authentication system (`githubAuthApiRef`) just like how the Ephemeral Environments plugin does it:

1. Replace the complex token determination logic with the simple `githubAuthApi.getAccessToken(['repo'])` call
2. Fix the initialization sequence to prevent infinite loops
3. Add proper error handling via ErrorApi
4. Use promises correctly to manage async initialization

## Implementation Steps

### 1. Update the API Client Dependencies

Modify the plugin.ts file to include `githubAuthApiRef` and `errorApiRef` in the API factory:

```typescript
// In plugin.ts
import {
  createPlugin,
  createRoutableExtension,
  createComponentExtension,
  configApiRef,
  identityApiRef,
  createApiFactory,
  githubAuthApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';

// ...

export const githubRepositoriesContibutorsPlugin = createPlugin({
  id: 'github-repositories-contibutors',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: githubContributorsApiRef,
      deps: { 
        configApi: configApiRef, 
        identityApi: identityApiRef,
        githubAuthApi: githubAuthApiRef,
        errorApi: errorApiRef,
      },
      factory: ({ configApi, identityApi, githubAuthApi, errorApi }) => {
        console.log('Creating GitHub Contributors API client from plugin.ts');
        return new GitHubContributorsApiClient({ 
          configApi, 
          identityApi, 
          githubAuthApi,
          errorApi,
        });
      },
    }),
  ],
});
```

### 2. Update the API Client Interface and Implementation

Modify the GitHubContributorsApiClient.ts file:

```typescript
// At the top of GitHubContributorsApiClient.ts
import {
  ConfigApi,
  IdentityApi,
  githubAuthApiRef,
  type GithubAuth,
  type ErrorApi,
} from '@backstage/core-plugin-api';

// Update the client options interface
interface GitHubContributorsApiClientOptions {
  configApi: ConfigApi;
  identityApi: IdentityApi;
  githubAuthApi: GithubAuth;
  errorApi: ErrorApi;
}

// Update the client class
export class GitHubContributorsApiClient implements GitHubContributorsApi {
  private configApi: ConfigApi;
  private identityApi: IdentityApi;
  private githubAuthApi: GithubAuth;
  private errorApi: ErrorApi;
  private octokit: Octokit | undefined;
  private organizationNames: string[] = [];
  private currentUser: string | undefined;
  private initialized: boolean = false;
  private initializePromise: Promise<void> | undefined;

  constructor(options: GitHubContributorsApiClientOptions) {
    this.configApi = options.configApi;
    this.identityApi = options.identityApi;
    this.githubAuthApi = options.githubAuthApi;
    this.errorApi = options.errorApi;
    
    // Initialize the client on construction (runs asynchronously)
    this.initialize().catch(error => {
      console.error('Failed to initialize GitHub Contributors API client on construction', error);
      this.errorApi.post(error);
    });
  }
  
  // ... other methods ...
}
```

### 3. Update the Initialization Logic

Replace the complex token determination and octokit initialization with:

```typescript
private async _doInitialize(): Promise<void> {
  try {
    console.log('Initializing GitHub Contributors API client');
    
    // Get GitHub token using Backstage's GitHub Auth API
    try {
      console.log('Getting GitHub token via backstage GitHubAuth');
      const token = await this.githubAuthApi.getAccessToken(['repo']);
      
      // Create new Octokit instance with the token
      console.log('Creating Octokit instance with auth token');
      this.octokit = new Octokit({
        auth: token,
        request: {
          timeout: 10000, // 10 seconds timeout
        }
      });
    } catch (authError) {
      console.error('Failed to get GitHub token via GitHubAuth', authError);
      this.errorApi.post(new Error(`Failed to get GitHub token: ${authError}`));
      
      // Create an unauthenticated Octokit instance as fallback
      console.log('Creating unauthenticated Octokit instance');
      this.octokit = new Octokit({
        request: {
          timeout: 10000, // 10 seconds timeout
        }
      });
    }
    
    // Get the current user
    await this.determineCurrentUser();
    
    // Get the organization names
    await this.determineOrganizationNames();
  } catch (error) {
    console.error('Error in GitHubContributorsApiClient initialization', error);
    this.errorApi.post(new Error(`GitHubContributorsApiClient initialization error: ${error}`));
    throw error;
  }
}
```

### 4. Fix the Initialize Method to Prevent Infinite Loops

```typescript
private async initialize(): Promise<void> {
  // If already initializing, wait for the existing promise
  if (this.initializePromise) {
    await this.initializePromise;
    return;
  }
  
  // If already initialized, return immediately
  if (this.initialized) {
    console.log('GitHub Contributors API client already initialized');
    return;
  }

  // Create a new initialization promise
  this.initializePromise = this._doInitialize();
  
  try {
    // Wait for initialization to complete
    await this.initializePromise;
    this.initialized = true;
  } catch (error) {
    // Reset initialization state on failure
    this.initialized = false;
    this.initializePromise = undefined;
    console.error('Error initializing GitHub Contributors API client', error);
    this.errorApi.post(new Error(`Failed to initialize GitHub Contributors API: ${error}`));
    throw error;
  }
}
```

## Testing the Changes

After implementing these changes:

1. Start the Backstage server: `yarn start`
2. Log in to Backstage with GitHub authentication
3. Navigate to a page that uses the GitHub Repositories Contributors plugin cards
4. Check the browser console for any errors
5. Verify that GitHub API requests succeed (should see repository data and pull requests)

The plugin should now properly use Backstage's GitHub authentication to make API calls, fixing the 401 Unauthorized errors and rate limiting issues.

## Complete Files

The complete implementations of the updated files are available in:
- `/Users/alokkulkarni/Documents/Development/platformengineering/updatedbackstage/fixed-github-contributors-plugin.ts` 
- `/Users/alokkulkarni/Documents/Development/platformengineering/updatedbackstage/fixed-github-contributors-api-client.ts`

You can use these as references to update the actual files in the plugin directory.
