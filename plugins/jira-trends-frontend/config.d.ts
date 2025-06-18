export interface Config {
  /** Configuration for the Jira Trends Frontend plugin */
  jiraTrends?: {
    /**
     * Use mock data instead of querying Jira
     * @default false
     */
    useMockData?: boolean;
    
    /**
     * Board selection strategy for users
     * - 'userFirstBoard': Use the first board the user has access to
     * - 'defaultBoard': Always use the configured default board
     * - 'allBoards': Show data from all accessible boards
     * @default 'userFirstBoard'
     */
    boardSelectionStrategy?: 'userFirstBoard' | 'defaultBoard' | 'allBoards';
    
    /**
     * API base URL for the Jira Trends backend service
     * @default http://localhost:7007
     */
    apiBaseUrl?: string;
    
    /**
     * Refresh interval for dashboard data in milliseconds
     * @default 300000 (5 minutes)
     */
    refreshInterval?: number;
    
    /**
     * Maximum number of sprints to display in trends charts
     * @default 20
     */
    maxTrendsData?: number;
    
    /**
     * Default board ID to use when none is specified
     */
    defaultBoardId?: number;
    
    /**
     * Enable/disable real-time updates
     * @default true
     */
    enableRealTimeUpdates?: boolean;
  };
}
