import { createApiRef } from '@backstage/core-plugin-api';
import { SourceControlTrendsApi } from '../types';

export const sourceControlTrendsApiRef = createApiRef<SourceControlTrendsApi>({
  id: 'plugin.sourcecontrol-trends.service',
});
