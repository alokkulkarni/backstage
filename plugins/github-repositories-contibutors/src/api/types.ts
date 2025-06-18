/**
 * Types for GitHub API responses
 */

export interface PullRequestData {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  repository_name: string;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  requested_reviewers?: Array<{
    login: string;
    avatar_url: string;
    html_url: string;
  }>;
}

export interface RepositoryData {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  contributors_url: string;
  contributors?: Array<{
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
  }>;
  last_committer?: {
    login: string;
    avatar_url: string;
    html_url: string;
    date: string;
  };
}

export interface GitHubContributorsApi {
  getMyPullRequests(): Promise<PullRequestData[]>;
  getActionRequiredPullRequests(): Promise<PullRequestData[]>;
  getContributorRepositories(): Promise<RepositoryData[]>;
  getOrganizationName(): string | undefined;
  getCurrentUser(): string | undefined;
  reinitialize(): Promise<void>;
  validateApiConfig(): Promise<{ isValid: boolean; status: string; details?: string }>;
}
