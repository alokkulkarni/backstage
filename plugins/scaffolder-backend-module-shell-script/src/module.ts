import { scaffolderActionsExtensionPoint  } from '@backstage/plugin-scaffolder-node/alpha';
import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { createExampleAction, createShellExecuteAction } from "./actions";

/**
 * A backend module that registers custom scaffolder actions into the scaffolder
 * 
 * This module provides:
 * - shell:execute - A comprehensive shell script execution action
 * - acme:example - An example action for reference
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'shell-script-actions',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolderActions, config}) {
        // Register the shell execute action with config support
        scaffolderActions.addActions(createShellExecuteAction({ config }));
        
        // Register the example action for reference
        scaffolderActions.addActions(createExampleAction());
      }
    });
  },
})
