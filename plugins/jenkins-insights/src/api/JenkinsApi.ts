import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { 
  JenkinsUser, 
  JenkinsJob, 
  JenkinsBuild, 
  JenkinsJobWithBuilds,
  JenkinsUserJobsResponse,
  JenkinsBuildTrend,
  JenkinsProjectSummary,
  JenkinsConsoleOutput,
  JenkinsBuildArtifact,
  JenkinsFailureDetails
} from './types';

export interface JenkinsApi {
  /**
   * Get the current user's profile from Jenkins
   */
  getCurrentUser(): Promise<JenkinsUser>;

  /**
   * Find a Jenkins user by email address
   */
  findUserByEmail(email: string): Promise<JenkinsUser | null>;

  /**
   * Get jobs triggered by a specific user
   */
  getJobsTriggeredByUser(userId: string): Promise<JenkinsUserJobsResponse>;

  /**
   * Get detailed information about a specific job
   */
  getJob(jobName: string): Promise<JenkinsJobWithBuilds>;

  /**
   * Get all jobs
   */
  getAllJobs(): Promise<JenkinsJob[]>;

  /**
   * Get recent builds for a user
   */
  getRecentBuildsForUser(userId: string, limit?: number): Promise<JenkinsBuild[]>;
  
  /**
   * Get detailed build information including stages and test results
   */
  getBuildDetails(jobName: string, buildNumber: number): Promise<JenkinsBuild>;
  
  /**
   * Trigger a new build for a job
   */
  triggerBuild(jobName: string, parameters?: Record<string, string>): Promise<{ queueId: number }>;
  
  /**
   * Get build trends for a job
   */
  getBuildTrends(jobName: string, limit?: number): Promise<JenkinsBuildTrend[]>;
  
  /**
   * Get projects summary grouped by project name
   */
  getProjectsSummary(userId: string): Promise<JenkinsProjectSummary[]>;
  
  /**
   * Get console output for a specific build
   */
  getConsoleOutput(jobName: string, buildNumber: number, start?: number): Promise<JenkinsConsoleOutput>;
  
  /**
   * Get build artifacts
   */
  getBuildArtifacts(jobName: string, buildNumber: number): Promise<JenkinsBuildArtifact[]>;
  
  /**
   * Get detailed failure information for a failed build
   */
  getFailureDetails(jobName: string, buildNumber: number): Promise<JenkinsFailureDetails>;
  
  /**
   * Convert a Jenkins URL to a proxy URL for browser access
   */
  convertJenkinsUrlToProxy(jenkinsUrl: string): Promise<string>;

  /**
   * Get only failed stage information (lightweight)
   */
  getFailedStagesOnly(jobName: string, buildNumber: number): Promise<Array<{
    stageName: string;
    errorMessage: string;
    stackTrace?: string;
    logUrl: string;
  }>>;

  /**
   * Get only test results for failed builds (lightweight)
   */
  getTestResultsOnly(jobName: string, buildNumber: number): Promise<{
    failCount: number;
    totalCount: number;
    failedTests: Array<{
      name: string;
      className: string;
      errorDetails?: string;
      testResultUrl?: string;
    }>;
    testReportUrl?: string;
  } | null>;

  /**
   * Get only build artifacts (lightweight)
   */
  getBuildArtifactsOnly(jobName: string, buildNumber: number): Promise<JenkinsBuildArtifact[]>;

  /**
   * Get lightweight failure summary (combines failed stages, test results, and artifacts)
   */
  getFailureSummary(jobName: string, buildNumber: number): Promise<{
    failedStages: Array<{
      stageName: string;
      errorMessage: string;
      logUrl: string;
    }>;
    testResults?: {
      failCount: number;
      totalCount: number;
      failedTests: Array<{
        name: string;
        className: string;
        errorDetails?: string;
        testResultUrl?: string;
      }>;
      testReportUrl?: string;
    };
    artifacts: JenkinsBuildArtifact[];
    consoleFailures?: Array<{
      errorType: string;
      errorMessage: string;
      location?: string;
      timestamp?: string;
    }>;
  }>;

  /**
   * Parse console output to extract failure reasons when stage-level information is not available
   */
  parseConsoleFailure(jobName: string, buildNumber: number): Promise<Array<{
    errorType: string;
    errorMessage: string;
    location?: string;
    timestamp?: string;
  }>>;
}

export class JenkinsApiClient implements JenkinsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    // Use the discovery API to get the proxy URL and append the Jenkins path
    const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');
    return `${proxyUrl}/jenkins/api`;
  }

  private async getDirectJenkinsUrl(): Promise<string> {
    // Return the direct Jenkins server URL for artifact access (no proxy)
    // This is read from the jenkins configuration in app-config.yaml
    return 'http://localhost:8082'; // Direct Jenkins server URL
  }

  private async convertToProxyUrl(jenkinsUrl: string): Promise<string> {
    // Convert direct Jenkins URLs to proxy URLs for browser access
    if (!jenkinsUrl) return jenkinsUrl;
    
    const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');
    const jenkinsUIUrl = `${proxyUrl}/jenkins`;
    
    // If the URL is already a proxy URL (contains our proxy base), return as is
    if (jenkinsUrl.includes(proxyUrl)) {
      return jenkinsUrl;
    }
    
    // Extract the path from the Jenkins URL and append to proxy URL
    try {
      const url = new URL(jenkinsUrl);
      // Remove any leading /api from the pathname when converting to UI URL
      let pathname = url.pathname;
      if (pathname.startsWith('/api/')) {
        pathname = pathname.substring(4); // Remove '/api'
      }
      return `${jenkinsUIUrl}${pathname}${url.search || ''}`;
    } catch (error) {
      // If URL parsing fails, assume it's a relative path
      const path = jenkinsUrl.startsWith('/') ? jenkinsUrl : `/${jenkinsUrl}`;
      return `${jenkinsUIUrl}${path}`;
    }
  }

  private async convertBuildUrlsToProxy(build: JenkinsBuild): Promise<JenkinsBuild> {
    // Convert build URLs to use the proxy for browser access
    const convertedBuild = { ...build };
    
    if (convertedBuild.url) {
      convertedBuild.url = await this.convertToProxyUrl(convertedBuild.url);
    }
    
    return convertedBuild;
  }

  private async request<T>(path: string): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${path}`;
    
    try {
      const response = await this.fetchApi.fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Jenkins API request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Jenkins API request failed: ${response.status} ${response.statusText}. Response: ${errorText.substring(0, 200)}...`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Jenkins API returned non-JSON response:', responseText.substring(0, 500));
        throw new Error(`Jenkins API returned non-JSON response. Content-Type: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Jenkins API request error for ${url}:`, error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<JenkinsUser> {
    return this.request<JenkinsUser>('/me/api/json');
  }

  async findUserByEmail(email: string): Promise<JenkinsUser | null> {
    try {
      // Try to get user by ID first (Jenkins often uses email as ID)
      const user = await this.request<JenkinsUser>(`/user/${encodeURIComponent(email)}/api/json`);
      return user;
    } catch (error) {
      console.warn(`User with email ${email} not found directly, searching in people`, error);
      
      try {
        // If direct lookup fails, search through all people
        const people = await this.request<{ users: Array<{ user: JenkinsUser }> }>('/people/api/json');
        
        for (const person of people.users) {
          const user = person.user;
          // Check if email matches in properties
          if (user.property) {
            for (const prop of user.property) {
              if (prop._class?.includes('Mailer') && prop.address === email) {
                return user;
              }
            }
          }
          // Also check if the ID contains the email or parts of it
          if (user.id === email || user.id?.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
            return user;
          }
        }
        
        return null;
      } catch (searchError) {
        console.error('Failed to search for user in people', searchError);
        return null;
      }
    }
  }

  async getAllJobs(): Promise<JenkinsJob[]> {
    const response = await this.request<{ jobs: JenkinsJob[] }>('/api/json?tree=jobs[name,url,color,buildable,fullDisplayName,description,lastBuild[number,url,result,timestamp,building],lastCompletedBuild[number,url,result,timestamp],lastSuccessfulBuild[number,url,result,timestamp]]');
    return response.jobs;
  }

  async getJob(jobName: string): Promise<JenkinsJobWithBuilds> {
    const job = await this.request<JenkinsJob>(`/job/${encodeURIComponent(jobName)}/api/json?tree=*,builds[number,url,result,timestamp,building,duration,displayName,fullDisplayName,description,actions[causes[shortDescription,userId,userName]],changeSet[items[author[fullName],commitId,msg,timestamp]],culprits[fullName]]`);
    
    const buildsResponse = await this.request<{ builds: JenkinsBuild[] }>(`/job/${encodeURIComponent(jobName)}/api/json?tree=builds[number,url,result,timestamp,building,duration,displayName,fullDisplayName,description,actions[causes[shortDescription,userId,userName]],changeSet[items[author[fullName],commitId,msg,timestamp]],culprits[fullName]]`);
    
    // Convert build URLs to proxy URLs
    const convertedBuilds = await Promise.all(
      (buildsResponse.builds || []).map(build => this.convertBuildUrlsToProxy(build))
    );
    
    return {
      ...job,
      builds: convertedBuilds
    };
  }

  async getJobsTriggeredByUser(userId: string): Promise<JenkinsUserJobsResponse> {
    try {
      // Get all jobs first
      const allJobs = await this.getAllJobs();
      const userJobs: JenkinsJob[] = [];
      const userBuilds: JenkinsBuild[] = [];

      // Check each job for builds triggered by the user
      for (const job of allJobs) {
        if (!job.buildable) continue;

        try {
          const jobDetails = await this.getJob(job.name);
          
          // Check builds for this job
          const userBuildsForJob = jobDetails.builds.filter(build => {
            if (!build.actions) return false;
            
            return build.actions.some(action => {
              if (!action.causes) return false;
              
              return action.causes.some(cause => {
                return cause.userId === userId || 
                       cause.userName === userId ||
                       (cause.shortDescription && cause.shortDescription.includes(userId));
              });
            });
          });

          if (userBuildsForJob.length > 0) {
            userJobs.push(job);
            userBuilds.push(...userBuildsForJob);
          }
        } catch (error) {
          console.warn(`Failed to get details for job ${job.name}:`, error);
        }
      }

      // Convert URLs to proxy URLs for browser access
      const convertedBuilds = await Promise.all(
        userBuilds.map(build => this.convertBuildUrlsToProxy(build))
      );

      return {
        jobs: userJobs,
        builds: convertedBuilds.sort((a, b) => b.timestamp - a.timestamp)
      };
    } catch (error) {
      console.error('Failed to get jobs triggered by user:', error);
      throw error;
    }
  }

  async getRecentBuildsForUser(userId: string, limit: number = 10): Promise<JenkinsBuild[]> {
    const userJobsResponse = await this.getJobsTriggeredByUser(userId);
    return userJobsResponse.builds.slice(0, limit);
  }

  async getBuildDetails(jobName: string, buildNumber: number): Promise<JenkinsBuild> {
    const build = await this.request<JenkinsBuild>(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=*,actions[causes[shortDescription,userId,userName]],changeSet[items[author[fullName],commitId,msg,timestamp]],culprits[fullName]`);
    
    // Try to get additional build details like workflow stages if available
    try {
      const wfApiUrl = `/job/${encodeURIComponent(jobName)}/${buildNumber}/wfapi/describe`;
      const workflowStages = await this.request<any>(wfApiUrl);
      
      if (workflowStages && workflowStages.stages) {
        build.stages = workflowStages.stages.map((stage: any) => ({
          id: stage.id,
          name: stage.name,
          status: stage.status,
          startTimeMillis: stage.startTimeMillis,
          durationMillis: stage.durationMillis,
          pauseDurationMillis: stage.pauseDurationMillis || 0
        }));
      }
    } catch (error) {
      console.warn(`Failed to get workflow stages for build ${jobName}#${buildNumber}:`, error);
      build.stages = [];
    }

    // Try to get test results if available
    try {
      const testResultUrl = `/job/${encodeURIComponent(jobName)}/${buildNumber}/testReport/api/json`;
      const testResults = await this.request<any>(testResultUrl);
      
      if (testResults) {
        const directJenkinsUrl = await this.getDirectJenkinsUrl();
        const testReportUrl = `${directJenkinsUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/testReport/`;
        
        // Extract failed test cases with detailed information
        const failedTests: any[] = [];
        if (testResults.suites) {
          testResults.suites.forEach((suite: any) => {
            if (suite.cases) {
              suite.cases.forEach((testCase: any) => {
                if (testCase.status === 'FAILED') {
                  failedTests.push({
                    name: testCase.name,
                    className: testCase.className,
                    status: testCase.status,
                    duration: testCase.duration,
                    errorDetails: testCase.errorDetails,
                    errorStackTrace: testCase.errorStackTrace,
                    failedSince: testCase.failedSince,
                    age: testCase.age,
                    testResultUrl: `${testReportUrl}${encodeURIComponent(suite.name)}/${encodeURIComponent(testCase.className)}/${encodeURIComponent(testCase.name)}/`
                  });
                }
              });
            }
          });
        }
        
        build.testResults = {
          totalCount: testResults.totalCount || 0,
          failCount: testResults.failCount || 0,
          skipCount: testResults.skipCount || 0,
          passCount: (testResults.totalCount || 0) - (testResults.failCount || 0) - (testResults.skipCount || 0),
          suites: testResults.suites?.map((suite: any) => ({
            name: suite.name,
            duration: suite.duration,
            cases: suite.cases?.map((testCase: any) => ({
              name: testCase.name,
              className: testCase.className,
              status: testCase.status,
              duration: testCase.duration,
              errorDetails: testCase.errorDetails,
              errorStackTrace: testCase.errorStackTrace,
              failedSince: testCase.failedSince,
              age: testCase.age,
              testResultUrl: `${testReportUrl}${encodeURIComponent(suite.name)}/${encodeURIComponent(testCase.className)}/${encodeURIComponent(testCase.name)}/`
            })) || []
          })) || [],
          failedTests,
          testReportUrl
        };
      }
    } catch (error) {
      console.warn(`Failed to get test results for build ${jobName}#${buildNumber}:`, error);
      build.testResults = {
        totalCount: 0,
        failCount: 0,
        skipCount: 0,
        passCount: 0,
        suites: [],
        failedTests: []
      };
    }

    // Try to get SonarQube quality gate results if available
    try {
      const sonarUrl = `/job/${encodeURIComponent(jobName)}/${buildNumber}/sonar/api/json`;
      const sonarResults = await this.request<any>(sonarUrl);
      
      if (sonarResults) {
        build.sonarQube = {
          status: sonarResults.status || 'UNKNOWN',
          url: sonarResults.url,
          conditions: sonarResults.conditions || []
        };
      }
    } catch (error) {
      console.warn(`Failed to get SonarQube results for build ${jobName}#${buildNumber}:`, error);
      build.sonarQube = {
        status: 'UNKNOWN',
        url: undefined,
        conditions: []
      };
    }

    // Get failure details for failed builds
    if (build.result === 'FAILURE' || build.result === 'UNSTABLE') {
      try {
        build.failureDetails = await this.getFailureDetails(jobName, buildNumber);
      } catch (error) {
        console.warn(`Failed to get failure details for build ${jobName}#${buildNumber}:`, error);
      }
    }

    // Convert URLs to proxy URLs for browser access
    const convertedBuild = await this.convertBuildUrlsToProxy(build);
    
    return convertedBuild;
  }

  async triggerBuild(jobName: string, parameters?: Record<string, string>): Promise<{ queueId: number }> {
    const baseUrl = await this.getBaseUrl();
    let url: string;
    let body: string | undefined;

    if (parameters && Object.keys(parameters).length > 0) {
      // Build with parameters
      url = `${baseUrl}/job/${encodeURIComponent(jobName)}/buildWithParameters`;
      const formData = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        formData.append(key, value);
      });
      body = formData.toString();
    } else {
      // Simple build
      url = `${baseUrl}/job/${encodeURIComponent(jobName)}/build`;
    }

    try {
      const response = await this.fetchApi.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger build: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      // Jenkins returns 201 for successful build trigger with Location header containing queue URL
      const location = response.headers.get('Location');
      if (location) {
        // Extract queue ID from location header (e.g., /queue/item/123/)
        const queueIdMatch = location.match(/\/queue\/item\/(\d+)\//);
        if (queueIdMatch) {
          return { queueId: parseInt(queueIdMatch[1], 10) };
        }
      }

      // Fallback to a dummy queue ID if we can't extract it
      return { queueId: Date.now() };
    } catch (error) {
      console.error(`Failed to trigger build for job ${jobName}:`, error);
      throw error;
    }
  }

  async getBuildTrends(jobName: string, limit: number = 10): Promise<JenkinsBuildTrend[]> {
    try {
      const jobDetails = await this.getJob(jobName);
      const recentBuilds = jobDetails.builds.slice(0, limit);

      return recentBuilds.map((build, index) => {
        const previousBuild = recentBuilds[index + 1];
        let trend: 'up' | 'down' | 'stable' = 'stable';

        if (previousBuild && build.duration && previousBuild.duration) {
          if (build.duration < previousBuild.duration) {
            trend = 'up'; // Faster is better
          } else if (build.duration > previousBuild.duration) {
            trend = 'down'; // Slower is worse
          }
        }

        return {
          buildNumber: build.number,
          result: build.result,
          duration: build.duration || 0,
          timestamp: build.timestamp,
          trend,
          durationChange: previousBuild && build.duration && previousBuild.duration 
            ? build.duration - previousBuild.duration 
            : 0
        };
      });
    } catch (error) {
      console.error(`Failed to get build trends for job ${jobName}:`, error);
      throw error;
    }
  }

  async getProjectsSummary(userId: string): Promise<JenkinsProjectSummary[]> {
    try {
      const userJobsResponse = await this.getJobsTriggeredByUser(userId);
      const projectsMap = new Map<string, {
        jobs: JenkinsJob[];
        builds: JenkinsBuild[];
        lastBuild?: JenkinsBuild;
        successRate: number;
        totalBuilds: number;
      }>();

      // Group jobs by project (assuming project name is part of job name or extract from job properties)
      userJobsResponse.jobs.forEach(job => {
        // Extract project name from job name (customize this logic based on your naming convention)
        const projectName = this.extractProjectName(job.name);
        
        if (!projectsMap.has(projectName)) {
          projectsMap.set(projectName, {
            jobs: [],
            builds: [],
            lastBuild: undefined,
            successRate: 0,
            totalBuilds: 0
          });
        }

        const project = projectsMap.get(projectName)!;
        project.jobs.push(job);
      });

      // Add builds to respective projects and calculate metrics
      userJobsResponse.builds.forEach(build => {
        const jobName = this.extractJobNameFromBuild(build);
        const projectName = this.extractProjectName(jobName);
        
        const project = projectsMap.get(projectName);
        if (project) {
          project.builds.push(build);
          
          if (!project.lastBuild || build.timestamp > project.lastBuild.timestamp) {
            project.lastBuild = build;
          }
        }
      });

      // Calculate success rates and return project summaries
      return Array.from(projectsMap.entries()).map(([projectName, data]) => {
        const successfulBuilds = data.builds.filter(build => build.result === 'SUCCESS').length;
        const successRate = data.builds.length > 0 ? (successfulBuilds / data.builds.length) * 100 : 0;

        return {
          name: projectName,
          jobs: data.jobs,
          lastBuild: data.lastBuild,
          successRate,
          totalBuilds: data.builds.length,
          recentBuilds: data.builds.slice(0, 5) // Last 5 builds per project
        };
      }).sort((a, b) => {
        // Sort by last build timestamp, newest first
        const aTime = a.lastBuild?.timestamp || 0;
        const bTime = b.lastBuild?.timestamp || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Failed to get projects summary:', error);
      throw error;
    }
  }

  private extractProjectName(jobName: string): string {
    // Customize this logic based on your Jenkins job naming convention
    // Examples:
    // - "project-name-feature-branch" -> "project-name"
    // - "MyProject/feature/branch" -> "MyProject"
    // - "frontend-build-main" -> "frontend"
    
    // Strategy 1: Split by first dash and take first part
    if (jobName.includes('-')) {
      return jobName.split('-')[0];
    }
    
    // Strategy 2: Split by slash and take first part (for folder-style jobs)
    if (jobName.includes('/')) {
      return jobName.split('/')[0];
    }
    
    // Strategy 3: Use the whole job name if no clear separator
    return jobName;
  }

  private extractJobNameFromBuild(build: JenkinsBuild): string {
    // Extract job name from build's fullDisplayName or URL
    if (build.fullDisplayName) {
      // Format is usually "JobName #123"
      const match = build.fullDisplayName.match(/^(.+?)\s*#\d+$/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: extract from URL
    if (build.url) {
      const match = build.url.match(/\/job\/([^\/]+)\/\d+\//);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    
    return 'Unknown';
  }

  async getConsoleOutput(jobName: string, buildNumber: number, start: number = 0): Promise<JenkinsConsoleOutput> {
    try {
      const baseUrl = await this.getBaseUrl();
      const url = `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/logText/progressiveText?start=${start}`;
      
      const response = await this.fetchApi.fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to get console output: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      const hasMore = response.headers.get('X-More-Data') === 'true';
      const textSize = response.headers.get('X-Text-Size');
      
      return {
        text,
        hasMore,
        size: textSize ? parseInt(textSize, 10) : text.length
      };
    } catch (error) {
      console.error(`Failed to get console output for ${jobName}#${buildNumber}:`, error);
      throw error;
    }
  }

  async getBuildArtifacts(jobName: string, buildNumber: number): Promise<JenkinsBuildArtifact[]> {
    try {
      const build = await this.request<any>(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=artifacts[displayPath,fileName,relativePath]`);
      
      if (!build.artifacts) {
        return [];
      }
      
      // Use direct Jenkins server URL for artifacts to avoid authentication issues
      const directJenkinsUrl = await this.getDirectJenkinsUrl();
      const buildBaseUrl = `${directJenkinsUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}`;
      
      // Return original Jenkins URLs for direct access (no proxy)
      const artifactsWithUrls = build.artifacts.map((artifact: any) => {
        const originalJenkinsUrl = `${buildBaseUrl}/artifact/${artifact.relativePath}`;
        return {
          displayPath: artifact.displayPath,
          fileName: artifact.fileName,
          relativePath: artifact.relativePath,
          url: originalJenkinsUrl, // Use direct Jenkins URL for authentication
          originalUrl: originalJenkinsUrl // Keep original URL for reference
        };
      });
      
      return artifactsWithUrls;
    } catch (error) {
      console.warn(`Failed to get artifacts for build ${jobName}#${buildNumber}:`, error);
      return [];
    }
  }

  async getFailureDetails(jobName: string, buildNumber: number): Promise<JenkinsFailureDetails> {
    const failureDetails: JenkinsFailureDetails = {
      failedStages: [],
      artifacts: []
    };

    try {
      // Get console output for failure analysis
      const consoleOutput = await this.getConsoleOutput(jobName, buildNumber);
      failureDetails.consoleOutput = consoleOutput;
    } catch (error) {
      console.warn(`Failed to get console output for failure analysis:`, error);
    }

    try {
      // Get build artifacts
      const artifacts = await this.getBuildArtifacts(jobName, buildNumber);
      failureDetails.artifacts = artifacts;
    } catch (error) {
      console.warn(`Failed to get artifacts for failure analysis:`, error);
    }

    try {
      // Get failed stages information
      const build = await this.getBuildDetails(jobName, buildNumber);
      
      if (build.stages) {
        const baseUrl = await this.getBaseUrl();
        failureDetails.failedStages = build.stages
          .filter(stage => stage.status === 'FAILURE')
          .map(stage => ({
            stageName: stage.name,
            errorMessage: `Stage '${stage.name}' failed`,
            logUrl: `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/execution/node/${stage.id}/log/`
          }));
      }
    } catch (error) {
      console.warn(`Failed to get stage failure details:`, error);
    }

    return failureDetails;
  }

  async convertJenkinsUrlToProxy(jenkinsUrl: string): Promise<string> {
    return this.convertToProxyUrl(jenkinsUrl);
  }

  async getFailedStagesOnly(jobName: string, buildNumber: number): Promise<Array<{
    stageName: string;
    errorMessage: string;
    stackTrace?: string;
    logUrl: string;
  }>> {
    try {
      // Only fetch stage information, not full build details
      const wfApiUrl = `/job/${encodeURIComponent(jobName)}/${buildNumber}/wfapi/describe`;
      const workflowStages = await this.request<any>(wfApiUrl);
      
      if (!workflowStages?.stages) {
        return [];
      }

      const baseUrl = await this.getBaseUrl();
      return workflowStages.stages
        .filter((stage: any) => stage.status === 'FAILURE')
        .map((stage: any) => ({
          stageName: stage.name,
          errorMessage: `Stage '${stage.name}' failed`,
          logUrl: `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/execution/node/${stage.id}/log/`
        }));
    } catch (error) {
      console.warn(`Failed to get failed stages for ${jobName}#${buildNumber}:`, error);
      return [];
    }
  }

  async getTestResultsOnly(jobName: string, buildNumber: number): Promise<{
    failCount: number;
    totalCount: number;
    failedTests: Array<{
      name: string;
      className: string;
      errorDetails?: string;
      testResultUrl?: string;
    }>;
    testReportUrl?: string;
  } | null> {
    try {
      const testResultUrl = `/job/${encodeURIComponent(jobName)}/${buildNumber}/testReport/api/json`;
      const testResults = await this.request<any>(testResultUrl);
      
      if (!testResults) {
        return null;
      }

      const directJenkinsUrl = await this.getDirectJenkinsUrl();
      const testReportUrl = `${directJenkinsUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/testReport/`;
      
      // Extract only failed test cases
      const failedTests: Array<{
        name: string;
        className: string;
        errorDetails?: string;
        testResultUrl?: string;
      }> = [];
      
      if (testResults.suites) {
        testResults.suites.forEach((suite: any) => {
          if (suite.cases) {
            suite.cases.forEach((testCase: any) => {
              if (testCase.status === 'FAILED') {
                failedTests.push({
                  name: testCase.name,
                  className: testCase.className,
                  errorDetails: testCase.errorDetails,
                  testResultUrl: `${testReportUrl}${encodeURIComponent(suite.name)}/${encodeURIComponent(testCase.className)}/${encodeURIComponent(testCase.name)}/`
                });
              }
            });
          }
        });
      }

      return {
        failCount: testResults.failCount || 0,
        totalCount: testResults.totalCount || 0,
        failedTests,
        testReportUrl
      };
    } catch (error) {
      console.warn(`Failed to get test results for ${jobName}#${buildNumber}:`, error);
      return null;
    }
  }

  async getBuildArtifactsOnly(jobName: string, buildNumber: number): Promise<JenkinsBuildArtifact[]> {
    return this.getBuildArtifacts(jobName, buildNumber);
  }

  async getFailureSummary(jobName: string, buildNumber: number): Promise<{
    failedStages: Array<{
      stageName: string;
      errorMessage: string;
      logUrl: string;
    }>;
    testResults?: {
      failCount: number;
      totalCount: number;
      failedTests: Array<{
        name: string;
        className: string;
        errorDetails?: string;
        testResultUrl?: string;
      }>;
      testReportUrl?: string;
    };
    artifacts: JenkinsBuildArtifact[];
    consoleFailures?: Array<{
      errorType: string;
      errorMessage: string;
      location?: string;
      timestamp?: string;
    }>;
  }> {
    try {
      // Fetch only the specific data we need in parallel
      const [failedStages, testResults, artifacts] = await Promise.allSettled([
        this.getFailedStagesOnly(jobName, buildNumber),
        this.getTestResultsOnly(jobName, buildNumber),
        this.getBuildArtifactsOnly(jobName, buildNumber)
      ]);

      const failedStagesResult = failedStages.status === 'fulfilled' ? failedStages.value : [];
      let consoleFailures: Array<{
        errorType: string;
        errorMessage: string;
        location?: string;
        timestamp?: string;
      }> | undefined;

      // If no failed stages found, try to parse console output for failure reasons
      if (failedStagesResult.length === 0) {
        try {
          consoleFailures = await this.parseConsoleFailure(jobName, buildNumber);
        } catch (error) {
          console.warn(`Failed to parse console failures for ${jobName}#${buildNumber}:`, error);
        }
      }

      return {
        failedStages: failedStagesResult,
        testResults: testResults.status === 'fulfilled' ? testResults.value || undefined : undefined,
        artifacts: artifacts.status === 'fulfilled' ? artifacts.value : [],
        consoleFailures
      };
    } catch (error) {
      console.error(`Failed to get failure summary for ${jobName}#${buildNumber}:`, error);
      return {
        failedStages: [],
        artifacts: []
      };
    }
  }

  async parseConsoleFailure(jobName: string, buildNumber: number): Promise<Array<{
    errorType: string;
    errorMessage: string;
    location?: string;
    timestamp?: string;
  }>> {
    try {
      const consoleOutput = await this.getConsoleOutput(jobName, buildNumber);
      const lines = consoleOutput.text.split('\n');
      const failures: Array<{
        errorType: string;
        errorMessage: string;
        location?: string;
        timestamp?: string;
      }> = [];

      // Common error patterns to look for in Jenkins console output
      const errorPatterns = [
        // Build tool failures
        {
          pattern: /ERROR.*?:\s*(.*)/i,
          type: 'Build Error',
          messageGroup: 1
        },
        {
          pattern: /FAILURE.*?:\s*(.*)/i,
          type: 'Build Failure',
          messageGroup: 1
        },
        {
          pattern: /BUILD FAILED/i,
          type: 'Build Failed',
          messageGroup: 0
        },
        // Maven/Gradle failures
        {
          pattern: /\[ERROR\]\s*(.*)/,
          type: 'Maven Error',
          messageGroup: 1
        },
        {
          pattern: /FAILURE:\s*Build failed with an exception\.\s*(.*)/,
          type: 'Gradle Exception',
          messageGroup: 1
        },
        // Compilation errors
        {
          pattern: /compilation failed/i,
          type: 'Compilation Error',
          messageGroup: 0
        },
        {
          pattern: /(\d+ error[s]?)/i,
          type: 'Compilation Error',
          messageGroup: 1
        },
        // Test failures
        {
          pattern: /Tests run:.*Failures:\s*(\d+)/,
          type: 'Test Failure',
          messageGroup: 0
        },
        // Docker/Container errors
        {
          pattern: /docker.*error.*?:\s*(.*)/i,
          type: 'Docker Error',
          messageGroup: 1
        },
        {
          pattern: /failed to build.*?:\s*(.*)/i,
          type: 'Build Error',
          messageGroup: 1
        },
        // Git/SCM errors
        {
          pattern: /fatal.*?:\s*(.*)/i,
          type: 'Git Error',
          messageGroup: 1
        },
        // Network/connection errors
        {
          pattern: /connection.*?(refused|timed out|failed).*?:\s*(.*)/i,
          type: 'Connection Error',
          messageGroup: 0
        },
        // Permission errors
        {
          pattern: /(permission denied|access denied).*?:\s*(.*)/i,
          type: 'Permission Error',
          messageGroup: 0
        },
        // NPM/Node errors
        {
          pattern: /npm ERR!.*?:\s*(.*)/,
          type: 'NPM Error',
          messageGroup: 1
        },
        // Python/pip errors
        {
          pattern: /(ImportError|ModuleNotFoundError|SyntaxError).*?:\s*(.*)/,
          type: 'Python Error',
          messageGroup: 0
        },
        // General exception patterns
        {
          pattern: /Exception.*?:\s*(.*)/,
          type: 'Exception',
          messageGroup: 1
        },
        {
          pattern: /Error.*?:\s*(.*)/,
          type: 'Error',
          messageGroup: 1
        }
      ];

      const timestampPattern = /^\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\]]*)\]?/;
      const locationPattern = /(?:at\s+|in\s+|from\s+)([^\s]+(?:\.[^\s]+)*(?::\d+)?)/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Extract timestamp if present
        const timestampMatch = line.match(timestampPattern);
        const timestamp = timestampMatch ? timestampMatch[1] : undefined;

        // Check against all error patterns
        for (const pattern of errorPatterns) {
          const match = line.match(pattern.pattern);
          if (match) {
            let errorMessage = match[pattern.messageGroup] || match[0];
            
            // Clean up the error message
            errorMessage = errorMessage.trim();
            if (errorMessage.length > 200) {
              errorMessage = errorMessage.substring(0, 200) + '...';
            }

            // Try to extract location information from the line or surrounding lines
            let location: string | undefined;
            const locationMatch = line.match(locationPattern);
            if (locationMatch) {
              location = locationMatch[1];
            } else {
              // Check next few lines for location info
              for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                const nextLineLocationMatch = lines[j].match(locationPattern);
                if (nextLineLocationMatch) {
                  location = nextLineLocationMatch[1];
                  break;
                }
              }
            }

            // Avoid duplicate similar errors
            const isDuplicate = failures.some(existing => 
              existing.errorType === pattern.type && 
              existing.errorMessage === errorMessage
            );

            if (!isDuplicate && errorMessage.length > 5) {
              failures.push({
                errorType: pattern.type,
                errorMessage,
                location,
                timestamp
              });
            }

            break; // Don't check other patterns for this line
          }
        }

        // Limit to prevent too many results
        if (failures.length >= 10) {
          break;
        }
      }

      // If we found no specific errors, look for general build termination messages
      if (failures.length === 0) {
        const generalFailurePatterns = [
          'Build step.*failed',
          'Build was aborted',
          'Build cancelled',
          'Process exited with code',
          'Command.*returned non-zero exit status',
          'finished with result: FAILURE'
        ];

        for (const line of lines.reverse().slice(0, 20)) { // Check last 20 lines
          for (const generalPattern of generalFailurePatterns) {
            if (new RegExp(generalPattern, 'i').test(line)) {
              failures.push({
                errorType: 'Build Termination',
                errorMessage: line.trim().substring(0, 200),
                timestamp: line.match(timestampPattern)?.[1]
              });
              break;
            }
          }
          if (failures.length > 0) break;
        }
      }

      return failures;
    } catch (error) {
      console.warn(`Failed to parse console failure for ${jobName}#${buildNumber}:`, error);
      return [];
    }
  }
}
