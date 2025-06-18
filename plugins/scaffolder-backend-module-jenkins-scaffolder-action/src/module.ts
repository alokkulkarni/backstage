import { createBackendModule } from "@backstage/backend-plugin-api";
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { coreServices } from '@backstage/backend-plugin-api';
import { createJenkinsJobAction } from "./actions/create-jenkins-job";
import { createJenkinsJobExecuteAction } from "./actions/execute-jenkins-job";

/**
 * A backend module that registers Jenkins scaffolder actions
 * Compatible with the new Backstage backend system
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'jenkins-scaffolder-actions',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ scaffolderActions, config, logger }) {
        logger.info('Initializing Jenkins scaffolder actions module');
        
        try {
          // Register Jenkins actions with enhanced error handling
          scaffolderActions.addActions(
            createJenkinsJobAction({ config }),
            createJenkinsJobExecuteAction({ config })
          );
          
          logger.info('Successfully registered Jenkins scaffolder actions: jenkins:create-job, jenkins:execute-job');
        } catch (error) {
          logger.error('Failed to register Jenkins scaffolder actions', error as Error);
          throw error;
        }
      }
    });
  },
});

// Export the module as default for easier importing
export default scaffolderModule;
