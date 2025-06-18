import { jenkinsInsightsPlugin } from './plugin';

describe('jenkins-insights', () => {
  it('should export plugin', () => {
    expect(jenkinsInsightsPlugin).toBeDefined();
  });
});
