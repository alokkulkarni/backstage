import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { InputError } from '@backstage/errors';
import { Config } from '@backstage/config';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

/**
 * Interface for shell script execution options
 */
export interface ShellScriptOptions {
  script: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  shell?: string;
  args?: string[];
  sudo?: boolean;
  interactive?: boolean;
  logOutput?: boolean;
  continueOnError?: boolean;
  encoding?: BufferEncoding;
}

/**
 * Interface for shell script execution result
 */
export interface ShellScriptResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  command: string;
  duration: number;
  success: boolean;
}

/**
 * Executes a shell script with comprehensive options and error handling
 * 
 * @param options - Shell script execution options
 * @param logger - Logger instance for logging
 * @returns Promise<ShellScriptResult> - Execution result
 */
async function executeShellScript(
  options: ShellScriptOptions,
  logger: any
): Promise<ShellScriptResult> {
  const startTime = Date.now();
  
  // Validate required parameters
  if (!options.script || options.script.trim().length === 0) {
    throw new InputError('Shell script content is required and cannot be empty');
  }

  // Set default values
  const {
    script,
    workingDirectory = process.cwd(),
    environment = {},
    timeout = 300000, // 5 minutes default
    shell = process.platform === 'win32' ? 'cmd' : '/bin/bash',
    args = [],
    sudo = false,
    interactive = false,
    logOutput = true,
    continueOnError = false,
    encoding = 'utf8'
  } = options;

  // Create temporary script file
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'backstage-shell-script-'));
  const scriptExtension = process.platform === 'win32' ? '.bat' : '.sh';
  const scriptPath = join(tempDir, `script${scriptExtension}`);
  
  try {
    // Write script to temporary file
    await fs.writeFile(scriptPath, script, { encoding, mode: 0o755 });
    
    logger.info(`Created temporary script file: ${scriptPath}`);
    if (logOutput) {
      logger.info(`Script content:\n${script}`);
    }

    // Prepare command and arguments
    let command: string;
    let commandArgs: string[];

    if (process.platform === 'win32') {
      command = 'cmd';
      commandArgs = ['/c', scriptPath, ...args];
    } else {
      if (sudo) {
        command = 'sudo';
        commandArgs = [shell, scriptPath, ...args];
      } else {
        command = shell;
        commandArgs = [scriptPath, ...args];
      }
    }

    // Prepare environment variables
    const env = {
      ...process.env,
      ...environment,
    };

    // Resolve working directory
    const resolvedWorkingDirectory = resolve(workingDirectory);
    
    // Validate working directory exists
    try {
      await fs.access(resolvedWorkingDirectory);
    } catch (error) {
      throw new InputError(`Working directory does not exist: ${resolvedWorkingDirectory}`);
    }

    logger.info(`Executing command: ${command} ${commandArgs.join(' ')}`);
    logger.info(`Working directory: ${resolvedWorkingDirectory}`);
    logger.info(`Environment variables: ${Object.keys(environment).join(', ')}`);

    // Execute the shell script
    const result = await new Promise<ShellScriptResult>((promiseResolve, promiseReject) => {
      const childProcess = spawn(command, commandArgs, {
        cwd: resolvedWorkingDirectory,
        env,
        stdio: interactive ? 'inherit' : 'pipe',
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // Set timeout if specified
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          childProcess.kill('SIGTERM');
          
          // Force kill after additional 10 seconds
          setTimeout(() => {
            if (!childProcess.killed) {
              childProcess.kill('SIGKILL');
            }
          }, 10000);
          
          promiseReject(new Error(`Shell script execution timed out after ${timeout}ms`));
        }, timeout);
      }

      // Handle stdout
      if (childProcess.stdout && !interactive) {
        childProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString(encoding);
          stdout += output;
          if (logOutput) {
            logger.info(`STDOUT: ${output.trim()}`);
          }
        });
      }

      // Handle stderr
      if (childProcess.stderr && !interactive) {
        childProcess.stderr.on('data', (data: Buffer) => {
          const output = data.toString(encoding);
          stderr += output;
          if (logOutput) {
            logger.warn(`STDERR: ${output.trim()}`);
          }
        });
      }

      // Handle process completion
      childProcess.on('close', (code: number | null) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const exitCode = code ?? -1;
        const duration = Date.now() - startTime;
        const success = exitCode === 0;

        const executionResult: ShellScriptResult = {
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          command: `${command} ${commandArgs.join(' ')}`,
          duration,
          success,
        };

        logger.info(`Script execution completed with exit code: ${exitCode}`);
        logger.info(`Execution duration: ${duration}ms`);

        if (!success && !continueOnError) {
          promiseReject(new Error(`Shell script failed with exit code ${exitCode}. STDERR: ${stderr}`));
        } else {
          promiseResolve(executionResult);
        }
      });

      // Handle process errors
      childProcess.on('error', (error: Error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        promiseReject(new Error(`Failed to execute shell script: ${error.message}`));
      });
    });

    return result;

  } finally {
    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      logger.info(`Cleaned up temporary directory: ${tempDir}`);
    } catch (error) {
      logger.warn(`Failed to clean up temporary directory ${tempDir}: ${error}`);
    }
  }
}

/**
 * Creates a comprehensive `shell:execute` Scaffolder action for executing shell scripts.
 * 
 * This action provides a secure and flexible way to execute shell scripts as part of
 * software templates with comprehensive logging, error handling, and timeout support.
 * 
 * Features:
 * - Cross-platform support (Windows, macOS, Linux)
 * - Comprehensive error handling and validation
 * - Timeout support with graceful termination
 * - Environment variable injection from app-config.yaml
 * - Working directory specification
 * - Interactive and non-interactive modes
 * - Sudo support for privileged operations
 * - Detailed logging and output capture
 * - Temporary file management
 * - Configurable shell selection
 * 
 * @param options - Configuration options
 * @public
 */
export function createShellExecuteAction(options?: { config?: Config }) {
  return createTemplateAction<{
    script: string;
    workingDirectory?: string;
    environment?: Record<string, string>;
    timeout?: number;
    shell?: string;
    args?: string[];
    sudo?: boolean;
    interactive?: boolean;
    logOutput?: boolean;
    continueOnError?: boolean;
    encoding?: BufferEncoding;
  }>({
    id: 'shell:execute',
    description: 'Executes a shell script with comprehensive options and error handling',
    supportsDryRun: false,
    schema: {
      input: {
        type: 'object',
        required: ['script'],
        properties: {
          script: {
            title: 'Shell Script',
            description: 'The shell script content to execute. Can be multi-line and include any valid shell commands.',
            type: 'string',
            examples: [
              'echo "Hello World"',
              'npm install\nnpm run build\necho "Build completed"',
              'mkdir -p ./output\ncp src/* ./output/\nls -la ./output'
            ]
          },
          workingDirectory: {
            title: 'Working Directory',
            description: 'The directory to execute the script in. Defaults to the current working directory.',
            type: 'string',
            default: '.',
            examples: ['./src', '/tmp/build', '${{ parameters.repoPath }}']
          },
          environment: {
            title: 'Environment Variables',
            description: 'Additional environment variables to set for the script execution.',
            type: 'object',
            additionalProperties: {
              type: 'string'
            },
            examples: [
              { 'NODE_ENV': 'production', 'API_URL': 'https://api.example.com' },
              { 'BUILD_NUMBER': '${{ parameters.buildNumber }}' }
            ]
          },
          timeout: {
            title: 'Timeout (milliseconds)',
            description: 'Maximum time to wait for script execution before timing out. Default is 300000ms (5 minutes).',
            type: 'number',
            default: 300000,
            minimum: 1000,
            maximum: 3600000,
            examples: [30000, 120000, 600000]
          },
          shell: {
            title: 'Shell',
            description: 'The shell to use for executing the script. Defaults to /bin/bash on Unix and cmd on Windows.',
            type: 'string',
            examples: ['/bin/bash', '/bin/sh', '/bin/zsh', 'powershell', 'cmd'],
            default: process.platform === 'win32' ? 'cmd' : '/bin/bash'
          },
          args: {
            title: 'Arguments',
            description: 'Additional arguments to pass to the shell script.',
            type: 'array',
            items: {
              type: 'string'
            },
            examples: [['--verbose'], ['--env', 'production', '--debug']]
          },
          sudo: {
            title: 'Use Sudo',
            description: 'Whether to execute the script with sudo privileges (Unix only).',
            type: 'boolean',
            default: false
          },
          interactive: {
            title: 'Interactive Mode',
            description: 'Whether to run the script in interactive mode (inherits stdio).',
            type: 'boolean',
            default: false
          },
          logOutput: {
            title: 'Log Output',
            description: 'Whether to log script output to the scaffolder logs.',
            type: 'boolean',
            default: true
          },
          continueOnError: {
            title: 'Continue on Error',
            description: 'Whether to continue template execution even if the script fails.',
            type: 'boolean',
            default: false
          },
          encoding: {
            title: 'Output Encoding',
            description: 'The character encoding to use for reading script output.',
            type: 'string',
            enum: ['utf8', 'ascii', 'utf16le', 'ucs2', 'base64', 'latin1', 'binary', 'hex'],
            default: 'utf8'
          }
        }
      },
      output: {
        type: 'object',
        properties: {
          exitCode: {
            title: 'Exit Code',
            description: 'The exit code returned by the shell script',
            type: 'number'
          },
          stdout: {
            title: 'Standard Output',
            description: 'The standard output from the shell script execution',
            type: 'string'
          },
          stderr: {
            title: 'Standard Error',
            description: 'The standard error output from the shell script execution',
            type: 'string'
          },
          command: {
            title: 'Executed Command',
            description: 'The actual command that was executed',
            type: 'string'
          },
          duration: {
            title: 'Execution Duration',
            description: 'The time taken to execute the script in milliseconds',
            type: 'number'
          },
          success: {
            title: 'Success',
            description: 'Whether the script executed successfully (exit code 0)',
            type: 'boolean'
          }
        }
      }
    },
    async handler(ctx) {
      const {
        script,
        workingDirectory,
        environment,
        timeout,
        shell,
        args,
        sudo,
        interactive,
        logOutput,
        continueOnError,
        encoding
      } = ctx.input;

      // Extract environment variables from app-config.yaml scaffolder configuration
      let configEnvironment: Record<string, string> = {};
      if (options?.config) {
        try {
          // Get scaffolder action config section
          const scaffolderConfig = options.config.getOptionalConfig('scaffolder');
          if (scaffolderConfig) {
            // Get action-specific environment variables
            const actionConfig = scaffolderConfig.getOptionalConfig('actions.shell:execute');
            if (actionConfig) {
              const actionEnv = actionConfig.getOptionalConfig('environment');
              if (actionEnv) {
                configEnvironment = actionEnv.get() as Record<string, string>;
                ctx.logger.info(`Loaded ${Object.keys(configEnvironment).length} environment variables from scaffolder config`);
              }
            }

            // Get global scaffolder environment variables
            const globalEnv = scaffolderConfig.getOptionalConfig('environment');
            if (globalEnv) {
              const globalEnvironment = globalEnv.get() as Record<string, string>;
              configEnvironment = { ...globalEnvironment, ...configEnvironment };
              ctx.logger.info(`Loaded ${Object.keys(globalEnvironment).length} global environment variables from scaffolder config`);
            }

            // Map common configurations from app-config.yaml
            const integrations = options.config.getOptionalConfig('integrations');
            if (integrations) {
              // Map GitHub configuration
              const github = integrations.getOptionalConfig('github');
              if (github && Array.isArray(github.get())) {
                const githubConfig = github.get() as Array<{ host?: string; token?: string; }>;
                if (githubConfig.length > 0 && githubConfig[0].token) {
                  configEnvironment.GITHUB_TOKEN = githubConfig[0].token;
                }
              }
            }

            // Map Jenkins configuration
            const jenkins = options.config.getOptionalConfig('jenkins');
            if (jenkins) {
              if (jenkins.has('baseUrl')) {
                configEnvironment.JENKINS_BASE_URL = jenkins.getString('baseUrl');
              }
              if (jenkins.has('username')) {
                configEnvironment.JENKINS_USERNAME = jenkins.getString('username');
              }
              if (jenkins.has('apiKey')) {
                configEnvironment.JENKINS_API_KEY = jenkins.getString('apiKey');
              }
            }

            // Map Jira configuration
            const jira = options.config.getOptionalConfig('jira');
            if (jira) {
              if (jira.has('instances') && Array.isArray(jira.get('instances'))) {
                const instances = jira.get('instances') as Array<{ apiToken?: string; email?: string; baseUrl?: string; }>;
                if (instances.length > 0) {
                  if (instances[0].apiToken) {
                    configEnvironment.JIRA_API_TOKEN = instances[0].apiToken;
                  }
                  if (instances[0].email) {
                    configEnvironment.JIRA_USERNAME = instances[0].email;
                  }
                  if (instances[0].baseUrl) {
                    configEnvironment.JIRA_BASE_URL = instances[0].baseUrl;
                  }
                }
              }
            }

            // Map SonarQube configuration
            const sonarqube = options.config.getOptionalConfig('sonarqube');
            if (sonarqube) {
              if (sonarqube.has('baseUrl')) {
                configEnvironment.SONARQUBE_BASE_URL = sonarqube.getString('baseUrl');
              }
              if (sonarqube.has('apiKey')) {
                configEnvironment.SONARQUBE_API_KEY = sonarqube.getString('apiKey');
              }
            }

            // Map application configuration
            const app = options.config.getOptionalConfig('app');
            if (app) {
              if (app.has('baseUrl')) {
                configEnvironment.BACKSTAGE_BASE_URL = app.getString('baseUrl');
              }
              if (app.has('title')) {
                configEnvironment.BACKSTAGE_APP_TITLE = app.getString('title');
              }
              
              // Map terraform environments config
              const terraformEnv = app.getOptionalConfig('terraformEnvironments');
              if (terraformEnv) {
                if (terraformEnv.has('defaultOwner')) {
                  configEnvironment.TERRAFORM_DEFAULT_OWNER = terraformEnv.getString('defaultOwner');
                }
                if (terraformEnv.has('defaultRepo')) {
                  configEnvironment.TERRAFORM_DEFAULT_REPO = terraformEnv.getString('defaultRepo');
                }
              }
            }

            // Map backend configuration
            const backend = options.config.getOptionalConfig('backend');
            if (backend) {
              if (backend.has('baseUrl')) {
                configEnvironment.BACKSTAGE_BACKEND_URL = backend.getString('baseUrl');
              }
            }
          }
        } catch (error) {
          ctx.logger.warn(`Failed to load environment variables from config: ${error}`);
        }
      }

      // Merge environment variables (input takes precedence over config)
      const mergedEnvironment = { ...configEnvironment, ...environment };

      ctx.logger.info('Starting shell script execution');
      ctx.logger.info(`Script length: ${script.length} characters`);
      ctx.logger.info(`Working directory: ${workingDirectory || 'current directory'}`);
      ctx.logger.info(`Environment variables: ${Object.keys(mergedEnvironment).length} total (${Object.keys(configEnvironment).length} from config, ${environment ? Object.keys(environment).length : 0} from input)`);
      ctx.logger.info(`Timeout: ${timeout || 300000}ms`);
      ctx.logger.info(`Shell: ${shell || 'default'}`);
      ctx.logger.info(`Arguments: ${args ? args.length : 0} provided`);
      ctx.logger.info(`Sudo: ${sudo || false}`);
      ctx.logger.info(`Interactive: ${interactive || false}`);

      try {
        // Resolve working directory relative to workspace path if provided
        const resolvedWorkingDirectory = workingDirectory 
          ? resolve(ctx.workspacePath, workingDirectory)
          : ctx.workspacePath;

        // Execute the shell script
        const result = await executeShellScript({
          script,
          workingDirectory: resolvedWorkingDirectory,
          environment: mergedEnvironment,
          timeout,
          shell,
          args,
          sudo,
          interactive,
          logOutput,
          continueOnError,
          encoding
        }, ctx.logger);

        // Set outputs for use in subsequent template steps
        ctx.output('exitCode', result.exitCode);
        ctx.output('stdout', result.stdout);
        ctx.output('stderr', result.stderr);
        ctx.output('command', result.command);
        ctx.output('duration', result.duration);
        ctx.output('success', result.success);

        ctx.logger.info('Shell script execution completed successfully');
        ctx.logger.info(`Final exit code: ${result.exitCode}`);
        ctx.logger.info(`Total execution time: ${result.duration}ms`);

        if (result.stdout && logOutput) {
          ctx.logger.info(`Script output: ${result.stdout.substring(0, 1000)}${result.stdout.length > 1000 ? '... (truncated)' : ''}`);
        }

        if (result.stderr && logOutput) {
          ctx.logger.warn(`Script errors: ${result.stderr.substring(0, 1000)}${result.stderr.length > 1000 ? '... (truncated)' : ''}`);
        }

      } catch (error) {
        ctx.logger.error(`Shell script execution failed: ${error}`);
        
        // Set error outputs
        ctx.output('exitCode', -1);
        ctx.output('stdout', '');
        ctx.output('stderr', String(error));
        ctx.output('command', 'failed');
        ctx.output('duration', 0);
        ctx.output('success', false);

        // Re-throw the error to fail the template step unless continueOnError is true
        if (!continueOnError) {
          throw error;
        } else {
          ctx.logger.warn('Continuing template execution despite script failure (continueOnError=true)');
        }
      }
    },
  });
}
