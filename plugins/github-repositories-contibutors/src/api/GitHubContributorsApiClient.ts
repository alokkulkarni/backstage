import {
  ConfigApi,
  IdentityApi,
  ErrorApi,
} from '@backstage/core-plugin-api';
import { Octokit } from '@octokit/rest';
import { GitHubContributorsApi, PullRequestData, RepositoryData } from './types';

/**
 * Options for the GitHubContributorsApiClient.
 */
interface GitHubContributorsApiClientOptions {
  configApi: ConfigApi;
  identityApi: IdentityApi;
  githubAuthApi: any;
  errorApi: ErrorApi;
}

/**
 * API Client for GitHub Contributors.
 * Handles communication with GitHub API and provides methods to fetch 
 * pull requests and repository data.
 */
export class GitHubContributorsApiClient implements GitHubContributorsApi {
  private configApi: ConfigApi;
  private identityApi: IdentityApi;
  private githubAuthApi: any;
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

  /**
   * Get pull requests authored by the current user.
   */
  async getMyPullRequests(): Promise<PullRequestData[]> {
    console.log('Client: getMyPullRequests called');
    return this.getPullRequests();
  }

  /**
   * Get pull requests that need attention from the current user.
   */
  async getActionRequiredPullRequests(): Promise<PullRequestData[]> {
    console.log('Client: getActionRequiredPullRequests called');
    await this.initialize();
    
    if (!this.octokit || !this.currentUser) {
      console.error('GitHub client not properly initialized for getActionRequiredPullRequests');
      return [];
    }
    
    try {
      // Create a minimal pull request structure that matches the expected interface
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `is:pr is:open review-requested:${this.currentUser}`,
        sort: 'updated',
        order: 'desc',
        per_page: 10,
      });
      
      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }
      
      console.log(`Found ${data.items.length} pull requests requiring review from ${this.currentUser}`);
      
      // Map the GitHub API response to the expected format
      return data.items.map((item: any) => {
        // Extract repository name from repository_url (Format: https://api.github.com/repos/owner/repo)
        const repoUrlParts = item.repository_url.split('/');
        const repoOwner = repoUrlParts[repoUrlParts.length - 2];
        const repoName = repoUrlParts[repoUrlParts.length - 1];
        const fullRepoName = `${repoOwner}/${repoName}`;
          
        return {
          id: item.id,
          number: item.number,
          title: item.title,
          state: item.state,
          html_url: item.html_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          repository_name: fullRepoName,
          author: {
            login: item.user.login,
            avatar_url: item.user.avatar_url,
            html_url: item.user.html_url,
          },
          requested_reviewers: item.requested_reviewers ? 
            item.requested_reviewers.map((reviewer: any) => ({
              login: reviewer.login,
              avatar_url: reviewer.avatar_url,
              html_url: reviewer.html_url,
            })) : [],
        };
      });
    } catch (error) {
      console.error('Error fetching action required pull requests', error);
      this.errorApi.post(new Error(`Failed to fetch action required pull requests: ${error}`));
      return [];
    }
  }

  /**
   * Get repositories contributed to by the current user.
   */
  async getContributorRepositories(): Promise<RepositoryData[]> {
    console.log('Client: getContributorRepositories called');
    
    try {
      await this.initialize();
    
      if (!this.octokit) {
        console.error('GitHub client not properly initialized: Octokit instance is missing');
        return [];
      }
      
      if (!this.currentUser) {
        console.error('GitHub client not properly initialized: current user is missing');
        console.log('Attempting to continue without a specific user');
      }
      
      try {
        let allRepositories: RepositoryData[] = [];
        let fetchAttemptSucceeded = false;
        
        // If we have organization names, try to fetch repositories from those organizations
        if (this.organizationNames.length > 0) {
          for (const orgName of this.organizationNames) {
            console.log(`Attempting to fetch repositories for: ${orgName}`);
            
            try {
              // First try as organization
              console.log(`Trying ${orgName} as organization`);
              const { data: orgRepos } = await this.octokit.repos.listForOrg({
                org: orgName,
                per_page: 30,
                sort: 'updated',
              });
              
              console.log(`Found ${orgRepos.length} repositories in organization ${orgName}`);
              fetchAttemptSucceeded = true;
              
              // Process and add to our collection
              const processedRepos = await this.processRepositoriesWithContributors(orgRepos);
              allRepositories = [...allRepositories, ...processedRepos];
              
            } catch (orgError: any) {
              console.warn(`${orgName} is not an organization or access denied. Trying as user...`);
              
              // If it fails as organization, try as user
              try {
                console.log(`Trying ${orgName} as user`);
                const { data: userRepos } = await this.octokit.repos.listForUser({
                  username: orgName,
                  per_page: 30,
                  sort: 'updated',
                });
                
                console.log(`Found ${userRepos.length} repositories for user ${orgName}`);
                fetchAttemptSucceeded = true;
                
                // Process and add to our collection
                const processedRepos = await this.processRepositoriesWithContributors(userRepos);
                allRepositories = [...allRepositories, ...processedRepos];
                
              } catch (userError: any) {
                console.error(`Failed to fetch repos for ${orgName} as both org and user:`, userError);
                // Don't post this error as it's a fallback attempt
              }
            }
          }
        }
        
        // If we still have no repositories or no organization was specified, 
        // fall back to current user's repositories
        if (allRepositories.length === 0 || !fetchAttemptSucceeded) {
          console.log(`Falling back to current user (${this.currentUser}) repositories`);
          return this.getRepositories();
        }
        
        return allRepositories;
      } catch (error) {
        console.error('Error fetching contributor repositories', error);
        this.errorApi.post(new Error(`Failed to fetch contributor repositories: ${error}`));
        // Try to give fallback results instead of empty array
        return this.getRepositories().catch(() => []);
      }
    } catch (error) {
      console.error('Error initializing GitHub client for getContributorRepositories', error);
      this.errorApi.post(new Error(`Failed to initialize GitHub client: ${error}`));
      return [];
    }
  }

  /**
   * Get the organization name used for API queries.
   */
  getOrganizationName(): string | undefined {
    console.log('Client: getOrganizationName called');
    if (this.organizationNames.length > 0) {
      return this.organizationNames[0];
    }
    return undefined;
  }

  /**
   * Get the current GitHub username.
   */
  getCurrentUser(): string | undefined {
    console.log('Client: getCurrentUser called');
    return this.currentUser;
  }
  
  /**
   * Reinitialize the client (reset token, organization, user info)
   */
  async reinitialize(): Promise<void> {
    console.log('Client: reinitialize called');
    this.initialized = false;
    this.initializePromise = undefined;
    await this.initialize();
  }
  
  /**
   * Validate the API client configuration by performing a simple GitHub API call
   * @returns A validation result object with status and details
   */
  async validateApiConfig(): Promise<{ isValid: boolean; status: string; details?: string }> {
    try {
      await this.initialize();
      
      if (!this.octokit) {
        return {
          isValid: false,
          status: 'GitHub API client not properly initialized',
          details: 'Octokit instance is missing'
        };
      }
      
      // Test GitHub API rate limit - this is a lightweight call that always works if authenticated
      const { data: rateLimit } = await this.octokit.rateLimit.get();
      
      const userStatus = this.currentUser
        ? `Current user: ${this.currentUser}`
        : 'No current user determined';
        
      const orgStatus = this.organizationNames.length > 0
        ? `Organizations: ${this.organizationNames.join(', ')}`
        : 'No organizations configured';
      
      return {
        isValid: true,
        status: 'GitHub API connection successful',
        details: `Rate limit: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}. ${userStatus}. ${orgStatus}`
      };
    } catch (error: any) {
      this.errorApi.post(new Error(`GitHub API validation failed: ${error?.message || 'Unknown error'}`));
      return {
        isValid: false,
        status: 'GitHub API connection failed',
        details: error?.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Initialize the client by determining the GitHub token, organization name, and current user.
   * This is called lazily when needed.
   */
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
  
  /**
   * Actual initialization logic
   */
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

  /**
   * Determine the current GitHub user based on the authenticated API
   */
  private async determineCurrentUser(): Promise<void> {
    if (!this.octokit) {
      console.error('Cannot determine current user without Octokit instance');
      return;
    }

    try {
      // Try to get the GitHub username from the authenticated GitHub API
      const { data } = await this.octokit.users.getAuthenticated();
      this.currentUser = data.login;
      console.log(`GitHub authenticated user found: ${this.currentUser}`);
      return;
    } catch (gitHubError: any) {
      console.warn(`Could not get authenticated GitHub user: ${gitHubError?.message || 'Unknown error'}`);
      this.errorApi.post(new Error(`Failed to get authenticated GitHub user: ${gitHubError?.message || 'Unknown error'}`));
      
      // Try to get user identity from Backstage
      try {
        const identity = await this.identityApi.getBackstageIdentity();
        if (identity && identity.userEntityRef) {
          // Parse username from entity reference (format: user:default/username)
          const entityParts = identity.userEntityRef.split('/');
          if (entityParts.length > 1) {
            this.currentUser = entityParts[entityParts.length - 1];
            console.log(`Using username from Backstage identity: ${this.currentUser}`);
            return;
          }
        }
        
        // Try to extract from profile info
        const profile = await this.identityApi.getProfileInfo();
        if (profile.email) {
          const emailUsername = profile.email.split('@')[0];
          this.currentUser = emailUsername;
          console.log(`Using email username as fallback GitHub user: ${this.currentUser}`);
          return;
        }
      } catch (identityError) {
        console.error('Error retrieving Backstage identity', identityError);
      }
      
      // Use a generic fallback user as last resort
      this.currentUser = 'unknown-user';
      console.warn(`Using default fallback GitHub user: ${this.currentUser}`);
    }
  }
  
  /**
   * Determine GitHub organization names from configuration
   */
  private async determineOrganizationNames(): Promise<void> {
    try {
      this.organizationNames = [];
      
      // Try to get organizations from GitHub integrations
      try {
        const githubIntegrations = this.configApi.getConfigArray('integrations.github');
        console.log(`Found ${githubIntegrations.length} GitHub integration(s) in config`);
        
        for (const integration of githubIntegrations) {
          if (integration.has('organizations')) {
            const orgs = integration.getStringArray('organizations');
            if (orgs && orgs.length > 0) {
              this.organizationNames.push(...orgs);
              console.log(`Found organizations in GitHub integrations: ${orgs.join(', ')}`);
            }
          }
        }
      } catch (integrationsError) {
        console.warn('Error processing GitHub integrations in config', integrationsError);
      }
      
      // If we have organizations from config, return
      if (this.organizationNames.length > 0) {
        console.log(`Using organization(s): ${this.organizationNames.join(', ')}`);
        return;
      }

      // Default to current user if no organizations are configured
      if (this.organizationNames.length === 0 && this.currentUser) {
        this.organizationNames.push(this.currentUser);
        console.log(`Defaulting to current user as organization: ${this.currentUser}`);
      }

      // If still no organizations, log a warning
      if (this.organizationNames.length === 0) {
        console.warn('No GitHub organizations found and no current user available');
      }
    } catch (error) {
      console.error('Error determining organization names', error);
      this.errorApi.post(new Error(`Failed to determine GitHub organizations: ${error}`));
    }
  }

  /**
   * Utility method used internally to fetch pull requests from GitHub
   */
  private async getPullRequests(): Promise<PullRequestData[]> {
    console.log('Client: getPullRequests called');
    await this.initialize();
    
    if (!this.octokit || !this.currentUser) {
      console.error('GitHub client not properly initialized for getPullRequests');
      return [];
    }
    
    try {
      // Create a minimal pull request structure that matches the expected interface
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `is:pr author:${this.currentUser} is:open`,
        sort: 'updated',
        order: 'desc',
        per_page: 10,
      });
      
      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }
      
      console.log(`Found ${data.items.length} pull requests for user ${this.currentUser}`);
      
      // Map the GitHub API response to the expected format
      return data.items.map((item: any) => {
        // Extract repository name from repository_url (Format: https://api.github.com/repos/owner/repo)
        const repoUrlParts = item.repository_url.split('/');
        const repoOwner = repoUrlParts[repoUrlParts.length - 2];
        const repoName = repoUrlParts[repoUrlParts.length - 1];
        const fullRepoName = `${repoOwner}/${repoName}`;
          
        return {
          id: item.id,
          number: item.number,
          title: item.title,
          state: item.state,
          html_url: item.html_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          repository_name: fullRepoName,
          author: {
            login: item.user.login,
            avatar_url: item.user.avatar_url,
            html_url: item.user.html_url,
          },
          requested_reviewers: [],
        };
      });
    } catch (error) {
      console.error('Error fetching pull requests', error);
      this.errorApi.post(new Error(`Failed to fetch pull requests: ${error}`));
      return [];
    }
  }

  /**
   * Utility method used internally to fetch repositories from GitHub
   */
  private async getRepositories(): Promise<RepositoryData[]> {
    console.log('Client: getRepositories called');
    await this.initialize();
    
    if (!this.octokit || !this.currentUser) {
      console.error('GitHub client not properly initialized for getRepositories');
      return [];
    }
    
    try {
      // Fetch repositories for the current user
      const { data: repos } = await this.octokit.repos.listForUser({
        username: this.currentUser,
        per_page: 30, // Increased to get more repos
        sort: 'updated',
      });
      
      if (!repos || !Array.isArray(repos)) {
        console.warn(`No repositories found for user ${this.currentUser}`);
        return [];
      }
      
      console.log(`Found ${repos.length} repositories for user ${this.currentUser}`);
      
      // Process repositories with contributors
      return await this.processRepositoriesWithContributors(repos);
    } catch (error) {
      console.error('Error fetching repositories', error);
      this.errorApi.post(new Error(`Failed to fetch repositories: ${error}`));
      return [];
    }
  }
  
  /**
   * Process repositories and fetch their contributor data
   */
  private async processRepositoriesWithContributors(repos: any[]): Promise<RepositoryData[]> {
    console.log(`Processing ${repos.length} repositories for contributor data`);
    const processedRepos = repos.map(repo => this.mapRepositoryData(repo));
    
    // Fetch contributors for each repository (limiting to avoid rate limits)
    const reposWithContributors = await Promise.all(
      processedRepos.slice(0, 10).map(async (repo) => { // Increased to 10 repos
        try {
          if (repo.full_name) {
            const [owner, repoName] = repo.full_name.split('/');
            console.log(`Fetching contributors for ${repo.full_name}`);
            
            const { data: contributors } = await this.octokit!.repos.listContributors({
              owner,
              repo: repoName,
              per_page: 10, // Increased to 10 contributors
            });
            
            console.log(`Found ${contributors.length} contributors for ${repo.full_name}`);
            
            const contributorData = contributors.map(contributor => ({
              login: contributor.login || '',
              avatar_url: contributor.avatar_url || '',
              html_url: contributor.html_url || '',
              contributions: contributor.contributions || 0,
            }));
            
            return {
              ...repo,
              contributors: contributorData,
            };
          }
        } catch (error) {
          console.warn(`Error fetching contributors for ${repo.full_name}:`, error);
          // Return repo with empty contributors instead of undefined
          return {
            ...repo,
            contributors: [],
          };
        }
        return {
          ...repo,
          contributors: [],
        };
      })
    );
    
    // Add the remaining repositories without contributor data
    const remainingRepos = processedRepos.slice(10).map(repo => ({
      ...repo,
      contributors: [],
    }));
    
    console.log(`Processed ${reposWithContributors.length} repos with contributor data, ${remainingRepos.length} without`);
    return [...reposWithContributors, ...remainingRepos];
  }
  
  /**
   * Map GitHub API repository data to our RepositoryData format
   */
  private mapRepositoryData = (repo: any): RepositoryData => {
    // Use explicit typing to avoid type compatibility issues
    return {
      id: repo.id,
      name: repo.name || '',
      full_name: repo.full_name || '',
      html_url: repo.html_url || '',
      description: repo.description || null,
      fork: repo.fork || false,
      created_at: repo.created_at || '',
      updated_at: repo.updated_at || '',
      pushed_at: repo.pushed_at || '',
      stargazers_count: repo.stargazers_count || 0,
      watchers_count: repo.watchers_count || 0,
      forks_count: repo.forks_count || 0,
      language: repo.language || null,
      default_branch: repo.default_branch || 'main',
      contributors_url: repo.contributors_url || '',
      contributors: [],
      last_committer: undefined,
    };
  }
}
