import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { JiraAPI } from './JiraAPI';
import { 
  JiraIssue, 
  JiraProject, 
  JiraResponse, 
  JiraComment, 
  JiraIssueType, 
  JiraUser,
  JiraSprint,
  JiraSprintHealth
} from './local-types';

// Re-export all types
export type { 
  JiraIssue, 
  JiraProject, 
  JiraResponse, 
  JiraComment, 
  JiraIssueType, 
  JiraUser,
  JiraSprint,
  JiraSprintHealth
} from './local-types';

export const jiraApiRef = createApiRef<JiraApi>({
  id: 'plugin.jira.api',
});

export interface IssueCreateOptions {
  projectKey: string;
  issueType: string;
  summary: string;
  description: string;
  status?: string;
  team?: string;
  startDate?: string;
  dueDate?: string;
  fixVersions?: string[];
  issueColor?: string;
  reporter?: string;
  attachment?: File;
  linkedItems?: string[];
  restrictToRoles?: string[];
}

export interface JiraApi {
  getIssuesForUser(email: string): Promise<JiraIssue[]>;
  getIssuesByProject(email: string): Promise<Map<string, JiraIssue[]>>;
  getIssuesByType(email: string): Promise<Map<string, JiraIssue[]>>;
  getIssueDetails(issueKey: string): Promise<JiraIssue>;
  getIssueComments(issueKey: string): Promise<JiraComment[]>;
  addComment(issueKey: string, comment: string): Promise<JiraComment>;
  getAvailableTransitions(issueKey: string): Promise<JiraResponse>;
  transitionIssue(issueKey: string, transitionId: string): Promise<void>;
  createIssue(projectKey: string, issueType: string, summary: string, description: string): Promise<JiraResponse>;
  createIssueWithOptions(options: IssueCreateOptions): Promise<JiraResponse>;
  getProjects(): Promise<JiraProject[]>;
  getIssueTypes(): Promise<JiraIssueType[]>;
  getUserProfile(): Promise<JiraUser>;
  getStatuses(): Promise<JiraResponse>;
  getTeams(): Promise<JiraResponse>;
  getFixVersions(projectKey: string): Promise<JiraResponse>;
  getAvailableRoles(): Promise<JiraResponse>;
  getSprintsByProject(projectKey: string): Promise<JiraSprint[]>;
  getSprintHealth(sprintId: number): Promise<JiraSprintHealth>;
  getAllSprintHealth(projectKey: string): Promise<JiraSprintHealth[]>;
}

export class JiraClient implements JiraApi {
  private readonly api: JiraAPI;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.api = new JiraAPI({
      discoveryApi: options.discoveryApi,
      fetchApi: options.fetchApi,
    });
  }

  async getIssuesForUser(email: string): Promise<JiraIssue[]> {
    return this.api.getIssuesForUser(email);
  }

  async getIssuesByProject(email: string): Promise<Map<string, JiraIssue[]>> {
    return this.api.getIssuesByProject(email);
  }

  async getIssuesByType(email: string): Promise<Map<string, JiraIssue[]>> {
    return this.api.getIssuesByType(email);
  }

  async getIssueDetails(issueKey: string): Promise<JiraIssue> {
    return this.api.getIssueDetails(issueKey);
  }

  async getIssueComments(issueKey: string): Promise<JiraComment[]> {
    return this.api.getIssueComments(issueKey);
  }

  async addComment(issueKey: string, comment: string): Promise<JiraComment> {
    return this.api.addComment(issueKey, comment);
  }

  async getAvailableTransitions(issueKey: string): Promise<JiraResponse> {
    return this.api.getAvailableTransitions(issueKey);
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    return this.api.transitionIssue(issueKey, transitionId);
  }

  async createIssue(
    projectKey: string,
    issueType: string,
    summary: string,
    description: string,
  ): Promise<JiraResponse> {
    return this.api.createIssue(projectKey, issueType, summary, description);
  }
  
  async createIssueWithOptions(options: IssueCreateOptions): Promise<JiraResponse> {
    return this.api.createIssueWithOptions(options);
  }

  async getProjects(): Promise<JiraProject[]> {
    return this.api.getProjects();
  }

  async getIssueTypes(): Promise<JiraIssueType[]> {
    return this.api.getIssueTypes();
  }

  async getUserProfile(): Promise<JiraUser> {
    return this.api.getUserProfile();
  }
  
  async getStatuses(): Promise<JiraResponse> {
    return this.api.getStatuses();
  }
  
  async getTeams(): Promise<JiraResponse> {
    return this.api.getTeams();
  }
  
  async getFixVersions(projectKey: string): Promise<JiraResponse> {
    return this.api.getFixVersions(projectKey);
  }
  
  async getAvailableRoles(): Promise<JiraResponse> {
    return this.api.getAvailableRoles();
  }

  async getSprintsByProject(projectKey: string): Promise<JiraSprint[]> {
    return this.api.getSprintsByProject(projectKey);
  }

  async getSprintHealth(sprintId: number): Promise<JiraSprintHealth> {
    return this.api.getSprintHealth(sprintId);
  }
  
  async getAllSprintHealth(projectKey: string): Promise<JiraSprintHealth[]> {
    return this.api.getAllSprintHealth(projectKey);
  }
}

export const createJiraApi = (options: {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}): JiraApi => {
  console.log('Creating Jira API client with options:', options);
  return new JiraClient(options);
};
