import { Logger } from 'winston';
import { Config } from '@backstage/config';
import { JiraApiService } from './JiraApiService';
import { JiraBoard } from '../types';

/**
 * Service for dynamic user-to-board mapping based on user access and preferences
 */
export class UserBoardMappingService {
  private readonly logger: Logger;
  private readonly jiraApiService: JiraApiService;
  private readonly defaultBoardId: number;
  private readonly boardSelectionStrategy: string;

  // Cache for user boards to avoid repeated API calls
  private userBoardsCache = new Map<string, JiraBoard[]>();
  private cacheExpiration = new Map<string, number>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(logger: Logger, config: Config, jiraApiService: JiraApiService) {
    this.logger = logger;
    this.jiraApiService = jiraApiService;
    
    // Load configuration
    const jiraTrendsConfig = config.getOptionalConfig('jiraTrends');
    this.defaultBoardId = jiraTrendsConfig?.getOptionalNumber('defaultBoard') || 1;
    this.boardSelectionStrategy = jiraTrendsConfig?.getOptionalString('boardSelectionStrategy') || 'userFirstBoard';
    
    this.logger.info('UserBoardMappingService initialized', {
      defaultBoardId: this.defaultBoardId,
      strategy: this.boardSelectionStrategy
    });
  }

  /**
   * Get board ID for a specific user email using dynamic strategy
   */
  async getBoardIdForUser(userEmail?: string): Promise<number> {
    if (!userEmail) {
      this.logger.debug('No user email provided, using default board', { defaultBoardId: this.defaultBoardId });
      return this.defaultBoardId;
    }

    try {
      switch (this.boardSelectionStrategy) {
        case 'userFirstBoard':
          return await this.getUserFirstBoard(userEmail);
        case 'allBoards':
          // For 'allBoards' strategy, we still need to return a default for single board queries
          return await this.getUserFirstBoard(userEmail);
        case 'defaultBoard':
        default:
          this.logger.debug('Using default board strategy', { userEmail, defaultBoardId: this.defaultBoardId });
          return this.defaultBoardId;
      }
    } catch (error) {
      this.logger.warn('Failed to get dynamic board for user, falling back to default', { 
        userEmail, 
        error: error instanceof Error ? error.message : 'Unknown error',
        defaultBoardId: this.defaultBoardId 
      });
      return this.defaultBoardId;
    }
  }

  /**
   * Get the first board that a user has access to
   */
  private async getUserFirstBoard(userEmail: string): Promise<number> {
    const userBoards = await this.getUserAccessibleBoards(userEmail);
    
    if (userBoards.length > 0) {
      const boardId = userBoards[0].id;
      this.logger.debug('Found first accessible board for user', { userEmail, boardId, boardName: userBoards[0].name });
      return boardId;
    }
    
    this.logger.debug('No accessible boards found for user, using default', { 
      userEmail, 
      defaultBoardId: this.defaultBoardId 
    });
    return this.defaultBoardId;
  }

  /**
   * Get all boards that a user has access to (with caching)
   */
  async getUserAccessibleBoards(userEmail: string): Promise<JiraBoard[]> {
    // Check cache first
    const cached = this.userBoardsCache.get(userEmail);
    const cacheExpiry = this.cacheExpiration.get(userEmail);
    
    if (cached && cacheExpiry && Date.now() < cacheExpiry) {
      this.logger.debug('Returning cached boards for user', { userEmail, boardCount: cached.length });
      return cached;
    }

    try {
      // Fetch all boards from Jira
      const allBoards = await this.jiraApiService.getBoards();
      
      // For now, we'll return all boards since Jira doesn't have a direct way to filter by user access
      // In a real implementation, you might want to:
      // 1. Check user permissions for each board
      // 2. Filter based on project membership
      // 3. Use Jira's user context API
      
      // Simple filtering based on user domain or other logic could be added here
      const accessibleBoards = this.filterBoardsForUser(allBoards, userEmail);
      
      // Cache the result
      this.userBoardsCache.set(userEmail, accessibleBoards);
      this.cacheExpiration.set(userEmail, Date.now() + this.cacheTimeout);
      
      this.logger.debug('Fetched accessible boards for user', { 
        userEmail, 
        totalBoards: allBoards.length,
        accessibleBoards: accessibleBoards.length 
      });
      
      return accessibleBoards;
    } catch (error) {
      this.logger.error('Failed to fetch user accessible boards', { userEmail, error });
      throw error;
    }
  }

  /**
   * Filter boards based on user email and business logic
   */
  private filterBoardsForUser(boards: JiraBoard[], userEmail: string): JiraBoard[] {
    // Simple filtering logic - can be enhanced based on requirements
    // For example, filter by project key, board name patterns, etc.
    
    // Extract domain from email
    const domain = userEmail.split('@')[1];
    const username = userEmail.split('@')[0];
    
    // Priority-based filtering
    let filteredBoards = boards;
    
    // 1. First, try to find boards that match user patterns
    const userSpecificBoards = boards.filter(board => {
      const boardName = board.name.toLowerCase();
      const usernameLower = username.toLowerCase();
      
      // Check if board name contains username or related terms
      return boardName.includes(usernameLower) || 
             boardName.includes(usernameLower.split('.')[0]) || // first name
             boardName.includes(usernameLower.split('.')[1]); // last name
    });
    
    if (userSpecificBoards.length > 0) {
      this.logger.debug('Found user-specific boards', { userEmail, boards: userSpecificBoards.map(b => b.name) });
      return userSpecificBoards;
    }
    
    // 2. If no user-specific boards, filter by domain/organization logic
    if (domain === 'example.com') {
      // Example: filter boards for example.com users
      filteredBoards = boards.filter(board => 
        board.name.toLowerCase().includes('dev') || 
        board.name.toLowerCase().includes('test')
      );
    }
    
    // 3. If still no specific boards, return all boards (user has access to everything)
    if (filteredBoards.length === 0) {
      filteredBoards = boards;
    }
    
    this.logger.debug('Filtered boards for user', { 
      userEmail, 
      domain, 
      username,
      originalCount: boards.length,
      filteredCount: filteredBoards.length 
    });
    
    return filteredBoards;
  }

  /**
   * Get all boards accessible to a user (for dropdown/selection purposes)
   */
  async getAllUserBoards(userEmail?: string): Promise<JiraBoard[]> {
    if (!userEmail) {
      // Return all boards if no user specified
      try {
        return await this.jiraApiService.getBoards();
      } catch (error) {
        this.logger.warn('Failed to fetch all boards, returning empty array', { error });
        return [];
      }
    }
    
    return await this.getUserAccessibleBoards(userEmail);
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userEmail: string): void {
    this.userBoardsCache.delete(userEmail);
    this.cacheExpiration.delete(userEmail);
    this.logger.debug('Cleared cache for user', { userEmail });
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.userBoardsCache.clear();
    this.cacheExpiration.clear();
    this.logger.debug('Cleared all user board cache');
  }

  /**
   * Get current board selection strategy
   */
  getBoardSelectionStrategy(): string {
    return this.boardSelectionStrategy;
  }
}
