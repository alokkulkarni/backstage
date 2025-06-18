import { JiraTrendsDashboard } from '../pages/JiraTrendsDashboard';

/**
 * Wrapper component for the Jira Trends page that ensures proper context isolation
 * and prevents Router context issues during plugin initialization.
 */
export const JiraTrendsPageWrapper = () => {
  return <JiraTrendsDashboard />;
};
