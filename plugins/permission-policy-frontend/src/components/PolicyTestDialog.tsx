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

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  makeStyles,
} from '@material-ui/core';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { usePolicyEvaluation, useCatalogEntities } from '../hooks/usePolicyData';
import {
  PolicyEvaluationContext,
} from '../types';

interface PolicyTestDialogProps {
  open: boolean;
  onClose: () => void;
}

const COMMON_RESOURCE_TYPES = [
  'catalog-entity',
  'scaffolder-template',
  'kubernetes-cluster',
  'tech-insights-fact',
  'jenkins-job',
];

const COMMON_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'use',
  'execute',
];

const useStyles = makeStyles((theme) => ({
  flexContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  flexGap: {
    display: 'flex',
    alignItems: 'center',
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(1),
    },
  },
  resultCard: {
    marginTop: theme.spacing(2),
  },
  ruleBox: {
    marginBottom: theme.spacing(1),
  },
}));

export const PolicyTestDialog: React.FC<PolicyTestDialogProps> = ({
  open,
  onClose,
}) => {
  const classes = useStyles();
  const { evaluate, loading, result, error, reset } = usePolicyEvaluation();
  const { users } = useCatalogEntities();

  const [testData, setTestData] = useState<{
    userRef: string;
    resourceType: string;
    resourceAttributes: string;
    action: string;
    environment: string;
  }>({
    userRef: '',
    resourceType: '',
    resourceAttributes: '{}',
    action: '',
    environment: '{}',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleTest = async () => {
    try {
      // Validate inputs
      const errors: Record<string, string> = {};

      if (!testData.userRef.trim()) {
        errors.userRef = 'User is required';
      }

      if (!testData.resourceType.trim()) {
        errors.resourceType = 'Resource type is required';
      }

      if (!testData.action.trim()) {
        errors.action = 'Action is required';
      }

      let resourceAttributes: Record<string, any> = {};
      try {
        resourceAttributes = JSON.parse(testData.resourceAttributes);
      } catch {
        errors.resourceAttributes = 'Invalid JSON format';
      }

      let environment: Record<string, any> = {};
      try {
        environment = JSON.parse(testData.environment);
      } catch {
        errors.environment = 'Invalid JSON format';
      }

      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      // Find user entity
      const user = users?.find(u => u.entityRef === testData.userRef);
      if (!user) {
        setValidationErrors({ userRef: 'User not found' });
        return;
      }

      const context: PolicyEvaluationContext = {
        user: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'User',
          metadata: {
            name: user.name,
            namespace: 'default',
          },
          spec: {},
        } as any,
        resource: {
          type: testData.resourceType,
          attributes: resourceAttributes,
        },
        action: testData.action,
        environment,
      };

      await evaluate(context);
    } catch (err) {
      console.error('Policy evaluation failed:', err);
    }
  };

  const handleClose = () => {
    reset();
    setTestData({
      userRef: '',
      resourceType: '',
      resourceAttributes: '{}',
      action: '',
      environment: '{}',
    });
    setValidationErrors({});
    onClose();
  };

  const formatJson = (value: string) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Test Policy Evaluation</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" style={{ marginBottom: 16 }}>
            {error.message}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth required error={!!validationErrors.userRef}>
              <InputLabel>User</InputLabel>
              <Select
                value={testData.userRef}
                onChange={(e) => {
                  setTestData(prev => ({ ...prev, userRef: e.target.value as string }));
                  setValidationErrors(prev => ({ ...prev, userRef: '' }));
                }}
              >
                {users?.map((user) => (
                  <MenuItem key={user.entityRef} value={user.entityRef}>
                    {user.name} ({user.entityRef})
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.userRef && (
                <Typography variant="caption" color="error">
                  {validationErrors.userRef}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth required error={!!validationErrors.resourceType}>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={testData.resourceType}
                onChange={(e) => {
                  setTestData(prev => ({ ...prev, resourceType: e.target.value as string }));
                  setValidationErrors(prev => ({ ...prev, resourceType: '' }));
                }}
              >
                {COMMON_RESOURCE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.resourceType && (
                <Typography variant="caption" color="error">
                  {validationErrors.resourceType}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth required error={!!validationErrors.action}>
              <InputLabel>Action</InputLabel>
              <Select
                value={testData.action}
                onChange={(e) => {
                  setTestData(prev => ({ ...prev, action: e.target.value as string }));
                  setValidationErrors(prev => ({ ...prev, action: '' }));
                }}
              >
                {COMMON_ACTIONS.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.action && (
                <Typography variant="caption" color="error">
                  {validationErrors.action}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Resource Attributes (JSON)"
              value={testData.resourceAttributes}
              onChange={(e) => {
                setTestData(prev => ({ ...prev, resourceAttributes: e.target.value }));
                setValidationErrors(prev => ({ ...prev, resourceAttributes: '' }));
              }}
              onBlur={(e) => {
                setTestData(prev => ({ ...prev, resourceAttributes: formatJson(e.target.value) }));
              }}
              multiline
              rows={3}
              error={!!validationErrors.resourceAttributes}
              helperText={validationErrors.resourceAttributes || 'Additional attributes for the resource (optional)'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Environment Context (JSON)"
              value={testData.environment}
              onChange={(e) => {
                setTestData(prev => ({ ...prev, environment: e.target.value }));
                setValidationErrors(prev => ({ ...prev, environment: '' }));
              }}
              onBlur={(e) => {
                setTestData(prev => ({ ...prev, environment: formatJson(e.target.value) }));
              }}
              multiline
              rows={3}
              error={!!validationErrors.environment}
              helperText={validationErrors.environment || 'Additional context for evaluation (optional)'}
            />
          </Grid>
        </Grid>

        {result && (
          <Card className={classes.resultCard}>
            <CardContent>
              <Box className={classes.flexContainer}>
                {result.decision === 'allow' ? (
                  <CheckIcon style={{ color: 'green', marginRight: 8 }} />
                ) : (
                  <CancelIcon style={{ color: 'red', marginRight: 8 }} />
                )}
                <Typography variant="h6">
                  {result.decision === 'allow' ? 'Access Allowed' : 
                   result.decision === 'deny' ? 'Access Denied' : 'Not Applicable'}
                </Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" paragraph>
                <strong>Reason:</strong> {result.reason || 'No specific reason provided'}
              </Typography>

              {result.rule && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      Applied Rule
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box width="100%">
                      <Box className={classes.ruleBox}>
                        <Box className={classes.flexGap}>
                          <Chip
                            label={result.rule.effect}
                            color={result.rule.effect === 'allow' ? 'primary' : 'secondary'}
                            size="small"
                          />
                          <Typography variant="body2">
                            <strong>Rule:</strong> {result.rule.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {result.rule.description}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {result.metadata && (
                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    Evaluation Time: {result.metadata.evaluationTime}ms | 
                    Rules Evaluated: {result.metadata.rulesEvaluated}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          onClick={handleTest}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={<PlayIcon />}
        >
          {loading ? 'Testing...' : 'Test Policy'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
