import { Logger } from 'winston';
import { JiraSprint, JiraIssue, SprintMetrics } from '../types';

/**
 * Service for calculating sprint metrics from Jira data
 */
export class MetricsCalculatorService {
  constructor(private readonly logger: Logger) {}

  /**
   * Calculate metrics for a sprint based on its issues
   */
  calculateSprintMetrics(
    sprint: JiraSprint,
    issues: JiraIssue[],
    previousSprintTeamMembers: string[] = [],
  ): SprintMetrics {
    this.logger.debug(`Calculating metrics for sprint ${sprint.id}: ${sprint.name}`);

    // Get all unique team members from this sprint
    const teamMembers = this.extractTeamMembers(issues);
    
    // Calculate core metrics
    const velocity = this.calculateVelocity(issues);
    const churnRate = this.calculateChurnRate(issues);
    const completionRatio = this.calculateCommittedVsCompleted(issues);
    const avgCycleTime = this.calculateAverageCycleTime(issues);
    const defectRate = this.calculateDefectRate(issues);
    
    // Calculate work breakdown
    const workTypeBreakdown = this.calculateWorkTypeBreakdown(issues);
    
    // Calculate team metrics
    const teamComposition = this.calculateTeamComposition(issues);
    const teamStability = this.calculateTeamStability(teamMembers, previousSprintTeamMembers);
    
    // Calculate issue metrics
    const issueMetrics = this.calculateIssueMetrics(issues, sprint);

    const metrics: SprintMetrics = {
      id: 0, // Will be set by database when saved
      sprintId: sprint.id,
      sprintName: sprint.name,
      boardId: sprint.boardId,
      boardName: '', // Will be populated by the service layer
      sprintStartDate: sprint.startDate,
      sprintEndDate: sprint.endDate,
      sprintCompleteDate: sprint.completeDate,
      
      // Core metrics
      velocity,
      churnRate,
      completionRatio,
      avgCycleTime,
      defectRate,
      
      // Work breakdown
      workTypeBreakdown,
      
      // Team metrics
      teamComposition,
      teamStability,
      
      // Issue metrics
      issueMetrics,
      
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.logger.info(`Calculated metrics for sprint ${sprint.name}:`, {
      velocity,
      teamSize: teamComposition.totalMembers,
      defectRate: Math.round(defectRate * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
    });

    return metrics;
  }

  /**
   * Extract unique team members from issues (both assignees and reporters)
   */
  private extractTeamMembers(issues: JiraIssue[]): string[] {
    const members = new Set<string>();
    
    issues.forEach(issue => {
      // Add assignee if available
      if (issue.fields.assignee?.emailAddress) {
        members.add(issue.fields.assignee.emailAddress);
      }
      
      // Add reporter if available
      if (issue.fields.reporter?.emailAddress) {
        members.add(issue.fields.reporter.emailAddress);
      }
    });

    return Array.from(members);
  }

  /**
   * Extract detailed team member information with roles
   */
  private extractDetailedTeamMembers(issues: JiraIssue[]): {
    email: string;
    displayName: string;
    roles: Set<string>;
  }[] {
    const memberMap = new Map<string, {
      email: string;
      displayName: string;
      roles: Set<string>;
    }>();

    issues.forEach(issue => {
      // Process assignee
      if (issue.fields.assignee?.emailAddress) {
        const email = issue.fields.assignee.emailAddress;
        if (!memberMap.has(email)) {
          memberMap.set(email, {
            email,
            displayName: issue.fields.assignee.displayName,
            roles: new Set<string>(),
          });
        }
        memberMap.get(email)!.roles.add('assignee');
      }

      // Process reporter
      if (issue.fields.reporter?.emailAddress) {
        const email = issue.fields.reporter.emailAddress;
        if (!memberMap.has(email)) {
          memberMap.set(email, {
            email,
            displayName: issue.fields.reporter.displayName,
            roles: new Set<string>(),
          });
        }
        memberMap.get(email)!.roles.add('reporter');
      }
    });

    return Array.from(memberMap.values());
  }

  /**
   * Calculate velocity (total completed story points)
   */
  private calculateVelocity(issues: JiraIssue[]): number {
    return issues
      .filter(issue => this.isCompleted(issue))
      .reduce((total, issue) => total + (issue.fields.storyPoints || 0), 0);
  }

  /**
   * Calculate defect rate (percentage of issues that are bugs)
   */
  private calculateDefectRate(issues: JiraIssue[]): number {
    if (issues.length === 0) return 0;
    
    const bugCount = this.countBugs(issues);
    return (bugCount / issues.length) * 100;
  }

  /**
   * Calculate churn rate (simplified - based on issues without story points vs with)
   * In a real implementation, this would require tracking scope changes over time
   */
  private calculateChurnRate(issues: JiraIssue[]): number {
    if (issues.length === 0) return 0;

    // Simplified calculation: issues without story points might indicate late additions
    const issuesWithoutPoints = issues.filter(issue => !issue.fields.storyPoints || issue.fields.storyPoints === 0);
    const unestimatedRate = (issuesWithoutPoints.length / issues.length) * 100;
    
    // Cap at 50% to avoid unrealistic values
    return Math.min(unestimatedRate, 50);
  }

  /**
   * Calculate average cycle time (simplified - based on created to resolved date)
   */
  private calculateAverageCycleTime(issues: JiraIssue[]): number {
    const completedIssues = issues.filter(issue => 
      this.isCompleted(issue) && issue.fields.resolutiondate
    );

    if (completedIssues.length === 0) return 0;

    const totalCycleTime = completedIssues.reduce((total, issue) => {
      const created = new Date(issue.fields.created);
      const resolved = new Date(issue.fields.resolutiondate!);
      const cycleTime = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      return total + cycleTime;
    }, 0);

    return totalCycleTime / completedIssues.length;
  }

  /**
   * Calculate committed vs completed ratio
   */
  private calculateCommittedVsCompleted(issues: JiraIssue[]): number {
    const totalCommitted = issues.reduce((total, issue) => total + (issue.fields.storyPoints || 0), 0);
    const totalCompleted = issues
      .filter(issue => this.isCompleted(issue))
      .reduce((total, issue) => total + (issue.fields.storyPoints || 0), 0);

    if (totalCommitted === 0) return 0;
    
    return (totalCompleted / totalCommitted) * 100;
  }

  /**
   * Count bug-type issues
   */
  private countBugs(issues: JiraIssue[]): number {
    return issues.filter(issue => 
      issue.fields.issuetype.name.toLowerCase().includes('bug') ||
      issue.fields.issuetype.name.toLowerCase().includes('defect')
    ).length;
  }

  /**
   * Calculate breakdown of work types
   */
  private calculateWorkTypeBreakdown(issues: JiraIssue[]): {
    story: number;
    bug: number;
    task: number;
    epic: number;
    [key: string]: number;
  } {
    const breakdown: Record<string, number> = {
      story: 0,
      bug: 0,
      task: 0,
      epic: 0,
    };

    issues.forEach(issue => {
      const issueType = issue.fields.issuetype.name.toLowerCase();
      
      if (issueType.includes('story')) {
        breakdown.story++;
      } else if (issueType.includes('bug') || issueType.includes('defect')) {
        breakdown.bug++;
      } else if (issueType.includes('task')) {
        breakdown.task++;
      } else if (issueType.includes('epic')) {
        breakdown.epic++;
      } else {
        // Add other types dynamically
        if (!breakdown[issueType]) {
          breakdown[issueType] = 0;
        }
        breakdown[issueType]++;
      }
    });

    return breakdown as {
      story: number;
      bug: number;
      task: number;
      epic: number;
      [key: string]: number;
    };
  }

  /**
   * Calculate team composition based on actual roles and patterns
   */
  private calculateTeamComposition(issues: JiraIssue[]): {
    totalMembers: number;
    seniorDevs: number;
    juniorDevs: number;
    qaEngineers: number;
    designers: number;
    productOwners: number;
    newMembers: number;
    experiencedMembers: number;
  } {
    const detailedMembers = this.extractDetailedTeamMembers(issues);
    const totalMembers = detailedMembers.length;
    
    // Analyze roles and issue types to infer team composition
    let seniorDevs = 0;
    let juniorDevs = 0;
    let qaEngineers = 0;
    let designers = 0;
    let productOwners = 0;
    
    // Count members by their activity patterns and role indicators
    detailedMembers.forEach(member => {
      const memberIssues = issues.filter(issue => 
        issue.fields.assignee?.emailAddress === member.email ||
        issue.fields.reporter?.emailAddress === member.email
      );
      
      // Analyze issue types this member is involved with
      const storyPoints = memberIssues
        .filter(issue => issue.fields.assignee?.emailAddress === member.email)
        .reduce((total, issue) => total + (issue.fields.storyPoints || 0), 0);
      
      const bugCount = memberIssues.filter(issue => 
        issue.fields.issuetype.name.toLowerCase().includes('bug') ||
        issue.fields.issuetype.name.toLowerCase().includes('defect')
      ).length;
      
      const storyCount = memberIssues.filter(issue =>
        issue.fields.issuetype.name.toLowerCase().includes('story')
      ).length;
      
      const epicCount = memberIssues.filter(issue =>
        issue.fields.issuetype.name.toLowerCase().includes('epic')
      ).length;
      
      // Role classification based on activity patterns
      const totalIssues = memberIssues.length;
      const bugRatio = totalIssues > 0 ? bugCount / totalIssues : 0;
      const hasReporterRole = member.roles.has('reporter');
      const hasAssigneeRole = member.roles.has('assignee');
      
      // Classify team member roles based on patterns
      if (bugRatio > 0.6 && hasAssigneeRole) {
        // High bug ratio suggests QA focus
        qaEngineers++;
      } else if (epicCount > 0 && hasReporterRole && !hasAssigneeRole) {
        // Primarily reports epics, doesn't implement - likely PO
        productOwners++;
      } else if (storyPoints > 20 || (storyCount > 3 && storyPoints > 0)) {
        // High story points or multiple stories suggest senior dev
        seniorDevs++;
      } else if (member.displayName.toLowerCase().includes('design') || 
                 memberIssues.some(issue => 
                   issue.fields.issuetype.name.toLowerCase().includes('design') ||
                   issue.fields.summary.toLowerCase().includes('ui') ||
                   issue.fields.summary.toLowerCase().includes('ux')
                 )) {
        // Design-related work suggests designer
        designers++;
      } else if (hasAssigneeRole && storyPoints > 0) {
        // Has story points but lower volume - likely junior dev
        juniorDevs++;
      } else {
        // Default classification - if active assignee, likely junior dev, otherwise PO
        if (hasAssigneeRole) {
          juniorDevs++;
        } else {
          productOwners++;
        }
      }
    });
    
    return {
      totalMembers,
      seniorDevs,
      juniorDevs,
      qaEngineers,
      designers,
      productOwners,
      newMembers: 0, // Would need historical data to determine
      experiencedMembers: seniorDevs, // Alias for seniorDevs for backward compatibility
    };
  }

  /**
   * Calculate team stability (percentage of team members from previous sprint)
   * Enhanced to consider both assignees and reporters
   */
  private calculateTeamStability(currentTeam: string[], previousTeam: string[]): number {
    if (previousTeam.length === 0) return 100; // First sprint or no previous data
    
    const currentSet = new Set(currentTeam);
    const retainedMembers = previousTeam.filter(member => currentSet.has(member));
    
    return (retainedMembers.length / previousTeam.length) * 100;
  }

  /**
   * Calculate issue metrics
   */
  private calculateIssueMetrics(issues: JiraIssue[], sprint: JiraSprint): {
    totalIssues: number;
    completedIssues: number;
    addedAfterStart: number;
    removedAfterStart: number;
    spilloverFromPrevious: number;
  } {
    const completedIssues = issues.filter(issue => this.isCompleted(issue));
    const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
    
    let addedAfterStart = 0;
    let spilloverFromPrevious = 0;
    
    if (sprintStart) {
      addedAfterStart = issues.filter(issue => {
        const created = new Date(issue.fields.created);
        return created > sprintStart;
      }).length;
      
      spilloverFromPrevious = issues.filter(issue => {
        const created = new Date(issue.fields.created);
        return created < sprintStart;
      }).length;
    }

    return {
      totalIssues: issues.length,
      completedIssues: completedIssues.length,
      addedAfterStart,
      removedAfterStart: 0, // Would need additional data to track removals
      spilloverFromPrevious,
    };
  }

  /**
   * Check if an issue is completed
   */
  private isCompleted(issue: JiraIssue): boolean {
    const statusCategory = issue.fields.status.statusCategory.key.toLowerCase();
    return statusCategory === 'done' || statusCategory === 'complete';
  }

  /**
   * Calculate trend metrics by comparing with historical data
   */
  calculateTrendMetrics(currentMetrics: SprintMetrics, historicalMetrics: SprintMetrics[]): {
    velocityTrend: 'up' | 'down' | 'stable';
    teamSizeTrend: 'up' | 'down' | 'stable';
    qualityTrend: 'up' | 'down' | 'stable'; // Based on bug count
  } {
    if (historicalMetrics.length === 0) {
      return {
        velocityTrend: 'stable',
        teamSizeTrend: 'stable',
        qualityTrend: 'stable',
      };
    }

    // Compare with average of last 3 sprints
    const recentSprints = historicalMetrics.slice(-3);
    const avgVelocity = recentSprints.reduce((sum, m) => sum + m.velocity, 0) / recentSprints.length;
    const avgTeamSize = recentSprints.reduce((sum, m) => sum + m.teamComposition.totalMembers, 0) / recentSprints.length;
    const avgBugCount = recentSprints.reduce((sum, m) => sum + m.workTypeBreakdown.bug, 0) / recentSprints.length;

    const velocityTrend = this.getTrend(currentMetrics.velocity, avgVelocity, 0.1);
    const teamSizeTrend = this.getTrend(currentMetrics.teamComposition.totalMembers, avgTeamSize, 0.2);
    const qualityTrend = this.getTrend(avgBugCount, currentMetrics.workTypeBreakdown.bug, 0.2); // Inverted: fewer bugs = better

    return { velocityTrend, teamSizeTrend, qualityTrend };
  }

  /**
   * Determine trend direction based on threshold
   */
  private getTrend(current: number, baseline: number, threshold: number): 'up' | 'down' | 'stable' {
    const change = (current - baseline) / baseline;
    
    if (Math.abs(change) <= threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }
}
