import { JenkinsApiClient } from './JenkinsApi';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

// Mock the dependencies
const mockDiscoveryApi: jest.Mocked<DiscoveryApi> = {
  getBaseUrl: jest.fn(),
};

const mockFetchApi: jest.Mocked<FetchApi> = {
  fetch: jest.fn(),
};

describe('JenkinsApiClient Console Parsing', () => {
  let jenkinsApi: JenkinsApiClient;

  beforeEach(() => {
    jenkinsApi = new JenkinsApiClient({ discoveryApi: mockDiscoveryApi, fetchApi: mockFetchApi });
    jest.clearAllMocks();
  });

  describe('parseConsoleFailure', () => {
    beforeEach(() => {
      mockDiscoveryApi.getBaseUrl.mockResolvedValue('http://localhost:8080');
    });

    it('should parse Maven compilation errors', async () => {
      const consoleOutput = `
[INFO] Compiling 15 source files to /workspace/target/classes
[ERROR] /workspace/src/main/java/com/example/Service.java:[25,15] cannot find symbol
[ERROR]   symbol:   variable undeclaredVariable
[ERROR]   location: class com.example.Service
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.8.1:compile (default-compile)
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '500']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('test-job', 123);

      expect(failures).toHaveLength(2);
      expect(failures[0]).toMatchObject({
        errorType: 'Maven Error',
        errorMessage: '/workspace/src/main/java/com/example/Service.java:[25,15] cannot find symbol',
      });
      expect(failures[1]).toMatchObject({
        errorType: 'Maven Error',
        errorMessage: 'Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.8.1:compile (default-compile)',
      });
    });

    it('should parse Gradle build failures', async () => {
      const consoleOutput = `
> Task :compileJava FAILED
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler error output for details.

* Try:
Run with --stacktrace option to get the stack trace.
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '300']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('gradle-job', 456);

      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatchObject({
        errorType: 'Gradle Exception',
        errorMessage: expect.stringContaining('What went wrong:'),
      });
    });

    it('should parse test failures', async () => {
      const consoleOutput = `
[INFO] Running com.example.UserServiceTest
[ERROR] Tests run: 5, Failures: 2, Errors: 0, Skipped: 0, Time elapsed: 2.345 s <<< FAILURE!
[ERROR] testCreateUser(com.example.UserServiceTest)  Time elapsed: 0.123 s  <<< FAILURE!
java.lang.AssertionError: Expected user to be created
        at org.junit.Assert.fail(Assert.java:88)
        at com.example.UserServiceTest.testCreateUser(UserServiceTest.java:45)
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '400']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('test-job', 789);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorType: 'Test Failure',
          })
        ])
      );
    });

    it('should parse Docker build errors', async () => {
      const consoleOutput = `
Step 5/8 : RUN npm install
 ---> Running in 1234567890ab
docker: Error response from daemon: failed to build: container stopped with exit code 1
ERROR: Service 'app' failed to build: Build failed
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '200']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('docker-job', 101);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorType: 'Docker Error',
          })
        ])
      );
    });

    it('should parse NPM errors', async () => {
      const consoleOutput = `
npm WARN deprecated package@1.0.0: This package is deprecated
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /workspace/package.json
npm ERR! errno -2
npm ERR! enoent ENOENT: no such file or directory, open '/workspace/package.json'
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '300']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('npm-job', 202);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorType: 'NPM Error',
          })
        ])
      );
    });

    it('should parse Git errors', async () => {
      const consoleOutput = `
+ git clone https://github.com/example/repo.git
Cloning into 'repo'...
fatal: remote error: access denied or repository not found
ERROR: Repository access denied
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '150']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('git-job', 303);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorType: 'Git Error',
          })
        ])
      );
    });

    it('should parse Python errors', async () => {
      const consoleOutput = `
File "/workspace/app.py", line 15, in <module>
    import nonexistent_module
ModuleNotFoundError: No module named 'nonexistent_module'
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '120']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('python-job', 404);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            errorType: 'Python Error',
            errorMessage: expect.stringContaining('No module named'),
          })
        ])
      );
    });

    it('should extract timestamps when present', async () => {
      const consoleOutput = `
[2024-01-15T10:30:45.123Z] Starting build...
[2024-01-15T10:31:02.456Z] [ERROR] Build failed: compilation error
[2024-01-15T10:31:02.500Z] BUILD FAILED
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '200']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('timestamp-job', 505);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0].timestamp).toContain('2024-01-15T10:31:02');
    });

    it('should handle empty or malformed console output gracefully', async () => {
      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '0']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('empty-job', 606);

      expect(failures).toHaveLength(0);
    });

    it('should handle console output fetch failures', async () => {
      mockFetchApi.fetch.mockRejectedValueOnce(new Error('Network error'));

      const failures = await jenkinsApi.parseConsoleFailure('error-job', 707);

      expect(failures).toHaveLength(0);
    });

    it('should limit the number of failures returned', async () => {
      // Create console output with many repeated errors
      const consoleOutput = Array(20).fill('[ERROR] Build error: repeated failure').join('\n');

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '500']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('many-errors-job', 808);

      // Should limit to max 10 failures as per implementation
      expect(failures.length).toBeLessThanOrEqual(10);
    });

    it('should avoid duplicate similar errors', async () => {
      const consoleOutput = `
[ERROR] Build failed: compilation error
[ERROR] Build failed: compilation error
[ERROR] Build failed: compilation error
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '150']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('duplicate-job', 909);

      // Should deduplicate identical errors
      expect(failures.length).toBeLessThan(3);
    });

    it('should find general build termination messages when no specific errors found', async () => {
      const consoleOutput = `
[INFO] Starting build process...
[INFO] Downloading dependencies...
[INFO] Building project...
Build step 'Execute shell' marked build as failure
Finished: FAILURE
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '200']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('general-failure-job', 1010);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0]).toMatchObject({
        errorType: 'Build Termination',
        errorMessage: expect.stringContaining('marked build as failure'),
      });
    });

    it('should extract location information when available', async () => {
      const consoleOutput = `
[ERROR] /workspace/src/main/java/Service.java:[42,15] cannot find symbol
  symbol:   variable undeclaredVar
  location: class Service
      `.trim();

      mockFetchApi.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(consoleOutput),
        headers: new Map([
          ['X-More-Data', 'false'],
          ['X-Text-Size', '150']
        ])
      } as any);

      const failures = await jenkinsApi.parseConsoleFailure('location-job', 1111);

      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0].location).toBeDefined();
      expect(failures[0].location).toContain('Service.java');
    });
  });
});
