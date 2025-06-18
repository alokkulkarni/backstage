import { useState, useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { 
  InfoCard, 
  Progress, 
  ResponseErrorPanel,
  EmptyState,
  Table,
  TableColumn 
} from '@backstage/core-components';
import { useGitHubContributorsApi } from '../../hooks';
import { PullRequestData } from '../../api';
import { Link, Button, IconButton, Tooltip, Avatar } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';

const useStyles = makeStyles(theme => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  empty: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    marginRight: theme.spacing(1),
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  refreshButton: {
    marginLeft: theme.spacing(1),
  },
  authorContainer: {
    display: 'flex',
    alignItems: 'center',
  },
}));

export const ActionRequiredPullRequestsCard = () => {
  const classes = useStyles();
  const githubApi = useGitHubContributorsApi();
  
  const [pullRequests, setPullRequests] = useState<PullRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const fetchPullRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      // Force a reinitialize before fetching
      try {
        await githubApi.reinitialize();
      } catch (initError) {
        console.warn('Reinitialization failed, continuing with existing client', initError);
      }
      
      const data = await githubApi.getActionRequiredPullRequests();
      setPullRequests(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pull requests for review:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [githubApi]);

  useEffect(() => {
    fetchPullRequests();
  }, [fetchPullRequests]);

  const handleRefresh = () => {
    fetchPullRequests();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: TableColumn<PullRequestData>[] = [
    {
      title: 'Title',
      field: 'title',
      highlight: true,
      render: (row: PullRequestData) => (
        <Link href={row.html_url} target="_blank" rel="noopener">
          {row.title}
        </Link>
      ),
    },
    {
      title: 'Repository',
      field: 'repository_name',
    },
    {
      title: 'Author',
      field: 'author',
      render: (row: PullRequestData) => (
        <div className={classes.authorContainer}>
          <Avatar 
            className={classes.avatar} 
            src={row.author.avatar_url} 
            alt={row.author.login}
          />
          <Link href={row.author.html_url} target="_blank" rel="noopener">
            {row.author.login}
          </Link>
        </div>
      ),
    },
    {
      title: 'Created',
      field: 'created_at',
      render: (row: PullRequestData) => formatDate(row.created_at),
    },
  ];

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <InfoCard 
      title={
        <div className={classes.titleContainer}>
          <span>Action Required PRs</span>
          <Tooltip title="Refresh">
            <IconButton 
              className={classes.refreshButton} 
              onClick={handleRefresh} 
              size="small"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      } 
      className={classes.card}
    >
      {pullRequests.length > 0 ? (
        <Table
          options={{
            search: true,
            paging: pullRequests.length > 10,
            pageSize: 10,
            padding: 'dense',
          }}
          data={pullRequests}
          columns={columns}
        />
      ) : (
        <EmptyState
          missing="data"
          title="No pull requests require your review"
          description="You don't have any pull requests waiting for your review."
          action={
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          }
        />
      )}
    </InfoCard>
  );
};
