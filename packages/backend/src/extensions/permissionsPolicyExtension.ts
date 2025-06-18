import { createBackendModule } from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { coreServices } from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { 
  PermissionPolicyService,
  createEnhancedPermissionPolicy,
  initializeGuestUserPolicies
} from '@internal/plugin-permission-policy-backend-backend';

/**
 * Enhanced permission policy module that integrates with the custom RBAC system
 * and provides proper guest user handling through the permissions plugin.
 */
export const enhancedPermissionPolicyModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'enhanced-permission-policy',
  register(reg) {
    reg.registerInit({
      deps: { 
        policy: policyExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        discovery: coreServices.discovery,
      },
      async init({ policy, config, logger, discovery }) {
        // Get admin users from config
        const adminUsers = config.getOptionalStringArray('permission.rbac.authorizedUsers') ?? 
                          config.getOptionalStringArray('permissions.adminUsers') ?? [];
        
        logger.info('Setting up enhanced permission policy', { adminUsers });

        // Create catalog client for the policy service
        const catalogClient = new CatalogClient({
          discoveryApi: discovery,
        });

        // Create permission policy service instance
        const policyService = new PermissionPolicyService(
          logger,
          { getOptionalConfig: (key: string) => config.getOptionalConfig(key) } as any,
          catalogClient,
        );

        // Initialize guest user policies FIRST before creating the enhanced policy
        try {
          await initializeGuestUserPolicies(policyService);
          logger.info('✅ Guest user policies initialized successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`❌ Failed to initialize guest user policies: ${errorMessage}`);
          // Continue with policy creation even if guest policies fail
        }

        // Create and register the enhanced permission policy with guest user support
        const enhancedPolicy = createEnhancedPermissionPolicy(policyService, adminUsers, logger);
        policy.setPolicy(enhancedPolicy);
        
        logger.info('✅ Enhanced permission policy with guest user support activated');
      },
    });
  },
});

export default enhancedPermissionPolicyModule;
