import React, { useState } from 'react';
import { Grid, Box } from '@material-ui/core';
import { Page, Header, Content, HeaderTabs } from '@backstage/core-components';
import { SourceControlRepository } from '../../types';
import {
  DashboardOverviewCard,
  RepositoryListCard,
  ComplianceDashboardCard,
  VulnerabilityTrackingCard,
  PullRequestAnalyticsCard,
  BenchmarkManagementCard,
  DataSourceIndicator,
  OrganizationSelector,
  UserRepositoryList,
  RepositoryDetailView,
  MetricsHelp
} from '../index';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`source-control-tabpanel-${index}`}
      aria-labelledby={`source-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const SourceControlDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [_selectedRepositories, setSelectedRepositories] = useState<SourceControlRepository[]>([]);
  const [viewingRepository, setViewingRepository] = useState<SourceControlRepository | null>(null);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const handleOrganizationChange = (organization: string | null) => {
    setSelectedOrganization(organization);
    // Reset selected repositories when organization changes
    setSelectedRepositories([]);
    setViewingRepository(null);
  };

  const handleRepositorySelection = (repositories: SourceControlRepository[]) => {
    setSelectedRepositories(repositories);
  };

  const handleRepositoryView = (repository: SourceControlRepository) => {
    setViewingRepository(repository);
  };

  const handleCloseRepositoryView = () => {
    setViewingRepository(null);
  };

  return (
    <Page themeId="tool">
      <Header title="Source Control Trends & Compliance" subtitle="Repository hygiene, security posture, and compliance tracking">
        <DataSourceIndicator />
        <HeaderTabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'repositories', label: 'Repositories' },
            { id: 'compliance', label: 'Compliance' },
            { id: 'security', label: 'Security' },
            { id: 'pull-requests', label: 'Pull Requests' },
            { id: 'benchmarks', label: 'Benchmarks' },
            { id: 'help', label: 'Metrics Guide' },
          ]}
          onChange={handleTabChange}
        />
      </Header>
      <Content>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OrganizationSelector
                onOrganizationChange={handleOrganizationChange}
              />
            </Grid>
            <Grid item xs={12}>
              <DashboardOverviewCard />
            </Grid>
            <Grid item xs={12} lg={6}>
              <RepositoryListCard />
            </Grid>
            <Grid item xs={12} lg={6}>
              <ComplianceDashboardCard />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OrganizationSelector
                onOrganizationChange={handleOrganizationChange}
              />
            </Grid>
            {viewingRepository ? (
              <Grid item xs={12}>
                <RepositoryDetailView
                  repository={viewingRepository}
                  onClose={handleCloseRepositoryView}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <UserRepositoryList
                  organization={selectedOrganization}
                  onRepositorySelect={handleRepositorySelection}
                  onRepositoryView={handleRepositoryView}
                />
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OrganizationSelector
                onOrganizationChange={handleOrganizationChange}
              />
            </Grid>
            <Grid item xs={12}>
              <ComplianceDashboardCard />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OrganizationSelector
                onOrganizationChange={handleOrganizationChange}
              />
            </Grid>
            <Grid item xs={12}>
              <VulnerabilityTrackingCard />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OrganizationSelector
                onOrganizationChange={handleOrganizationChange}
              />
            </Grid>
            <Grid item xs={12}>
              <PullRequestAnalyticsCard />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <OrganizationSelector
                onOrganizationChange={handleOrganizationChange}
              />
            </Grid>
            <Grid item xs={12}>
              <BenchmarkManagementCard />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MetricsHelp compactView={false} />
            </Grid>
          </Grid>
        </TabPanel>
      </Content>
    </Page>
  );
};
