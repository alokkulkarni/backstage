import fetch from 'node-fetch';
import { Config } from '@backstage/config';

export interface JenkinsConfig {
  baseUrl: string;
  username?: string;
  apiKey?: string;
  proxyPath?: string;
}

export interface JenkinsJob {
  name: string;
  description?: string;
  jenkinsfile: string;
  parameters?: { [key: string]: any };
}

export interface JenkinsBuildResult {
  number: number;
  result: string | null;
  building: boolean;
  url: string;
  queueId?: number;
}

/**
 * Jenkins API client for scaffolder actions
 */
export class JenkinsClient {
  private config: JenkinsConfig;
  private authHeader: string;

  constructor(config: Config) {
    const jenkinsConfig = config.getConfig('jenkins');
    
    this.config = {
      baseUrl: jenkinsConfig.getString('baseUrl'),
      username: jenkinsConfig.getOptionalString('username'),
      apiKey: jenkinsConfig.getOptionalString('apiKey'),
      // Backend actions make direct calls to Jenkins, not through proxy
      proxyPath: undefined,
    };

    // Create Basic Auth header for direct Jenkins API calls
    if (this.config.username && this.config.apiKey) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.apiKey}`).toString('base64');
      this.authHeader = `Basic ${credentials}`;
      console.log('Jenkins client: Configured for direct API calls with authentication');
    } else {
      console.error('Jenkins username and apiKey must be configured for backend actions');
      throw new Error('Jenkins credentials are required for scaffolder backend actions');
    }
  }

  private getApiUrl(): string {
    // Backend actions make direct calls to Jenkins API
    // Note: Don't append /api here, as different endpoints have different paths
    const directUrl = this.config.baseUrl;
    console.log(`Jenkins client: Using direct Jenkins base URL: ${directUrl}`);
    return directUrl;
  }

  private getHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    // Always add Authorization header for direct Jenkins API calls
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }

    return headers;
  }

  /**
   * Get crumb for CSRF protection
   */
  private async getCrumb(): Promise<{ crumb: string; crumbRequestField: string } | null> {
    try {
      const response = await fetch(`${this.getApiUrl()}/crumbIssuer/api/json`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const crumbData = await response.json() as any;
        return {
          crumb: crumbData.crumb,
          crumbRequestField: crumbData.crumbRequestField,
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to get CSRF crumb:', error);
      return null;
    }
  }

  /**
   * Check if a Jenkins job exists
   */
  async jobExists(jobName: string): Promise<boolean> {
    try {
      const checkUrl = `${this.getApiUrl()}/job/${encodeURIComponent(jobName)}/api/json`;
      console.log(`Jenkins client: Checking job existence at URL: ${checkUrl}`);
      
      const response = await fetch(checkUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      console.log(`Jenkins client: Job exists check response: ${response.status} ${response.statusText}`);
      
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.warn(`Jenkins client: Unexpected response when checking job existence: ${errorText}`);
      }
      
      return response.ok;
    } catch (error) {
      console.error(`Jenkins client: Error checking job existence:`, error);
      return false;
    }
  }

  /**
   * Create or update a Jenkins job
   */
  async createOrUpdateJob(job: JenkinsJob): Promise<void> {
    console.log(`Jenkins client: Checking if job '${job.name}' exists...`);
    const jobExists = await this.jobExists(job.name);
    console.log(`Jenkins client: Job '${job.name}' exists: ${jobExists}`);
    
    const crumb = await this.getCrumb();
    console.log(`Jenkins client: CSRF crumb obtained: ${crumb ? 'yes' : 'no'}`);
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/xml',
    };

    // Always add Authorization header for direct Jenkins API calls
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }

    if (crumb) {
      headers[crumb.crumbRequestField] = crumb.crumb;
    }

    const configXml = this.generateJobConfigXml(job);
    console.log(`Jenkins client: Generated config XML (${configXml.length} chars)`);
    
    let url: string;
    let method: string;

    if (jobExists) {
      // Update existing job
      url = `${this.getApiUrl()}/job/${encodeURIComponent(job.name)}/config.xml`;
      method = 'POST';
      console.log(`Jenkins client: Updating existing job at URL: ${url}`);
    } else {
      // Create new job - use pipeline type
      url = `${this.getApiUrl()}/createItem?name=${encodeURIComponent(job.name)}&mode=org.jenkinsci.plugins.workflow.job.WorkflowJob`;
      method = 'POST';
      console.log(`Jenkins client: Creating new pipeline job at URL: ${url}`);
    }

    console.log(`Jenkins client: Making ${method} request to Jenkins...`);
    const response = await fetch(url, {
      method,
      headers,
      body: configXml,
    });

    console.log(`Jenkins client: Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jenkins client: Error response body: ${errorText}`);
      
      // Provide user-friendly error messages while logging detailed errors
      let userFriendlyMessage = `Failed to ${jobExists ? 'update' : 'create'} Jenkins job '${job.name}'`;
      
      if (response.status === 404) {
        userFriendlyMessage = `Jenkins API endpoint not found. Please verify Jenkins URL: ${this.config.baseUrl}`;
        console.error(`Jenkins client: 404 error - Check if Jenkins is running at ${this.config.baseUrl} and API is accessible`);
      } else if (response.status === 401) {
        userFriendlyMessage = `Authentication failed. Please check Jenkins credentials.`;
        console.error(`Jenkins client: 401 error - Invalid username/API key combination`);
      } else if (response.status === 403) {
        userFriendlyMessage = `Access denied. User '${this.config.username}' may not have permission to create/update jobs.`;
        console.error(`Jenkins client: 403 error - User lacks permissions`);
      } else if (response.status === 500) {
        userFriendlyMessage = `Jenkins server error. The pipeline configuration may be invalid.`;
        console.error(`Jenkins client: 500 error - Server-side error, possibly invalid job configuration`);
      } else {
        userFriendlyMessage = `Unexpected error (${response.status}). Please check Jenkins server status.`;
      }
      
      // Log full technical details for debugging
      console.error(`Jenkins client: Full error details:`, {
        status: response.status,
        statusText: response.statusText,
        url: url,
        method: method,
        headers: headers,
        responseBody: errorText
      });
      
      throw new Error(userFriendlyMessage);
    }
    
    console.log(`Jenkins client: Successfully ${jobExists ? 'updated' : 'created'} Jenkins job '${job.name}'`);
  }

  /**
   * Trigger a Jenkins job build
   */
  async triggerBuild(jobName: string, parameters?: { [key: string]: any }): Promise<{ queueId?: number }> {
    try {
      console.log(`Jenkins client: Triggering build for job '${jobName}'`);
      
      const crumb = await this.getCrumb();
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      if (this.authHeader) {
        headers['Authorization'] = this.authHeader;
      }

      if (crumb) {
        headers[crumb.crumbRequestField] = crumb.crumb;
      }

      let url: string;
      let body = '';

      if (parameters && Object.keys(parameters).length > 0) {
        // Build with parameters
        url = `${this.getApiUrl()}/job/${encodeURIComponent(jobName)}/buildWithParameters`;
        const params = new URLSearchParams();
        Object.entries(parameters).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        body = params.toString();
      } else {
        // Build without parameters
        url = `${this.getApiUrl()}/job/${encodeURIComponent(jobName)}/build`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      console.log(`Jenkins client: Build trigger response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Jenkins client: Failed to trigger build: ${errorText}`);
        throw new Error(`Failed to trigger Jenkins job build: ${response.status} ${response.statusText}`);
      }

      // Jenkins returns queue ID in Location header for successful builds
      const location = response.headers.get('Location');
      let queueId: number | undefined;
      if (location) {
        const queueIdMatch = location.match(/\/queue\/item\/(\d+)\//);
        if (queueIdMatch) {
          queueId = parseInt(queueIdMatch[1], 10);
        }
      }

      console.log(`Jenkins client: Build triggered successfully, queue ID: ${queueId}`);
      return { queueId };
    } catch (error) {
      console.error(`Jenkins client: Error triggering build:`, error);
      throw error;
    }
  }

  /**
   * Get queue item information
   */
  async getQueueItem(queueId: number): Promise<any> {
    try {
      const response = await fetch(`${this.getApiUrl()}/queue/item/${queueId}/api/json`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 404) {
        return null; // Queue item may have been processed
      } else {
        throw new Error(`Failed to get queue item: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Jenkins client: Error getting queue item:`, error);
      throw error;
    }
  }

  /**
   * Get build information for a specific build number
   */
  async getBuildInfo(jobName: string, buildNumber: number): Promise<JenkinsBuildResult> {
    try {
      const response = await fetch(`${this.getApiUrl()}/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get build info: ${response.status} ${response.statusText}`);
      }

      const buildData = await response.json() as any;
      return {
        number: buildData.number,
        result: buildData.result,
        building: buildData.building || false,
        url: buildData.url,
      };
    } catch (error) {
      console.error(`Jenkins client: Error getting build info:`, error);
      throw error;
    }
  }

  /**
   * Wait for build completion with timeout
   */
  async waitForBuildCompletion(jobName: string, buildNumber: number, timeoutMs: number = 300000): Promise<JenkinsBuildResult> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const buildInfo = await this.getBuildInfo(jobName, buildNumber);
        
        if (!buildInfo.building) {
          console.log(`Jenkins client: Build ${buildNumber} completed with result: ${buildInfo.result}`);
          return buildInfo;
        }
        
        console.log(`Jenkins client: Build ${buildNumber} still running, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } catch (error) {
        console.warn(`Jenkins client: Error checking build status, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
    
    throw new Error(`Build ${buildNumber} did not complete within ${timeoutMs}ms timeout`);
  }

  /**
   * Generate Jenkins job configuration XML
   */
  private generateJobConfigXml(job: JenkinsJob): string {
    const description = job.description || `Pipeline job for ${job.name}`;
    const parametersXml = this.generateParametersXml(job.parameters || {});
    
    return `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.42">
  <actions/>
  <description>${this.escapeXml(description)}</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    ${parametersXml ? `<hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        ${parametersXml}
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>` : ''}
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.92">
    <script>${this.escapeXml(job.jenkinsfile)}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
  }

  /**
   * Generate parameters XML for Jenkins job
   */
  private generateParametersXml(parameters: { [key: string]: any }): string {
    if (!parameters || Object.keys(parameters).length === 0) {
      return '';
    }

    return Object.entries(parameters).map(([key, config]) => {
      const paramType = config.type || 'string';
      const defaultValue = config.defaultValue || '';
      const description = config.description || '';

      switch (paramType.toLowerCase()) {
        case 'boolean':
          return `<hudson.model.BooleanParameterDefinition>
            <name>${this.escapeXml(key)}</name>
            <description>${this.escapeXml(description)}</description>
            <defaultValue>${defaultValue === true || defaultValue === 'true'}</defaultValue>
          </hudson.model.BooleanParameterDefinition>`;
        case 'choice': {
          const choices = config.choices || [];
          const choicesXml = choices.map((choice: string) => `<string>${this.escapeXml(choice)}</string>`).join('\n');
          return `<hudson.model.ChoiceParameterDefinition>
            <name>${this.escapeXml(key)}</name>
            <description>${this.escapeXml(description)}</description>
            <choices class="java.util.Arrays$ArrayList">
              <a class="string-array">
                ${choicesXml}
              </a>
            </choices>
          </hudson.model.ChoiceParameterDefinition>`;
        }
        default:
          return `<hudson.model.StringParameterDefinition>
            <name>${this.escapeXml(key)}</name>
            <description>${this.escapeXml(description)}</description>
            <defaultValue>${this.escapeXml(String(defaultValue))}</defaultValue>
            <trim>false</trim>
          </hudson.model.StringParameterDefinition>`;
      }
    }).join('\n');
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Test Jenkins connectivity and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      console.log(`Jenkins client: Testing connection to ${this.config.baseUrl}`);
      
      const response = await fetch(`${this.getApiUrl()}/api/json`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const version = data.version || 'unknown';
        console.log(`Jenkins client: Successfully connected to Jenkins version ${version}`);
        return {
          success: true,
          message: `Connected to Jenkins version ${version}`,
          version: version
        };
      } else {
        const errorText = await response.text();
        console.error(`Jenkins client: Connection test failed: ${response.status} ${response.statusText}`);
        console.error(`Jenkins client: Error response: ${errorText}`);
        
        let message = 'Failed to connect to Jenkins';
        if (response.status === 401) {
          message = 'Authentication failed - check username and API key';
        } else if (response.status === 404) {
          message = 'Jenkins API not found - check if Jenkins is running and URL is correct';
        } else if (response.status === 403) {
          message = 'Access denied - user may not have sufficient permissions';
        }
        
        return {
          success: false,
          message: `${message} (${response.status})`
        };
      }
    } catch (error) {
      console.error(`Jenkins client: Connection test error:`, error);
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }
}
