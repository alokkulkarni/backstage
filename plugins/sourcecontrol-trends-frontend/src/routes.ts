import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'sourcecontrol-trends',
});

export const repositoryRouteRef = createSubRouteRef({
  id: 'sourcecontrol-trends:repository',
  parent: rootRouteRef,
  path: '/repository/:repositoryId',
});

export const complianceRouteRef = createSubRouteRef({
  id: 'sourcecontrol-trends:compliance',
  parent: rootRouteRef,
  path: '/compliance',
});

export const benchmarksRouteRef = createSubRouteRef({
  id: 'sourcecontrol-trends:benchmarks',
  parent: rootRouteRef,
  path: '/benchmarks',
});
