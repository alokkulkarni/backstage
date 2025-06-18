import { Router } from 'express';
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { SourceControlTrendsController } from './controllers/SourceControlTrendsController';
import { SourceControlTrendsService } from './services/SourceControlTrendsService';
import { GitHubUserService } from './services/GitHubUserService';
import { MockDataService } from './services/MockDataService';

export interface RouterOptions {
  logger: LoggerService;
  sourceControlTrendsService: SourceControlTrendsService;
  gitHubUserService: GitHubUserService;
  mockDataService: MockDataService;
}

export async function createRouter(options: RouterOptions): Promise<Router> {
  const { logger, sourceControlTrendsService, gitHubUserService, mockDataService } = options;
  
  const router = Router();
  
  // Add JSON parsing middleware
  router.use(express.json());

  // Initialize the controller
  const controller = new SourceControlTrendsController(
    logger,
    sourceControlTrendsService,
    gitHubUserService,
    mockDataService,
  );

  // Health check endpoint
  router.get('/health', controller.health.bind(controller));

  // User endpoints
  router.get('/user/organizations', controller.getOrganizations.bind(controller));
  router.get('/user/repositories/:organization', controller.getRepositories.bind(controller));

  // Repository trends endpoints
  router.get('/repository/trends/:owner/:repo', controller.getRepositoryTrends.bind(controller));

  return router;
}
