import { LoggerService, DatabaseService } from '@backstage/backend-plugin-api';
import { GitHubApiService } from './GitHubApiService';
import { 
  DataIngestionService as IDataIngestionService,
  GitHubRepositoryResponse,
  GitHubPullRequestResponse,
  GitHubVulnerabilityResponse,
  SourceControlRepository,
  SourceControlPullRequest,
  SourceControlVulnerability
} from '../types';

export class DataIngestionService implements IDataIngestionService {
  private db: DatabaseService;
  private logger: LoggerService;

  constructor(
    db: DatabaseService,
    logger: LoggerService,
    _githubApi: GitHubApiService
  ) {
    this.db = db;
    this.logger = logger;
    // githubApi parameter kept for interface compatibility but not used
  }

  async ingestRepositoryData(repositories: GitHubRepositoryResponse[]): Promise<void> {
    try {
      this.logger.info(`Starting ingestion of ${repositories.length} repositories`);
      const client = await this.db.getClient();

      for (const repo of repositories) {
        const repositoryData: Partial<SourceControlRepository> = {
          id: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          defaultBranch: repo.default_branch,
          isPrivate: repo.private,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
          lastPushedAt: new Date(repo.pushed_at),
          starsCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          watchersCount: repo.watchers_count,
          openIssuesCount: repo.open_issues_count,
          hasIssues: repo.has_issues,
          hasProjects: repo.has_projects,
          hasWiki: repo.has_wiki,
          archived: repo.archived,
          disabled: repo.disabled,
          visibility: repo.visibility,
          lastScanAt: new Date()
        };

        await client('sourcecontrol_repositories')
          .insert(repositoryData)
          .onConflict('id')
          .merge();
      }

      this.logger.info(`Successfully ingested ${repositories.length} repositories`);
    } catch (error) {
      this.logger.error('Failed to ingest repository data:', error as Error);
      throw error;
    }
  }

  async ingestPullRequestData(repositoryId: string, pullRequests: GitHubPullRequestResponse[]): Promise<void> {
    try {
      this.logger.info(`Starting ingestion of ${pullRequests.length} pull requests for repository ${repositoryId}`);
      const client = await this.db.getClient();

      for (const pr of pullRequests) {
        const pullRequestData: Partial<SourceControlPullRequest> = {
          id: pr.id.toString(),
          repositoryId: repositoryId,
          number: pr.number,
          title: pr.title,
          state: pr.state === 'closed' && pr.merged_at ? 'merged' : pr.state,
          authorLogin: pr.user?.login || '',
          authorId: pr.user?.id.toString() || '',
          createdAt: new Date(pr.created_at),
          updatedAt: new Date(pr.updated_at),
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
          baseBranch: pr.base?.ref || '',
          headBranch: pr.head?.ref || '',
          additions: pr.additions || 0,
          deletions: pr.deletions || 0,
          changedFiles: pr.changed_files || 0,
          reviewersCount: pr.requested_reviewers?.length || 0,
          approvalsCount: 0,
          requestedChangesCount: 0,
          commentsCount: pr.comments || 0,
          timeToMergeHours: null,
          timeToFirstReviewHours: null,
          draft: pr.draft || false,
          mergeable: pr.mergeable
        };

        await client('sourcecontrol_pull_requests')
          .insert(pullRequestData)
          .onConflict('id')
          .merge();
      }

      this.logger.info(`Successfully ingested ${pullRequests.length} pull requests for repository ${repositoryId}`);
    } catch (error) {
      this.logger.error(`Failed to ingest pull request data for repository ${repositoryId}:`, error as Error);
      throw error;
    }
  }

  async ingestVulnerabilityData(repositoryId: string, vulnerabilities: GitHubVulnerabilityResponse[]): Promise<void> {
    try {
      this.logger.info(`Starting ingestion of ${vulnerabilities.length} vulnerabilities for repository ${repositoryId}`);
      const client = await this.db.getClient();

      for (const vuln of vulnerabilities) {
        const vulnerabilityData: Partial<SourceControlVulnerability> = {
          id: vuln.number.toString(),
          repositoryId: repositoryId,
          alertId: vuln.number.toString(),
          severity: vuln.security_advisory.severity,
          state: vuln.state,
          packageName: vuln.security_vulnerability.package.name,
          vulnerableVersionRange: vuln.security_vulnerability.vulnerable_version_range,
          firstPatchedVersion: vuln.security_vulnerability.first_patched_version?.identifier || null,
          createdAt: new Date(vuln.created_at),
          updatedAt: new Date(vuln.updated_at),
          dismissedAt: vuln.dismissed_at ? new Date(vuln.dismissed_at) : null,
          fixedAt: vuln.fixed_at ? new Date(vuln.fixed_at) : null,
          dismissReason: vuln.dismiss_reason,
          cwe: vuln.security_advisory.cwe?.cwe_id || null,
          ghsaId: vuln.security_advisory.ghsa_id,
          description: vuln.security_advisory.description
        };

        await client('sourcecontrol_vulnerabilities')
          .insert(vulnerabilityData)
          .onConflict('id')
          .merge();
      }

      this.logger.info(`Successfully ingested ${vulnerabilities.length} vulnerabilities for repository ${repositoryId}`);
    } catch (error) {
      this.logger.error(`Failed to ingest vulnerability data for repository ${repositoryId}:`, error as Error);
      throw error;
    }
  }

  async refreshRepositoryData(repositoryId?: string): Promise<void> {
    try {
      if (repositoryId) {
        this.logger.info(`Refreshing data for repository ${repositoryId}`);
        await this.updateRepositoryLastScan(repositoryId);
      } else {
        this.logger.info('Refreshing data for all repositories');
        const client = await this.db.getClient();
        const repositories = await client('sourcecontrol_repositories').select('*');
        
        for (const repository of repositories) {
          try {
            await this.updateRepositoryLastScan(repository.id);
          } catch (error) {
            this.logger.error(`Failed to refresh repository ${repository.fullName}:`, error as Error);
          }
        }
      }
      
      this.logger.info('Completed repository data refresh');
    } catch (error) {
      this.logger.error('Failed to refresh repository data:', error as Error);
      throw error;
    }
  }

  private async updateRepositoryLastScan(repositoryId: string): Promise<void> {
    const client = await this.db.getClient();
    await client('sourcecontrol_repositories')
      .where('id', repositoryId)
      .update({ lastScanAt: new Date() });
  }
}
