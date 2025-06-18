import {
  createPlugin,
  createApiFactory,
  configApiRef,
} from '@backstage/core-plugin-api';
import { discoveryApiRef } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { sourceControlTrendsApiRef, SourceControlTrendsApiClient } from './api';

export const sourceControlTrendsPlugin = createPlugin({
  id: 'sourcecontrol-trends',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: sourceControlTrendsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, configApi }) =>
        new SourceControlTrendsApiClient({ discoveryApi, configApi }),
    }),
  ],
});

// Export the component directly
export { SourceControlDashboardPage as SourceControlTrendsPage } from './components/SourceControlDashboardPage/SourceControlDashboardPage';
