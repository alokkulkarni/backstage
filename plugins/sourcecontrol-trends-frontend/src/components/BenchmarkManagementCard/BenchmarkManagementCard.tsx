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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  IconButton,
  Tooltip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { Edit as EditIcon, Add as AddIcon } from '@material-ui/icons';
import { useApi } from '@backstage/core-plugin-api';
import { sourceControlTrendsApiRef } from '../../api';
import { SourceControlBenchmark } from '../../types';

const useStyles = makeStyles((theme) => ({
  card: {
    marginBottom: theme.spacing(2),
  },
  addButton: {
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    maxHeight: 400,
  },
  formField: {
    marginBottom: theme.spacing(2),
    minWidth: 200,
  },
}));

interface BenchmarkFormData {
  metric: string;
  passThreshold: number;
  warnThreshold: number;
  failThreshold: number;
  comparisonOperator: string;
  description: string;
}

export const BenchmarkManagementCard: React.FC = () => {
  const classes = useStyles();
  const api = useApi(sourceControlTrendsApiRef);
  const [benchmarks, setBenchmarks] = useState<SourceControlBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<SourceControlBenchmark | null>(null);
  const [formData, setFormData] = useState<BenchmarkFormData>({
    metric: '',
    passThreshold: 0,
    warnThreshold: 0,
    failThreshold: 0,
    comparisonOperator: 'gte',
    description: '',
  });

  useEffect(() => {
    const fetchBenchmarks : () => Promise<void> = async () => {
      try {
        setLoading(true);
        const result = await api.getBenchmarks();
        setBenchmarks(result.items || []);
        setError(null);
      } catch (err) {
        setError('Failed to load benchmarks');
        console.error('Error fetching benchmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmarks();
  }, [api]);

  const refreshBenchmarks = async () => {
    try {
      setLoading(true);
      const result = await api.getBenchmarks();
      setBenchmarks(result.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to refresh benchmarks');
      console.error('Error refreshing benchmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const metricTypes = [
    'branch_protection_enabled',
    'pr_review_required',
    'security_scanning_enabled',
    'license_compliance',
    'documentation_coverage',
    'test_coverage',
    'dependency_updates',
  ];

  const handleOpenDialog = (benchmark?: SourceControlBenchmark) => {
    if (benchmark) {
      setEditingBenchmark(benchmark);
      setFormData({
        metric: benchmark.metric,
        passThreshold: benchmark.passThreshold || 0,
        warnThreshold: benchmark.warnThreshold || 0,
        failThreshold: benchmark.failThreshold || 0,
        comparisonOperator: benchmark.comparisonOperator,
        description: benchmark.description || '',
      });
    } else {
      setEditingBenchmark(null);
      setFormData({
        metric: '',
        passThreshold: 0,
        warnThreshold: 0,
        failThreshold: 0,
        comparisonOperator: 'gte',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBenchmark(null);
  };

  const handleSaveBenchmark = async () => {
    try {
      // Here you would call the API to save/update the benchmark
      // For now, we'll just close the dialog and refresh
      handleCloseDialog();
      await refreshBenchmarks();
    } catch (err) {
      console.error('Failed to save benchmark:', err);
    }
  };

  const handleFormChange = (field: keyof BenchmarkFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Benchmark Management
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
            Benchmark Management
          </Typography>
          <Alert severity="error">
            Failed to load benchmarks: {typeof error === 'string' ? error : 'Unknown error'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Benchmark Management
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            className={classes.addButton}
          >
            Add Benchmark
          </Button>
          
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Comparison</TableCell>
                  <TableCell align="center">Pass Threshold</TableCell>
                  <TableCell align="center">Warn Threshold</TableCell>
                  <TableCell align="center">Fail Threshold</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {benchmarks.map((benchmark: SourceControlBenchmark) => (
                  <TableRow key={benchmark.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {benchmark.metric.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>{benchmark.comparisonOperator}</TableCell>
                    <TableCell align="center">
                      {benchmark.passThreshold}
                      {benchmark.unit}
                    </TableCell>
                    <TableCell align="center">
                      {benchmark.warnThreshold}
                      {benchmark.unit}
                    </TableCell>
                    <TableCell align="center">
                      {benchmark.failThreshold}
                      {benchmark.unit}
                    </TableCell>
                    <TableCell>
                      {benchmark.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        style={{ 
                          color: benchmark.category === 'security' ? '#f44336' : '#4caf50',
                          fontWeight: 'bold'
                        }}
                      >
                        {benchmark.category.toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Benchmark">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(benchmark)}
                        >
                          <EditIcon />
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

      {/* Benchmark Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBenchmark ? 'Edit Benchmark' : 'Add New Benchmark'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth className={classes.formField}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={formData.metric}
              onChange={(e) => handleFormChange('metric', e.target.value)}
            >
              {metricTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth className={classes.formField}>
            <InputLabel>Comparison Operator</InputLabel>
            <Select
              value={formData.comparisonOperator}
              onChange={(e) => handleFormChange('comparisonOperator', e.target.value)}
            >
              {['gte', 'lte', 'eq', 'range'].map((op) => (
                <MenuItem key={op} value={op}>
                  {op.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Pass Threshold"
            type="number"
            value={formData.passThreshold}
            onChange={(e) => handleFormChange('passThreshold', parseFloat(e.target.value) || 0)}
            className={classes.formField}
          />

          <TextField
            fullWidth
            label="Warn Threshold"
            type="number"
            value={formData.warnThreshold}
            onChange={(e) => handleFormChange('warnThreshold', parseFloat(e.target.value) || 0)}
            className={classes.formField}
          />

          <TextField
            fullWidth
            label="Fail Threshold"
            type="number"
            value={formData.failThreshold}
            onChange={(e) => handleFormChange('failThreshold', parseFloat(e.target.value) || 0)}
            className={classes.formField}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            className={classes.formField}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveBenchmark} color="primary" variant="contained">
            {editingBenchmark ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
