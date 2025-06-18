// filepath: /Users/alokkulkarni/Documents/Development/platformengineering/updatedbackstage/backstage/plugins/jira-plugin/src/api/JiraAPI.ts
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { JiraIssue, JiraProject, JiraComment, JiraIssueType, JiraResponse, JiraUser, JiraSprint, JiraSprintHealth, JiraSprintMetrics } from './local-types';

export class JiraAPI {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    try {
      const proxyUrl = await this.discoveryApi.getBaseUrl('proxy');
      console.log('JiraAPI: Using proxy URL:', proxyUrl);
      // Use Jira's REST API v2 path
      const apiPath = `${proxyUrl}/jira/api/rest/api/2`;
      console.log('JiraAPI: Complete API path:', apiPath);
      return apiPath;
    } catch (error) {
      console.error('JiraAPI: Error getting base URL:', error);
      throw new Error(`Failed to get base URL for Jira API: ${error}`);
    }
  }

  async getIssuesForUser(email: string): Promise<JiraIssue[]> {
    const baseUrl = await this.getBaseUrl();
    console.log('Fetching issues for user:', email);
    
    try {
      // Try first with currentUser() which is safer and works if the user is logged in with the same account
      const jql = `assignee = currentUser() ORDER BY updated DESC`;
      
      console.log(`Making request to: ${baseUrl}/search`);
      console.log(`Using JQL: ${jql}`);
      
      // Debug request to check auth headers
      console.log('Testing auth headers with /myself endpoint first');
      const authTestResponse = await this.fetchApi.fetch(
        `${baseUrl}/myself`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );
      
      if (authTestResponse.ok) {
        const userData = await authTestResponse.json();
        console.log('Authentication successful, user account ID:', userData.accountId);
      } else {
        console.warn('Authentication test failed, status:', authTestResponse.status);
      }
      
      const response = await this.fetchApi.fetch(
        `${baseUrl}/search`,
        {
          method: 'POST', // Use POST instead of GET for better JQL handling
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            jql: jql,
            startAt: 0,
            maxResults: 50,
            fields: [
              "summary",
              "status",
              "assignee",
              "reporter",
              "issuetype",
              "project",
              "created",
              "updated",
              "description",
              "priority"
            ],
            expand: ["names", "schema", "transitions"]
          }),
        },
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch issues: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Issues fetched successfully:', data.issues?.length || 0);
      
      if (!data.issues || !Array.isArray(data.issues)) {
        console.error('Unexpected response format:', data);
        return [];
      }
      
      return data.issues as JiraIssue[];
    } catch (error) {
      console.error('Error in getIssuesForUser:', error);
      throw error;
    }
  }

  async getIssuesByProject(email: string): Promise<Map<string, JiraIssue[]>> {
    const issues = await this.getIssuesForUser(email);
    const issuesByProject = new Map<string, JiraIssue[]>();

    issues.forEach(issue => {
      const projectKey = issue.fields.project.key;
      if (!issuesByProject.has(projectKey)) {
        issuesByProject.set(projectKey, []);
      }
      issuesByProject.get(projectKey)?.push(issue);
    });

    return issuesByProject;
  }

  async getIssuesByType(email: string): Promise<Map<string, JiraIssue[]>> {
    const issues = await this.getIssuesForUser(email);
    const issuesByType = new Map<string, JiraIssue[]>();

    issues.forEach(issue => {
      const issueType = issue.fields.issuetype.name;
      if (!issuesByType.has(issueType)) {
        issuesByType.set(issueType, []);
      }
      issuesByType.get(issueType)?.push(issue);
    });

    return issuesByType;
  }

  async getIssueDetails(issueKey: string): Promise<JiraIssue> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Fetching issue details for ${issueKey}`);
    
    try {
      const response = await this.fetchApi.fetch(
        `${baseUrl}/issue/${encodeURIComponent(issueKey)}?expand=changelog,transitions,renderedFields`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );

      console.log(`JiraAPI: Issue details response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error fetching issue details:`, errorText);
        throw new Error(`Failed to fetch issue details: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Issue details fetched successfully for ${issueKey}`);
      return data as JiraIssue;
    } catch (error) {
      console.error(`JiraAPI: Error in getIssueDetails for ${issueKey}:`, error);
      throw error;
    }
  }

  async getIssueComments(issueKey: string): Promise<JiraComment[]> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Fetching comments for issue ${issueKey}`);
    
    try {
      const response = await this.fetchApi.fetch(
        `${baseUrl}/issue/${encodeURIComponent(issueKey)}/comment`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );
      
      console.log(`JiraAPI: Comments response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error fetching comments:`, errorText);
        throw new Error(`Failed to fetch comments: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Comments fetched successfully for ${issueKey}, count:`, 
                 data.comments?.length || 0);
      return data.comments as JiraComment[] || [];
    } catch (error) {
      console.error(`JiraAPI: Error in getIssueComments for ${issueKey}:`, error);
      throw error;
    }
  }

  async addComment(issueKey: string, comment: string): Promise<JiraComment> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Adding comment to issue ${issueKey}`);
    
    try {
      const response = await this.fetchApi.fetch(
        `${baseUrl}/issue/${encodeURIComponent(issueKey)}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ body: comment }),
        },
      );
      
      console.log(`JiraAPI: Add comment response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error adding comment:`, errorText);
        throw new Error(`Failed to add comment: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Comment added successfully to ${issueKey}`);
      return data as JiraComment;
    } catch (error) {
      console.error(`JiraAPI: Error in addComment for ${issueKey}:`, error);
      throw error;
    }
  }

  async getAvailableTransitions(issueKey: string): Promise<JiraResponse> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/issue/${encodeURIComponent(issueKey)}/transitions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transitions: ${response.statusText}`);
    }

    return await response.json();
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(
      `${baseUrl}/issue/${encodeURIComponent(issueKey)}/transitions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transition: { id: transitionId },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to transition issue: ${response.statusText}`);
    }
  }

  async createIssue(projectKey: string, issueType: string, summary: string, description: string): Promise<JiraResponse> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Creating new issue in project ${projectKey}`);
    
    try {
      const payload = {
        fields: {
          project: { key: projectKey },
          issuetype: { name: issueType },
          summary,
          description,
        },
      };
      
      console.log(`JiraAPI: Issue creation payload:`, JSON.stringify(payload));
      
      const response = await this.fetchApi.fetch(`${baseUrl}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log(`JiraAPI: Create issue response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error creating issue:`, errorText);
        throw new Error(`Failed to create issue: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Issue created successfully, key: ${data.key || 'unknown'}`);
      return data;
    } catch (error) {
      console.error(`JiraAPI: Error in createIssue:`, error);
      throw error;
    }
  }

  async createIssueWithOptions(options: {
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
    linkedItems?: string[];
    restrictToRoles?: string[];
  }): Promise<JiraResponse> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Creating new issue with extended options in project ${options.projectKey}`);
    
    try {
      // Build the fields object with all the provided options
      const fields: any = {
        project: { key: options.projectKey },
        issuetype: { name: options.issueType },
        summary: options.summary,
        description: options.description,
      };

      // Add optional fields if provided
      if (options.dueDate) {
        fields.duedate = options.dueDate;
      }

      if (options.startDate) {
        fields.customfield_10015 = options.startDate; // Assuming this is the start date field ID
      }

      if (options.team) {
        fields.customfield_10010 = { value: options.team }; // Assuming this is the team field ID
      }

      if (options.fixVersions && options.fixVersions.length > 0) {
        fields.fixVersions = options.fixVersions.map(version => ({ name: version }));
      }

      if (options.reporter) {
        // In Jira, reporter usually requires account ID, not just a string
        fields.reporter = { id: options.reporter };
      }

      // Create the payload with the fields
      const payload = { fields };
      
      console.log(`JiraAPI: Issue creation payload:`, JSON.stringify(payload));
      
      const response = await this.fetchApi.fetch(`${baseUrl}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log(`JiraAPI: Create issue response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error creating issue:`, errorText);
        throw new Error(`Failed to create issue: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Issue created successfully, key: ${data.key || 'unknown'}`);
      
      // Handle attachments if provided - this would be a separate API call
      // if (options.attachment) {
      //   await this.addAttachment(data.key, options.attachment);
      // }

      // Handle linked items if provided
      if (options.linkedItems && options.linkedItems.length > 0) {
        // Here you would implement logic to link items
        // Example: options.linkedItems.forEach(async (item) => await this.linkIssues(data.key, item));
        console.log(`Would link ${options.linkedItems.length} items to ${data.key}`);
      }

      return data;
    } catch (error) {
      console.error(`JiraAPI: Error in createIssueWithOptions:`, error);
      throw error;
    }
  }

  async getProjects(): Promise<JiraProject[]> {
    const baseUrl = await this.getBaseUrl();
    console.log('JiraAPI: Fetching projects list');
    
    try {
      const response = await this.fetchApi.fetch(`${baseUrl}/project`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('JiraAPI: Projects response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JiraAPI: Error fetching projects:', errorText);
        throw new Error(`Failed to fetch projects: ${response.statusText} - ${errorText}`);
      }

      const projects = await response.json();
      console.log('JiraAPI: Projects fetched successfully, count:', Array.isArray(projects) ? projects.length : 'N/A (not an array)');
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error('JiraAPI: Error in getProjects:', error);
      throw error;
    }
  }

  async getIssueTypes(): Promise<JiraIssueType[]> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/issuetype`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch issue types: ${response.statusText}`);
    }

    return await response.json();
  }

  async getUserProfile(): Promise<JiraUser> {
    const baseUrl = await this.getBaseUrl();
    console.log('JiraAPI: Fetching user profile from', `${baseUrl}/myself`);
    
    try {
      const response = await this.fetchApi.fetch(`${baseUrl}/myself`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('JiraAPI: User profile response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JiraAPI: Error fetching user profile:', errorText);
        throw new Error(`Failed to fetch user profile: ${response.statusText} - ${errorText}`);
      }

      const userData = await response.json();
      console.log('JiraAPI: User profile fetched successfully, account ID:', userData.accountId);
      
      // Log the full response for debugging (excluding sensitive data)
      console.log('JiraAPI: User profile data:', {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress ? `${userData.emailAddress.substring(0, 3)}...` : undefined,
        active: userData.active,
      });
      
      return userData;
    } catch (error) {
      console.error('JiraAPI: Error in getUserProfile:', error);
      throw error;
    }
  }

  async getStatuses(): Promise<JiraResponse> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Fetching available statuses`);
    
    try {
      const response = await this.fetchApi.fetch(
        `${baseUrl}/status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error fetching statuses:`, errorText);
        throw new Error(`Failed to fetch statuses: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Statuses fetched successfully`);
      return data;
    } catch (error) {
      console.error(`JiraAPI: Error in getStatuses:`, error);
      // Return default statuses if the API call fails
      return [{ id: '1', name: 'To Do' }, { id: '2', name: 'In Progress' }, { id: '3', name: 'Done' }];
    }
  }

  async getTeams(): Promise<JiraResponse> {
    // In a real implementation, this might fetch from a Jira custom field
    // For now, we'll return some mock teams
    console.log(`JiraAPI: Fetching available teams (mock data)`);
    return [
      { id: 'team1', name: 'Frontend Team' },
      { id: 'team2', name: 'Backend Team' },
      { id: 'team3', name: 'DevOps Team' },
      { id: 'team4', name: 'QA Team' },
    ];
  }

  async getFixVersions(projectKey: string): Promise<JiraResponse> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Fetching fix versions for project ${projectKey}`);
    
    try {
      const response = await this.fetchApi.fetch(
        `${baseUrl}/project/${encodeURIComponent(projectKey)}/versions`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error fetching fix versions:`, errorText);
        throw new Error(`Failed to fetch fix versions: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Fix versions fetched successfully for project ${projectKey}`);
      return data;
    } catch (error) {
      console.error(`JiraAPI: Error in getFixVersions for ${projectKey}:`, error);
      // Return mock versions if the API call fails
      return [
        { id: 'v1', name: '1.0.0' },
        { id: 'v2', name: '1.1.0' },
        { id: 'v3', name: '2.0.0' },
      ];
    }
  }

  async getAvailableRoles(): Promise<JiraResponse> {
    const baseUrl = await this.getBaseUrl();
    console.log(`JiraAPI: Fetching available roles`);
    
    try {
      const response = await this.fetchApi.fetch(
        `${baseUrl}/role`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JiraAPI: Error fetching roles:`, errorText);
        throw new Error(`Failed to fetch roles: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`JiraAPI: Roles fetched successfully`);
      return data;
    } catch (error) {
      console.error(`JiraAPI: Error in getAvailableRoles:`, error);
      // Return mock roles if the API call fails
      return [
        { id: '10001', name: 'Administrators' },
        { id: '10002', name: 'Developers' },
        { id: '10003', name: 'Users' },
      ];
    }
  }

  async getSprintsByProject(projectKey: string): Promise<JiraSprint[]> {
    try {
      console.log(`Starting getSprintsByProject for project key: ${projectKey}`);
      const baseUrl = await this.getBaseUrl();
      
      // Log the base URL for debugging
      console.log(`DEBUG: Base URL is: ${baseUrl}`);
      
      // Note: Since Jira's sprint API is part of the agile API, we adjust the path
      // This is typically at /rest/agile/1.0/
      const agileBasePath = baseUrl.replace('/rest/api/2', '/rest/agile/1.0');
      console.log(`DEBUG: Using Agile API base path: ${agileBasePath}`);
      
      // Try a direct sprint search approach first (faster and more reliable in some Jira instances)
      // This approach can find all sprints across all boards in the project with one call
      try {
        console.log(`Attempting direct sprint search first for project ${projectKey}`);
        const directSprintUrl = `${agileBasePath}/sprint/search?jql=project=${projectKey}`;
        console.log(`Direct sprint search URL: ${directSprintUrl}`);
        
        const directSprintResponse = await this.fetchApi.fetch(
          directSprintUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );
        
        if (directSprintResponse.ok) {
          const directSprintData = await directSprintResponse.json();
          if (directSprintData.values && Array.isArray(directSprintData.values) && directSprintData.values.length > 0) {
            console.log(`Found ${directSprintData.values.length} sprints directly via sprint search`);
            return directSprintData.values;
          }
          console.log('Direct sprint search returned no results, falling back to board search');
        } else {
          console.log(`Direct sprint search failed (${directSprintResponse.status}), falling back to board search`);
        }
      } catch (directSearchError) {
        console.log(`Error in direct sprint search, falling back to board search: ${directSearchError}`);
      }
      
      // First, get the board IDs for the project
      const boardsUrl = `${agileBasePath}/board?projectKeyOrId=${projectKey}`;
      console.log(`Fetching boards from: ${boardsUrl}`);
      
      const boardsResponse = await this.fetchApi.fetch(
        boardsUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!boardsResponse.ok) {
        const errorMsg = `Failed to fetch boards for project ${projectKey}: ${boardsResponse.statusText} (${boardsResponse.status})`;
        console.error(errorMsg);
        
        // Try alternative ways to find boards in case of error
        console.log('Trying alternative approaches to find boards...');
        return await this.findSprintsWithAlternativeMethods(projectKey, agileBasePath);
      }

      const boardsData = await boardsResponse.json();
      
      if (!boardsData.values || !Array.isArray(boardsData.values) || boardsData.values.length === 0) {
        console.log(`JiraAPI: No boards found for project ${projectKey}`);
        
        // Try to create mock data in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('Creating mock data for development environment');
          return this.createMockSprintsData();
        }
        
        return [];
      }
      
      // Get all sprints, regardless of state
      const sprints: JiraSprint[] = [];
      
      // Log the boards we found
      console.log(`Found ${boardsData.values.length} boards for project ${projectKey}:`);
      boardsData.values.forEach((board: any, index: number) => {
        console.log(`Board ${index + 1}: ID ${board.id}, Name: ${board.name || 'unnamed'}, Type: ${board.type || 'unknown'}`);
      });
      
      // Process each board to find sprints
      for (const board of boardsData.values) {
        console.log(`Fetching sprints for board ${board.id} (${board.name || 'unnamed'})`);
        
        try {
          // Use the helper method to get sprints from this board
          const boardSprints = await this.getSprintsFromBoard(board.id, agileBasePath);
          
          if (boardSprints.length > 0) {
            // Add sprints to our list
            sprints.push(...boardSprints);
            
            // Check specifically for SCRUM Sprint 1
            const scrumSprint = boardSprints.find(s => 
              s.name && s.name.toLowerCase().includes('scrum sprint 1')
            );
            
            if (scrumSprint) {
              console.log(`DEBUG: Found SCRUM Sprint 1 in board ${board.id}:`, scrumSprint);
            }
          } else {
            console.log(`No sprints found for board ${board.id}, it might be a Kanban board or have no sprints created`);
          }
        } catch (boardError) {
          console.error(`Error processing board ${board.id}:`, boardError);
          // Continue with other boards even if one fails
        }
      }
      
      // If we still didn't find any sprints, try one more approach with direct board access
      if (sprints.length === 0) {
        console.log(`No sprints found through standard methods, attempting additional search...`);
        
        // Try looking for "all" boards rather than just project-specific ones
        try {
          const allBoardsUrl = `${agileBasePath}/board`;
          console.log(`Fetching all accessible boards from: ${allBoardsUrl}`);
          
          const allBoardsResponse = await this.fetchApi.fetch(
            allBoardsUrl,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (allBoardsResponse.ok) {
            const allBoardsData = await allBoardsResponse.json();
            if (allBoardsData.values && Array.isArray(allBoardsData.values) && allBoardsData.values.length > 0) {
              console.log(`Found ${allBoardsData.values.length} total boards, checking for matching project...`);
              
              // Look for boards that might match our project name (not just by key)
              const possibleBoards = allBoardsData.values.filter((b: any) => 
                b.name && (
                  b.name.includes(projectKey) || 
                  (b.location && b.location.projectName && b.location.projectName.includes(projectKey))
                )
              );
              
              console.log(`Found ${possibleBoards.length} boards possibly related to project ${projectKey}`);
              
              // Process each possible board
              for (const possibleBoard of possibleBoards) {
                const boardSprints = await this.getSprintsFromBoard(possibleBoard.id, agileBasePath);
                sprints.push(...boardSprints);
              }
            }
          }
        } catch (additionalSearchError) {
          console.error(`Error in additional board search:`, additionalSearchError);
        }
      }
      
      // Handle case where we still have no sprints
      if (sprints.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No sprints found, providing mock data for development');
        return this.createMockSprintsData();
      }
      
      console.log(`JiraAPI: Fetched ${sprints.length} sprints for project ${projectKey}`);
      return sprints;
    } catch (error) {
      console.error(`JiraAPI: Error in getSprintsByProject for ${projectKey}:`, error);
      throw error;
    }
  }

  async getSprintHealth(sprintId: number): Promise<JiraSprintHealth> {
    try {
      console.log(`Fetching health data for sprint ${sprintId}`);
      const baseUrl = await this.getBaseUrl();
      const agileBasePath = baseUrl.replace('/rest/api/2', '/rest/agile/1.0');
      
      // First, get the sprint details with cache busting
      const sprintTimestamp = new Date().getTime();
      const sprintUrl = `${agileBasePath}/sprint/${sprintId}?_=${sprintTimestamp}`;
      console.log(`Fetching sprint details from: ${sprintUrl}`);
      
      const sprintResponse = await this.fetchApi.fetch(
        sprintUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      );

      if (!sprintResponse.ok) {
        throw new Error(`Failed to fetch sprint ${sprintId}: ${sprintResponse.statusText}`);
      }

      const sprint: JiraSprint = await sprintResponse.json();
      console.log(`Retrieved sprint details: ${sprint.name}, state: ${sprint.state}`);
      
      
      // Now, get the issues for this sprint with cache busting to ensure fresh data
      const timestamp = new Date().getTime();
      const issuesUrl = `${agileBasePath}/sprint/${sprintId}/issue?maxResults=100&_=${timestamp}`;
      console.log(`Fetching sprint issues from: ${issuesUrl}`);
      
      const issuesResponse = await this.fetchApi.fetch(
        issuesUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          // No need for body in GET request, use URL parameters instead
        }
      );

      if (!issuesResponse.ok) {
        console.error(`Error fetching issues for sprint ${sprintId}: ${issuesResponse.statusText}`);
        throw new Error(`Failed to fetch issues for sprint ${sprintId}: ${issuesResponse.statusText}`);
      }

      const issuesData = await issuesResponse.json();
      const issues = issuesData.issues || [];
      console.log(`Retrieved ${issues.length} issues for sprint ${sprintId}`);
      
      // Log the first few issues for debugging
      const issueSample = issues.slice(0, 3).map((issue: any) => ({ 
        key: issue.key, 
        summary: issue.fields.summary,
        status: issue.fields.status.name
      }));
      console.log('Sample issues:', issueSample);
      
      // Calculate sprint metrics
      const metrics: JiraSprintMetrics = {
        totalIssues: issues.length,
        completedIssues: 0,
        issuesByStatus: {},
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        daysRemaining: undefined,
        isOnTrack: undefined,
      };
      
      // Process the issues to collect metrics
      for (const issue of issues) {
        const statusName = issue.fields.status.name;
        
        // Count issues by status
        if (!metrics.issuesByStatus[statusName]) {
          metrics.issuesByStatus[statusName] = 0;
        }
        metrics.issuesByStatus[statusName]++;
        
        // Count completed issues (assuming 'Done' is the completed status)
        if (statusName.toLowerCase() === 'done' || 
            issue.fields.status.statusCategory.key === 'done') {
          metrics.completedIssues++;
        }
        
        // Log if this is the SCRUM Sprint 1 for debugging
        if (sprint.name.toLowerCase().includes('scrum sprint 1')) {
          console.log(`Issue ${issue.key} in "${sprint.name}": Status=${statusName}`);
        }
        
        // Calculate story points if available
        // Enhanced story point detection with better debugging
        let storyPoints = 0;
        
        // If this is the first issue, dump all field names to help identify the story points field
        if (issues.indexOf(issue) === 0) {
          console.log(`DEBUG: Available fields for issue ${issue.key}:`, Object.keys(issue.fields).join(', '));
          
          // Look for anything that might be a story point field and log its value
          Object.keys(issue.fields).forEach(field => {
            if (field.toLowerCase().includes('story') || 
                field.toLowerCase().includes('point') || 
                field.toLowerCase().includes('estimate')) {
              console.log(`Potential story point field: ${field} = ${issue.fields[field]}`);
            }
          });
        }
        
        // Enhanced list of common story point fields, ordered by most common first
        const commonStoryPointFields = [
          'customfield_10024',    // Common in Jira Cloud
          'customfield_10002',    // Common in many Jira instances
          'customfield_10016',    // Used in some Jira instances
          'customfield_10026',    // Used in some Jira instances
          'customfield_10028',    // Used in some Jira instances
          'storyPoints',          // Some instances use this naming
          'story_points',         // Alternative naming
          'storypoint',           // Alternative naming
          'story_point_estimate', // Another alternative
          'story-points',         // Another alternative
          'points',               // Generic naming
          'estimate'              // Generic naming
        ];
        
        // First try all the common fields
        for (const fieldName of commonStoryPointFields) {
          if (issue.fields[fieldName] !== undefined && issue.fields[fieldName] !== null) {
            const points = Number(issue.fields[fieldName]);
            if (!isNaN(points)) {
              storyPoints = points;
              if (storyPoints > 0) {
                console.log(`Found story points in field ${fieldName}: ${points} for issue ${issue.key}`);
                break;
              }
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
            !key.toLowerCase().includes('description') && // Exclude description fields
            !key.toLowerCase().includes('text') // Exclude text fields
          );
          
          if (storyPointFields.length > 0) {
            console.log(`Found ${storyPointFields.length} potential story point fields: ${storyPointFields.join(', ')}`);
            // Try each field until we find a usable value
            for (const field of storyPointFields) {
              const value = issue.fields[field];
              if (value !== null && value !== undefined) {
                const points = Number(value);
                if (!isNaN(points)) {
                  storyPoints = points;
                  console.log(`Using story points from field ${field}: ${points} for issue ${issue.key}`);
                  break;
                }
              }
            }
          }
        }
        
        // Log story points for debugging, especially for SCRUM Sprint 1
        if (sprint.name.toLowerCase().includes('scrum sprint 1')) {
          console.log(`Issue ${issue.key} has ${storyPoints} story points`);
        }
        
        // Handle story points with proper null/undefined checks
        if (metrics.totalStoryPoints !== undefined) {
          metrics.totalStoryPoints += storyPoints;
        }
        
        if ((statusName.toLowerCase() === 'done' || 
             issue.fields.status.statusCategory.key === 'done') &&
            metrics.completedStoryPoints !== undefined) {
          metrics.completedStoryPoints += storyPoints;
        }
      }
      
      // Calculate days remaining if sprint has an end date
      // Always fetch fresh data using current timestamp
      if (sprint.endDate) {
        const now = new Date();
        const endDate = new Date(sprint.endDate);
        
        // Calculate both calendar days and working days remaining
        const diffTime = endDate.getTime() - now.getTime();
        const calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate working days (excludes weekends)
        let workingDays = 0;
        const currentDate = new Date(now);
        currentDate.setHours(0, 0, 0, 0); // Start from beginning of today
        
        const endDateCopy = new Date(endDate);
        endDateCopy.setHours(23, 59, 59, 999); // End at end of end date
        
        // Count working days between now and end date
        while (currentDate <= endDateCopy) {
          const dayOfWeek = currentDate.getDay();
          // 0 is Sunday, 6 is Saturday
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Sprint ${sprint.name}: Calendar days remaining=${calendarDays}, Working days remaining=${workingDays}`);
        
        // Use working days for sprint calculation as it's more accurate for team planning
        metrics.daysRemaining = Math.max(0, workingDays);
        
        // Also store both values for UI display options
        metrics.calendarDaysRemaining = Math.max(0, calendarDays);
        metrics.workingDaysRemaining = metrics.daysRemaining;
      } else {
        console.log(`Sprint ${sprint.name} has no end date defined`);
        metrics.daysRemaining = undefined;
        metrics.calendarDaysRemaining = undefined;
        metrics.workingDaysRemaining = undefined;
      }
      
      // Calculate if sprint is on track with improved algorithm
      // Consider sprint duration for a more accurate calculation
      let sprintDurationDays = 10; // Default to 2 weeks (10 working days)
      
      if (sprint.startDate && sprint.endDate) {
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        
        // Calculate total duration in working days for better accuracy
        let totalWorkingDays = 0;
        const dayCounter = new Date(startDate);
        dayCounter.setHours(0, 0, 0, 0);
        
        const endDateCopy = new Date(endDate);
        endDateCopy.setHours(23, 59, 59, 999);
        
        while (dayCounter <= endDateCopy) {
          const dayOfWeek = dayCounter.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalWorkingDays++;
          }
          dayCounter.setDate(dayCounter.getDate() + 1);
        }
        
        sprintDurationDays = totalWorkingDays;
        console.log(`Sprint ${sprint.name} total duration: ${sprintDurationDays} working days`);
      }
      
      // Improved on-track calculation
      // If half the sprint time has passed, half the work should be done
      const timeRatio = metrics.daysRemaining !== undefined ? 
                        1 - (metrics.daysRemaining / sprintDurationDays) : 0.5;
      const completionRatio = metrics.completedIssues / Math.max(1, metrics.totalIssues);
      
      metrics.isOnTrack = completionRatio >= (timeRatio - 0.1); // 10% buffer
      
      return {
        sprint,
        metrics
      };
    } catch (error) {
      console.error(`JiraAPI: Error in getSprintHealth for sprint ${sprintId}:`, error);
      throw error;
    }
  }

  async getAllSprintHealth(projectKey: string): Promise<JiraSprintHealth[]> {
    try {
      console.log(`Getting sprint health for all sprints in project ${projectKey}`);
      
      // Get sprints where the user is involved (assigned tickets or scrum master)
      const sprints = await this.getSprintsByUserInvolvement(projectKey);
      console.log(`Found ${sprints.length} sprints with user involvement for project ${projectKey}`);
      
      // Log sprint information for better debugging
      if (sprints.length > 0) {
        const sprintInfo = sprints.map(s => ({ 
          id: s.id, 
          name: s.name || 'Unnamed Sprint', 
          state: s.state || 'unknown',
          startDate: s.startDate,
          endDate: s.endDate
        }));
        console.log('Sprint details:', JSON.stringify(sprintInfo, null, 2));
        
        // Check for SCRUM Sprint 1 using flexible matching (case insensitive, spaces optional)
        const scrumSprint1Patterns = [
          /scrum\s*sprint\s*1/i,
          /sprint\s*1/i,
          /scrum\s*1/i
        ];
        
        // Try each pattern to find the SCRUM Sprint 1
        let scrumSprint1: JiraSprint | undefined;
        for (const pattern of scrumSprint1Patterns) {
          scrumSprint1 = sprints.find(s => s.name && pattern.test(s.name));
          if (scrumSprint1) {
            console.log(`DEBUG: Found sprint matching pattern ${pattern}: "${scrumSprint1.name}"`);
            break;
          }
        }
        
        if (scrumSprint1) {
          console.log('DEBUG: Found SCRUM Sprint 1:', scrumSprint1);
        } else {
          console.log('DEBUG: No sprint with name resembling "SCRUM Sprint 1" found');
          
          // Log all sprint names to help troubleshoot
          const allSprintNames = sprints.map(s => s.name).join(', ');
          console.log(`DEBUG: Available sprint names: ${allSprintNames}`);
        }
      } else {
        console.log('No sprints found for this project');
        
        // Create sample mock data to test UI if we're in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('DEBUG: Creating sample sprint data for testing in development mode');
          return this.createMockSprintData();
        }
        
        return []; // Return empty array if no sprints in production
      }
      
      // Process sprints one at a time instead of using Promise.all to better handle errors
      const healthResults: JiraSprintHealth[] = [];
      const failedSprints: JiraSprint[] = [];
      
      for (const sprint of sprints) {
        try {
          console.log(`Fetching health data for sprint: ${sprint.name} (ID: ${sprint.id})`);
          const sprintHealth = await this.getSprintHealth(sprint.id);
          healthResults.push(sprintHealth);
          
          // If this is "SCRUM Sprint 1", log more details about it
          if (sprint.name && sprint.name.toLowerCase().includes('scrum sprint 1')) {
            console.log('DEBUG: Successfully retrieved health data for SCRUM Sprint 1:', 
              JSON.stringify({
                name: sprint.name,
                id: sprint.id,
                metrics: {
                  totalIssues: sprintHealth.metrics.totalIssues,
                  completedIssues: sprintHealth.metrics.completedIssues,
                  issuesByStatus: sprintHealth.metrics.issuesByStatus
                }
              })
            );
          }
        } catch (sprintError) {
          console.error(`Error fetching health for sprint ${sprint.name} (${sprint.id}):`, sprintError);
          failedSprints.push(sprint);
          // Continue with other sprints even if one fails
        }
      }
      
      console.log(`Successfully retrieved health data for ${healthResults.length} out of ${sprints.length} sprints`);
      
      // If we failed to retrieve data for all sprints, but found some sprints, log an error
      if (healthResults.length === 0 && failedSprints.length > 0) {
        console.error(`Failed to retrieve health data for all ${failedSprints.length} sprints. Using mock data instead.`);
        
        // In development mode, provide mock data to help with testing
        if (process.env.NODE_ENV === 'development') {
          console.log('Creating mock sprint data since all real sprints failed to load');
          return this.createMockSprintData();
        }
      }
      
      // Always check if we found SCRUM Sprint 1 in the results
      const scrumSprint1Health = healthResults.find(
        h => h.sprint.name && h.sprint.name.toLowerCase().includes('scrum sprint 1')
      );
      
      if (!scrumSprint1Health && healthResults.length > 0) {
        console.log('SCRUM Sprint 1 was not found in the health results, but other sprints were found');
      } else if (scrumSprint1Health) {
        console.log('SCRUM Sprint 1 was successfully loaded with health data');
      }
      
      // If we have no health results in production, throw a more informative error
      if (healthResults.length === 0 && process.env.NODE_ENV !== 'development') {
        throw new Error(`No sprint health data found for project ${projectKey}. Please ensure that sprints exist and are properly configured in Jira.`);
      }
      
      return healthResults;
    } catch (error) {
      console.error(`JiraAPI: Error in getAllSprintHealth for project ${projectKey}:`, error);
      
      // In development mode, provide mock data to help with UI testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Error occurred in getAllSprintHealth, returning mock data for development');
        return this.createMockSprintData();
      }
      
      // In production, propagate the error
      throw error;
    }
  }

  /**
   * Creates mock sprint data for testing when no real sprints are available
   * This is only used in development mode
   */
  private createMockSprintData(): JiraSprintHealth[] {
    console.log('Creating mock sprint data for development testing');
    
    // Create a mock active sprint that looks like SCRUM Sprint 1
    const mockActiveSprint: JiraSprint = {
      id: 12345,
      name: 'SCRUM Sprint 1',
      state: 'active',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),   // 9 days from now
      originBoardId: 1001,
      goal: 'Complete the Backstage Jira integration',
      release: 'v2.0.0'
    };
    
    // Create mock metrics for the sprint
    const mockMetrics: JiraSprintMetrics = {
      completedIssues: 11,
      totalIssues: 22,
      completedStoryPoints: 23,
      totalStoryPoints: 51,
      issuesByStatus: {
        'To Do': 7,
        'In Progress': 4,
        'Done': 11
      },
      daysRemaining: 9,
      calendarDaysRemaining: 9,
      workingDaysRemaining: 7, // Assuming 7 working days out of 9 calendar days
      isOnTrack: true
    };
    
    // Create a second mock sprint (closed)
    const mockClosedSprint: JiraSprint = {
      id: 12346,
      name: 'Previous Sprint',
      state: 'closed',
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),    // 7 days ago
      completeDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      originBoardId: 1001
    };
    
    // Create metrics for the closed sprint
    const mockClosedMetrics: JiraSprintMetrics = {
      completedIssues: 12,
      totalIssues: 15,
      completedStoryPoints: 28,
      totalStoryPoints: 30,
      issuesByStatus: {
        'To Do': 1,
        'In Progress': 2,
        'Done': 12
      },
      daysRemaining: 0,
      calendarDaysRemaining: 0,
      workingDaysRemaining: 0,
      isOnTrack: false
    };
    
    return [
      { sprint: mockActiveSprint, metrics: mockMetrics },
      { sprint: mockClosedSprint, metrics: mockClosedMetrics }
    ];
  }

  /**
   * Create mock data for sprints (separate from sprint health) for testing
   */
  private createMockSprintsData(): JiraSprint[] {
    console.log('Creating mock sprint data for development testing');
    
    return [
      {
        id: 12345,
        name: 'SCRUM Sprint 1',
        state: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now to match createMockSprintData
        originBoardId: 1001,
        goal: 'Complete the Backstage Jira integration'
      },
      {
        id: 12346,
        name: 'Previous Sprint',
        state: 'closed',
        startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completeDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        originBoardId: 1001
      }
    ];
  }

  /**
   * Attempt to find sprints using alternative methods when standard board search fails
   * This is a fallback approach when the primary method fails
   */
  private async findSprintsWithAlternativeMethods(projectKey: string, agileBasePath: string): Promise<JiraSprint[]> {
    console.log(`Using alternative methods to find sprints for project ${projectKey}`);
    const sprints: JiraSprint[] = [];
    
    try {
      // Try to query for "recent" boards which might include this project
      console.log('Attempting to find recent boards...');
      const recentBoardsUrl = `${agileBasePath}/board/recent`;
      
      const recentBoardsResponse = await this.fetchApi.fetch(
        recentBoardsUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      if (recentBoardsResponse.ok) {
        const recentBoardsData = await recentBoardsResponse.json();
        if (recentBoardsData.values && Array.isArray(recentBoardsData.values)) {
          console.log(`Found ${recentBoardsData.values.length} recent boards`);
          
          // Filter for boards that might be related to our project
          const possibleBoards = recentBoardsData.values.filter((board: any) => 
            board.location && 
            (board.location.projectId === projectKey || 
             board.location.projectKey === projectKey ||
             (board.location.projectName && board.location.projectName.includes(projectKey)))
          );
          
          if (possibleBoards.length > 0) {
            console.log(`Found ${possibleBoards.length} boards possibly related to project ${projectKey}`);
            
            // Search for sprints in each of these boards
            for (const board of possibleBoards) {
              try {
                const boardSprints = await this.getSprintsFromBoard(board.id, agileBasePath);
                sprints.push(...boardSprints);
              } catch (error) {
                console.log(`Failed to get sprints from board ${board.id}: ${error}`);
              }
            }
          }
        }
      }
      
      // If we still don't have sprints, create mock data in development
      if (sprints.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No sprints found through alternative methods, creating mock data for development');
        return this.createMockSprintsData();
      }
      
      return sprints;
    } catch (error) {
      console.error('Error in alternative sprint search:', error);
      
      // Return mock data in development mode
      if (process.env.NODE_ENV === 'development') {
        return this.createMockSprintsData();
      }
      return [];
    }
  }
  
  /**
   * Get sprints from a specific board
   */
  private async getSprintsFromBoard(boardId: number, agileBasePath: string): Promise<JiraSprint[]> {
    console.log(`Fetching sprints for board ${boardId}`);
    
    // Try different URL patterns to ensure we get all sprints
    const urls = [
      `${agileBasePath}/board/${boardId}/sprint`,
      `${agileBasePath}/board/${boardId}/sprint?state=active,closed,future`
    ];
    
    for (const url of urls) {
      try {
        console.log(`Trying to fetch sprints from: ${url}`);
        const response = await this.fetchApi.fetch(
          url,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.values && Array.isArray(data.values) && data.values.length > 0) {
            console.log(`Found ${data.values.length} sprints for board ${boardId}`);
            return data.values;
          }
        }
      } catch (error) {
        console.log(`Error fetching sprints from ${url}: ${error}`);
      }
    }
    
    return [];
  }

  /**
   * Get sprints where the current user is involved (either assigned to issues or as a scrum master)
   * This filters the sprints to only include those relevant to the current user
   */
  async getSprintsByUserInvolvement(projectKey: string): Promise<JiraSprint[]> {
    try {
      console.log(`Getting sprints with user involvement for project ${projectKey}`);
      
      // First get the current user profile to get the account ID
      const currentUser = await this.getUserProfile();
      console.log(`Current user: ${currentUser.displayName} (${currentUser.accountId})`);
      
      // Get all sprints for the project
      const allSprints = await this.getSprintsByProject(projectKey);
      console.log(`Found ${allSprints.length} total sprints for project ${projectKey}`);
      
      if (allSprints.length === 0) {
        return []; // No sprints available
      }
      
      // For each sprint, check if the user is involved
      const userSprints: JiraSprint[] = [];
      const baseUrl = await this.getBaseUrl();
      const agileBasePath = baseUrl.replace('/rest/api/2', '/rest/agile/1.0');
      
      for (const sprint of allSprints) {
        try {
          // Get all issues for this sprint
          const timestamp = new Date().getTime();
          const issuesUrl = `${agileBasePath}/sprint/${sprint.id}/issue?maxResults=100&_=${timestamp}`;
          console.log(`Checking user involvement in sprint ${sprint.name} (${sprint.id})`);
          
          const issuesResponse = await this.fetchApi.fetch(
            issuesUrl,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
            }
          );
          
          if (issuesResponse.ok) {
            const issuesData = await issuesResponse.json();
            const issues = issuesData.issues || [];
            
            // Check if the user is assigned to any issues in this sprint or is the reporter
            const userInvolved = issues.some((issue: any) => {
              // Check if user is assignee
              if (issue.fields.assignee && issue.fields.assignee.accountId === currentUser.accountId) {
                console.log(`User is assigned to issue ${issue.key} in sprint ${sprint.name}`);
                return true;
              }
              
              // Check if user is reporter
              if (issue.fields.reporter && issue.fields.reporter.accountId === currentUser.accountId) {
                console.log(`User is reporter for issue ${issue.key} in sprint ${sprint.name}`);
                return true;
              }
              
              // Check if user is mentioned in the sprint goal as scrum master
              // Common formats: "SM: John Doe", "Scrum Master: John Doe", etc.
              if (sprint.goal && 
                  sprint.goal.toLowerCase().includes('scrum master') && 
                  sprint.goal.toLowerCase().includes(currentUser.displayName.toLowerCase())) {
                console.log(`User might be scrum master for sprint ${sprint.name} based on goal text`);
                return true;
              }
              
              return false;
            });
            
            if (userInvolved) {
              // Also fetch release information for this sprint
              try {
                const enhancedSprint = await this.enhanceSprintWithReleaseInfo(sprint, projectKey);
                userSprints.push(enhancedSprint);
              } catch (releaseError) {
                console.error(`Error getting release info for sprint ${sprint.id}:`, releaseError);
                userSprints.push(sprint);
              }
            }
          }
        } catch (sprintError) {
          console.error(`Error checking user involvement for sprint ${sprint.id}:`, sprintError);
          // Continue checking other sprints
        }
      }
      
      console.log(`Found ${userSprints.length} sprints with user involvement`);
      
      // If no user sprints found but we're in dev mode, return mock data
      if (userSprints.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No sprints with user involvement found, creating mock data for development');
        return this.createMockSprintsData();
      }
      
      return userSprints;
    } catch (error) {
      console.error(`Error in getSprintsByUserInvolvement for project ${projectKey}:`, error);
      
      // If in development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Error occurred, creating mock data for development');
        return this.createMockSprintsData();
      }
      
      throw error;
    }
  }
  
  /**
   * Enhance sprint data with release information
   * This adds the fixVersion information to the sprint object
   */
  async enhanceSprintWithReleaseInfo(sprint: JiraSprint, _projectKey: string): Promise<JiraSprint> {
    try {
      // Clone the sprint object
      const enhancedSprint: JiraSprint = { ...sprint };
      
      // Note: projectKey is used in the error logging below
      // Get issues in the sprint to determine which fix version they belong to
      const baseUrl = await this.getBaseUrl();
      const agileBasePath = baseUrl.replace('/rest/api/2', '/rest/agile/1.0');
      
      const timestamp = new Date().getTime();
      const issuesUrl = `${agileBasePath}/sprint/${sprint.id}/issue?maxResults=100&_=${timestamp}`;
      
      const issuesResponse = await this.fetchApi.fetch(
        issuesUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        }
      );
      
      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        const issues = issuesData.issues || [];
        
        // Find the most common fix version in the sprint
        const fixVersionMap: Record<string, number> = {};
        
        issues.forEach((issue: any) => {
          if (issue.fields.fixVersions && Array.isArray(issue.fields.fixVersions)) {
            issue.fields.fixVersions.forEach((fixVersion: any) => {
              const versionName = fixVersion.name;
              fixVersionMap[versionName] = (fixVersionMap[versionName] || 0) + 1;
            });
          }
        });
        
        // Find the most common fix version
        let mostCommonVersion = '';
        let maxCount = 0;
        
        Object.entries(fixVersionMap).forEach(([version, count]) => {
          if (count > maxCount) {
            mostCommonVersion = version;
            maxCount = count;
          }
        });
        
        // Add release information to the sprint
        if (mostCommonVersion) {
          console.log(`Sprint ${sprint.name} is aligned with release: ${mostCommonVersion}`);
          enhancedSprint.release = mostCommonVersion;
        } else {
          console.log(`Sprint ${sprint.name} has no associated release`);
          enhancedSprint.release = 'No release aligned';
        }
      }
      
      return enhancedSprint;
    } catch (error) {
      console.error(`Error enhancing sprint ${sprint.id} with release info:`, error);
      // Return the original sprint if there's an error
      return sprint;
    }
  }
}
