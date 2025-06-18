import {
  createPlugin,
  createRoutableExtension,
  createComponentExtension,
  configApiRef,
  identityApiRef,
  createApiFactory,
  githubAuthApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { githubContributorsApiRef } from './api';
import { GitHubContributorsApiClient } from './api/GitHubContributorsApiClient';

export const githubRepositoriesContibutorsPlugin = createPlugin({
  id: 'github-repositories-contibutors',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: githubContributorsApiRef,
      deps: { 
        configApi: configApiRef, 
        identityApi: identityApiRef,
        githubAuthApi: githubAuthApiRef,
        errorApi: errorApiRef,
      },
      factory: ({ configApi, identityApi, githubAuthApi, errorApi }) => {
        console.log('Creating GitHub Contributors API client from plugin.ts');
        return new GitHubContributorsApiClient({ 
          configApi, 
          identityApi, 
          githubAuthApi,
          errorApi,
        });
      },
    }),
  ],
});

export const GithubRepositoriesContibutorsPage = githubRepositoriesContibutorsPlugin.provide(
  createRoutableExtension({
    name: 'GithubRepositoriesContibutorsPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);

// Export individual cards for use in the homepage
export const MyPullRequestsCard = githubRepositoriesContibutorsPlugin.provide(
  createComponentExtension({
    name: 'MyPullRequestsCard',
    component: {
      lazy: () =>
        import('./components/MyPullRequestsCard').then(
          m => m.MyPullRequestsCard,
        ),
    },
  }),
);

export const ActionRequiredPullRequestsCard = githubRepositoriesContibutorsPlugin.provide(
  createComponentExtension({
    name: 'ActionRequiredPullRequestsCard',
    component: {
      lazy: () =>
        import('./components/ActionRequiredPullRequestsCard').then(
          m => m.ActionRequiredPullRequestsCard,
        ),
    },
  }),
);

export const ContributorRepositoriesCard = githubRepositoriesContibutorsPlugin.provide(
  createComponentExtension({
    name: 'ContributorRepositoriesCard',
    component: {
      lazy: () =>
        import('./components/ContributorRepositoriesCard').then(
          m => m.ContributorRepositoriesCard,
        ),
    },
  }),
);
