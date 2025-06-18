import { createJenkinsJobAction } from './create-jenkins-job';
import { ConfigReader } from '@backstage/config';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import * as fs from 'fs-extra';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('./jenkins-client');

const mockFs = jest.mocked(fs);

describe('createJenkinsJobAction', () => {
  const mockConfig = new ConfigReader({
    jenkins: {
      baseUrl: 'http://localhost:8082',
      username: 'admin',
      apiKey: 'test-token',
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create action successfully', async () => {
    const action = createJenkinsJobAction({ config: mockConfig });
    
    expect(action).toBeDefined();
    expect(action.id).toBe('jenkins:create-job');
    expect(action.description).toBe('Creates Jenkins pipeline jobs based on Jenkinsfiles in skeleton directories');
  });

  it('should throw error for missing skeleton path', async () => {
    const action = createJenkinsJobAction({ config: mockConfig });

    // Mock fs.existsSync to return false for the skeleton path
    mockFs.existsSync.mockReturnValue(false);

    const context = createMockActionContext({
      input: {
        artifactId: 'my-service',
        skeletonPath: 'nonexistent',
      } as any,
      workspacePath: '/tmp/test-workspace',
    });

    await expect(action.handler(context)).rejects.toThrow();
  });

  it('should handle empty skeleton directory', async () => {
    const action = createJenkinsJobAction({ config: mockConfig });

    // Mock fs.existsSync to return true for skeleton path
    mockFs.existsSync.mockReturnValue(true);
    
    // Mock fs.readdir (async) to return empty array with file types
    (mockFs.readdir as jest.Mock).mockResolvedValue([]);

    const context = createMockActionContext({
      input: {
        artifactId: 'my-service',
        skeletonPath: 'empty-skeleton',
      } as any,
      workspacePath: '/tmp/test-workspace',
    });

    const result = await action.handler(context);
    expect(result).toEqual({ createdJobs: [] });
  });
});
