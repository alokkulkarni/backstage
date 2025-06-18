import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  githubAuthApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
  identityApiRef,
  errorApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { GithubAuth, OAuthRequestManager } from '@backstage/core-app-api';
import { 
  githubContributorsApiRef,
  GitHubContributorsApiClient,
} from '@internal/plugin-github-repositories-contibutors';
import {
  jenkinsApiRef,
  createJenkinsApi,
} from '@internal/plugin-jenkins-insights';
import {
  jiraTrendsApiRef,
  JiraTrendsApiClient,
} from '@internal/plugin-jira-trends-frontend';
import {
  sourceControlTrendsApiRef,
  SourceControlTrendsApiClient,
} from '@internal/plugin-sourcecontrol-trends-frontend';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  
  // Add GitHub authentication API
  createApiFactory({
    api: oauthRequestApiRef,
    deps: {},
    factory: () => new OAuthRequestManager(),
  }),
  
  createApiFactory({
    api: githubAuthApiRef,
    deps: { 
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi }) =>
      GithubAuth.create({
        discoveryApi,
        oauthRequestApi,
        defaultScopes: ['repo'],
      }),
  }),
  
  // GitHub Contributors API - now using the properly fixed implementation directly from the plugin
  createApiFactory({
    api: githubContributorsApiRef,
    deps: { 
      configApi: configApiRef, 
      identityApi: identityApiRef,
      githubAuthApi: githubAuthApiRef,
      errorApi: errorApiRef,
    },
    factory: ({ configApi, identityApi, githubAuthApi, errorApi }) => {
      console.log('Creating GitHub Contributors API client from the plugin');
      return new GitHubContributorsApiClient({ 
        configApi, 
        identityApi, 
        githubAuthApi,
        errorApi,
      });
    },
  }),

  // Jenkins API
  createApiFactory({
    api: jenkinsApiRef,
    deps: { 
      discoveryApi: discoveryApiRef, 
      fetchApi: fetchApiRef,
    },
    factory: ({ discoveryApi, fetchApi }) => {
      console.log('Creating Jenkins API client');
      return new createJenkinsApi({ 
        discoveryApi, 
        fetchApi,
      });
    },
  }),

  // Jira Trends API
  createApiFactory({
    api: jiraTrendsApiRef,
    deps: { 
      discoveryApi: discoveryApiRef, 
      fetchApi: fetchApiRef,
    },
    factory: ({ discoveryApi, fetchApi }) => {
      console.log('Creating Jira Trends API client');
      return new JiraTrendsApiClient(discoveryApi, fetchApi);
    },
  }),

  // SourceControl Trends API
  createApiFactory({
    api: sourceControlTrendsApiRef,
    deps: { 
      discoveryApi: discoveryApiRef, 
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, configApi }) => {
      console.log('Creating SourceControl Trends API client');
      return new SourceControlTrendsApiClient({ discoveryApi, configApi });
    },
  }),
];
