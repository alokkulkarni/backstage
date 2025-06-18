import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { createJiraApi, jiraApiRef } from './api';

export const jiraPluginPlugin = createPlugin({
  id: 'jira-plugin',
  apis: [
    createApiFactory({
      api: jiraApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        createJiraApi({ discoveryApi, fetchApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const JiraPluginPage = jiraPluginPlugin.provide(
  createRoutableExtension({
    name: 'JiraPluginPage',
    component: () =>
      import('./components/JiraPluginWrapper').then(m => m.JiraPluginWrapper as any),
    mountPoint: rootRouteRef,
  }),
);

export const JiraDashboard = jiraPluginPlugin.provide(
  createRoutableExtension({
    name: 'JiraDashboard',
    component: () =>
      import('./components/JiraDashboard').then(m => m.JiraDashboard as any),
    mountPoint: rootRouteRef,
  }),
);
