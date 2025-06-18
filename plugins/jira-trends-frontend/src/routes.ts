import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

export const jiraTrendsRouteRef = createRouteRef({
  id: 'jira-trends',
});

export const jiraTrendsDashboardRouteRef = createSubRouteRef({
  id: 'jira-trends-dashboard',
  path: '/dashboard',
  parent: jiraTrendsRouteRef,
});

export const jiraTrendsMetricsRouteRef = createSubRouteRef({
  id: 'jira-trends-metrics',
  path: '/metrics',
  parent: jiraTrendsRouteRef,
});

export const jiraTrendsComplianceRouteRef = createSubRouteRef({
  id: 'jira-trends-compliance',
  path: '/compliance',
  parent: jiraTrendsRouteRef,
});
