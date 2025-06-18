import { Logger } from 'winston';
import { Config } from '@backstage/config';
import { JiraBoard, JiraIssue, JiraSprint } from '../types';

/**
 * Production-ready service for making direct API calls to Jira
 * Uses dedicated jiraTrends configuration section for reliability
 */
export class JiraApiService {
  private readonly logger: Logger;
  private jiraBaseUrl: string = '';
  private authHeaders: Record<string, string> = {};

  constructor(
    logger: Logger,
    _discovery: any, // Not used for direct API calls
    _fetchApi: any, // Not used for direct API calls  
    config: Config,
  ) {
    this.logger = logger;
    
    // Try to get Jira configuration from dedicated jiraTrends config first
    const jiraTrendsConfig = config.getOptionalConfig('jiraTrends');
    let jiraConfig;
    
    if (jiraTrendsConfig) {
      jiraConfig = jiraTrendsConfig.getOptionalConfig('jira');
    }
    
    // Fallback to main jira config if jiraTrends config not found
    if (!jiraConfig) {
      const mainJiraConfig = config.getOptionalConfig('jira');
      if (mainJiraConfig && mainJiraConfig.has('instances')) {
        const instances = mainJiraConfig.getConfigArray('instances');
        if (instances.length > 0) {
          jiraConfig = instances[0]; // Use first instance
        }
      }
    }
    
    if (jiraConfig) {
      this.jiraBaseUrl = jiraConfig.getString('baseUrl');
      
      // Get authentication credentials
      const apiToken = jiraConfig.getOptionalString('apiToken');
      const email = jiraConfig.getOptionalString('email');
      
      if (apiToken && email) {
        // Create Basic Auth header
        const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
        this.authHeaders = {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Atlassian-Token': 'nocheck',
          'User-Agent': 'Backstage-JiraTrends'
        };
        this.logger.info('JiraApiService initialized with dedicated configuration');
      } else {
        this.logger.warn('Missing apiToken or email in Jira configuration, using fallback');
        this.setupFallbackConfig();
      }
    } else {
      this.logger.warn('No Jira configuration found, using fallback configuration');
      this.setupFallbackConfig();
    }
    
    this.logger.info('JiraApiService initialized with base URL:', this.jiraBaseUrl);
  }

  /**
   * Setup fallback configuration for development
   */
  private setupFallbackConfig() {
    this.jiraBaseUrl = 'https://fintechclub.atlassian.net';
    this.authHeaders = {
      'Authorization': 'Basic a3Vsa2FybmkuYWxva0BnbWFpbC5jb206QVRBVFQzeEZmR0YwcXJhQ0pvMW5LQnpxRkJHTkN3SkRLbnVpNGdaSWZ5RF9pcG1FM0FERF9Yc3F6QTN0YzJ1VEpndUdGa09TU2hHWlBzeU5hSVJ3SUhsTlUxZU83TGlXeXg4cEZjekRGeGJ4bWNlU1dNQVppdVV0X0dxNHZvTEJySzNSU21Tb2hpTWZuZXRxSzVnOUI3VjY4UmFhLUV6NWY0Rnh5QzdFZDRUUUNKOE9lZnZFNFRFPTRDQjc0RDVD',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Atlassian-Token': 'nocheck',
      'User-Agent': 'Backstage-JiraTrends'
    };
  }

  /**
   * Get the base URL for Jira REST API v2 calls (direct to Jira)
   */
  private getApiBaseUrl(): string {
    const apiPath = `${this.jiraBaseUrl}/rest/api/2`;
    this.logger.debug(`JiraApiService: Using direct API path: ${apiPath}`);
    return apiPath;
  }

  /**
   * Get the base URL for Jira Agile API v1.0 calls (direct to Jira)
   */
  private getAgileApiBaseUrl(): string {
    const apiPath = `${this.jiraBaseUrl}/rest/agile/1.0`;
    this.logger.debug(`JiraApiService: Using direct Agile API path: ${apiPath}`);
    return apiPath;
  }

  /**
   * Make direct request to Jira API using configured credentials
   * Uses the same authentication and headers as configured in proxy settings
   */
  async makeRequest<T>(endpoint: string, isAgileApi: boolean = false): Promise<T> {
    const baseUrl = isAgileApi ? this.getAgileApiBaseUrl() : this.getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    this.logger.debug(`Making direct Jira API request to: ${url}`);
    
    try {
      // Make direct API call with authentication headers from config
      const response = await fetch(url, {
        method: 'GET',
        headers: this.authHeaders,
      });

      this.logger.debug(`Jira API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Jira API error response: status=${response.status} statusText="${response.statusText}" body="${errorBody}" url="${url}" endpoint="${endpoint}"`);
        throw new Error(`Jira API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      this.logger.debug(`Jira API request successful for ${endpoint}`);
      return data;
    } catch (error) {
      this.logger.error(`Jira API error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all boards
   */
  async getBoards(): Promise<JiraBoard[]> {
    try {
      this.logger.info('Fetching all Jira boards');
      const data = await this.makeRequest<{ values: JiraBoard[] }>('/board', true);
      this.logger.info(`Successfully fetched ${data.values?.length || 0} boards`);
      return data.values || [];
    } catch (error) {
      this.logger.error('Error fetching boards:', error);
      throw error;
    }
  }

  /**
   * Get sprints for a board
   */
  async getSprintsForBoard(boardId: number): Promise<JiraSprint[]> {
    try {
      this.logger.info(`Fetching sprints for board ${boardId}`);
      const data = await this.makeRequest<{ values: JiraSprint[] }>(`/board/${boardId}/sprint`, true);
      this.logger.info(`Successfully fetched ${data.values?.length || 0} sprints for board ${boardId}`);
      return data.values || [];
    } catch (error) {
      this.logger.error(`Error fetching sprints for board ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get sprints for a board with optional state filter
   * Alias for compatibility with DataRefreshService
   */
  async getSprints(boardId: number, state?: string): Promise<JiraSprint[]> {
    try {
      this.logger.info(`Fetching sprints for board ${boardId} with state filter: ${state || 'all'}`);
      const endpoint = state 
        ? `/board/${boardId}/sprint?state=${state}`
        : `/board/${boardId}/sprint`;
      const data = await this.makeRequest<{ values: JiraSprint[] }>(endpoint, true);
      this.logger.info(`Successfully fetched ${data.values?.length || 0} sprints for board ${boardId}`);
      return data.values || [];
    } catch (error) {
      this.logger.error(`Error fetching sprints for board ${boardId} with state ${state || 'all'}:`, error);
      throw error;
    }
  }

  /**
   * Get issues for a board with specific fields including reporter and all possible story point fields
   */
  async getBoardIssues(boardId: number): Promise<JiraIssue[]> {
    try {
      this.logger.info(`Fetching issues for board ${boardId}`);
      // Include essential fields for team analysis including both assignee and reporter
      // and ALL common story point custom fields based on the main Jira plugin
      const storyPointFields = [
        'customfield_10024',
        'customfield_10002',
        'customfield_10016',
        'customfield_10026',
        'customfield_10028',
        'customfield_10030',
        'customfield_10032',
        'customfield_10034',
        'customfield_10036',
        'customfield_10038',
        'story_points',
        'storypoint',
        'story_point_estimate',
        'story-points',
        'points',
        'estimate'
      ].join(',');
      
      const fieldsParam = `fields=summary,status,assignee,reporter,issuetype,created,updated,resolutiondate,${storyPointFields}`;
      const data = await this.makeRequest<{ issues: JiraIssue[] }>(`/board/${boardId}/issue?${fieldsParam}`, false);
      this.logger.info(`Successfully fetched ${data.issues?.length || 0} issues for board ${boardId}`);
      
      // Log story points extraction for debugging
      if (data.issues) {
        data.issues.forEach(issue => {
          const storyPoints = this.extractStoryPoints(issue);
          if (storyPoints > 0) {
            this.logger.debug(`Issue ${issue.key} has ${storyPoints} story points`);
          }
        });
      }
      
      return data.issues || [];
    } catch (error) {
      this.logger.error(`Error fetching issues for board ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get sprint issues with specific fields including reporter and all possible story point fields
   */
  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    try {
      this.logger.info(`Fetching issues for sprint ${sprintId}`);
      const storyPointFields = [
        'customfield_10024',
        'customfield_10002',
        'customfield_10016',
        'customfield_10026',
        'customfield_10028',
        'customfield_10030',
        'customfield_10032',
        'customfield_10034',
        'customfield_10036',
        'customfield_10038',
        'story_points',
        'storypoint',
        'story_point_estimate',
        'story-points',
        'points',
        'estimate'
      ].join(',');
      
      const fieldsParam = `fields=summary,status,assignee,reporter,issuetype,created,updated,resolutiondate,${storyPointFields}`;
      const data = await this.makeRequest<{ issues: JiraIssue[] }>(`/sprint/${sprintId}/issue?${fieldsParam}`, true);
      this.logger.info(`Successfully fetched ${data.issues?.length || 0} issues for sprint ${sprintId}`);
      
      // Log story points extraction for debugging
      if (data.issues) {
        data.issues.forEach(issue => {
          const storyPoints = this.extractStoryPoints(issue);
          if (storyPoints > 0) {
            this.logger.debug(`Issue ${issue.key} has ${storyPoints} story points`);
          }
        });
      }
      
      return data.issues || [];
    } catch (error) {
      this.logger.error(`Error fetching issues for sprint ${sprintId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific issue with detailed fields
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      this.logger.info(`Fetching issue ${issueKey}`);
      // Include essential fields for team analysis including both assignee and reporter
      const fieldsParam = 'fields=summary,status,assignee,reporter,issuetype,created,updated,resolutiondate,storyPoints,customfield_10016';
      const data = await this.makeRequest<JiraIssue>(`/issue/${issueKey}?${fieldsParam}`, false);
      this.logger.info(`Successfully fetched issue ${issueKey}`);
      return data;
    } catch (error) {
      this.logger.error(`Error fetching issue ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Extract story points from a Jira issue using multiple possible field names
   */
  private extractStoryPoints(issue: JiraIssue): number {
    let storyPoints = 0;

    // Enhanced list of common story point fields, ordered by most common first
    const commonStoryPointFields = [
      'customfield_10024',
      'customfield_10002',
      'customfield_10016',
      'customfield_10026',
      'customfield_10028',
      'customfield_10030',
      'story_points',
      'storypoint',
      'story_point_estimate',
      'story-points',
      'points',
      'estimate'
    ];

    // First try all the common fields
    for (const fieldName of commonStoryPointFields) {
      const value = (issue.fields as any)[fieldName];
      if (value !== null && value !== undefined) {
        const points = Number(value);
        if (!isNaN(points)) {
          storyPoints = points;
          this.logger.debug(`Using story points from field ${fieldName}: ${points} for issue ${issue.key}`);
          break;
        }
      }
    }

    // If we still don't have story points, try to find any field that might contain story points
    if (storyPoints === 0) {
      // This will scan ALL fields for anything that might be a story point
      const storyPointFields = Object.keys(issue.fields).filter(key =>
        (key.toLowerCase().includes('story') ||
         key.toLowerCase().includes('point') ||
         key.toLowerCase().includes('estimate')) &&
        !key.toLowerCase().includes('text') // Exclude text fields
      );
      
      if (storyPointFields.length > 0) {
        this.logger.debug(`Found ${storyPointFields.length} potential story point fields: ${storyPointFields.join(', ')}`);
        // Try each field until we find a usable value
        for (const field of storyPointFields) {
          const value = (issue.fields as any)[field];
          if (value !== null && value !== undefined) {
            const points = Number(value);
            if (!isNaN(points)) {
              storyPoints = points;
              this.logger.debug(`Using story points from field ${field}: ${points} for issue ${issue.key}`);
              break;
            }
          }
        }
      }
    }
    
    return storyPoints;
  }
}
