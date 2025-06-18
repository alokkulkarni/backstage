import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import {
  HomePageCompanyLogo,
  HomePageStarredEntities,
} from '@backstage/plugin-home';
import { 
  Content, 
  Page, 
  InfoCard, 
  Header, 
  HeaderLabel,
  Link 
} from '@backstage/core-components';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Paper,
  Chip
} from '@material-ui/core';
import WelcomeTitle from './WelcomeTitle';
import SettingsIcon from '@material-ui/icons/Settings';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AssignmentIcon from '@material-ui/icons/Assignment';
import BuildIcon from '@material-ui/icons/Build';
import CloudIcon from '@material-ui/icons/Cloud';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import CreateIcon from '@material-ui/icons/Create';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TimelineIcon from '@material-ui/icons/Timeline';
import GroupWorkIcon from '@material-ui/icons/GroupWork';
// Import for GitHub
import CodeIcon from '@material-ui/icons/Code';
// Import for new tiles
import VisibilityIcon from '@material-ui/icons/Visibility';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import AndroidIcon from '@material-ui/icons/Android';
import ExploreIcon from '@material-ui/icons/Explore';
// Import for Jira - custom plugin with enhanced SprintHealthCard
import { JiraPluginWrapper, SprintHealthCard } from '@internal/plugin-jira-plugin';
// Import for GitHub Contributors plugin
import {
  MyPullRequestsCard,
  ActionRequiredPullRequestsCard,
  ContributorRepositoriesCard
} from '@internal/plugin-github-repositories-contibutors';
// Import for Jenkins Insights plugin
import { JenkinsJobsCard } from '@internal/plugin-jenkins-insights';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { useApi } from '@backstage/core-plugin-api';
import { identityApiRef } from '@backstage/core-plugin-api';
import { useEffect, useState } from 'react';
// Permission components and definitions
import { PermissionWrapper } from '../common/PermissionWrapper';
import {
  githubRepositoryReadPermission,
  githubPullRequestReadPermission,
  jiraBoardReadPermission,
  jiraSprintReadPermission,
  jenkinsInsightsReadPermission,
  platformMetricsReadPermission,
  systemStatusReadPermission,
} from '../../permissions/permissions';

const useStyles = makeStyles(theme => ({
  // Header and user display
  avatar: {
    width: 42,
    height: 42,
    cursor: 'pointer',
  },
  userDisplay: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: theme.spacing(0.5),
  },
  profileLink: {
    marginLeft: theme.spacing(-0.5),
  },
  
  // Dashboard layout styles
  dashboardContainer: {
    padding: theme.spacing(0.5),
    background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
    minHeight: '100vh',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  
  // Quick Links Grid
  quickLinksContainer: {
    marginBottom: theme.spacing(1),
  },
  quickLinkGridItem: {
    padding: '2.5px',
  },
  quickLinkCard: {
    height: 80,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0.5),
    textAlign: 'center',
    minWidth: 120,
    maxWidth: 160,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[6],
      borderColor: theme.palette.primary.main,
    },
  },
  quickLinkIcon: {
    fontSize: '1.5rem',
    marginBottom: theme.spacing(0.5),
    color: theme.palette.primary.main,
  },
  quickLinkTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.palette.text.primary,
    fontSize: '0.75rem',
    lineHeight: 1.2,
  },
  quickLinkSubtitle: {
    fontSize: '0.65rem',
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 1.1,
  },
  
  // Metrics Cards
  metricsContainer: {
    marginBottom: theme.spacing(2),
  },
  metricCard: {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: theme.palette.primary.contrastText,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    textAlign: 'center',
    height: 100,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
  },
  metricLabel: {
    fontSize: '0.75rem',
    opacity: 0.9,
  },
  
  // Widget Cards
  widgetCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    background: theme.palette.background.paper,
    height: '100%',
    '& .MuiCardHeader-root': {
      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      color: theme.palette.primary.contrastText,
    },
  },
  
  // Specific widget heights
  standardWidgetHeight: {
    minHeight: 350,
  },
  tallWidgetHeight: {
    minHeight: 450,
  },
  shortWidgetHeight: {
    minHeight: 250,
  },
  
  // Status indicators
  statusIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(2),
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusHealthy: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  statusWarning: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  statusError: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  
  // Footer
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(3),
    paddingTop: theme.spacing(3),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  copyright: {
    marginTop: theme.spacing(1),
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
}));

export const HomePage = () => {
  const classes = useStyles();
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string>('default-user'); // Add state for user ID
  const identityApi = useApi(identityApiRef);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get profile info which contains user display name and email
        const profile = await identityApi.getProfileInfo();
        setDisplayName(profile.displayName);
        
        // Use email as the userId for Jira integration
        if (profile.email) {
          // Log the email being used
          console.log('[HomePage] User profile email:', profile.email);
          
          // Set the email as userId - using the raw email without modifications
          setUserId(profile.email);
          
          // Add additional logging
          console.log('[HomePage] Set userId for Jira integration:', profile.email);
        } else {
          // Fallback to user entity ref if email is not available
          const identity = await identityApi.getBackstageIdentity();
          const id = identity.userEntityRef.split(':')[1] || 'default-user';
          setUserId(id);
          console.log('[HomePage] No email available, using entity ref:', id);
        }
      } catch (error) {
        console.error('Error fetching user profile', error);
        setDisplayName('User');
        // Keep default user ID if there's an error
      }
    };

    fetchUserProfile();
  }, [identityApi]); // Removing userId from dependency to prevent infinite loop

  return (
    <Page themeId="home">
      <Header title={<WelcomeTitle displayName={displayName} />} pageTitleOverride="Platform Engineering Dashboard">
        <HeaderLabel label="Owner" value="Platform Team" />
        <HeaderLabel label="Environment" value="Production" />
        <HeaderLabel label="Status" value="Operational" />
        <Link to="/settings" className={`${classes.userDisplay} ${classes.profileLink}`}>
          <UserSettingsSignInAvatar size={42} />
        </Link>
      </Header>
      <Content className={classes.dashboardContainer}>
        <Grid container spacing={2}>
          
          {/* Quick Access - Always visible for all users */}
          <Grid item xs={12} className={classes.quickLinksContainer}>
              <Typography variant="h6" className={classes.sectionTitle}>
                <DashboardIcon />
                Quick Access
              </Typography>
              <Card className={classes.widgetCard} style={{ minHeight: 90 }}>
                <CardContent style={{ padding: '6px 15px', display: 'flex', alignItems: 'center' }}>
                  <Grid container spacing={0} justifyContent="center" alignItems="center">
                    {/* Internal Backstage Tools */}
                    <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.location.href = '/catalog'}>
                      <SettingsIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Service Catalog</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Browse Services</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.location.href = '/docs'}>
                      <MenuBookIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Documentation</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Browse Docs</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.location.href = '/create'}>
                      <CreateIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Create Service</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>New Project</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://github.com/alokkulkarni', '_blank')}>
                      <CodeIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>GitHub</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Source Code</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://dev.azure.com/kulkarnialok', '_blank')}>
                      <CloudIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Azure DevOps</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Pipelines</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://fintechclub.atlassian.net/jira', '_blank')}>
                      <AssignmentIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Jira</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Issue Tracking</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://fintechclub.atlassian.net/wiki', '_blank')}>
                      <MenuBookIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Confluence</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Wiki & Docs</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('http://localhost:8082', '_blank')}>
                      <BuildIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Jenkins</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>CI/CD</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://dynatrace.your-org.com', '_blank')}>
                      <VisibilityIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Dynatrace</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Monitoring</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://bazaar.your-org.com', '_blank')}>
                      <ShoppingCartIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Bazaar</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Marketplace</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.open('https://github.com/copilot?ref_cta=Copilot+free&ref_loc=getting+started+with+github+copilot&ref_page=docs', '_blank')}>
                      <AndroidIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Copilot</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>AI Assistant</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3} lg={2} className={classes.quickLinkGridItem}>
                    <Card className={classes.quickLinkCard} onClick={() => window.location.href = '/tech-radar'}>
                      <ExploreIcon className={classes.quickLinkIcon} />
                      <Typography variant="body2" className={classes.quickLinkTitle}>Tech Radar</Typography>
                      <Typography variant="caption" className={classes.quickLinkSubtitle}>Technology</Typography>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Metrics Dashboard */}
          <Grid item xs={12} className={classes.metricsContainer} style={{ marginTop: '16px' }}>
            <PermissionWrapper permission={platformMetricsReadPermission}>
              <Typography variant="h6" className={classes.sectionTitle}>
                <TrendingUpIcon />
                Platform Metrics
              </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper className={classes.metricCard}>
                  <Typography variant="h4" className={classes.metricValue}>42</Typography>
                  <Typography variant="caption" className={classes.metricLabel}>Active Services</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper className={classes.metricCard}>
                  <Typography variant="h4" className={classes.metricValue}>98.9%</Typography>
                  <Typography variant="caption" className={classes.metricLabel}>System Uptime</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper className={classes.metricCard}>
                  <Typography variant="h4" className={classes.metricValue}>15</Typography>
                  <Typography variant="caption" className={classes.metricLabel}>Active Sprints</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper className={classes.metricCard}>
                  <Typography variant="h4" className={classes.metricValue}>127</Typography>
                  <Typography variant="caption" className={classes.metricLabel}>Deployments/Week</Typography>
                </Paper>
              </Grid>
            </Grid>
            </PermissionWrapper>
          </Grid>

          {/* Main Dashboard Content - Now takes full width */}
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              <GroupWorkIcon />
              Development Overview
            </Typography>
            
            {/* GitHub Pull Requests - Side by side */}
            <Grid container spacing={2} style={{ marginBottom: 16 }}>
              <Grid item xs={12} md={6}>
                <PermissionWrapper permission={githubPullRequestReadPermission}>
                  <Card className={`${classes.widgetCard} ${classes.standardWidgetHeight}`}>
                    <MyPullRequestsCard />
                  </Card>
                </PermissionWrapper>
              </Grid>
              <Grid item xs={12} md={6}>
                <PermissionWrapper permission={githubPullRequestReadPermission}>
                  <Card className={`${classes.widgetCard} ${classes.standardWidgetHeight}`}>
                    <ActionRequiredPullRequestsCard />
                  </Card>
                </PermissionWrapper>
              </Grid>
            </Grid>

            {/* GitHub Repositories and Sprint Health - Side by side */}
            <Grid container spacing={2} style={{ marginBottom: 16 }}>
              <Grid item xs={12} md={8}>
                <PermissionWrapper permission={githubRepositoryReadPermission}>
                  <Card className={`${classes.widgetCard} ${classes.tallWidgetHeight}`}>
                    <ContributorRepositoriesCard />
                  </Card>
                </PermissionWrapper>
              </Grid>
              <Grid item xs={12} md={4}>
                <PermissionWrapper permission={jiraSprintReadPermission}>
                  <Card className={`${classes.widgetCard} ${classes.tallWidgetHeight}`}>
                    <InfoCard title="Sprint Health">
                      {(() => {
                        try {
                          return (
                            <SprintHealthCard 
                              title="Current Sprint Status"
                              autoRefresh={true}
                              showRefreshButton={true}
                              height={420}
                            />
                          );
                        } catch (error) {
                          console.error('[HomePage] Error rendering Sprint Health card:', error);
                          return (
                            <Box p={2}>
                              <Typography color="error">Error loading Sprint Health data</Typography>
                              <Chip 
                                label="System Error" 
                                className={`${classes.statusIndicator} ${classes.statusError}`}
                                size="small"
                              />
                            </Box>
                          );
                        }
                      })()}
                    </InfoCard>
                  </Card>
                </PermissionWrapper>
              </Grid>
            </Grid>
            
            {/* Jira Integration - Full width */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <PermissionWrapper permission={jiraBoardReadPermission}>
                  <Card className={`${classes.widgetCard} ${classes.tallWidgetHeight}`}>
                    {(() => {
                      console.log('[HomePage] Rendering Jira card with userId:', userId);
                      try {
                        return <JiraPluginWrapper />;
                      } catch (error) {
                        console.error('[HomePage] Error rendering Jira card:', error);
                        return (
                          <CardContent>
                            <Typography color="error">Error loading Jira tasks</Typography>
                          </CardContent>
                        );
                      }
                    })()}
                  </Card>
                </PermissionWrapper>
              </Grid>
            </Grid>

            {/* Jenkins Integration - Full width */}
            <Grid container spacing={2} style={{ marginTop: 16 }}>
              <Grid item xs={12}>
                <PermissionWrapper permission={jenkinsInsightsReadPermission}>
                  <Card className={`${classes.widgetCard} ${classes.standardWidgetHeight}`}>
                    {(() => {
                      try {
                        return <JenkinsJobsCard />;
                      } catch (error) {
                        console.error('[HomePage] Error rendering Jenkins card:', error);
                        return (
                          <CardContent>
                            <Typography color="error">Error loading Jenkins jobs</Typography>
                          </CardContent>
                        );
                      }
                    })()}
                  </Card>
                </PermissionWrapper>
              </Grid>
            </Grid>
          </Grid>

          {/* Bottom Section - Status & Favourites horizontally aligned */}
          <Grid item xs={12} style={{ marginTop: 16 }}>
            <PermissionWrapper permission={systemStatusReadPermission}>
              <Typography variant="h6" className={classes.sectionTitle}>
                <TimelineIcon />
                System Status & Services
              </Typography>
            
            <Grid container spacing={2}>
              {/* System Status */}
              <Grid item xs={12} md={6}>
                <Card className={classes.widgetCard} style={{ minHeight: 200 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <TimelineIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
                      System Status
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">Platform Services</Typography>
                          <Chip 
                            label="Operational" 
                            className={`${classes.statusIndicator} ${classes.statusHealthy}`}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">CI/CD Pipeline</Typography>
                          <Chip 
                            label="Healthy" 
                            className={`${classes.statusIndicator} ${classes.statusHealthy}`}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Monitoring</Typography>
                          <Chip 
                            label="Warning" 
                            className={`${classes.statusIndicator} ${classes.statusWarning}`}
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Favorite Services - Always visible for all users */}
              <Grid item xs={12} md={6}>
                  <Card className={classes.widgetCard} style={{ minHeight: 200 }}>
                    <InfoCard title="Favorite Services">
                      <HomePageStarredEntities />
                    </InfoCard>
                  </Card>
              </Grid>
            </Grid>
            </PermissionWrapper>
          </Grid>
          
          {/* Footer */}
          <Grid item xs={12}>
            <div className={classes.footer}>
              <HomePageCompanyLogo 
                logo={<img src="https://example.com/your-company-logo.svg" alt="Company Logo" />}
              />
              <div className={classes.copyright}>
                © 2025 Virgin Money. All rights reserved. | Platform Engineering Dashboard
              </div>
            </div>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};