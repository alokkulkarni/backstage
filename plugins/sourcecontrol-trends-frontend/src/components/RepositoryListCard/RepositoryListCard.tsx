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
  LinearProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../../api/SourceControlTrendsApiRef';
import { SourceControlRepository } from '../../types';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    maxHeight: 400,
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
}));

export const RepositoryListCard: React.FC = () => {
  const classes = useStyles();
  const [repositories, setRepositories] = useState<SourceControlRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi(sourceControlTrendsApiRef);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api.getRepositories();
        setRepositories(result.items || []);
        setError(null);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return classes.healthyScore;
    if (score >= 60) return classes.warningScore;
    return classes.criticalScore;
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
            Failed to load repositories: {typeof error === 'string' ? error : 'Unknown error'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Repositories ({repositories.length})
        </Typography>
        
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Repository</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="center">Health Score</TableCell>
                <TableCell align="center">Compliance</TableCell>
                <TableCell align="center">Stars</TableCell>
                <TableCell align="center">Forks</TableCell>
                <TableCell>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repositories.map((repo: SourceControlRepository) => (
                <TableRow key={repo.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {repo.name}
                    </Typography>
                    {repo.description && (
                      <Typography variant="caption" color="textSecondary">
                        {repo.description.length > 50 
                          ? `${repo.description.substring(0, 50)}...`
                          : repo.description
                        }
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{repo.owner}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${Math.floor(Math.random() * 100)}%`}
                      size="small"
                      className={`${classes.scoreChip} ${getScoreColor(Math.floor(Math.random() * 100))}`}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label="unknown"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">{repo.starsCount || 0}</TableCell>
                  <TableCell align="center">{repo.forksCount || 0}</TableCell>
                  <TableCell>
                    {repo.updatedAt 
                      ? new Date(repo.updatedAt).toLocaleDateString()
                      : 'Unknown'
                    }
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
