import React from 'react';
import { Grid } from '@material-ui/core';
import { Page, Header, Content } from '@backstage/core-components';
import { BenchmarkManagementCard } from '../BenchmarkManagementCard/BenchmarkManagementCard';

export const BenchmarkManagementPage: React.FC = () => {
  return (
    <Page themeId="tool">
      <Header 
        title="Benchmark Management" 
        subtitle="Configure compliance standards and targets for source control metrics" 
      />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <BenchmarkManagementCard />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
