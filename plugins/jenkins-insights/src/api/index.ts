import { createApiRef } from '@backstage/core-plugin-api';
import { JenkinsApi, JenkinsApiClient } from './JenkinsApi';

export const jenkinsApiRef = createApiRef<JenkinsApi>({
  id: 'plugin.jenkins-insights.service',
});

export const createJenkinsApi = JenkinsApiClient;

export * from './types';
export * from './JenkinsApi';
