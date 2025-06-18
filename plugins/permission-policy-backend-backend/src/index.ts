/**
 * Permission Policy Backend Plugin
 * Backstage backend plugin for managing and evaluating permission policies using OPA
 */

import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from './router';
import { PermissionPolicyService } from './service/PermissionPolicyService';
import { initializeGuestUserPolicies } from './policy/DefaultGuestUserPolicies';

/**
 * Permission Policy Backend Plugin
 * 
 * This plugin provides:
 * - Policy rule management (CRUD operations)
 * - Policy template system
 * - OPA-based policy evaluation
 * - Backstage catalog integration
 * - Policy testing and simulation
 * - Bundle import/export
 */
export const permissionPolicyPlugin = createBackendPlugin({
  pluginId: 'permission-policy',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        discovery: coreServices.discovery,
      },
      async init({ config, logger, httpRouter, discovery }) {
        // Initialize catalog client
        const catalogClient = new CatalogClient({
          discoveryApi: discovery,
        });

        // Create the permission policy service
        const service = new PermissionPolicyService(
          logger,
          { getOptionalConfig: (key: string) => config.getOptionalConfig(key) } as any,
          catalogClient,
        );

        // Initialize default guest user policies
        try {
          await initializeGuestUserPolicies(service);
          logger.info('Guest user policies initialized successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Failed to initialize guest user policies: ${errorMessage}`);
        }

        // Create and register the router
        const router = createRouter(service, logger);
        
        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/permission-policy',
          allow: 'unauthenticated', // Allow unauthenticated access for now
        });

        logger.info('Permission Policy Backend Plugin initialized');
      },
    });
  },
});

// Default export for the plugin
export default permissionPolicyPlugin;

// Export types and services for external use
export * from './types';
export { PermissionPolicyService } from './service/PermissionPolicyService';
export { OpaPolicyEvaluator } from './evaluator/opaEvaluator';
export { FileSystemPolicyStorage } from './service/storage';
export { createEnhancedPermissionPolicy, BackstagePermissionPolicy } from './policy/BackstagePermissionPolicy';
export { GUEST_USER_POLICY_CONFIG, GUEST_USER_POLICY_RULES, GUEST_USER_ROLE } from './policy/GuestUserPolicy';
export { DEFAULT_GUEST_USER_POLICIES, initializeGuestUserPolicies, migrateGuestUserPoliciesFromRBAC } from './policy/DefaultGuestUserPolicies';
