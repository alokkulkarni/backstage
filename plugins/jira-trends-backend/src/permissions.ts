/**
 * Permission definitions for Jira Trends plugin
 * These permissions are automatically handled by the Universal Permission Interceptor
 */

import { createPermission } from '@backstage/plugin-permission-common';

export const jiraTrendsPermissions = {
  // Board permissions
  boardRead: createPermission({
    name: 'jira.board.read',
    attributes: { 
      action: 'read',
    },
  }),
  boardUpdate: createPermission({
    name: 'jira.board.update',
    attributes: { 
      action: 'update',
    },
  }),

  // Sprint permissions
  sprintRead: createPermission({
    name: 'jira.sprint.read',
    attributes: { 
      action: 'read',
    },
  }),
  sprintUpdate: createPermission({
    name: 'jira.sprint.update',
    attributes: { 
      action: 'update',
    },
  }),

  // Metrics permissions
  metricsRead: createPermission({
    name: 'jira.metrics.read',
    attributes: { 
      action: 'read',
    },
  }),
  metricsUpdate: createPermission({
    name: 'jira.metrics.update',
    attributes: { 
      action: 'update',
    },
  }),

  // Report permissions
  reportRead: createPermission({
    name: 'jira.report.read',
    attributes: { 
      action: 'read',
    },
  }),
  reportCreate: createPermission({
    name: 'jira.report.create',
    attributes: { 
      action: 'create',
    },
  }),

  // Dashboard permissions
  dashboardRead: createPermission({
    name: 'jira.dashboard.read',
    attributes: { 
      action: 'read',
    },
  }),

  // Configuration permissions
  configRead: createPermission({
    name: 'jira.config.read',
    attributes: { 
      action: 'read',
    },
  }),
  configUpdate: createPermission({
    name: 'jira.config.update',
    attributes: { 
      action: 'update',
    },
  }),
};

// Export permission references for frontend use
export const jiraTrendsPermissionRefs = {
  boardRead: jiraTrendsPermissions.boardRead,
  boardUpdate: jiraTrendsPermissions.boardUpdate,
  sprintRead: jiraTrendsPermissions.sprintRead,
  sprintUpdate: jiraTrendsPermissions.sprintUpdate,
  metricsRead: jiraTrendsPermissions.metricsRead,
  metricsUpdate: jiraTrendsPermissions.metricsUpdate,
  reportRead: jiraTrendsPermissions.reportRead,
  reportCreate: jiraTrendsPermissions.reportCreate,
  dashboardRead: jiraTrendsPermissions.dashboardRead,
  configRead: jiraTrendsPermissions.configRead,
  configUpdate: jiraTrendsPermissions.configUpdate,
};

// Permission categories for easy management
export const jiraTrendsPermissionCategories = {
  read: [
    jiraTrendsPermissions.boardRead,
    jiraTrendsPermissions.sprintRead,
    jiraTrendsPermissions.metricsRead,
    jiraTrendsPermissions.reportRead,
    jiraTrendsPermissions.dashboardRead,
    jiraTrendsPermissions.configRead,
  ],
  write: [
    jiraTrendsPermissions.boardUpdate,
    jiraTrendsPermissions.sprintUpdate,
    jiraTrendsPermissions.metricsUpdate,
    jiraTrendsPermissions.reportCreate,
    jiraTrendsPermissions.configUpdate,
  ],
};

export default jiraTrendsPermissions;
