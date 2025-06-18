export interface JiraResponse {
  [key: string]: any;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  projectCategory?: {
    id: string;
    name: string;
    description: string;
  };
}

export interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
}

export interface JiraUser {
  accountId: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
}

export interface JiraStatus {
  id: string;
  name: string;
  description: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
  };
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description: string;
    created: string;
    updated: string;
    duedate?: string;
    priority?: {
      id: string;
      name: string;
      iconUrl: string;
    };
    status: JiraStatus;
    issuetype: JiraIssueType;
    assignee?: JiraUser;
    reporter: JiraUser;
    project: JiraProject;
    [key: string]: any;
  };
  renderedFields?: {
    description: string;
    [key: string]: any;
  };
  changelog?: {
    histories: {
      id: string;
      author: JiraUser;
      created: string;
      items: {
        field: string;
        fromString: string;
        toString: string;
        [key: string]: any;
      }[];
    }[];
  };
  transitions?: {
    id: string;
    name: string;
    to: {
      id: string;
      name: string;
      [key: string]: any;
    };
    [key: string]: any;
  }[];
}
