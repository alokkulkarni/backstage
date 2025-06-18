import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { JiraTrendsService } from './services/JiraTrendsService';
import { JiraApiService } from './services/JiraApiService';
import { DatabaseService } from './services/DatabaseService';
import { DataRefreshService } from './services/DataRefreshService';
import { MetricsCalculatorService } from './services/MetricsCalculatorService';
import { ComplianceService } from './services/ComplianceService';
import { UserBoardMappingService } from './services/UserBoardMappingService';
import { MockDataService } from './services/MockDataService';

/**
 * jiraTrendsBackendPlugin backend plugin
 *
 * @public
 */
export const jiraTrendsBackendPlugin = createBackendPlugin({
  pluginId: 'jira-trends',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
      },
      async init({
        httpRouter,
        logger,
        config,
        discovery,
      }) {
        logger.info('Initializing Jira Trends backend plugin with direct API authentication');
        
        try {
          // Initialize services in proper dependency order
          
          // 1. Core services first - using direct API calls with credentials
          const jiraApiService = new JiraApiService(
            logger as any,
            discovery,
            null, // Not used for direct API calls
            config,
          );

          // 2. Mock data service 
          const mockDataService = new MockDataService(logger as any, config);

          // 3. User board mapping service
          const userBoardMappingService = new UserBoardMappingService(
            logger as any, 
            config, 
            jiraApiService
          );

          // 4. Database service with logger
          const databaseService = new DatabaseService(logger as any);
          
          // Initialize database service with mock data
          await databaseService.initialize();

          // 5. Supporting calculation services
          const metricsCalculatorService = new MetricsCalculatorService(logger as any);
          const complianceService = new ComplianceService(logger as any, databaseService);

          // 6. Data refresh service with all dependencies
          const dataRefreshService = new DataRefreshService(
            logger as any,
            config,
            jiraApiService,
            databaseService,
            metricsCalculatorService,
            complianceService,
          );

          // 7. Main service with all dependencies
          const jiraTrendsService = new JiraTrendsService(
            logger as any,
            databaseService,
            dataRefreshService,
            jiraApiService,
            mockDataService,
          );

          logger.info('All services initialized, creating router');

          // 8. Create router with all required services
          const router = await createRouter({
            logger: logger as any,
            jiraTrendsService,
            dataRefreshService,
            userBoardMappingService,
            mockDataService,
          });

          // 7. Register the router
          httpRouter.use(router);

          // Auth policies are now handled by Universal Permission Interceptor
          // No need to add individual auth policies here

          logger.info('Jira Trends backend plugin initialized successfully with direct API authentication');

          // 9. Start the data refresh service
          dataRefreshService.start();
          logger.info('Data refresh service started and will sync with Jira every 6 hours');

          // 10. Perform initial data refresh to populate real Jira data immediately
          try {
            logger.info('Performing initial data refresh to load real Jira data...');
            await dataRefreshService.performFullRefresh('system-initialization');
            logger.info('Initial data refresh completed - system now populated with real Jira data');
          } catch (error) {
            logger.warn('Initial data refresh failed, but plugin will continue running', {
              error: error instanceof Error ? error.message : 'Unknown error',
              note: 'Data will be refreshed on next scheduled interval'
            });
          }

          // Graceful shutdown handling
          const cleanup = async () => {
            logger.info('Shutting down Jira Trends service');
            try {
              // Stop any background services
              logger.info('Jira Trends service shut down successfully');
            } catch (error) {
              logger.error('Error during shutdown:', error instanceof Error ? error : new Error(String(error)));
            }
          };

          process.on('SIGINT', cleanup);
          process.on('SIGTERM', cleanup);

        } catch (error) {
          logger.error('Failed to initialize Jira Trends backend plugin', error as Error);
          throw error;
        }
      },
    });
  },
});
