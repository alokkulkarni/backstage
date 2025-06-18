/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';

// Create the backend instance
const backend = createBackend();

// Add standard backend plugins
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@roadiehq/scaffolder-backend-module-http-request'));

// Add the scaffolder backend without custom actions for now
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-azure'));
backend.add(import('@invincible/plugin-scaffolder-backend-module-createvalues'));

backend.add(import('@backstage/plugin-techdocs-backend'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
backend.add(import('@backstage/plugin-auth-backend-module-microsoft-provider'));
// backend.add(import('@backstage/plugin-auth-backend-module-azure-easyauth-provider'));

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(import('@backstage/plugin-catalog-backend-module-github'));
backend.add(import('@backstage/plugin-catalog-backend-module-github-org'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));
backend.add(
  import('@backstage-community/plugin-scaffolder-backend-module-sonarqube'),
);

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// backend.add(import('@backstage/plugin-permission-backend-module-allow-all-policy'));

// Add our new permission policy plugin
backend.add(import('@internal/plugin-permission-policy-backend-backend'));

// Add enhanced permission policy with guest user support from permissions plugin
backend.add(import('./extensions/permissionsPolicyExtension'));
// backend.add(import('./extensions/permissionInterceptorPattern')); // Fallback interceptor, replaced by enhanced policy

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes
backend.add(import('@backstage/plugin-kubernetes-backend'));
backend.add(import('@backstage-community/plugin-jenkins-backend'));
backend.add(import('@backstage-community/plugin-sonarqube-backend'));
backend.add(import('@backstage-community/plugin-tech-radar-backend'));
backend.add(import('@backstage-community/plugin-bazaar-backend'));
backend.add(import('@backstage-community/plugin-copilot-backend'));
backend.add(import('@parfuemerie-douglas/scaffolder-backend-module-azure-repositories'));
backend.add(import('@internal/plugin-jira-trends-backend'));
backend.add(import('@internal/plugin-sourcecontrol-trends-backend'));
backend.add(import('@internal/plugin-scaffolder-backend-module-shell-script'));
backend.add(import('@internal/plugin-scaffolder-backend-module-jenkins-scaffolder-action'));
backend.start();
