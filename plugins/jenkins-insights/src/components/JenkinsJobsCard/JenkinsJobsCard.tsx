import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Link,
  Tooltip
} from '@material-ui/core';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Cancel as AbortedIcon,
  Build as BuildIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { jenkinsApiRef, JenkinsJob, JenkinsBuild } from '../../api';

interface JenkinsJobsCardProps {
  title?: string;
  showRefreshButton?: boolean;
  maxItems?: number;
}

const useStyles = makeStyles(theme => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  listItem: {
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  buildStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  jobName: {
    fontWeight: 500,
  },
  buildNumber: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
  timeAgo: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));

interface JenkinsJobsCardProps {
  title?: string;
  showRefreshButton?: boolean;
  maxItems?: number;
}

const getBuildStatusIcon = (result: string | null, building: boolean) => {
  if (building) {
    return <CircularProgress size={16} />;
  }
  
  switch (result) {
    case 'SUCCESS':
      return <SuccessIcon style={{ color: '#4caf50', fontSize: 16 }} />;
    case 'FAILURE':
      return <ErrorIcon style={{ color: '#f44336', fontSize: 16 }} />;
    case 'UNSTABLE':
      return <WarningIcon style={{ color: '#ff9800', fontSize: 16 }} />;
    case 'ABORTED':
      return <AbortedIcon style={{ color: '#757575', fontSize: 16 }} />;
    default:
      return <BuildIcon style={{ color: '#2196f3', fontSize: 16 }} />;
  }
};

const getResultColor = (result: string | null, building: boolean) => {
  if (building) return 'primary';
  
  switch (result) {
    case 'SUCCESS':
      return 'default';
    case 'FAILURE':
      return 'secondary';
    case 'UNSTABLE':
      return 'default';
    case 'ABORTED':
      return 'default';
    default:
      return 'primary';
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
};

export const JenkinsJobsCard: React.FC<JenkinsJobsCardProps> = ({
  title = 'My Jenkins Jobs',
  showRefreshButton = true,
  maxItems = 8
}) => {
  const classes = useStyles();
  const jenkinsApi = useApi(jenkinsApiRef);
  const identityApi = useApi(identityApiRef);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JenkinsJob[]>([]);
  const [builds, setBuilds] = useState<JenkinsBuild[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the current user's email from Backstage identity
      const profile = await identityApi.getProfileInfo();
      if (!profile.email) {
        throw new Error('No email found in user profile');
      }

      setUserEmail(profile.email);

      // Try to find the Jenkins user by email
      const jenkinsUser = await jenkinsApi.findUserByEmail(profile.email);
      let userId = profile.email;

      if (jenkinsUser) {
        userId = jenkinsUser.id;
        console.log('Found Jenkins user:', jenkinsUser.fullName, 'with ID:', userId);
      } else {
        console.log('Jenkins user not found by email, using email as userId:', userId);
        // Try using just the username part of the email
        userId = profile.email.split('@')[0];
      }

      // Get jobs triggered by this user
      const userJobsResponse = await jenkinsApi.getJobsTriggeredByUser(userId);
      
      setJobs(userJobsResponse.jobs.slice(0, maxItems));
      setBuilds(userJobsResponse.builds.slice(0, maxItems));

    } catch (err) {
      console.error('Failed to fetch Jenkins data:', err);
      let errorMessage = 'Failed to fetch Jenkins data';
      
      if (err instanceof Error) {
        if (err.message.includes('<!DOCTYPE')) {
          errorMessage = 'Jenkins server is not accessible or returning HTML instead of JSON. Please check if Jenkins is running and the proxy configuration is correct.';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to Jenkins server. Please verify that Jenkins is running on the configured endpoint.';
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = 'Authentication failed. Please check Jenkins credentials in the configuration.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title={title} />
        <CardContent className={classes.content}>
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={classes.card}>
        <CardHeader 
          title={title}
          action={
            showRefreshButton && (
              <IconButton onClick={handleRefresh} size="small" title="Refresh">
                <RefreshIcon />
              </IconButton>
            )
          }
        />
        <CardContent className={classes.content}>
          <Alert severity="error">
            <Typography variant="body2" style={{ marginBottom: 8 }}>
              <strong>Jenkins Connection Error:</strong>
            </Typography>
            <Typography variant="body2" style={{ marginBottom: 8 }}>
              {error}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Troubleshooting: Ensure Jenkins is running on localhost:8082 and the proxy configuration in app-config.yaml is correct.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const displayBuilds = builds.slice(0, maxItems);

  return (
    <Card className={classes.card}>
      <CardHeader 
        title={title}
        subheader={userEmail ? `Showing jobs for ${userEmail}` : undefined}
        action={
          showRefreshButton && (
            <IconButton onClick={handleRefresh} size="small" title="Refresh">
              <RefreshIcon />
            </IconButton>
          )
        }
      />
      <CardContent className={classes.content}>
        {displayBuilds.length === 0 ? (
          <div className={classes.emptyState}>
            <BuildIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
            <Typography variant="body1">
              No recent jobs found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You haven't triggered any Jenkins jobs recently.
            </Typography>
          </div>
        ) : (
          <List dense>
            {displayBuilds.map((build, index) => {
              const correspondingJob = jobs.find(job => 
                build.url.includes(`/job/${encodeURIComponent(job.name)}/`)
              );
              const jobName = correspondingJob?.name || 
                             build.fullDisplayName?.split(' #')[0] || 
                             'Unknown Job';

              return (
                <ListItem key={`${build.url}-${index}`} className={classes.listItem}>
                  <ListItemIcon>
                    {getBuildStatusIcon(build.result, build.building)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                        <Typography variant="body2" className={classes.jobName}>
                          {jobName}
                        </Typography>
                        <Typography variant="caption" className={classes.buildNumber}>
                          #{build.number}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                        <Chip
                          size="small"
                          label={build.building ? 'Running' : (build.result || 'Unknown')}
                          color={getResultColor(build.result, build.building)}
                          variant="outlined"
                        />
                        <Typography variant="caption" className={classes.timeAgo}>
                          {formatTimeAgo(build.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Open in Jenkins">
                      <IconButton
                        edge="end"
                        size="small"
                        component={Link}
                        href={build.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
