/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import { permissionPolicyApiRef, PermissionPolicyApiClient } from './api/PermissionPolicyApi';

export const permissionPolicyPlugin = createPlugin({
  id: 'permission-policy',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: permissionPolicyApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new PermissionPolicyApiClient({
          discoveryApi,
          fetchApi,
        }),
    }),
  ],
});

export const PermissionPolicyPage = permissionPolicyPlugin.provide(
  createRoutableExtension({
    name: 'PermissionPolicyPage',
    component: () =>
      import('./components/PermissionPolicyPage').then(m => m.PermissionPolicyPage),
    mountPoint: rootRouteRef,
  }),
);
