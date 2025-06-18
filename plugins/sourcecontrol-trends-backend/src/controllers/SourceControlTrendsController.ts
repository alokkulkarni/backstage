import { LoggerService } from '@backstage/backend-plugin-api';
import { Request, Response } from 'express';
import { SourceControlTrendsService } from '../services/SourceControlTrendsService';
import { GitHubUserService } from '../services/GitHubUserService';
import { MockDataService } from '../services/MockDataService';

export class SourceControlTrendsController {
  constructor(
    private readonly logger: LoggerService,
    private readonly sourceControlTrendsService: SourceControlTrendsService,
    private readonly gitHubUserService: GitHubUserService,
    private readonly mockDataService: MockDataService,
  ) {}

  async health(_req: Request, res: Response): Promise<void> {
    this.logger.info('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  async getOrganizations(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Getting organizations');

      // Check if using mock data first
      if (this.mockDataService.isUsingMockData()) {
        this.logger.info('Returning mock organizations');
        const mockOrganizations = await this.mockDataService.getMockOrganizations();
        res.json({ organizations: mockOrganizations });
        return;
      }

      // Get user info from request
      const userInfo = await this.gitHubUserService.getUserInfoFromRequest(req);
      if (!userInfo) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Convert to UserRepositoryAccess format
      const userAccess = await this.gitHubUserService.getUserRepositoryAccess(userInfo);
      
      // Get organizations from service
      const organizations = await this.sourceControlTrendsService.getUserOrganizations(userAccess);
      
      res.json({ organizations });
    } catch (error) {
      this.logger.error('Failed to get organizations', error as Error);
      res.status(500).json({ error: 'Failed to load organizations' });
    }
  }

  async getRepositories(req: Request, res: Response): Promise<void> {
    try {
      const { organization } = req.params;
      this.logger.info(`Getting repositories for organization: ${organization}`);

      // Check if using mock data first
      if (this.mockDataService.isUsingMockData()) {
        this.logger.info('Returning mock repositories');
        const mockRepositories = await this.mockDataService.getMockRepositoriesForOrganization(organization);
        res.json({ repositories: mockRepositories });
        return;
      }

      // Get user info from request
      const userInfo = await this.gitHubUserService.getUserInfoFromRequest(req);
      if (!userInfo) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Convert to UserRepositoryAccess format
      const userAccess = await this.gitHubUserService.getUserRepositoryAccess(userInfo);
      
      // Get repositories from service
      const repositories = await this.sourceControlTrendsService.getUserRepositories(userAccess);
      
      res.json({ repositories });
    } catch (error) {
      this.logger.error(`Failed to get repositories for organization ${req.params.organization}`, error as Error);
      res.status(500).json({ error: 'Failed to load repositories' });
    }
  }

  async getRepositoryTrends(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo } = req.params;
      this.logger.info(`Getting trends for repository: ${owner}/${repo}`);

      // Check if using mock data first
      if (this.mockDataService.isUsingMockData()) {
        this.logger.info('Returning mock repository trends');
        const mockTrends = this.mockDataService.getMockRepositoryTrends(owner, repo);
        res.json(mockTrends);
        return;
      }

      // Get user info from request
      const userInfo = await this.gitHubUserService.getUserInfoFromRequest(req);
      if (!userInfo) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Convert to UserRepositoryAccess format
      const userAccess = await this.gitHubUserService.getUserRepositoryAccess(userInfo);
      
      // Get trends from service
      const trends = await this.sourceControlTrendsService.getRepositoryTrends(userAccess, owner, repo);
      
      res.json(trends);
    } catch (error) {
      this.logger.error(`Failed to get trends for repository ${req.params.owner}/${req.params.repo}`, error as Error);
      res.status(500).json({ error: 'Failed to load repository trends' });
    }
  }
}