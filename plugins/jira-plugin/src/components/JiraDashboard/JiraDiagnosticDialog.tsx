import { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import BuildIcon from '@material-ui/icons/Build';
import { useApi } from '@backstage/core-plugin-api';
import { jiraApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  success: {
    color: theme.palette.success.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  waiting: {
    color: theme.palette.grey[500],
  },
  dialogContent: {
    minWidth: '500px',
  },
  testTitle: {
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
  }
}));

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'waiting';
  message?: string;
};

export const JiraDiagnosticDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const classes = useStyles();
  const jiraApi = useApi(jiraApiRef);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  const runDiagnostics = async () => {
    setLoading(true);
    setTestResults([
      { name: 'API Connection', status: 'waiting' },
      { name: 'User Authentication', status: 'waiting' },
      { name: 'Projects Access', status: 'waiting' },
      { name: 'Issues Access', status: 'waiting' },
    ]);
    
    // Test API Connection
    try {
      const baseUrlTest = await fetch('/api/proxy/jira/api/rest/api/2/serverInfo');
      
      if (baseUrlTest.ok) {
        updateTestResult(0, 'success', 'Successfully connected to Jira API');
      } else {
        updateTestResult(0, 'error', `Failed to connect to Jira API: ${baseUrlTest.status} ${baseUrlTest.statusText}`);
      }
    } catch (error) {
      updateTestResult(0, 'error', `API connection error: ${error}`);
    }
    
    // Test User Authentication
    try {
      await jiraApi.getUserProfile();
      updateTestResult(1, 'success', 'Successfully authenticated with Jira');
    } catch (error) {
      updateTestResult(1, 'error', `Authentication error: ${error}`);
    }
    
    // Test Projects Access
    try {
      const projects = await jiraApi.getProjects();
      updateTestResult(2, 'success', `Successfully retrieved ${projects.length} projects`);
    } catch (error) {
      updateTestResult(2, 'error', `Projects access error: ${error}`);
    }
    
    // Test Issues Access
    try {
      // Use currentUser() JQL which doesn't need a specific email
      const response = await fetch('/api/proxy/jira/api/rest/api/2/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jql: 'assignee = currentUser()',
          maxResults: 1,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTestResult(3, 'success', `Successfully retrieved issues (total: ${data.total || 0})`);
      } else {
        const errorText = await response.text();
        updateTestResult(3, 'error', `Issues access error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      updateTestResult(3, 'error', `Issues access error: ${error}`);
    }
    
    setLoading(false);
  };

  const updateTestResult = (index: number, status: 'success' | 'error', message?: string) => {
    setTestResults(prev => 
      prev.map((result, i) => 
        i === index ? { ...result, status, message } : result
      )
    );
  };

  useEffect(() => {
    if (open) {
      runDiagnostics();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>Jira Connectivity Diagnostic</DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" className={classes.testTitle}>
              Test Results
            </Typography>
            
            <List>
              {testResults.map(test => (
                <ListItem key={test.name}>
                  <ListItemIcon>
                    {test.status === 'success' && <CheckCircleIcon className={classes.success} />}
                    {test.status === 'error' && <ErrorIcon className={classes.error} />}
                    {test.status === 'waiting' && <CircularProgress size={24} />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={test.name} 
                    secondary={test.message || ''} 
                  />
                </ListItem>
              ))}
            </List>
            
            {testResults.some(test => test.status === 'error') && (
              <Alert severity="warning" style={{ marginTop: '16px' }}>
                <Typography>Troubleshooting steps:</Typography>
                <ol>
                  <li>Verify your Jira API token is valid</li>
                  <li>Check the proxy configuration in app-config.yaml</li>
                  <li>Ensure the Jira base URL is correct</li>
                  <li>Check your browser console for detailed error messages</li>
                </ol>
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          startIcon={<BuildIcon />} 
          onClick={runDiagnostics} 
          color="primary" 
          disabled={loading}
        >
          Run Again
        </Button>
        <Button onClick={onClose} color="primary" disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
