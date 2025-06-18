import { LoggerService, DatabaseService, RootConfigService } from '@backstage/backend-plugin-api';
import { 
  SourceControlRepository,
  SourceControlBenchmark,
  SourceControlMetrics,
  SourceControlComplianceReport,
  RepositoryMetricsRequest,
  ComplianceReportRequest,
} from '../types';
import { MockDataService } from './MockDataService';
import { GitHubUserService, UserRepositoryAccess } from './GitHubUserService';

export class SourceControlTrendsService {
  private db: DatabaseService;
  private logger: LoggerService;
  private config: RootConfigService;
  private mockDataService: MockDataService;
  private githubUserService: GitHubUserService;
  private useMockData: boolean;

  constructor(db: DatabaseService, logger: LoggerService, config: RootConfigService, githubUserService: GitHubUserService) {
    this.db = db;
    this.logger = logger;
    this.config = config;
    this.githubUserService = githubUserService;
    this.mockDataService = new MockDataService(logger);
    
    // Check if mock data should be used
    this.useMockData = this.config.getOptionalBoolean('sourceControlTrends.useMockData') ?? false;
    
    if (this.useMockData) {
      this.logger.info('Source Control Trends service initialized with MOCK DATA');
    } else {
      this.logger.info('Source Control Trends service initialized with REAL DATA');
    }
  }

  private async getClient() {
    return await this.db.getClient();
  }

  // Repository management
  async getRepositories(request: RepositoryMetricsRequest): Promise<SourceControlRepository[]> {
    if (this.useMockData) {
      return await this.mockDataService.getMockRepositories(request);
    }

    try {
      const client = await this.getClient();
      let query = client('sourcecontrol_repositories');
      
      if (request.ownerFilter) {
        query = query.where('owner', request.ownerFilter);
      }
      
      if (!request.includeArchived) {
        query = query.where('archived', false);
      }

      const repositories = await query.select('*').orderBy('updated_at', 'desc');
      
      this.logger.info(`Retrieved ${repositories.length} repositories`);
      return repositories;
    } catch (error) {
      this.logger.error('Failed to get repositories:', error as Error);
      throw error;
    }
  }

  async getRepository(repositoryId: string): Promise<SourceControlRepository | null> {
    if (this.useMockData) {
      return await this.mockDataService.getMockRepository(repositoryId);
    }

    try {
      const client = await this.getClient();
      const repository = await client('sourcecontrol_repositories')
        .where('id', repositoryId)
        .first();
      
      return repository || null;
    } catch (error) {
      this.logger.error(`Failed to get repository ${repositoryId}:`, error as Error);
      throw error;
    }
  }

  // Controller-compatible methods
  async getUserOrganizations(userAccess: UserRepositoryAccess): Promise<string[]> {
    if (this.useMockData) {
      return await this.mockDataService.getMockUserOrganizations(userAccess);
    }

    try {
      return await this.githubUserService.getUserOrganizations(userAccess);
    } catch (error) {
      this.logger.error('Failed to get user organizations:', error as Error);
      throw error;
    }
  }

  async getUserRepositories(userAccess: UserRepositoryAccess): Promise<SourceControlRepository[]> {
    if (this.useMockData) {
      return await this.mockDataService.getMockUserRepositories(userAccess);
    }

    try {
      const allRepos = await this.getRepositories({});
      return this.githubUserService.filterRepositoriesByUserAccess(allRepos, userAccess);
    } catch (error) {
      this.logger.error('Failed to get user repositories:', error as Error);
      throw error;
    }
  }

  async getRepositoryTrends(_userAccess: UserRepositoryAccess, owner: string, repo: string): Promise<any> {
    if (this.useMockData) {
      return this.mockDataService.getMockRepositoryTrends(owner, repo);
    }

    try {
      this.logger.info(`Getting repository trends for ${owner}/${repo}`);
      
      return {
        repository: `${owner}/${repo}`,
        timeRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          days: 30
        },
        trends: [],
        summary: {}
      };
    } catch (error) {
      this.logger.error(`Failed to get repository trends for ${owner}/${repo}:`, error as Error);
      throw error;
    }
  }

  // Data source information
  getDataSourceInfo(): { useMockData: boolean; dataSource: string } {
    return {
      useMockData: this.useMockData,
      dataSource: this.useMockData ? 'mock' : 'github',
    };
  }

  // Placeholder methods for other functionality
  async getMetrics(request: RepositoryMetricsRequest): Promise<SourceControlMetrics[]> {
    if (this.useMockData) {
      return await this.mockDataService.getMockMetrics(request);
    }
    
    this.logger.debug('getMetrics called');
    return [];
  }

  async getComplianceReports(request: ComplianceReportRequest): Promise<SourceControlComplianceReport[]> {
    if (this.useMockData) {
      return await this.mockDataService.getMockComplianceReports(request);
    }
    
    this.logger.debug('getComplianceReports called');
    return [];
  }

  async getAllBenchmarks(): Promise<SourceControlBenchmark[]> {
    if (this.useMockData) {
      return await this.mockDataService.getMockBenchmarks();
    }
    
    this.logger.debug('getAllBenchmarks called');
    return [];
  }

  async getDashboardOverview(): Promise<any> {
    if (this.useMockData) {
      return await this.mockDataService.getMockDashboardOverview();
    }
    
    this.logger.debug('getDashboardOverview called');
    return {
      totalRepositories: 0,
      activeRepositories: 0,
      vulnerabilityStats: { total: 0, critical: 0, high: 0, medium: 0, low: 0, open: 0 },
      complianceStats: { total: 0, pass: 0, warn: 0, fail: 0, avgScore: 0 },
      lastUpdated: new Date().toISOString(),
    };
  }
}
