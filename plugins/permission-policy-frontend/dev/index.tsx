import { createDevApp } from '@backstage/dev-utils';
import { permissionPolicyPlugin, PermissionPolicyPage } from '../src/plugin';

createDevApp()
  .registerPlugin(permissionPolicyPlugin)
  .addPage({
    element: <PermissionPolicyPage />,
    title: 'Root Page',
    path: '/permission-policy-frontend',
  })
  .render();
