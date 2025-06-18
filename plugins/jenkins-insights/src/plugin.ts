import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { createJenkinsApi, jenkinsApiRef } from './api';

export const jenkinsInsightsPlugin = createPlugin({
  id: 'jenkins-insights',
  apis: [
    createApiFactory({
      api: jenkinsApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new createJenkinsApi({ discoveryApi, fetchApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const JenkinsInsightsPage = jenkinsInsightsPlugin.provide(
  createRoutableExtension({
    name: 'JenkinsInsightsPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);

export const JenkinsJobsCard = jenkinsInsightsPlugin.provide(
  createRoutableExtension({
    name: 'JenkinsJobsCard',
    component: () =>
      import('./components/JenkinsJobsCard/EnhancedJenkinsJobsCard').then(m => m.JenkinsJobsCard as any),
    mountPoint: rootRouteRef,
  }),
);
