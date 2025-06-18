import { LoggerService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import * as cron from 'node-cron';
import { GitHubApiService } from './GitHubApiService';
import { DataIngestionService } from './DataIngestionService';
import { MetricsCalculationService } from './MetricsCalculationService';

export class DataRefreshService {
  private db: Knex;
  private logger: LoggerService;
  private githubApi: GitHubApiService;
  private ingestionService: DataIngestionService;
  private metricsService: MetricsCalculationService;
  private isRefreshing: boolean = false;
  private lastRefreshTime: Date | null = null;

  constructor(
    db: Knex,
    logger: LoggerService,
    githubApi: GitHubApiService,
    ingestionService: DataIngestionService,
    metricsService: MetricsCalculationService
  ) {
    this.db = db;
    this.logger = logger;
    this.githubApi = githubApi;
    this.ingestionService = ingestionService;
    this.metricsService = metricsService;

    // Set up periodic refresh schedule
    this.setupPeriodicRefresh();
  }

  private setupPeriodicRefresh(): void {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      if (!this.isRefreshing) {
        await this.performScheduledRefresh();
      }
    });

    this.logger.info('Data refresh scheduler initialized - will run every 6 hours');
  }

  async performScheduledRefresh(): Promise<void> {
    if (this.isRefreshing) {
      this.logger.warn('Data refresh already in progress, skipping scheduled refresh');
      return;
    }

    try {
      this.isRefreshing = true;
      this.logger.info('Starting scheduled data refresh');

      // Get all active repositories
      const repositories = await this.db('sourcecontrol_repositories')
        .select('*')
        .where('archived', false);

      this.logger.info(`Refreshing data for ${repositories.length} repositories`);

      // Refresh each repository
      for (const repository of repositories) {
        try {
          await this.refreshRepositoryData(repository.id, repository.full_name);
        } catch (error) {
          this.logger.error(`Failed to refresh repository ${repository.full_name}:`, error as Error);
          // Continue with other repositories
        }
      }

      this.lastRefreshTime = new Date();
      this.logger.info('Scheduled data refresh completed successfully');

    } catch (error) {
      this.logger.error('Scheduled data refresh failed:', error as Error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async refreshRepositoryData(repositoryId: string, fullName?: string): Promise<void> {
    try {
      this.logger.debug(`Refreshing data for repository ${repositoryId}`);

      // Get repository details if fullName not provided
      if (!fullName) {
        const repository = await this.db('sourcecontrol_repositories')
          .select('full_name')
          .where('id', repositoryId)
          .first();
        
        if (!repository) {
          throw new Error(`Repository ${repositoryId} not found`);
        }
        fullName = repository.full_name;
      }

      if (!fullName) {
        throw new Error(`Repository fullName is not available for ${repositoryId}`);
      }

      const [owner, repo] = fullName.split('/');

      // Fetch fresh data from GitHub
      const [pullRequests, vulnerabilities] = await Promise.all([
        this.githubApi.getPullRequests(owner, repo).catch(error => {
          this.logger.warn(`Failed to fetch PRs for ${fullName}:`, error as Error);
          return [];
        }),
        this.githubApi.getVulnerabilityAlerts(owner, repo).catch(error => {
          this.logger.warn(`Failed to fetch vulnerabilities for ${fullName}:`, error as Error);
          return [];
        })
      ]);

      // Ingest the data
      await Promise.all([
        this.ingestionService.ingestPullRequestData(repositoryId, pullRequests),
        this.ingestionService.ingestVulnerabilityData(repositoryId, vulnerabilities)
      ]);

      // Calculate fresh metrics
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };

      await this.metricsService.calculateRepositoryMetrics(repositoryId, dateRange);

      // Calculate compliance report
      const benchmarks = await this.db('sourcecontrol_benchmarks').select('*');
      await this.metricsService.calculateComplianceReport(repositoryId, benchmarks);

      this.logger.debug(`Successfully refreshed data for repository ${repositoryId}`);

    } catch (error) {
      this.logger.error(`Failed to refresh repository data for ${repositoryId}:`, error as Error);
      throw error;
    }
  }

  async initializeRepositoryFromGitHub(owner: string, repo: string): Promise<string> {
    try {
      this.logger.info(`Initializing new repository ${owner}/${repo} from GitHub`);

      // Fetch repository data from GitHub
      const repositories = await this.githubApi.getRepositories();
      const targetRepo = repositories.find(r => r.full_name === `${owner}/${repo}`);

      if (!targetRepo) {
        throw new Error(`Repository ${owner}/${repo} not found in GitHub`);
      }

      // Ingest repository data
      await this.ingestionService.ingestRepositoryData([targetRepo]);

      const repositoryId = targetRepo.id.toString();

      // Refresh all data for the new repository
      await this.refreshRepositoryData(repositoryId, targetRepo.full_name);

      this.logger.info(`Successfully initialized repository ${owner}/${repo} with ID ${repositoryId}`);
      return repositoryId;

    } catch (error) {
      this.logger.error(`Failed to initialize repository ${owner}/${repo}:`, error as Error);
      throw error;
    }
  }

  async refreshOrganizationRepositories(organization: string): Promise<void> {
    try {
      this.logger.info(`Refreshing all repositories for organization ${organization}`);

      // Fetch all repositories for the organization
      const repositories = await this.githubApi.getRepositories(organization);

      // Ingest repository data (this will update existing repos and add new ones)
      await this.ingestionService.ingestRepositoryData(repositories);

      // Refresh data for each repository
      for (const repo of repositories) {
        if (!repo.archived && !repo.disabled) {
          try {
            await this.refreshRepositoryData(repo.id.toString(), repo.full_name);
          } catch (error) {
            this.logger.error(`Failed to refresh repository ${repo.full_name}:`, error as Error);
            // Continue with other repositories
          }
        }
      }

      this.logger.info(`Successfully refreshed ${repositories.length} repositories for organization ${organization}`);

    } catch (error) {
      this.logger.error(`Failed to refresh organization repositories for ${organization}:`, error as Error);
      throw error;
    }
  }

  getRefreshStatus(): {
    isRefreshing: boolean;
    lastRefreshTime: Date | null;
    nextScheduledRefresh: Date | null;
  } {
    // Calculate next scheduled refresh (every 6 hours)
    const nextScheduledRefresh = this.lastRefreshTime
      ? new Date(this.lastRefreshTime.getTime() + 6 * 60 * 60 * 1000)
      : new Date(Date.now() + 6 * 60 * 60 * 1000);

    return {
      isRefreshing: this.isRefreshing,
      lastRefreshTime: this.lastRefreshTime,
      nextScheduledRefresh,
    };
  }

  async forceRefresh(repositoryId?: string): Promise<void> {
    if (this.isRefreshing) {
      throw new Error('Data refresh already in progress');
    }

    try {
      this.isRefreshing = true;

      if (repositoryId) {
        await this.refreshRepositoryData(repositoryId);
      } else {
        await this.performScheduledRefresh();
      }

    } finally {
      this.isRefreshing = false;
    }
  }

  async getDataFreshness(): Promise<{
    repositoryId: string;
    repositoryName: string;
    lastScanAt: Date | null;
    dataAge: number; // hours
    isStale: boolean;
  }[]> {
    try {
      const repositories = await this.db('sourcecontrol_repositories')
        .select('id', 'full_name', 'last_scan_at')
        .where('archived', false);

      const freshness = repositories.map((repo: any) => {
        const lastScanAt = repo.last_scan_at ? new Date(repo.last_scan_at) : null;
        const dataAge = lastScanAt 
          ? (Date.now() - lastScanAt.getTime()) / (1000 * 60 * 60) // hours
          : Infinity;
        const isStale = dataAge > 12; // Consider stale if >12 hours old

        return {
          repositoryId: repo.id,
          repositoryName: repo.full_name,
          lastScanAt,
          dataAge: Math.round(dataAge),
          isStale,
        };
      });

      return freshness;

    } catch (error) {
      this.logger.error('Failed to get data freshness:', error as Error);
      throw error;
    }
  }
}
