import { testBackstagePluginPlugin } from './plugin';

describe('test-backstage-plugin', () => {
  it('should export plugin', () => {
    expect(testBackstagePluginPlugin).toBeDefined();
  });
});
