import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Tooltip,
  IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { Visibility, VisibilityOff, TrendingUp, Security, Assessment } from '@material-ui/icons';
import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../../api/SourceControlTrendsApiRef';
import { SourceControlRepository } from '../../types';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    maxHeight: 600,
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  scoreChip: {
    fontWeight: 'bold',
  },
  healthyScore: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  warningScore: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  criticalScore: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  selectionActions: {
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    alignItems: 'center',
  },
  selectedCount: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  repositoryName: {
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  ownerChip: {
    fontSize: '0.75rem',
  },
  repositoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

export interface UserRepositoryListProps {
  organization?: string | null;
  useUserFilter?: boolean;
  includeArchived?: boolean;
  onRepositorySelect?: (repositories: SourceControlRepository[]) => void;
  onRepositoryView?: (repository: SourceControlRepository) => void;
}

export const UserRepositoryList: React.FC<UserRepositoryListProps> = ({
  organization,
  useUserFilter = true,
  includeArchived = false,
  onRepositorySelect,
  onRepositoryView,
}) => {
  const classes = useStyles();
  const api = useApi(sourceControlTrendsApiRef);
  
  const [repositories, setRepositories] = useState<SourceControlRepository[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let result;
        if (useUserFilter) {
          if (organization) {
            result = await api.getRepositoriesForOrganization(organization, { includeArchived });
          } else {
            result = await api.getUserRepositories({ includeArchived });
          }
        } else {
          result = await api.getRepositories({ includeArchived });
        }
        
        setRepositories(result.items || []);
        setSelectedRepositories(new Set()); // Clear selection when data changes
        
      } catch (err) {
        console.error('Failed to fetch repositories:', err);
        setError(typeof err === 'string' ? err : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [api, organization, useUserFilter, includeArchived]);

  // Notify parent component when selection changes
  useEffect(() => {
    const selectedRepos = repositories.filter(repo => selectedRepositories.has(repo.id));
    onRepositorySelect?.(selectedRepos);
  }, [selectedRepositories, repositories, onRepositorySelect]);

  const handleSelectAll = () => {
    if (selectedRepositories.size === repositories.length) {
      setSelectedRepositories(new Set());
    } else {
      setSelectedRepositories(new Set(repositories.map(repo => repo.id)));
    }
  };

  const handleRepositoryToggle = (repositoryId: string) => {
    const newSelection = new Set(selectedRepositories);
    if (newSelection.has(repositoryId)) {
      newSelection.delete(repositoryId);
    } else {
      newSelection.add(repositoryId);
    }
    setSelectedRepositories(newSelection);
  };

  const handleRepositoryView = (repository: SourceControlRepository) => {
    onRepositoryView?.(repository);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return classes.healthyScore;
    if (score >= 60) return classes.warningScore;
    return classes.criticalScore;
  };

  const getVisibilityIcon = (isPrivate: boolean) => {
    return isPrivate ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Repositories
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Repositories
          </Typography>
          <Alert severity="error">
            Failed to load repositories: {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
          <Typography variant="h6">
            Repositories ({repositories.length})
            {organization && ` - ${organization}`}
          </Typography>
          <div className={classes.actionButtons}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TrendingUp />}
              disabled={selectedRepositories.size === 0}
            >
              View Trends
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Security />}
              disabled={selectedRepositories.size === 0}
            >
              Security Report
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Assessment />}
              disabled={selectedRepositories.size === 0}
            >
              Compliance Report
            </Button>
          </div>
        </Box>

        <div className={classes.selectionActions}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedRepositories.size === repositories.length && repositories.length > 0}
                indeterminate={selectedRepositories.size > 0 && selectedRepositories.size < repositories.length}
                onChange={handleSelectAll}
                color="primary"
              />
            }
            label={`Select All (${selectedRepositories.size}/${repositories.length})`}
          />
          {selectedRepositories.size > 0 && (
            <Typography variant="body2" className={classes.selectedCount}>
              {selectedRepositories.size} repository{selectedRepositories.size !== 1 ? 'ies' : ''} selected
            </Typography>
          )}
        </div>
        
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>Repository</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Health Score</TableCell>
                <TableCell align="center">Compliance</TableCell>
                <TableCell align="center">Stars</TableCell>
                <TableCell align="center">Forks</TableCell>
                <TableCell align="center">Language</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repositories.map((repo: SourceControlRepository) => (
                <TableRow key={repo.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRepositories.has(repo.id)}
                      onChange={() => handleRepositoryToggle(repo.id)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className={classes.repositoryInfo}>
                      <Typography 
                        variant="subtitle2" 
                        className={classes.repositoryName}
                        onClick={() => handleRepositoryView(repo)}
                      >
                        {repo.name}
                      </Typography>
                      {getVisibilityIcon(repo.isPrivate)}
                      {repo.archived && (
                        <Chip label="Archived" size="small" variant="outlined" />
                      )}
                    </div>
                    {repo.description && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {repo.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={repo.owner} 
                      size="small" 
                      className={classes.ownerChip}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {/* Mock health score - in real implementation, this would come from metrics */}
                    <Chip
                      label={Math.floor(Math.random() * 40) + 60}
                      size="small"
                      className={`${classes.scoreChip} ${getScoreColor(Math.floor(Math.random() * 40) + 60)}`}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={Math.random() > 0.7 ? 'PASS' : Math.random() > 0.4 ? 'WARN' : 'FAIL'}
                      size="small"
                      color={Math.random() > 0.7 ? 'primary' : Math.random() > 0.4 ? 'default' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell align="center">{repo.starsCount}</TableCell>
                  <TableCell align="center">{repo.forksCount}</TableCell>
                  <TableCell align="center">
                    {repo.language && (
                      <Chip label={repo.language} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(repo.updatedAt)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleRepositoryView(repo)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
