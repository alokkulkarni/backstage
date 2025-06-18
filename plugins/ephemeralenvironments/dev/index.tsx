import { createDevApp } from '@backstage/dev-utils';
import { ephemeralenvironmentsPlugin, EphemeralenvironmentsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(ephemeralenvironmentsPlugin)
  .addPage({
    element: <EphemeralenvironmentsPage />,
    title: 'Root Page',
    path: '/ephemeralenvironments',
  })
  .render();
