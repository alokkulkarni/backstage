import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { JiraTrendsService } from './services/JiraTrendsService';
import { DataRefreshService } from './services/DataRefreshService';
import { UserBoardMappingService } from './services/UserBoardMappingService';
import { MockDataService } from './services/MockDataService';
import { JiraTrendsController } from './controllers/JiraTrendsController';

export interface RouterOptions {
  logger: Logger;
  jiraTrendsService: JiraTrendsService;
  dataRefreshService: DataRefreshService;
  userBoardMappingService: UserBoardMappingService;
  mockDataService: MockDataService;
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { 
    logger, 
    jiraTrendsService, 
    dataRefreshService, 
    userBoardMappingService, 
    mockDataService 
  } = options;
  
  const router = Router();
  
  // Add JSON parsing middleware
  router.use(express.json());

  // Initialize controller with all required services
  const controller = new JiraTrendsController(
    logger,
    jiraTrendsService,
    dataRefreshService,
    userBoardMappingService,
    mockDataService,
  );

  // Health check endpoint
  router.get('/health', controller.getHealth.bind(controller));

  // Boards endpoints
  router.get('/boards', controller.getBoards.bind(controller));

  // Sprint metrics endpoints
  router.get('/sprint-metrics', controller.getSprintMetrics.bind(controller));
  router.get('/sprint-metrics/:sprintId', controller.getSprintMetricsById.bind(controller));

  // Compliance endpoints
  router.get('/compliance-reports', controller.getComplianceReports.bind(controller));
  router.get('/compliance-reports/:sprintId', controller.getComplianceReportById.bind(controller));

  // Benchmarks endpoints
  router.get('/benchmarks', controller.getBenchmarks.bind(controller));

  // Trends endpoints
  router.get('/trends', controller.getTrends.bind(controller));
  router.get('/compliance-trends', controller.getComplianceTrends.bind(controller));

  // Data refresh endpoints
  router.post('/refresh', controller.refreshBoardData.bind(controller));
  router.post('/refresh/all', controller.refreshAllData.bind(controller));
  router.get('/refresh/status', controller.getRefreshStatus.bind(controller));

  // Catch-all for undefined routes
  router.use('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
      availableEndpoints: [
        'GET /health',
        'GET /boards',
        'GET /sprint-metrics',
        'GET /sprint-metrics/:sprintId',
        'GET /compliance-reports',
        'GET /compliance-reports/:sprintId',
        'GET /compliance-trends',
        'GET /benchmarks',
        'GET /trends',
        'POST /refresh',
        'POST /refresh/all',
        'GET /refresh/status',
      ],
    });
  });

  logger.info('Jira Trends router created successfully with controller-based architecture');
  return router;
}