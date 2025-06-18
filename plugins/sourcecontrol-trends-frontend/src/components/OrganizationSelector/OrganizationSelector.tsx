import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Switch,
  FormControlLabel,
  Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../../api/SourceControlTrendsApiRef';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  formControl: {
    minWidth: 200,
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  organizationChip: {
    margin: theme.spacing(0.5),
  },
  stats: {
    display: 'flex',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  statItem: {
    textAlign: 'center',
  },
}));

export interface OrganizationSelectorProps {
  onOrganizationChange?: (organization: string | null) => void;
  onUserFilterChange?: (useUserFilter: boolean) => void;
  onArchiveFilterChange?: (includeArchived: boolean) => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  onOrganizationChange,
  onUserFilterChange,
  onArchiveFilterChange,
}) => {
  const classes = useStyles();
  const api = useApi(sourceControlTrendsApiRef);
  
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [useUserFilter, setUseUserFilter] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repositoryCounts, setRepositoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching user organizations...');
        const result = await api.getUserOrganizations();
        console.log('Organizations result:', result);
        setOrganizations(result.items || []);
        
        // Fetch repository counts for each organization
        const counts: Record<string, number> = {};
        for (const org of result.items || []) {
          try {
            console.log(`Fetching repositories for organization: ${org}`);
            const orgRepos = await api.getRepositoriesForOrganization(org, { includeArchived });
            console.log(`Repository count for ${org}:`, orgRepos.total);
            counts[org] = orgRepos.total || 0;
          } catch (error) {
            console.warn(`Failed to get repository count for ${org}:`, error);
            counts[org] = 0;
          }
        }
        setRepositoryCounts(counts);
        
      } catch (err) {
        console.error('Failed to fetch user organizations:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load organizations: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (useUserFilter) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setRepositoryCounts({});
      setLoading(false);
    }
  }, [api, useUserFilter, includeArchived]);

  const handleOrganizationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const org = event.target.value as string;
    setSelectedOrganization(org);
    onOrganizationChange?.(org || null);
  };

  const handleUserFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setUseUserFilter(checked);
    onUserFilterChange?.(checked);
    
    if (!checked) {
      setSelectedOrganization('');
      onOrganizationChange?.(null);
    }
  };

  const handleArchiveFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIncludeArchived(checked);
    onArchiveFilterChange?.(checked);
  };

  const totalRepositories = Object.values(repositoryCounts).reduce((sum, count) => sum + count, 0);

  if (error) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Repository Filters
        </Typography>
        
        <div className={classes.filterRow}>
          <FormControlLabel
            control={
              <Switch
                checked={useUserFilter}
                onChange={handleUserFilterChange}
                color="primary"
              />
            }
            label="Show only my accessible repositories"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={includeArchived}
                onChange={handleArchiveFilterChange}
                color="primary"
              />
            }
            label="Include archived repositories"
          />
        </div>

        {useUserFilter && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            
            <div className={classes.filterRow}>
              <FormControl className={classes.formControl} disabled={loading}>
                <InputLabel>Organization</InputLabel>
                <Select
                  value={selectedOrganization}
                  onChange={handleOrganizationChange}
                >
                  <MenuItem value="">
                    <em>All Organizations</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org} value={org}>
                      {org} ({repositoryCounts[org] || 0} repos)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {organizations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Your Organizations ({organizations.length}):
                </Typography>
                <Box>
                  {organizations.map((org) => (
                    <Chip
                      key={org}
                      label={`${org} (${repositoryCounts[org] || 0})`}
                      className={classes.organizationChip}
                      color={selectedOrganization === org ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedOrganization(org);
                        onOrganizationChange?.(org);
                      }}
                    />
                  ))}
                </Box>
                
                <div className={classes.stats}>
                  <div className={classes.statItem}>
                    <Typography variant="h6">{organizations.length}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Organizations
                    </Typography>
                  </div>
                  <div className={classes.statItem}>
                    <Typography variant="h6">{totalRepositories}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Repositories
                    </Typography>
                  </div>
                </div>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
