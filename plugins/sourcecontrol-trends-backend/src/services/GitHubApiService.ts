import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import { 
  GitHubApiService as IGitHubApiService,
  GitHubRepositoryResponse,
  GitHubPullRequestResponse,
  GitHubVulnerabilityResponse
} from '../types';

export class GitHubApiService implements IGitHubApiService {
  private octokit: Octokit;
  private graphqlClient: any;
  private logger: LoggerService;
  private config: Config;

  constructor(config: Config, logger: LoggerService) {
    this.config = config;
    this.logger = logger;
    
    // Initialize GitHub API clients
    const token = this.getGitHubToken();
    this.octokit = new Octokit({
      auth: token,
      request: {
        timeout: 10000,
      },
    });
    
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
  }

  private getGitHubToken(): string {
    // Try to get token from integrations configuration (preferred)
    try {
      const integrations = this.config.getOptionalConfigArray('integrations.github');
      if (integrations && integrations.length > 0) {
        const token = integrations[0].getOptionalString('token');
        if (token) {
          this.logger.info('Using GitHub token from integrations.github configuration');
          return token;
        }
      }
    } catch (error) {
      this.logger.debug('Failed to read from integrations.github', { error: String(error) });
    }

    // Fallback to other config locations
    try {
      const token = this.config.getString('integrations.github.token');
      this.logger.info('Using GitHub token from integrations.github.token');
      return token;
    } catch (error) {
      this.logger.debug('Failed to read from integrations.github.token', { error: String(error) });
    }

    try {
      const token = this.config.getString('github.token');
      this.logger.info('Using GitHub token from github.token');
      return token;
    } catch (error) {
      this.logger.debug('Failed to read from github.token', { error: String(error) });
    }
        
    // Fallback to environment variable
    const envToken = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
    if (envToken) {
      this.logger.info('Using GitHub token from environment variable');
      return envToken;
    }
    
    this.logger.warn('No GitHub token found. API calls will be rate-limited.');
    return '';
  }

  async getRepositories(org?: string): Promise<GitHubRepositoryResponse[]> {
    try {
      let repositories: GitHubRepositoryResponse[] = [];

      if (org) {
        // Get repositories for a specific organization
        const { data } = await this.octokit.repos.listForOrg({
          org,
          type: 'all',
          sort: 'updated',
          per_page: 100,
        });
        repositories = data as GitHubRepositoryResponse[];
      } else {
        // Get repositories for the authenticated user
        const { data } = await this.octokit.repos.listForAuthenticatedUser({
          type: 'all',
          sort: 'updated',
          per_page: 100,
        });
        repositories = data as GitHubRepositoryResponse[];
      }

      this.logger.info(`Fetched ${repositories.length} repositories${org ? ` for org ${org}` : ''}`);
      return repositories;
    } catch (error) {
      this.logger.error(`Failed to fetch repositories${org ? ` for org ${org}` : ''}:`, error as Error);
      throw error;
    }
  }

  async getPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubPullRequestResponse[]> {
    try {
      const allPRs: GitHubPullRequestResponse[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const { data } = await this.octokit.pulls.list({
          owner,
          repo,
          state,
          sort: 'updated',
          direction: 'desc',
          per_page: perPage,
          page,
        });

        if (data.length === 0) break;

        // Enhance each PR with additional data
        const enhancedPRs = await Promise.all(
          data.map(async (pr) => {
            try {
              // Get detailed PR information including file changes
              const { data: detailedPR } = await this.octokit.pulls.get({
                owner,
                repo,
                pull_number: pr.number,
              });

              return {
                ...pr,
                additions: detailedPR.additions,
                deletions: detailedPR.deletions,
                changed_files: detailedPR.changed_files,
              } as unknown as GitHubPullRequestResponse;
            } catch (error) {
              this.logger.warn(`Failed to get detailed info for PR ${pr.number}:`, error as Error);
              return pr as unknown as GitHubPullRequestResponse;
            }
          })
        );

        allPRs.push(...enhancedPRs);
        
        if (data.length < perPage) break;
        page++;
      }

      this.logger.info(`Fetched ${allPRs.length} pull requests for ${owner}/${repo}`);
      return allPRs;
    } catch (error) {
      this.logger.error(`Failed to fetch pull requests for ${owner}/${repo}:`, error as Error);
      throw error;
    }
  }

  async getBranchProtection(owner: string, repo: string, branch: string): Promise<any> {
    try {
      const { data } = await this.octokit.repos.getBranchProtection({
        owner,
        repo,
        branch,
      });
      
      this.logger.debug(`Fetched branch protection for ${owner}/${repo}:${branch}`);
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        // Branch protection not enabled
        this.logger.debug(`No branch protection found for ${owner}/${repo}:${branch}`);
        return null;
      }
      this.logger.error(`Failed to fetch branch protection for ${owner}/${repo}:${branch}:`, error as Error);
      throw error;
    }
  }

  async getVulnerabilityAlerts(owner: string, repo: string): Promise<GitHubVulnerabilityResponse[]> {
    try {
      // Note: The Dependabot alerts API requires specific permissions
      // Using the Security Advisory API as an alternative
      const { data } = await this.octokit.rest.securityAdvisories.listRepositoryAdvisories({
        owner,
        repo,
      });
      
      this.logger.info(`Fetched ${data.length} security advisories for ${owner}/${repo}`);
      return data.map(advisory => ({
        id: advisory.ghsa_id,
        severity: advisory.severity,
        summary: advisory.summary,
        description: advisory.description,
        state: 'open', // Default state since API doesn't provide this
        created_at: advisory.published_at,
        updated_at: advisory.updated_at,
        package: advisory.vulnerabilities?.[0]?.package?.name || 'unknown',
        vulnerable_version_range: advisory.vulnerabilities?.[0]?.vulnerable_version_range || '',
        patched_version: advisory.vulnerabilities?.[0]?.patched_versions || '',
        first_patched_version: advisory.vulnerabilities?.[0]?.patched_versions || ''
      })) as unknown as GitHubVulnerabilityResponse[];
    } catch (error: any) {
      if (error.status === 404 || error.status === 403) {
        // Repository doesn't have security advisories or no access
        this.logger.debug(`Security advisories not available for ${owner}/${repo}`);
        return [];
      }
      this.logger.error(`Failed to fetch vulnerability alerts for ${owner}/${repo}:`, error as Error);
      throw error;
    }
  }

  async getCommits(owner: string, repo: string, since?: Date, until?: Date): Promise<any[]> {
    try {
      const params: any = {
        owner,
        repo,
        per_page: 100,
      };

      if (since) params.since = since.toISOString();
      if (until) params.until = until.toISOString();

      const allCommits: any[] = [];
      let page = 1;

      while (true) {
        const { data } = await this.octokit.repos.listCommits({
          ...params,
          page,
        });

        if (data.length === 0) break;
        allCommits.push(...data);
        
        if (data.length < 100) break;
        page++;
      }

      this.logger.info(`Fetched ${allCommits.length} commits for ${owner}/${repo}`);
      return allCommits;
    } catch (error) {
      this.logger.error(`Failed to fetch commits for ${owner}/${repo}:`, error as Error);
      throw error;
    }
  }

  async getDependencies(owner: string, repo: string): Promise<any[]> {
    try {
      // Use GraphQL to get dependency information
      const query = `
        query($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            dependencyGraphManifests(first: 100) {
              nodes {
                filename
                dependencies(first: 100) {
                  nodes {
                    packageName
                    requirements
                    packageManager
                    hasDependencies
                  }
                }
              }
            }
          }
        }
      `;

      const result = await this.graphqlClient(query, { owner, repo });
      const manifests = result.repository?.dependencyGraphManifests?.nodes || [];
      
      const dependencies: any[] = [];
      manifests.forEach((manifest: any) => {
        manifest.dependencies?.nodes?.forEach((dep: any) => {
          dependencies.push({
            ...dep,
            manifestPath: manifest.filename,
          });
        });
      });

      this.logger.info(`Fetched ${dependencies.length} dependencies for ${owner}/${repo}`);
      return dependencies;
    } catch (error) {
      this.logger.error(`Failed to fetch dependencies for ${owner}/${repo}:`, error as Error);
      // Return empty array if dependency graph is not available
      return [];
    }
  }

  async getSecurityScans(owner: string, repo: string): Promise<any[]> {
    try {
      const scans: any[] = [];

      // Get code scanning alerts
      try {
        const { data: codeScanning } = await this.octokit.codeScanning.listAlertsForRepo({
          owner,
          repo,
          per_page: 100,
        });
        
        scans.push({
          type: 'code_scanning',
          alerts: codeScanning,
          count: codeScanning.length,
        });
      } catch (error: any) {
        if (error.status !== 404 && error.status !== 403) {
          this.logger.warn(`Failed to fetch code scanning alerts for ${owner}/${repo}:`, error);
        }
      }

      // Get secret scanning alerts
      try {
        const { data: secretScanning } = await this.octokit.secretScanning.listAlertsForRepo({
          owner,
          repo,
          per_page: 100,
        });
        
        scans.push({
          type: 'secret_scanning',
          alerts: secretScanning,
          count: secretScanning.length,
        });
      } catch (error: any) {
        if (error.status !== 404 && error.status !== 403) {
          this.logger.warn(`Failed to fetch secret scanning alerts for ${owner}/${repo}:`, error);
        }
      }

      this.logger.info(`Fetched ${scans.length} security scan types for ${owner}/${repo}`);
      return scans;
    } catch (error) {
      this.logger.error(`Failed to fetch security scans for ${owner}/${repo}:`, error as Error);
      return [];
    }
  }

  // Utility method to check API rate limits
  async getRateLimit(): Promise<any> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return data;
    } catch (error) {
      this.logger.error('Failed to get rate limit information:', error as Error);
      throw error;
    }
  }

  // Utility method to get organization members (for team analysis)
  async getOrganizationMembers(org: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.orgs.listMembers({
        org,
        per_page: 100,
      });
      
      this.logger.info(`Fetched ${data.length} members for organization ${org}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch organization members for ${org}:`, error as Error);
      throw error;
    }
  }
}
