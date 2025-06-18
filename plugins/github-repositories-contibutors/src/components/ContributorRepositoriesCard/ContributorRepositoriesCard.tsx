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
import { RepositoryData } from '../../api';
import { Link, Button, IconButton, Tooltip } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import StarIcon from '@material-ui/icons/Star';
import AccountTreeIcon from '@material-ui/icons/AccountTree';

const useStyles = makeStyles(theme => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
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
  language: {
    marginRight: theme.spacing(1),
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    '& > *': {
      marginRight: theme.spacing(1),
    },
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  contributorAvatars: {
    display: 'flex',
    alignItems: 'center',
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(0.5),
    },
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '1px solid #ddd',
  },
  moreContributors: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(0.5),
  },
  testButton: {
    marginTop: theme.spacing(1),
  },
  errorContainer: {
    marginBottom: theme.spacing(2),
  },
}));

export const ContributorRepositoriesCard = () => {
  const classes = useStyles();
  const githubApi = useGitHubContributorsApi();
  
  const [repositories, setRepositories] = useState<RepositoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [apiStatus, setApiStatus] = useState<{ isValid: boolean; status: string; details?: string } | undefined>();

  const validateApiConnection = useCallback(async () => {
    try {
      const validationResult = await githubApi.validateApiConfig();
      setApiStatus(validationResult);
      return validationResult.isValid;
    } catch (err) {
      console.error('API validation failed:', err);
      setApiStatus({
        isValid: false,
        status: 'API validation failed',
        details: err instanceof Error ? err.message : String(err)
      });
      return false;
    }
  }, [githubApi]);

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      // First validate the API connection
      const isValid = await validateApiConnection();
      
      if (!isValid) {
        setError(new Error(`GitHub API connection issue`));
        setLoading(false);
        return;
      }
      
      // Force a reinitialize before fetching
      try {
        await githubApi.reinitialize();
      } catch (initError) {
        console.warn('Reinitialization failed, continuing with existing client', initError);
      }
      
      const data = await githubApi.getContributorRepositories();
      setRepositories(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching contributor repositories:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [githubApi, validateApiConnection]); // Removed apiStatus from dependencies

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const handleRefresh = () => {
    fetchRepositories();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: TableColumn<RepositoryData>[] = [
    {
      title: 'Name',
      field: 'name',
      highlight: true,
      render: (row: RepositoryData) => (
        <Link href={row.html_url} target="_blank" rel="noopener">
          {row.name}
        </Link>
      ),
    },
    {
      title: 'Organization/Owner',
      field: 'full_name',
      render: (row: RepositoryData) => {
        const [owner] = row.full_name.split('/');
        return owner;
      },
    },
    {
      title: 'Contributors',
      render: (row: RepositoryData) => {
        console.log(`Rendering contributors for ${row.name}:`, row.contributors);
        
        if (!row.contributors || row.contributors.length === 0) {
          return <span className={classes.moreContributors}>Loading contributors...</span>;
        }
        
        const visibleContributors = row.contributors.slice(0, 6); // Show up to 6 avatars
        const remainingCount = row.contributors.length - visibleContributors.length;
        
        return (
          <div className={classes.contributorAvatars}>
            {visibleContributors.map((contributor, index) => (
              <Tooltip 
                key={`${contributor.login}-${index}`} 
                title={`${contributor.login} (${contributor.contributions} contributions)`}
              >
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className={classes.avatar}
                  onError={(e) => {
                    console.warn(`Failed to load avatar for ${contributor.login}`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <span className={classes.moreContributors}>
                +{remainingCount} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Stats',
      render: (row: RepositoryData) => (
        <div className={classes.stats}>
          <Tooltip title="Stars">
            <span>
              <StarIcon fontSize="small" /> {row.stargazers_count}
            </span>
          </Tooltip>
          <Tooltip title="Forks">
            <span>
              <AccountTreeIcon fontSize="small" /> {row.forks_count}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Updated',
      field: 'updated_at',
      render: (row: RepositoryData) => formatDate(row.updated_at),
    },
  ];

  // Generate helpful troubleshooting information if there's an error with API connection
  const renderApiConnectionError = () => {
    if (!apiStatus || apiStatus.isValid) {
      return null;
    }
    
    return (
      <div className={classes.errorContainer}>
        <h3>GitHub API Connection Issues</h3>
        <p><strong>Status:</strong> {apiStatus.status}</p>
        {apiStatus.details && <p><strong>Details:</strong> {apiStatus.details}</p>}
        
        <h4>Troubleshooting Tips:</h4>
        <ul>
          <li>Ensure your GitHub token is valid and has not expired</li>
          <li>Check that the token has required scopes: <code>repo</code>, <code>read:org</code></li>
          <li>Verify organization names are correct in your configuration</li>
          <li>Confirm your Backstage identity is properly configured</li>
        </ul>
        
        <p>
          Configuration locations:
        </p>
        <ul>
          <li><code>app-config.yaml</code>: Check the <code>integrations.github</code> section</li>
          <li>Environment variables: <code>GITHUB_TOKEN</code>, <code>GITHUB_ORGANIZATIONS</code></li>
        </ul>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={validateApiConnection}
          className={classes.testButton}
        >
          Test API Connection
        </Button>
      </div>
    );
  };

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return (
      <InfoCard title="GitHub Repositories - Error">
        {renderApiConnectionError()}
        <ResponseErrorPanel error={error} />
      </InfoCard>
    );
  }

  const title = `Contributor Repositories${
    githubApi.getOrganizationName() 
      ? ` (${githubApi.getOrganizationName()})` 
      : githubApi.getCurrentUser() 
        ? ` (${githubApi.getCurrentUser()})` 
        : ''
  }`;

  return (
    <InfoCard 
      title={
        <div className={classes.titleContainer}>
          <span>{title}</span>
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
      {repositories.length > 0 ? (
        <Table
          options={{
            search: true,
            paging: repositories.length > 5,
            pageSize: 5,
            padding: 'dense',
          }}
          data={repositories}
          columns={columns}
        />
      ) : (
        <EmptyState
          missing="data"
          title="No repositories found"
          description="No repositories were found where you are a contributor."
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
