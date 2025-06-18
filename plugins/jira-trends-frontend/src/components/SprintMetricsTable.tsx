import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Search, Visibility } from '@material-ui/icons';
import { SprintMetrics } from '../types/index';

const useStyles = makeStyles((theme) => ({
  card: {
    height: '100%',
  },
  searchField: {
    marginBottom: theme.spacing(2),
    maxWidth: 300,
  },
  tableContainer: {
    maxHeight: 600,
  },
  metricCell: {
    textAlign: 'right',
  },
  statusChip: {
    minWidth: 60,
  },
  actionButton: {
    padding: theme.spacing(0.5),
  },
  sprintNameBold: {
    fontWeight: 'bold',
  },
  sprintDateSecondary: {
    fontSize: '0.875rem',
    color: 'gray',
  },
  churnRateHigh: {
    color: 'red',
  },
  defectRateHigh: {
    color: 'red',
  },
}));

interface SprintMetricsTableProps {
  metrics: SprintMetrics[];
  loading?: boolean;
  onViewDetails?: (metric: SprintMetrics) => void;
}

export const SprintMetricsTable: React.FC<SprintMetricsTableProps> = ({
  metrics,
  loading = false,
  onViewDetails,
}) => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <Card className={classes.card}>
        <CardHeader title="Sprint Metrics" />
        <CardContent>
          <div>Loading metrics table...</div>
        </CardContent>
      </Card>
    );
  }

  // Filter metrics based on search term
  const filteredMetrics = metrics.filter(metric =>
    metric.sprintName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by start date (most recent first)
  const sortedMetrics = [...filteredMetrics].sort(
    (a, b) => new Date(b.sprintStartDate || '').getTime() - new Date(a.sprintStartDate || '').getTime()
  );

  // Paginate the data
  const paginatedMetrics = sortedMetrics.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCompletionStatus = (ratio: number) => {
    if (ratio >= 0.9) {
      return { label: 'Excellent', color: 'primary' as const };
    } else if (ratio >= 0.7) {
      return { label: 'Good', color: 'secondary' as const };
    } else if (ratio >= 0.5) {
      return { label: 'Fair', color: 'default' as const };
    } else {
      return { label: 'Poor', color: 'default' as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals);
  };

  return (
    <Card className={classes.card}>
      <CardHeader 
        title="Sprint Metrics" 
        subheader={`${filteredMetrics.length} sprints`}
      />
      <CardContent>
        <TextField
          className={classes.searchField}
          variant="outlined"
          size="small"
          placeholder="Search by sprint or team name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer className={classes.tableContainer}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sprint</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell className={classes.metricCell}>Velocity</TableCell>
                <TableCell className={classes.metricCell}>Completion</TableCell>
                <TableCell className={classes.metricCell}>Churn Rate</TableCell>
                <TableCell className={classes.metricCell}>Cycle Time</TableCell>
                <TableCell className={classes.metricCell}>Team Stability</TableCell>
                <TableCell className={classes.metricCell}>Defect Rate</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMetrics.map((metric, index) => {
                const completionStatus = getCompletionStatus(metric.completionRatio);
                
                return (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <div className={classes.sprintNameBold}>{metric.sprintName}</div>
                        <div className={classes.sprintDateSecondary}>
                          {formatDate(metric.sprintStartDate || '')} - {formatDate(metric.sprintEndDate || '')}
                        </div>
                      </Box>
                    </TableCell>
                    
                    <TableCell>Board {metric.boardId}</TableCell>
                    
                    <TableCell>
                      {Math.ceil(
                        (new Date(metric.sprintEndDate || '').getTime() - new Date(metric.sprintStartDate || '').getTime()) / 
                        (1000 * 60 * 60 * 24)
                      )} days
                    </TableCell>
                    
                    <TableCell className={classes.metricCell}>
                      {formatNumber(metric.velocity, 0)}
                    </TableCell>
                    
                    <TableCell className={classes.metricCell}>
                      <Chip
                        size="small"
                        label={formatPercentage(metric.completionRatio)}
                        color={completionStatus.color}
                        className={classes.statusChip}
                      />
                    </TableCell>
                    
                    <TableCell className={classes.metricCell}>
                      <span className={metric.churnRate > 0.2 ? classes.churnRateHigh : ''}>
                        {formatPercentage(metric.churnRate)}
                      </span>
                    </TableCell>
                    
                    <TableCell className={classes.metricCell}>
                      {formatNumber(metric.avgCycleTime, 1)}d
                    </TableCell>
                    
                    <TableCell className={classes.metricCell}>
                      {formatPercentage(metric.teamStability)}
                    </TableCell>
                    
                    <TableCell className={classes.metricCell}>
                      <span className={metric.defectRate > 0.1 ? classes.defectRateHigh : ''}>
                        {formatPercentage(metric.defectRate)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      {onViewDetails && (
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            className={classes.actionButton}
                            onClick={() => onViewDetails(metric)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredMetrics.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
};
