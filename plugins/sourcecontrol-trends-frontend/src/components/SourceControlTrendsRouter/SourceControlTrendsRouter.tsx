import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SourceControlDashboardPage, BenchmarkManagementPage } from '../index';

export const SourceControlTrendsRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SourceControlDashboardPage />} />
      <Route path="/benchmarks" element={<BenchmarkManagementPage />} />
    </Routes>
  );
};
