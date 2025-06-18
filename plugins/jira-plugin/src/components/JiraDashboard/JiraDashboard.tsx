// filepath: /Users/alokkulkarni/Documents/Development/platformengineering/updatedbackstage/backstage/plugins/jira-plugin/src/components/JiraDashboard/JiraDashboard.tsx
import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Button,
  IconButton,
  Box,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import RefreshIcon from '@material-ui/icons/Refresh';
import BuildIcon from '@material-ui/icons/Build';
import { useApi } from '@backstage/core-plugin-api';
import { JiraIssue } from '../../api';  // Import from the barrel file
import { jiraApiRef } from '../../api';
// Import directly using relative paths with file extension
import { IssueList } from './IssueList.tsx';
import { NewIssueDialog } from './NewIssueDialog.tsx';
import { ProjectTabPanel } from './ProjectTabPanel.tsx';
import { JiraDiagnosticDialog } from './JiraDiagnosticDialog.tsx';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(1),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
  },
  tabs: {
    marginTop: theme.spacing(1),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  button: {
    marginRight: theme.spacing(1),
  },
}));

export interface JiraDashboardProps {
  userId: string;
  showRefreshButton?: boolean;
}

export const JiraDashboard: React.FC<JiraDashboardProps> = ({
  userId,
  showRefreshButton = true,
}) => {
  const classes = useStyles();
  const jiraApi = useApi(jiraApiRef);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [issuesByProject, setIssuesByProject] = useState<Map<string, JiraIssue[]>>(new Map());
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState<string[]>([]);
  const [openNewIssue, setOpenNewIssue] = useState(false);
  const [openDiagnostic, setOpenDiagnostic] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    if (!userId || userId.trim() === '') {
      console.error('JiraDashboard: No userId provided');
      setError('No user ID provided. Please make sure you are logged in.');
      setLoading(false);
      return;
    }
    
    try {
      // First, check if we can connect to Jira by fetching projects (a simple test)
      try {
        console.log('JiraDashboard: Testing Jira API connectivity');
        const projects = await jiraApi.getProjects();
        console.log('JiraDashboard: Jira API connectivity test succeeded, found', projects.length, 'projects');
      } catch (testErr) {
        console.error('JiraDashboard: Jira API connectivity test failed:', testErr);
        // Continue anyway, as the user might still have access to issues
      }
      
      // Now fetch the user's issues
      console.log('JiraDashboard: Fetching issues for user', userId);
      const userIssues = await jiraApi.getIssuesForUser(userId);
      console.log('JiraDashboard: Fetched issues:', userIssues?.length ?? 0);
      setIssues(userIssues || []);
      
      // Only attempt to organize by project if we have issues
      if (userIssues && userIssues.length > 0) {
        const issuesByProj = await jiraApi.getIssuesByProject(userId);
        setIssuesByProject(issuesByProj);
        
        // Get the project names from the map keys
        setProjects(Array.from(issuesByProj.keys()));
      } else {
        setIssuesByProject(new Map());
        setProjects([]);
      }
    } catch (err: any) {
      console.error('JiraDashboard: Error fetching Jira issues:', err);
      const errorMessage = err?.message || 'Unknown error';
      setError(`Failed to load issues from Jira: ${errorMessage}. Please check your Jira configuration and credentials.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('JiraDashboard: userId changed to', userId);
    fetchData();
  }, [userId]);

  const handleTabChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleRefresh = () => {
    fetchData();
  };
  
  const handleCreateIssue = () => {
    setOpenNewIssue(true);
  };
  
  const handleIssueCreated = () => {
    fetchData();
    setOpenNewIssue(false);
  };
  
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className={classes.root}>
        <CardHeader 
          title="Assigned to Me" 
          action={
            <Box display="flex" alignItems="center">
              {showRefreshButton && (
                <IconButton onClick={handleRefresh} size="small" title="Refresh">
                  <RefreshIcon />
                </IconButton>
              )}
            </Box>
          }
        />
        <CardContent>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          <Box mt={2}>
            <Typography variant="body2">
              Make sure your Jira integration is properly configured:
            </Typography>
            <ul>
              <li><Typography variant="body2">Check that your Jira API token is valid</Typography></li>
              <li><Typography variant="body2">Verify that the correct email address is being used</Typography></li>
              <li><Typography variant="body2">Confirm that the Jira instance URL is correct</Typography></li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  if (issues.length === 0) {
    return (
      <Card className={classes.root}>
        <CardHeader 
          title="Assigned to Me" 
          action={
            <Box display="flex" alignItems="center">
              <Button 
                color="primary" 
                variant="contained"
                className={classes.button}
                onClick={handleCreateIssue}
              >
                Create Issue
              </Button>
              <IconButton onClick={() => setOpenDiagnostic(true)} size="small" title="Diagnose Jira Connection">
                <BuildIcon />
              </IconButton>
              {showRefreshButton && (
                <IconButton onClick={handleRefresh} size="small" title="Refresh">
                  <RefreshIcon />
                </IconButton>
              )}
            </Box>
          }
        />
        <CardContent>
          <Alert severity="info">No issues found for user: {userId}</Alert>
          <Box mt={2}>
            <Typography>
              You don't have any issues assigned to you in Jira. You can create a new issue or try refreshing.
            </Typography>
          </Box>
        </CardContent>
        <NewIssueDialog open={openNewIssue} onClose={() => setOpenNewIssue(false)} onIssueCreated={handleIssueCreated} />
      </Card>
    );
  }
  
  return (
    <Card className={classes.root}>
      <CardHeader 
        title="Assigned to Me" 
        action={
          <Box display="flex" alignItems="center">
            <Button 
              color="primary" 
              variant="contained"
              className={classes.button}
              onClick={handleCreateIssue}
            >
              Create Issue
            </Button>
            {showRefreshButton && (
              <IconButton onClick={handleRefresh} size="small" title="Refresh">
                <RefreshIcon />
              </IconButton>
            )}
          </Box>
        }
      />
      <Divider />
      <Box className={classes.tabs}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Issues" />
          {projects.map(project => (
            <Tab key={project} label={project} />
          ))}
        </Tabs>
      </Box>
      <CardContent>
        {activeTab === 0 ? (
          <IssueList issues={issues} onIssueUpdated={handleRefresh} />
        ) : (
          <ProjectTabPanel 
            project={projects[activeTab - 1]} 
            issues={issuesByProject.get(projects[activeTab - 1]) || []} 
            onIssueUpdated={handleRefresh} 
          />
        )}
      </CardContent>

      <NewIssueDialog open={openNewIssue} onClose={() => setOpenNewIssue(false)} onIssueCreated={handleIssueCreated} />
      
      {/* Diagnostic dialog for troubleshooting */}
      <JiraDiagnosticDialog open={openDiagnostic} onClose={() => setOpenDiagnostic(false)} />
    </Card>
  );
};
