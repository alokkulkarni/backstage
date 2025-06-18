import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import {
  Page,
  Header,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
  Progress,
  ErrorPanel,
  InfoCard,
  Select,
} from '@backstage/core-components';
import { Grid, Button, Typography } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import './JiraTrendsDashboard.css';
import { jiraTrendsApiRef } from '../api';
import { 
  MetricsOverviewCard,
  ComplianceStatusCard,
  TrendsChart,
  SprintMetricsTable,
  BenchmarksCard,
} from '../components';
import type { 
  SprintMetrics, 
  SprintComplianceReport, 
  JiraBoard, 
  HealthStatus, 
  SprintBenchmark,
} from '../types/index';

export const JiraTrendsDashboard = () => {
  const jiraTrendsApi = useApi(jiraTrendsApiRef);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDataCheck, setInitialDataCheck] = useState(false);
  
  // Data state
  const [metrics, setMetrics] = useState<SprintMetrics[]>([]);
  const [compliance, setCompliance] = useState<SprintComplianceReport[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [benchmarks, setBenchmarks] = useState<SprintBenchmark[]>([]);
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  
  // Filter state
  const [selectedBoard, setSelectedBoard] = useState<number | undefined>();

  const loadDashboardData = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      
      console.log(`Loading dashboard data for board: ${selectedBoard || 'all'}`);
      
      // Load all data in parallel with error handling for each request
      const [metricsResult, complianceResult, healthResult, benchmarksResult, boardsResult] = await Promise.allSettled([
        jiraTrendsApi.getSprintMetrics(selectedBoard ? { boardId: selectedBoard } : undefined),
        jiraTrendsApi.getComplianceReports(selectedBoard ? { boardId: selectedBoard } : undefined), 
        jiraTrendsApi.getHealth(),
        jiraTrendsApi.getBenchmarks(),
        jiraTrendsApi.getBoards(),
      ]);
      
      // Extract data from settled promises, using empty arrays as fallback
      const metricsData = metricsResult.status === 'fulfilled' ? metricsResult.value : [];
      const complianceData = complianceResult.status === 'fulfilled' ? complianceResult.value : [];
      const healthData = healthResult.status === 'fulfilled' ? healthResult.value : null;
      const benchmarksData = benchmarksResult.status === 'fulfilled' ? benchmarksResult.value : [];
      const boardsData = boardsResult.status === 'fulfilled' ? boardsResult.value : [];
      
      // Log any failed requests
      if (metricsResult.status === 'rejected') {
        console.warn('Failed to load metrics:', metricsResult.reason);
      }
      if (complianceResult.status === 'rejected') {
        console.warn('Failed to load compliance reports:', complianceResult.reason);
      }
      if (healthResult.status === 'rejected') {
        console.warn('Failed to load health status:', healthResult.reason);
      }
      if (benchmarksResult.status === 'rejected') {
        console.warn('Failed to load benchmarks:', benchmarksResult.reason);
      }
      if (boardsResult.status === 'rejected') {
        console.warn('Failed to load boards:', boardsResult.reason);
      }
      
      console.log(`Loaded data: ${metricsData.length} metrics, ${complianceData.length} compliance reports`);
      
      setMetrics(metricsData);
      setCompliance(complianceData);
      setHealth(healthData);
      setBenchmarks(benchmarksData);
      setBoards(boardsData);

      // Special handling for board-specific requests
      if (selectedBoard && metricsData.length === 0) {
        console.log(`No data found for board ${selectedBoard}. This might be expected if the board has no sprint data.`);
        // Don't retry for board-specific requests with no data
        return;
      }

      // If no data found on first load and no board filter, set up a retry mechanism
      if (!initialDataCheck && metricsData.length === 0 && !selectedBoard) {
        setInitialDataCheck(true);
        // Retry after 3 seconds to allow background refresh to complete
        setTimeout(() => {
          console.log('No initial data found, retrying in case background refresh is in progress...');
          loadDashboardData(true);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      let errorMessage = 'Unknown error occurred';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Request timed out - the server may be overloaded or there may be connectivity issues. Please try again.';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      // CRITICAL: Always set loading to false when the function completes
      setLoading(false);
    }
  }, [selectedBoard, initialDataCheck, jiraTrendsApi]); // Dependencies for useCallback

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await jiraTrendsApi.refreshAllData();
      // Wait a moment for the refresh to process, then reload data
      setTimeout(async () => {
        await loadDashboardData();
      }, 2000);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBoardChange = (selected: string | string[] | number | number[]) => {
    console.log('Board selection changed:', selected);
    let boardId: string;
    if (Array.isArray(selected)) {
      boardId = selected[0]?.toString() || 'all';
    } else {
      boardId = selected.toString();
    }
    const newBoardId = boardId === 'all' ? undefined : parseInt(boardId, 10);
    console.log('Setting selected board to:', newBoardId);
    setSelectedBoard(newBoardId);
  };

  // Load data on component mount and when board selection changes
  useEffect(() => {
    console.log('useEffect triggered, selectedBoard:', selectedBoard);
    
    let isStale = false;
    
    const performLoad = async () => {
      try {
        await loadDashboardData();
      } catch (error) {
        if (!isStale) {
          console.error('Error in useEffect loadDashboardData:', error);
        }
      }
    };

    performLoad();

    // Cleanup function to prevent stale updates
    return () => {
      isStale = true;
    };
  }, [loadDashboardData]); // Depend on the memoized function

  // Separate useEffect for timeout protection
  useEffect(() => {
    if (!loading) return;
    
    const timeoutId = setTimeout(() => {
      console.warn('Loading timeout reached, forcing loading to false');
      setLoading(false);
      setError('Request timed out. Please try refreshing the data or check your connection.');
    }, 15000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);

  if (loading && !refreshing) {
    return (
      <Page themeId="tool">
        <Header title="Jira Trends Dashboard" subtitle="Sprint Analytics and Compliance Monitoring">
          <HeaderLabel label="Owner" value="Platform Team" />
          <HeaderLabel label="Lifecycle" value="Production" />
        </Header>
        <Content>
          <Progress />
          <div className="dashboard-controls">
            {initialDataCheck ? 
              'Loading data from Jira... This may take a moment for first-time setup.' :
              'Loading dashboard...'
            }
          </div>
        </Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page themeId="tool">
        <Header title="Jira Trends Dashboard" subtitle="Sprint Analytics and Compliance Monitoring">
          <HeaderLabel label="Owner" value="Platform Team" />
          <HeaderLabel label="Lifecycle" value="Production" />
        </Header>
        <Content>
          <ErrorPanel 
            title="Failed to Load Dashboard" 
            error={new Error(error)}
          />
          <div className="board-selector">
            <Button variant="contained" color="primary" onClick={() => loadDashboardData()}>
              Retry Loading
            </Button>
          </div>
        </Content>
      </Page>
    );
  }

  // Show message if no data is available yet
  if (!loading && metrics.length === 0) {
    return (
      <Page themeId="tool">
        <Header title="Jira Trends Dashboard" subtitle="Sprint Analytics and Compliance Monitoring">
          <HeaderLabel label="Owner" value="Platform Team" />
          <HeaderLabel label="Lifecycle" value="Production" />
          <HeaderLabel label="Status" value="Setting Up" />
        </Header>
        <Content>
          <ContentHeader title="Setting Up Your Dashboard">
            <SupportButton>
              We're fetching your sprint data from Jira. This usually takes a few moments for the initial setup.
            </SupportButton>
          </ContentHeader>
          
          <Grid container spacing={3} className="board-selector">
            <Grid item xs={12}>
              <InfoCard title="Loading Sprint Data" noPadding>
                <div className="loading-container">
                  <Progress />
                  <div className="loading-status">
                    <h3>Fetching data from Jira...</h3>
                    <p>
                      We're collecting sprint metrics, compliance data, and performance trends from your Jira instance.
                      This process runs automatically and typically completes within 1-2 minutes.
                    </p>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="board-selector"
                    >
                      {refreshing ? 'Refreshing...' : 'Force Refresh'}
                    </Button>
                  </div>
                </div>
              </InfoCard>
            </Grid>
          </Grid>
        </Content>
      </Page>
    );
  }

  const healthStatus = health?.status || 'error';
  const jiraConnectionStatus = health?.jiraConnection || 'error';

  return (
    <Page themeId="tool">
      <Header title="🚀 Jira Trends Dashboard" subtitle="Real-time Sprint Analytics & Performance Intelligence">
        <HeaderLabel label="Owner" value="Platform Team" />
        <HeaderLabel label="Environment" value="Production" />
        <HeaderLabel 
          label="Health" 
          value={healthStatus === 'healthy' ? '✅ Healthy' : '⚠️ Issues Detected'} 
        />
        <HeaderLabel 
          label="Data Source" 
          value="🔗 Live Jira API" 
        />
      </Header>
      
      <Content>
        {/* Enhanced Header with Controls */}
        <div className="dashboard-header">
          <Grid container spacing={3} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                📊 Performance Analytics Hub
              </Typography>
              <Typography variant="body1" style={{ color: '#666', lineHeight: 1.6 }}>
                Real-time insights into sprint performance, compliance metrics, and team productivity trends
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <div className="controls-container">
                <Select
                  placeholder="Select Board"
                  label="🎯 Board Filter"
                  items={[
                    { label: '📋 All Boards', value: 'all' },
                    ...boards.map(board => ({
                      label: `📌 ${board.name}`,
                      value: board.id.toString(),
                    })),
                  ]}
                  selected={selectedBoard?.toString() || 'all'}
                  onChange={handleBoardChange}
                />
                <Button
                  className="refresh-button"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                </Button>
              </div>
            </Grid>
          </Grid>
        </div>

        {/* Health Status Alert */}
        {healthStatus !== 'healthy' && (
          <div className="warning-message">
            System Health: {health?.message || 'Some systems are experiencing issues'}
            {jiraConnectionStatus !== 'ok' && ' - Jira connection issues detected'}
          </div>
        )}

        {/* No Data Message for Selected Board */}
        {selectedBoard && metrics.length === 0 && !loading && (
          <div className="info-message">
            <strong>No data found for selected board</strong>
            <div className="metric-details">
              Board ID {selectedBoard} doesn't have any sprint metrics yet. This could be because:
              <ul className="metric-list">
                <li>No sprints have been completed on this board</li>
                <li>Data hasn't been refreshed yet - try the "Refresh Data" button</li>
                <li>The board is new or inactive</li>
              </ul>
              Try selecting "All Boards" to see data from other boards, or refresh the data.
            </div>
          </div>
        )}

        <Grid container spacing={2} className="compact-grid">
          {/* Enhanced Metrics Overview - Compact */}
          <Grid item xs={12}>
            <div className="compact-card">
              <div className="card-header">
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  📈 Sprint Metrics Overview
                </Typography>
              </div>
              <div className="card-content">
                <MetricsOverviewCard metrics={metrics} loading={loading} />
              </div>
            </div>
          </Grid>

          {/* Two Column Layout for Charts */}
          <Grid item xs={12} lg={8}>
            <div className="compact-card">
              <div className="card-header">
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  📊 Performance Trends
                </Typography>
              </div>
              <div className="card-content">
                <TrendsChart metrics={metrics} benchmarks={benchmarks} loading={loading} />
              </div>
            </div>
          </Grid>

          <Grid item xs={12} lg={4}>
            <div className="compact-card">
              <div className="card-header">
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  🎯 Compliance Status
                </Typography>
              </div>
              <div className="card-content">
                <ComplianceStatusCard compliance={compliance} loading={loading} />
              </div>
            </div>
          </Grid>

          {/* Sprint Metrics Table - Compact */}
          <Grid item xs={12}>
            <div className="compact-card">
              <div className="card-header">
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  📋 Sprint Details
                </Typography>
              </div>
              <div className="card-content">
                <SprintMetricsTable 
                  metrics={metrics} 
                  loading={loading}
                  onViewDetails={(sprintId) => {
                    console.log('View details for sprint:', sprintId);
                    // TODO: Navigate to detailed sprint view
                  }}
                />
              </div>
            </div>
          </Grid>

          {/* Enhanced Benchmarks Section - Full Width */}
          <Grid item xs={12}>
            <BenchmarksCard 
              benchmarks={benchmarks} 
              loading={loading}
              onUpdateBenchmark={async () => await loadDashboardData()}
              onCreateBenchmark={async () => await loadDashboardData()}
            />
          </Grid>

          {/* Data Summary - Compact Side Panel */}
          <Grid item xs={12} md={6}>
            <div className="compact-card">
              <div className="card-header">
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  📊 Data Summary
                </Typography>
              </div>
              <div className="card-content">
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <div className="stat-item">
                      <Typography variant="h4" className="stat-value primary">
                        {metrics.length}
                      </Typography>
                      <Typography className="metric-subtitle">
                        Sprint Records
                      </Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="stat-item">
                      <Typography variant="h4" className="stat-value secondary">
                        {compliance.length}
                      </Typography>
                      <Typography className="metric-subtitle">
                        Compliance Reports
                      </Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="stat-item">
                      <Typography variant="h4" className="stat-value tertiary">
                        {benchmarks.filter(b => b.isActive).length}
                      </Typography>
                      <Typography className="metric-subtitle">
                        Active Benchmarks
                      </Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="stat-item">
                      <Typography variant="h4" className="stat-value quaternary">
                        {boards.length}
                      </Typography>
                      <Typography className="metric-subtitle">
                        Monitored Boards
                      </Typography>
                    </div>
                  </Grid>
                </Grid>
              </div>
            </div>
          </Grid>

          {/* Live Status Panel */}
          <Grid item xs={12} md={6}>
            <div className="compact-card">
              <div className="card-header">
                <Typography variant="h6" style={{ fontWeight: 600 }}>
                  🔄 System Status
                </Typography>
              </div>
              <div className="card-content">
                <div className="summary-section">
                  <div className="summary-title">
                    <strong>🔗 Data Source:</strong> Live Jira API
                  </div>
                  <div className="summary-subtitle">
                    Last updated: {new Date().toLocaleString()}
                  </div>
                  {refreshing && (
                    <div className="trend-indicator">
                      🔄 Fetching latest data from Jira...
                    </div>
                  )}
                  <div className={`health-status ${healthStatus === 'healthy' ? 'healthy' : 'warning'}`}>
                    <Typography variant="body2">
                      Health: {healthStatus === 'healthy' ? '✅ All systems operational' : '⚠️ Some issues detected'}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
