// filepath: src/components/HealthCheck/HealthCheck.tsx
import React, { useState, useEffect } from 'react';
import './HealthCheck.css';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'loading';
  timestamp: string;
  services: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

const HealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'loading',
    timestamp: new Date().toISOString(),
    services: {},
  });

  const checkHealth = async () => {
    setHealthStatus(prev => ({ ...prev, status: 'loading' }));
    
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setHealthStatus({
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: data.services || {},
      });
    } catch (error) {
      setHealthStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          api: {
            status: 'down',
            error: 'Connection failed',
          },
        },
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return '#10b981';
      case 'unhealthy':
      case 'down':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  return (
    <div className="health-check">
      <div className="health-check-header">
        <h2>System Health Check</h2>
        <button 
          onClick={checkHealth}
          className="refresh-btn"
          disabled={healthStatus.status === 'loading'}
        >
          {healthStatus.status === 'loading' ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="health-status-card">
        <div className="status-indicator">
          <div 
            className={`status-dot ${healthStatus.status}`}
            style={{ backgroundColor: getStatusColor(healthStatus.status) }}
          />
          <span className="status-text">
            System Status: {healthStatus.status.toUpperCase()}
          </span>
        </div>
        <div className="timestamp">
          Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
        </div>
      </div>

      <div className="services-grid">
        {Object.entries(healthStatus.services).map(([serviceName, service]) => (
          <div key={serviceName} className="service-card">
            <div className="service-header">
              <h3>{serviceName}</h3>
              <div 
                className={`service-status ${service.status}`}
                style={{ backgroundColor: getStatusColor(service.status) }}
              >
                {service.status.toUpperCase()}
              </div>
            </div>
            <div className="service-details">
              {service.responseTime && (
                <p>Response Time: {service.responseTime}ms</p>
              )}
              {service.error && (
                <p className="error-message">Error: {service.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="health-info">
        <h3>About Health Checks</h3>
        <p>
          This endpoint monitors the health of various application services and dependencies.
          It's used by load balancers, monitoring systems, and orchestration platforms to
          determine if the application is ready to serve traffic.
        </p>
        <ul>
          <li><strong>Healthy:</strong> All services are operational</li>
          <li><strong>Unhealthy:</strong> One or more services are experiencing issues</li>
          <li><strong>Loading:</strong> Health check in progress</li>
        </ul>
      </div>
    </div>
  );
};

export default HealthCheck;
