import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JenkinsClient } from './jenkins-client';
import { Config } from '@backstage/config';

/**
 * Creates a scaffolder action that executes Jenkins jobs by name
 */
export function createJenkinsJobExecuteAction(options: { config: Config }) {
  return createTemplateAction<{
    jobName: string;
    parameters?: Record<string, any>;
    waitForCompletion?: boolean;
    timeout?: number;
  }>({
    id: 'jenkins:execute-job',
    description: 'Executes a Jenkins job by name',
    schema: {
      input: {
        type: 'object',
        required: ['jobName'],
        properties: {
          jobName: {
            type: 'string',
            title: 'Job Name',
            description: 'Name of the Jenkins job to execute',
          },
          parameters: {
            type: 'object',
            title: 'Build Parameters',
            description: 'Parameters to pass to the Jenkins job',
          },
          waitForCompletion: {
            type: 'boolean',
            title: 'Wait for Completion',
            description: 'Whether to wait for the build to complete before returning',
            default: true,
          },
          timeout: {
            type: 'number',
            title: 'Timeout (seconds)',
            description: 'Maximum time to wait for build completion in seconds',
            default: 600,
          },
        },
      },
    },
    async handler(ctx) {
      const { jobName, parameters, waitForCompletion = true, timeout = 600 } = ctx.input;
      const { logger } = ctx;

      logger.info(`Executing Jenkins job: ${jobName}`);

      try {
        // Initialize Jenkins client
        const jenkinsClient = new JenkinsClient(options.config);

        // Check if job exists
        const jobExists = await jenkinsClient.jobExists(jobName);
        if (!jobExists) {
          throw new Error(`Jenkins job '${jobName}' does not exist`);
        }

        // Trigger the build
        logger.info(`Triggering build for job: ${jobName}${parameters ? ' with parameters' : ''}`);
        const buildResult = await jenkinsClient.triggerBuild(jobName, parameters);
        
        logger.info(`Build queued with ID: ${buildResult.queueId}`);

        // If we don't need to wait, return immediately
        if (!waitForCompletion) {
          ctx.output('queueId', buildResult.queueId || 0);
          ctx.output('building', true);
          ctx.output('buildUrl', `${jenkinsClient.getBaseUrl()}/job/${encodeURIComponent(jobName)}/`);
          return;
        }

        // Wait for build to start and get build number
        logger.info(`Waiting for build to start...`);
        let actualBuildResult;
        let retries = 0;
        const maxRetries = 30; // Wait up to 30 seconds for build to start

        while (retries < maxRetries) {
          try {
            if (buildResult.queueId) {
              const queueItem = await jenkinsClient.getQueueItem(buildResult.queueId);
              if (queueItem?.executable?.number) {
                actualBuildResult = await jenkinsClient.getBuildInfo(jobName, queueItem.executable.number);
                break;
              }
            }
          } catch (error) {
            // Queue item might not be available yet, continue retrying
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }

        if (!actualBuildResult) {
          throw new Error(`Build did not start within ${maxRetries} seconds`);
        }

        logger.info(`Build started with number: ${actualBuildResult.number}`);

        // Wait for build completion if requested
        if (waitForCompletion) {
          logger.info(`Waiting for build completion (timeout: ${timeout}s)...`);
          actualBuildResult = await jenkinsClient.waitForBuildCompletion(
            jobName, 
            actualBuildResult.number, 
            timeout * 1000
          );
          
          logger.info(`Build completed with result: ${actualBuildResult.result}`);
        }

        ctx.output('buildNumber', actualBuildResult.number);
        ctx.output('buildUrl', actualBuildResult.url);
        ctx.output('result', actualBuildResult.result);
        ctx.output('building', actualBuildResult.building);
        ctx.output('queueId', buildResult.queueId || 0);
      } catch (error) {
        logger.error(`Failed to execute Jenkins job ${jobName}: ${error}`);
        throw error;
      }
    },
  });
}
