import { JenkinsClient } from './jenkins-client';
import { ConfigReader } from '@backstage/config';

// Mock node-fetch
jest.mock('node-fetch');
const mockFetch = jest.mocked(require('node-fetch'));

describe('JenkinsClient', () => {
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

  it('should initialize successfully with valid config', () => {
    const client = new JenkinsClient(mockConfig);
    expect(client).toBeDefined();
    expect(client.getBaseUrl()).toBe('http://localhost:8082');
  });

  it('should throw error if username is missing', () => {
    const invalidConfig = new ConfigReader({
      jenkins: {
        baseUrl: 'http://localhost:8082',
        apiKey: 'test-token',
      },
    });

    expect(() => new JenkinsClient(invalidConfig)).toThrow(
      'Jenkins username and apiKey must be configured'
    );
  });

  it('should throw error if apiKey is missing', () => {
    const invalidConfig = new ConfigReader({
      jenkins: {
        baseUrl: 'http://localhost:8082',
        username: 'admin',
      },
    });

    expect(() => new JenkinsClient(invalidConfig)).toThrow(
      'Jenkins username and apiKey must be configured'
    );
  });

  it('should check if job exists', async () => {
    const client = new JenkinsClient(mockConfig);
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'test-job' }),
    } as any);

    const exists = await client.jobExists('test-job');
    expect(exists).toBe(true);
  });

  it('should return false if job does not exist', async () => {
    const client = new JenkinsClient(mockConfig);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as any);

    const exists = await client.jobExists('non-existent-job');
    expect(exists).toBe(false);
  });
});
