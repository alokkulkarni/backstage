import { ConfigApi, IdentityApi } from '@backstage/core-plugin-api';
import { GitHubContributorsApi, PullRequestData, RepositoryData } from './types';

/**
 * Options for the GitHubContributorsApiClient.
 */
export interface GitHubContributorsApiClientOptions {
  configApi: ConfigApi;
  identityApi: IdentityApi;
}

/**
 * API Client for GitHub Contributors.
 * Handles communication with GitHub API and provides methods to fetch 
 * pull requests and repository data.
 */
export declare class GitHubContributorsApiClient implements GitHubContributorsApi {
  constructor(options: GitHubContributorsApiClientOptions);
  
  /**
   * Get pull requests authored by the current user.
   */
  getMyPullRequests(): Promise<PullRequestData[]>;

  /**
   * Get pull requests that need attention from the current user.
   */
  getActionRequiredPullRequests(): Promise<PullRequestData[]>;

  /**
   * Get repositories contributed to by the current user.
   */
  getContributorRepositories(): Promise<RepositoryData[]>;

  /**
   * Get the organization name used for API queries.
   */
  getOrganizationName(): string | undefined;

  /**
   * Get the current GitHub username.
   */
  getCurrentUser(): string | undefined;
  
  /**
   * Reinitialize the client (reset token, organization, user info)
   */
  reinitialize(): Promise<void>;
  
  /**
   * Validate the API client configuration by performing a simple GitHub API call
   * @returns A validation result object with status and details
   */
  validateApiConfig(): Promise<{ isValid: boolean; status: string; details?: string }>;
}
