import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { SourceControlTrendsService } from './services/SourceControlTrendsService';
import { GitHubUserService } from './services/GitHubUserService';
import { MockDataService } from './services/MockDataService';

/**
 * sourceControlTrendsPlugin backend plugin
 *
 * @public
 */
export const sourceControlTrendsPlugin = createBackendPlugin({
  pluginId: 'sourcecontrol-trends',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
      },
      async init({
        httpRouter,
        logger,
        config,
        auth,
        httpAuth,
      }) {
        logger.info('Initializing Source Control Trends backend plugin with controller-based architecture');
        
        try {
          // Initialize services in proper dependency order
          
          // 1. Core services first - using GitHub API with proper authentication
          const gitHubUserService = new GitHubUserService({
            logger,
            auth,
            httpAuth,
            config,
          });

          // 2. Mock data service (only needs logger)
          const mockDataService = new MockDataService(logger as any);

          // 3. Main service with all dependencies
          const sourceControlTrendsService = new SourceControlTrendsService(
            {} as any, // database placeholder 
            logger as any,
            config as any,
            gitHubUserService,
          );

          logger.info('All services initialized, creating router');

          // 4. Create router with all required services
          const router = await createRouter({
            logger: logger as any,
            sourceControlTrendsService,
            gitHubUserService,
            mockDataService,
          });

          // 5. Register the router
          httpRouter.use(router);

          logger.info('Source Control Trends backend plugin initialized successfully with controller-based architecture');
        } catch (error) {
          logger.error('Failed to initialize Source Control Trends backend plugin', error as Error);
          throw error;
        }
      },
    });
  },
});
