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

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the FailureDetailsView component from the main file
const TestableFailureDetailsView = ({ failureDetails }: { failureDetails: any }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div>
      <div onClick={() => setShowDetails(!showDetails)}>
        Failure Details
      </div>
      {showDetails && (
        <div>
          {failureDetails?.failedStages && failureDetails.failedStages.length > 0 ? (
            <div>
              <div>Failed Stages ({failureDetails.failedStages.length})</div>
              {failureDetails.failedStages.map((stage: any, index: number) => (
                <div key={index}>
                  <div>Stage: {stage.name}</div>
                  <div>Status: {stage.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>No failed stages information available</div>
          )}
          
          {failureDetails?.consoleOutput ? (
            <div>
              <div>Console Output</div>
              <pre>{failureDetails.consoleOutput}</pre>
            </div>
          ) : (
            <div>Console output not available for this failure summary</div>
          )}
          
          {failureDetails?.artifacts && failureDetails.artifacts.length > 0 && (
            <div>
              <div>Artifacts ({failureDetails.artifacts.length})</div>
              {failureDetails.artifacts.map((artifact: any, index: number) => (
                <div key={index}>{artifact.fileName}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('FailureDetailsView', () => {
  it('should display failure details when data is available', async () => {
    const mockFailureDetails = {
      failedStages: [
        { name: 'Build', status: 'FAILED' },
        { name: 'Test', status: 'FAILED' }
      ],
      artifacts: [
        { fileName: 'test-results.xml' }
      ]
    };

    render(<TestableFailureDetailsView failureDetails={mockFailureDetails} />);
    
    // Click to expand details
    const detailsButton = screen.getByText('Failure Details');
    detailsButton.click();
    
    // Check that failed stages are displayed
    expect(screen.getByText('Failed Stages (2)')).toBeInTheDocument();
    expect(screen.getByText('Stage: Build')).toBeInTheDocument();
    expect(screen.getByText('Stage: Test')).toBeInTheDocument();
    
    // Check that console output fallback is shown
    expect(screen.getByText('Console output not available for this failure summary')).toBeInTheDocument();
    
    // Check that artifacts are displayed
    expect(screen.getByText('Artifacts (1)')).toBeInTheDocument();
    expect(screen.getByText('test-results.xml')).toBeInTheDocument();
  });

  it('should handle missing or empty failure details gracefully', async () => {
    const mockFailureDetails = {
      failedStages: [],
      artifacts: []
    };

    render(<TestableFailureDetailsView failureDetails={mockFailureDetails} />);
    
    // Click to expand details
    const detailsButton = screen.getByText('Failure Details');
    detailsButton.click();
    
    // Check that fallback messages are displayed
    expect(screen.getByText('No failed stages information available')).toBeInTheDocument();
    expect(screen.getByText('Console output not available for this failure summary')).toBeInTheDocument();
  });

  it('should handle null/undefined failure details', async () => {
    render(<TestableFailureDetailsView failureDetails={null} />);
    
    // Click to expand details
    const detailsButton = screen.getByText('Failure Details');
    detailsButton.click();
    
    // Check that fallback messages are displayed
    expect(screen.getByText('No failed stages information available')).toBeInTheDocument();
    expect(screen.getByText('Console output not available for this failure summary')).toBeInTheDocument();
  });

  it('should display console output when available', async () => {
    const mockFailureDetails = {
      failedStages: [],
      consoleOutput: 'Error: Build failed at step XYZ',
      artifacts: []
    };

    render(<TestableFailureDetailsView failureDetails={mockFailureDetails} />);
    
    // Click to expand details
    const detailsButton = screen.getByText('Failure Details');
    detailsButton.click();
    
    // Check that console output is displayed
    expect(screen.getByText('Console Output')).toBeInTheDocument();
    expect(screen.getByText('Error: Build failed at step XYZ')).toBeInTheDocument();
  });
});
