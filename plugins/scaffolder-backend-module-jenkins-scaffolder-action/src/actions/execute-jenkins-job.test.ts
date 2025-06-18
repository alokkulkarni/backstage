import { createJenkinsJobExecuteAction } from './execute-jenkins-job';
import { ConfigReader } from '@backstage/config';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { JenkinsClient } from './jenkins-client';

// Mock JenkinsClient
jest.mock('./jenkins-client');
const MockJenkinsClient = jest.mocked(JenkinsClient);

describe('createJenkinsJobExecuteAction', () => {
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
    const action = createJenkinsJobExecuteAction({ config: mockConfig });
    
    expect(action).toBeDefined();
    expect(action.id).toBe('jenkins:execute-job');
    expect(action.description).toBe('Executes a Jenkins job by name');
  });

  it('should execute job successfully', async () => {
    const action = createJenkinsJobExecuteAction({ config: mockConfig });

    // Mock JenkinsClient methods
    const mockJobExists = jest.fn().mockResolvedValue(true);
    const mockTriggerBuild = jest.fn().mockResolvedValue(456); // Return queueId
    const mockGetBaseUrl = jest.fn().mockReturnValue('http://localhost:8082');

    MockJenkinsClient.mockImplementation(() => ({
      jobExists: mockJobExists,
      triggerBuild: mockTriggerBuild,
      getBaseUrl: mockGetBaseUrl,
    } as any));

    const context = createMockActionContext({
      input: {
        jobName: 'test-job',
        waitForCompletion: false,
      } as any,
    });

    const result = await action.handler(context);
    
    expect(result).toEqual({
      queueId: 456,
      building: true,
      buildUrl: 'http://localhost:8082/job/test-job/',
    });
  });

  it('should throw error for non-existent job', async () => {
    const action = createJenkinsJobExecuteAction({ config: mockConfig });

    // Mock JenkinsClient to return false for job existence
    const mockJobExists = jest.fn().mockResolvedValue(false);
    
    MockJenkinsClient.mockImplementation(() => ({
      jobExists: mockJobExists,
    } as any));

    const context = createMockActionContext({
      input: {
        jobName: 'non-existent-job',
      } as any,
    });

    await expect(action.handler(context)).rejects.toThrow('Jenkins job \'non-existent-job\' does not exist');
  });
});
