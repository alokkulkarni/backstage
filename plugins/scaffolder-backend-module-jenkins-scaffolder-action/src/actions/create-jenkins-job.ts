import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JenkinsClient, JenkinsJob } from './jenkins-client';
import { Config } from '@backstage/config';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Creates a scaffolder action that creates Jenkins pipeline jobs based on Jenkinsfiles
 * found in the local skeleton directories or scaffolding templates.
 */
export function createJenkinsJobAction(options: { config: Config }) {
  return createTemplateAction<{
    artifactId: string;
    skeletonPath: string;
    baseJobName?: string;
    description?: string;
    parameters?: Record<string, any>;
  }>({
    id: 'jenkins:create-job',
    description: 'Creates Jenkins pipeline jobs based on Jenkinsfiles in skeleton directories',
    schema: {
      input: {
        type: 'object',
        required: ['artifactId', 'skeletonPath'],
        properties: {
          artifactId: {
            type: 'string',
            title: 'Artifact ID',
            description: 'The artifact ID from scaffolding template, used as base for job names',
          },
          skeletonPath: {
            type: 'string',
            title: 'Skeleton Path',
            description: 'Path to the skeleton directory containing Jenkinsfiles',
          },
          baseJobName: {
            type: 'string',
            title: 'Base Job Name',
            description: 'Optional base name for the jobs. If not provided, artifactId will be used',
          },
          description: {
            type: 'string',
            title: 'Job Description',
            description: 'Description for the Jenkins jobs',
          },
          parameters: {
            type: 'object',
            title: 'Job Parameters',
            description: 'Default parameters for the Jenkins jobs',
          },
        },
      },
    },
    async handler(ctx) {
      const { artifactId, skeletonPath, baseJobName, description, parameters } = ctx.input;
      const { logger } = ctx;

      logger.info(`Creating Jenkins jobs for artifact: ${artifactId}`);
      logger.info(`Input skeleton path: ${skeletonPath}`);
      logger.info(`Workspace path: ${ctx.workspacePath}`);

      try {
        // Initialize Jenkins client
        const jenkinsClient = new JenkinsClient(options.config);

        // Test Jenkins connectivity before proceeding
        logger.info('Testing Jenkins connectivity...');
        const connectionTest = await jenkinsClient.testConnection();
        if (!connectionTest.success) {
          const errorMessage = `Jenkins connection failed: ${connectionTest.message}`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }
        logger.info(`Jenkins connection successful: ${connectionTest.message}`);

        // Enhanced skeleton path resolution that handles post-publish scenarios
        let resolvedSkeletonPath: string;
        let jenkinsfiles: string[] = [];
        
        // Debug workspace contents
        try {
          const workspaceContents = fs.readdirSync(ctx.workspacePath);
          logger.info(`Workspace contents: ${workspaceContents.join(', ')}`);
        } catch (error) {
          logger.warn(`Could not read workspace directory: ${error}`);
        }

        // Strategy 1: Look for Jenkinsfiles directly in the workspace (post-publish scenario)
        logger.info(`Strategy 1: Searching for Jenkinsfiles in workspace root`);
        jenkinsfiles = await findJenkinsfiles(ctx.workspacePath);
        if (jenkinsfiles.length > 0) {
          logger.info(`Found ${jenkinsfiles.length} Jenkinsfiles in workspace root: ${jenkinsfiles.map(f => path.basename(f)).join(', ')}`);
        } else {
          // Strategy 2: Use traditional skeleton path resolution
          logger.info(`Strategy 2: Using skeleton path resolution`);
          
          // Handle different skeleton path formats
          if (path.isAbsolute(skeletonPath)) {
            // If absolute path, use it directly but ensure it exists
            resolvedSkeletonPath = skeletonPath;
            logger.info(`Using absolute skeleton path: ${resolvedSkeletonPath}`);
          } else {
            // If relative path, resolve it relative to workspace
            resolvedSkeletonPath = path.resolve(ctx.workspacePath, skeletonPath);
            logger.info(`Resolved relative skeleton path: ${resolvedSkeletonPath}`);
          }
          
          // Try alternative locations if the primary path doesn't exist
          if (!fs.existsSync(resolvedSkeletonPath)) {
            logger.warn(`Primary skeleton path does not exist: ${resolvedSkeletonPath}`);
            
            // Try looking in the skeleton subdirectory of the workspace
            const alternativeSkeletonPath = path.resolve(ctx.workspacePath, 'skeleton');
            if (fs.existsSync(alternativeSkeletonPath)) {
              resolvedSkeletonPath = alternativeSkeletonPath;
              logger.info(`Found skeleton files at alternative path: ${alternativeSkeletonPath}`);
            } else {
              // Try with the original skeletonPath as a subdirectory of skeleton
              const nestedSkeletonPath = path.resolve(ctx.workspacePath, 'skeleton', skeletonPath);
              if (fs.existsSync(nestedSkeletonPath)) {
                resolvedSkeletonPath = nestedSkeletonPath;
                logger.info(`Found skeleton files at nested path: ${nestedSkeletonPath}`);
              } else {
                // Try looking for template directory
                const templateSkeletonPath = path.resolve(ctx.workspacePath, 'template', 'skeleton');
                if (fs.existsSync(templateSkeletonPath)) {
                  resolvedSkeletonPath = templateSkeletonPath;
                  logger.info(`Found skeleton files at template path: ${templateSkeletonPath}`);
                } else {
                  // Strategy 3: Search all subdirectories for Jenkinsfiles
                  logger.info(`Strategy 3: Searching all subdirectories for Jenkinsfiles`);
                  jenkinsfiles = await findJenkinsfilesRecursively(ctx.workspacePath);
                  if (jenkinsfiles.length > 0) {
                    logger.info(`Found ${jenkinsfiles.length} Jenkinsfiles in subdirectories: ${jenkinsfiles.map(f => path.relative(ctx.workspacePath, f)).join(', ')}`);
                  } else {
                    logger.error(`Tried skeleton paths: ${resolvedSkeletonPath}, ${alternativeSkeletonPath}, ${nestedSkeletonPath}, ${templateSkeletonPath}`);
                    throw new Error(`No Jenkinsfiles found in workspace or skeleton directories. Workspace content: ${fs.readdirSync(ctx.workspacePath).join(', ')}`);
                  }
                }
              }
            }
          }
          
          // If we found a valid skeleton path, get Jenkinsfiles from it
          if (resolvedSkeletonPath && fs.existsSync(resolvedSkeletonPath)) {
            logger.info(`Using resolved skeleton path: ${resolvedSkeletonPath}`);
            jenkinsfiles = await findJenkinsfiles(resolvedSkeletonPath);
          }
        }

        // Final check: Ensure we have Jenkinsfiles to process
        if (jenkinsfiles.length === 0) {
          logger.warn(`No Jenkinsfiles found in any searched locations`);
          ctx.output('createdJobs', []);
          return;
        }

        logger.info(`Final result: Found ${jenkinsfiles.length} Jenkinsfiles: ${jenkinsfiles.map(f => path.relative(ctx.workspacePath, f)).join(', ')}`);

        const createdJobs = [];
        const jobBaseName = baseJobName || artifactId;

        for (const jenkinsfilePath of jenkinsfiles) {
          // Read Jenkinsfile content
          const jenkinsfileContent = await fs.readFile(jenkinsfilePath, 'utf-8');
          
          // Generate job name: artifactId + Jenkinsfile name
          const jenkinsfileName = path.basename(jenkinsfilePath);
          const jobName = jenkinsfileName === 'Jenkinsfile' 
            ? jobBaseName 
            : `${jobBaseName}-${jenkinsfileName.replace(/^Jenkinsfile\.?/, '').replace(/\W+/g, '-')}`;

          logger.info(`Creating Jenkins job: ${jobName} from ${jenkinsfileName}`);

          try {
            // Create Jenkins job object
            const job: JenkinsJob = {
              name: jobName,
              description: description || `Pipeline job for ${artifactId}`,
              jenkinsfile: jenkinsfileContent,
              parameters: parameters || {},
            };

            // Create or update the Jenkins job
            await jenkinsClient.createOrUpdateJob(job);
            const jobUrl = `${jenkinsClient.getBaseUrl()}/job/${encodeURIComponent(jobName)}/`;

            createdJobs.push({
              name: jobName,
              url: jobUrl,
              jenkinsfile: jenkinsfileName,
            });

            logger.info(`Successfully created Jenkins job: ${jobName}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Failed to create Jenkins job ${jobName}: ${errorMessage}`);
            
            // Provide user-friendly error message while logging technical details
            throw new Error(`Failed to create Jenkins job '${jobName}': ${errorMessage}`);
          }
        }

        ctx.output('createdJobs', createdJobs);
        logger.info(`Successfully created ${createdJobs.length} Jenkins jobs`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error(`Failed to create Jenkins jobs: ${errorMessage}`);
        
        // Log technical details for debugging
        if (error instanceof Error && error.stack) {
          logger.error(`Stack trace: ${error.stack}`);
        }
        
        // Re-throw with user-friendly message (the specific error messages are already user-friendly from Jenkins client)
        throw new Error(errorMessage);
      }
    },
  });
}

/**
 * Recursively finds all Jenkinsfiles in a directory
 */
async function findJenkinsfiles(dir: string): Promise<string[]> {
  const jenkinsfiles: string[] = [];
  
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Recursively search subdirectories
        const subJenkinsfiles = await findJenkinsfiles(fullPath);
        jenkinsfiles.push(...subJenkinsfiles);
      } else if (item.isFile() && isJenkinsfile(item.name)) {
        jenkinsfiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}: ${error}`);
  }

  return jenkinsfiles;
}

/**
 * Recursively finds all Jenkinsfiles in a directory and its subdirectories
 * This is used as a fallback when skeleton paths are not found
 */
async function findJenkinsfilesRecursively(baseDir: string): Promise<string[]> {
  const jenkinsfiles: string[] = [];
  
  async function searchDirectory(dir: string, depth: number = 0): Promise<void> {
    // Limit recursion depth to avoid infinite loops
    if (depth > 5) return;
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        // Skip common directories that shouldn't contain Jenkinsfiles
        if (item.isDirectory() && !['node_modules', '.git', '.github', 'dist', 'build', 'coverage'].includes(item.name)) {
          await searchDirectory(fullPath, depth + 1);
        } else if (item.isFile() && isJenkinsfile(item.name)) {
          jenkinsfiles.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}: ${error}`);
    }
  }
  
  await searchDirectory(baseDir);
  return jenkinsfiles;
}

/**
 * Checks if a filename is a Jenkinsfile
 */
function isJenkinsfile(filename: string): boolean {
  return filename === 'Jenkinsfile' || filename.startsWith('Jenkinsfile.');
}