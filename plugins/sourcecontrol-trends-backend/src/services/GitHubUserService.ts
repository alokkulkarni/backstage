import { LoggerService, AuthService, HttpAuthService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { Octokit } from '@octokit/rest';

export interface GitHubUserInfo {
  username: string;
  email?: string;
  organizations: string[];
  repos: string[];
}

interface UserPrincipal {
  type: string;
  userEntityRef: string;
}

interface AuthCredentials {
  principal?: UserPrincipal;
}

export interface UserRepositoryAccess {
  userId: string;
  username: string;
  organizations: string[];
  accessibleRepositories: string[];
}

/**
 * Service to handle GitHub user authentication and organization discovery
 */
export class GitHubUserService {
  private logger: LoggerService;
  private httpAuth: HttpAuthService;
  private config: Config;
  private useMockData: boolean;
  private tokenCache: Map<string, { token: string; expires: number }> = new Map();

  constructor(options: {
    logger: LoggerService;
    auth: AuthService;
    httpAuth: HttpAuthService;
    config: Config;
  }) {
    this.logger = options.logger;
    // Note: auth service is available but currently not used
    this.httpAuth = options.httpAuth;
    this.config = options.config;
    this.useMockData = this.config.getOptionalBoolean('sourceControlTrends.useMockData') ?? false;
    
    if (this.useMockData) {
      this.logger.info('GitHubUserService initialized with MOCK DATA enabled');
    }
  }

  /**
   * Get GitHub user information from the authenticated request
   */
  async getUserInfoFromRequest(req: any): Promise<GitHubUserInfo | null> {
    // If mock data is enabled, return mock user info
    if (this.useMockData) {
      this.logger.debug('Returning mock user info as useMockData is enabled');
      return this.getMockUserInfo();
    }

    try {
      // Extract user identity from request
      const credentials = await this.httpAuth.credentials(req) as AuthCredentials;
      if (!credentials.principal || credentials.principal.type !== 'user') {
        this.logger.warn('No user principal found in request');
        return null;
      }

      const userEntityRef = credentials.principal.userEntityRef;
      this.logger.debug(`Processing user: ${userEntityRef}`);

      // Get GitHub token for the user
      const token = await this.getGitHubTokenForUser(userEntityRef);
      if (!token) {
        this.logger.warn(`No GitHub token found for user: ${userEntityRef}`);
        return null;
      }

      // Create Octokit instance with user's token
      const octokit = new Octokit({
        auth: token,
        request: { timeout: 10000 }
      });

      // Get user's GitHub information
      const { data: githubUser } = await octokit.users.getAuthenticated();
      
      // Get user's organizations
      const { data: orgs } = await octokit.orgs.listForAuthenticatedUser({
        per_page: 100
      });

      // Get user's repositories
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: 'updated',
        direction: 'desc'
      });

      const organizations = orgs.map(org => org.login);
      const repositoryIds = repos.map(repo => repo.id.toString());

      this.logger.info(`User ${githubUser.login} has access to ${organizations.length} organizations and ${repositoryIds.length} repositories`);

      return {
        username: githubUser.login,
        email: githubUser.email || undefined,
        organizations,
        repos: repositoryIds
      };

    } catch (error) {
      this.logger.error('Failed to get user info from request:', error as Error);
      return null;
    }
  }

  /**
   * Get user's accessible repositories based on their organizations
   */
  async getUserRepositoryAccess(userInfo: GitHubUserInfo): Promise<UserRepositoryAccess> {
    try {
      const accessibleRepositories: string[] = [];

      // Add user's own repositories
      accessibleRepositories.push(...userInfo.repos);

      // Get repositories from each organization the user belongs to
      for (const org of userInfo.organizations) {
        try {
          const orgRepos = await this.getOrganizationRepositories(org, userInfo.username);
          accessibleRepositories.push(...orgRepos);
        } catch (error) {
          this.logger.warn(`Failed to get repositories for organization ${org}:`, error as Error);
        }
      }

      // Remove duplicates
      const uniqueRepositories = [...new Set(accessibleRepositories)];

      return {
        userId: userInfo.username,
        username: userInfo.username,
        organizations: userInfo.organizations,
        accessibleRepositories: uniqueRepositories
      };

    } catch (error) {
      this.logger.error('Failed to get user repository access:', error as Error);
      throw error;
    }
  }

  /**
   * Get repositories for a specific organization
   */
  private async getOrganizationRepositories(org: string, username: string): Promise<string[]> {
    try {
      // Get cached or fresh token for the user
      const token = await this.getGitHubTokenForUser(`user:default/${username}`);
      if (!token) {
        return [];
      }

      const octokit = new Octokit({
        auth: token,
        request: { timeout: 10000 }
      });

      const { data: repos } = await octokit.repos.listForOrg({
        org,
        per_page: 100,
        type: 'all'
      });

      return repos.map(repo => repo.id.toString());

    } catch (error) {
      this.logger.error(`Failed to get repositories for organization ${org}:`, error as Error);
      return [];
    }
  }

  /**
   * Get GitHub token for a user (this would integrate with Backstage's auth system)
   * For now, this is a placeholder that would need to be implemented based on
   * your specific auth setup
   */
  private async getGitHubTokenForUser(userEntityRef: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.tokenCache.get(userEntityRef);
      if (cached && cached.expires > Date.now()) {
        return cached.token;
      }

      // In a real implementation, this would:
      // 1. Use the auth service to get user credentials
      // 2. Extract GitHub token from user's session or stored credentials
      // 3. Handle token refresh if needed
      
      // For now, fall back to configured token
      const token = this.config.getOptionalString('sourceControlTrends.github.token') ||
                   this.config.getOptionalString('integrations.github.0.token') ||
                   process.env.GITHUB_TOKEN;

      if (token) {
        // Cache for 1 hour
        this.tokenCache.set(userEntityRef, {
          token,
          expires: Date.now() + 3600000
        });
      }

      return token || null;

    } catch (error) {
      this.logger.error(`Failed to get GitHub token for user ${userEntityRef}:`, error as Error);
      return null;
    }
  }

  /**
   * Filter repositories by user's access
   */
  filterRepositoriesByUserAccess(
    repositories: any[],
    userAccess: UserRepositoryAccess
  ): any[] {
    if (!userAccess || userAccess.accessibleRepositories.length === 0) {
      return repositories;
    }

    return repositories.filter(repo => 
      userAccess.accessibleRepositories.includes(repo.id) ||
      userAccess.organizations.includes(repo.owner)
    );
  }

  /**
   * Get mock user info for testing when useMockData is enabled
   */
  getMockUserInfo(): GitHubUserInfo {
    return {
      username: 'alokkulkarni',
      email: 'kulkarni.alok@gmail.com',
      organizations: ['alokkulkarni', 'platformengineering'],
      repos: ['repo-1', 'repo-2', 'repo-3', 'repo-4']
    };
  }

  /**
   * Get user organizations from GitHub
   */
  async getUserOrganizations(userInfo: UserRepositoryAccess): Promise<string[]> {
    this.logger.debug('Getting user organizations', { user: userInfo.username });
    
    if (this.useMockData) {
      return ['alokkulkarni', 'virginmoney', 'platformteam'];
    }

    try {
      // For now, return the organizations from the user info
      // This can be expanded to make actual GitHub API calls
      return userInfo.organizations || [];
    } catch (error) {
      this.logger.error('Failed to get user organizations', error as Error);
      throw error;
    }
  }

  /**
   * Get repositories for an organization
   */
  async getRepositoriesForOrganization(userInfo: UserRepositoryAccess, organization: string): Promise<any[]> {
    this.logger.debug('Getting repositories for organization', { user: userInfo.username, organization });
    
    if (this.useMockData) {
      return [
        {
          id: 'repo-1',
          name: 'frontend-app',
          full_name: `${organization}/frontend-app`,
          owner: { login: organization },
          description: 'Frontend application',
          language: 'TypeScript',
          private: false,
          html_url: `https://github.com/${organization}/frontend-app`
        },
        {
          id: 'repo-2',
          name: 'backend-api',
          full_name: `${organization}/backend-api`,
          owner: { login: organization },
          description: 'Backend API service',
          language: 'Python',
          private: true,
          html_url: `https://github.com/${organization}/backend-api`
        }
      ];
    }

    try {
      // For now, return mock repositories
      // This can be expanded to make actual GitHub API calls
      return [];
    } catch (error) {
      this.logger.error('Failed to get repositories for organization', error as Error);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(userInfo: UserRepositoryAccess, owner: string, repo: string): Promise<any> {
    this.logger.debug('Getting repository info', { user: userInfo.username, owner, repo });
    
    if (this.useMockData) {
      return {
        id: 'repo-1',
        name: repo,
        full_name: `${owner}/${repo}`,
        owner: { login: owner },
        description: 'Mock repository for testing',
        language: 'TypeScript',
        private: false,
        html_url: `https://github.com/${owner}/${repo}`,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        stargazers_count: 42,
        forks_count: 8,
        open_issues_count: 3
      };
    }

    try {
      // For now, return mock repository info
      // This can be expanded to make actual GitHub API calls
      return {
        id: 'repo-1',
        name: repo,
        full_name: `${owner}/${repo}`,
        owner: { login: owner },
        description: 'Repository information',
        language: 'Unknown',
        private: false,
        html_url: `https://github.com/${owner}/${repo}`,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0
      };
    } catch (error) {
      this.logger.error('Failed to get repository info', error as Error);
      throw error;
    }
  }

  /**
   * Clear token cache (useful for testing or when tokens are revoked)
   */
  clearTokenCache(): void {
    this.tokenCache.clear();
  }
}
