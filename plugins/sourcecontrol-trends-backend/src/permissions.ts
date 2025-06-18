/**
 * Permission definitions for Source Control Trends plugin
 * These permissions are automatically handled by the Universal Permission Interceptor
 */

import { createPermission } from '@backstage/plugin-permission-common';

export const sourceControlPermissions = {
  // Repository permissions
  repositoryRead: createPermission({
    name: 'sourcecontrol.repository.read',
    attributes: { 
      action: 'read',
    },
  }),
  repositoryUpdate: createPermission({
    name: 'sourcecontrol.repository.update',
    attributes: { 
      action: 'update',
    },
  }),
  repositoryDelete: createPermission({
    name: 'sourcecontrol.repository.delete',
    attributes: { 
      action: 'delete',
    },
  }),

  // Metrics permissions
  metricsRead: createPermission({
    name: 'sourcecontrol.metrics.read',
    attributes: { 
      action: 'read',
    },
  }),
  metricsUpdate: createPermission({
    name: 'sourcecontrol.metrics.update',
    attributes: { 
      action: 'update',
    },
  }),

  // Compliance permissions
  complianceRead: createPermission({
    name: 'sourcecontrol.compliance.read',
    attributes: { 
      action: 'read',
    },
  }),
  complianceUpdate: createPermission({
    name: 'sourcecontrol.compliance.update',
    attributes: { 
      action: 'update',
    },
  }),

  // Benchmark permissions
  benchmarkRead: createPermission({
    name: 'sourcecontrol.benchmark.read',
    attributes: { 
      action: 'read',
    },
  }),
  benchmarkUpdate: createPermission({
    name: 'sourcecontrol.benchmark.update',
    attributes: { 
      action: 'update',
    },
  }),

  // Dashboard permissions
  dashboardRead: createPermission({
    name: 'sourcecontrol.dashboard.read',
    attributes: { 
      action: 'read',
    },
  }),
};

// Export permission references for frontend use
export const sourceControlPermissionRefs = {
  repositoryRead: sourceControlPermissions.repositoryRead,
  repositoryUpdate: sourceControlPermissions.repositoryUpdate,
  repositoryDelete: sourceControlPermissions.repositoryDelete,
  metricsRead: sourceControlPermissions.metricsRead,
  metricsUpdate: sourceControlPermissions.metricsUpdate,
  complianceRead: sourceControlPermissions.complianceRead,
  complianceUpdate: sourceControlPermissions.complianceUpdate,
  benchmarkRead: sourceControlPermissions.benchmarkRead,
  benchmarkUpdate: sourceControlPermissions.benchmarkUpdate,
  dashboardRead: sourceControlPermissions.dashboardRead,
};

// Permission categories for easy management
export const sourceControlPermissionCategories = {
  read: [
    sourceControlPermissions.repositoryRead,
    sourceControlPermissions.metricsRead,
    sourceControlPermissions.complianceRead,
    sourceControlPermissions.benchmarkRead,
    sourceControlPermissions.dashboardRead,
  ],
  write: [
    sourceControlPermissions.repositoryUpdate,
    sourceControlPermissions.metricsUpdate,
    sourceControlPermissions.complianceUpdate,
    sourceControlPermissions.benchmarkUpdate,
  ],
  delete: [
    sourceControlPermissions.repositoryDelete,
  ],
};

export default sourceControlPermissions;
