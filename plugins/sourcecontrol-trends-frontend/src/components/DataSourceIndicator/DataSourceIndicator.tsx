import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, Tooltip } from '@material-ui/core';
import { useSourceControlTrendsApi } from '../../hooks';

const useStyles = makeStyles(theme => ({
  mockChip: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
    fontWeight: 'bold',
    '& .MuiChip-icon': {
      color: theme.palette.warning.contrastText,
    },
  },
  realChip: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
    fontWeight: 'bold',
    '& .MuiChip-icon': {
      color: theme.palette.success.contrastText,
    },
  },
}));

export const DataSourceIndicator: React.FC = () => {
  const classes = useStyles();
  const api = useSourceControlTrendsApi();
  const [dataSourceInfo, setDataSourceInfo] = useState<{ useMockData: boolean; dataSource: string } | null>(null);

  useEffect(() => {
    const fetchDataSourceInfo = async () => {
      try {
        const info = await api.getDataSourceInfo();
        setDataSourceInfo(info);
      } catch (error) {
        console.error('Failed to fetch data source info:', error);
      }
    };

    fetchDataSourceInfo();
  }, [api]);

  if (!dataSourceInfo) {
    return null;
  }

  const isMock = dataSourceInfo.useMockData;
  const chipClass = isMock ? classes.mockChip : classes.realChip;
  const label = isMock ? 'MOCK DATA' : 'LIVE DATA';
  const tooltipText = isMock 
    ? 'Currently displaying mock data for demonstration purposes. Configure GitHub integration to use real data.'
    : 'Currently displaying live data from GitHub repositories.';

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        size="small"
        label={label}
        className={chipClass}
      />
    </Tooltip>
  );
};
