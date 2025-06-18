/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  PlayArrow as TestIcon,
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import {
  Content,
  Header,
  HeaderLabel,
  Page,
  Progress,
  SupportButton,
} from '@backstage/core-components';
import { usePolicyRules, usePolicyActions, useCatalogEntities } from '../hooks/usePolicyData';
import { PolicyRule, User, Group, PolicyListFilter } from '../types';
import { PolicyRuleFormEnhanced as PolicyRuleForm } from './PolicyRuleFormEnhanced';
import { PolicyTestDialog } from './PolicyTestDialog';

const useStyles = makeStyles(theme => ({
  flexBox: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  flexBoxSmall: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  flexWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  },
  captionWithMargin: {
    marginTop: theme.spacing(1),
  },
}));

export const PolicyRulesList = () => {
  const classes = useStyles();
  const [filter, setFilter] = useState<PolicyListFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PolicyRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<PolicyRule | null>(null);

  const { data, loading, error, refetch } = usePolicyRules(filter);
  const { createRule, updateRule, deleteRule } = usePolicyActions();
  const { users: usersData, groups: groupsData } = useCatalogEntities();

  // Transform the data to match the expected User and Group interfaces
  const users: User[] = usersData?.map(user => ({
    id: user.entityRef,
    name: user.name,
    entityRef: user.entityRef,
  })) || [];

  const groups: Group[] = groupsData?.map(group => ({
    id: group.entityRef,
    name: group.name,
    entityRef: group.entityRef,
  })) || [];

  const handleCreateRule = () => {
    setSelectedRule(null);
    setShowForm(true);
  };

  const handleEditRule = (rule: PolicyRule) => {
    setSelectedRule(rule);
    setShowForm(true);
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    
    try {
      await deleteRule(ruleToDelete.id);
      refetch();
      setRuleToDelete(null);
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleSaveRule = async (ruleData: Partial<PolicyRule>) => {
    try {
      if (selectedRule) {
        await updateRule(selectedRule.id, ruleData);
      } else {
        await createRule(ruleData as Omit<PolicyRule, 'id' | 'createdAt' | 'updatedAt'>);
      }
      refetch();
      return true;
    } catch (err) {
      console.error('Failed to save rule:', err);
      return false;
    }
  };

  const handleFormClose = (saved?: boolean) => {
    setShowForm(false);
    setSelectedRule(null);
    if (saved) {
      refetch();
    }
  };

  const handleFilterChange = (field: keyof PolicyListFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilter({});
  };

  if (loading && !data) {
    return <Progress />;
  }

  return (
    <Page themeId="tool">
      <Header title="Permission Policies" subtitle="Manage access control policies">
        <HeaderLabel label="Owner" value="Platform Team" />
        <HeaderLabel label="Lifecycle" value="Production" />
      </Header>

      <Content>
        {error && (
          <Alert severity="error" style={{ marginBottom: 16 }}>
            {error.message}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <div className={classes.flexBox}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateRule}
            >
              Create Policy
            </Button>
            <Button
              variant="outlined"
              startIcon={<TestIcon />}
              onClick={() => setShowTestDialog(true)}
            >
              Test Policies
            </Button>
          </div>
          
          <div className={classes.flexBox}>
            <Tooltip title="Toggle Filters">
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={refetch} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
        </Box>

        {showFilters && (
          <Card style={{ marginBottom: 16 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={filter.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by name or description"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    select
                    label="Effect"
                    value={filter.effect || ''}
                    onChange={(e) => handleFilterChange('effect', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="allow">Allow</MenuItem>
                    <MenuItem value="deny">Deny</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Resource Type"
                    value={filter.resourceType || ''}
                    onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                    placeholder="e.g., catalog-entity"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Action"
                    value={filter.action || ''}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    placeholder="e.g., read"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filter.enabled ?? true}
                        onChange={(e) => handleFilterChange('enabled', e.target.checked)}
                      />
                    }
                    label="Enabled Only"
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Button onClick={clearFilters}>Clear</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {data && data.items && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Showing {data.items.length} of {data.total || data.items.length} policies
          </Typography>
        )}

        <Grid container spacing={2}>
          {data?.items?.map((rule) => (
            <Grid item xs={12} md={6} lg={4} key={rule.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component="h3">
                      {rule.name}
                    </Typography>
                    <div className={classes.flexBoxSmall}>
                      <Chip
                        label={rule.effect}
                        color={rule.effect === 'allow' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </div>
                  </Box>

                  {rule.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {rule.description}
                    </Typography>
                  )}

                  <Box mb={1}>
                    <Typography variant="caption" display="block">
                      Subjects ({(rule.subjects || []).length}):
                    </Typography>
                    <div className={classes.flexWrap}>
                      {(rule.subjects || []).slice(0, 3).map((subject, index) => (
                        <Chip
                          key={index}
                          label={`${subject.type}: ${subject.identifier}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {(rule.subjects || []).length > 3 && (
                        <Chip label={`+${(rule.subjects || []).length - 3} more`} size="small" />
                      )}
                    </div>
                  </Box>

                  <Box mb={1}>
                    <Typography variant="caption" display="block">
                      Resource:
                    </Typography>
                    <Chip
                      label={rule.resource}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" display="block">
                      Actions ({(rule.actions || []).length}):
                    </Typography>
                    <div className={classes.flexWrap}>
                      {(rule.actions || []).slice(0, 3).map((action, index) => (
                        <Chip
                          key={index}
                          label={action}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {(rule.actions || []).length > 3 && (
                        <Chip label={`+${(rule.actions || []).length - 3} more`} size="small" />
                      )}
                    </div>
                  </Box>

                  <Typography variant="caption" display="block" className={classes.captionWithMargin}>
                    Priority: {rule.metadata?.priority || 1} | Updated: {rule.metadata?.updatedAt ? new Date(rule.metadata.updatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditRule(rule)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="secondary"
                    startIcon={<DeleteIcon />}
                    onClick={() => setRuleToDelete(rule)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {data?.items?.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              No policies found
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {Object.keys(filter).length > 0
                ? 'Try adjusting your filters or create a new policy.'
                : 'Get started by creating your first policy.'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateRule}
            >
              Create Policy
            </Button>
          </Box>
        )}

        {/* Create/Edit Dialog */}
        <PolicyRuleForm
          open={showForm}
          rule={selectedRule}
          users={users}
          groups={groups}
          onClose={handleFormClose}
          onSave={handleSaveRule}
        />

        {/* Test Dialog */}
        <PolicyTestDialog
          open={showTestDialog}
          onClose={() => setShowTestDialog(false)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!ruleToDelete}
          onClose={() => setRuleToDelete(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Policy Rule</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the policy rule "{ruleToDelete?.name}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRuleToDelete(null)}>Cancel</Button>
            <Button
              onClick={handleDeleteRule}
              color="secondary"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Content>
      
      <SupportButton>
        Need help managing policies? Check out our documentation.
      </SupportButton>
    </Page>
  );
};
