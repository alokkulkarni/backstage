import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const ephemeralenvironmentsPlugin = createPlugin({
  id: 'ephemeralenvironments',
  routes: {
    root: rootRouteRef,
  },
});

export const EphemeralenvironmentsPage = ephemeralenvironmentsPlugin.provide(
  createRoutableExtension({
    name: 'EphemeralenvironmentsPage',
    component: () =>
      import('./components/EnvironmentsPage/EnvironmentsPage').then(m => m.EnvironmentsPage),
    mountPoint: rootRouteRef,
  }),
);
