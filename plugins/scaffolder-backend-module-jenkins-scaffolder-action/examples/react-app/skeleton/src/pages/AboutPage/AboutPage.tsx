// filepath: src/pages/AboutPage/AboutPage.tsx
import React from 'react';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <section className="about-hero">
          <h1>About {{ values.component_id | title }}</h1>
          <p className="about-subtitle">
            A comprehensive React application demonstrating modern development practices
            and enterprise-ready patterns.
          </p>
        </section>

        <section className="about-content">
          <div className="content-grid">
            <div className="content-section">
              <h2>🚀 Project Overview</h2>
              <p>
                This application serves as a production-ready template for React applications
                built with TypeScript, Redux Toolkit, and modern development tools. It demonstrates
                best practices for state management, component architecture, testing, and deployment.
              </p>
              
              <h3>Key Features</h3>
              <ul>
                <li>Modern React 18 with functional components and hooks</li>
                <li>TypeScript for type safety and better developer experience</li>
                <li>Redux Toolkit for predictable state management</li>
                <li>RTK Query for efficient API data fetching</li>
                <li>Responsive design with CSS Grid and Flexbox</li>
                <li>Comprehensive testing setup with Jest and React Testing Library</li>
                <li>End-to-end testing with Cypress</li>
                <li>Code quality enforcement with ESLint and Prettier</li>
              </ul>
            </div>

            <div className="content-section">
              <h2>🏗️ Architecture</h2>
              <p>
                The application follows a modular architecture with clear separation of concerns:
              </p>
              
              <div className="architecture-list">
                <div className="arch-item">
                  <strong>Components:</strong> Reusable UI components with TypeScript interfaces
                </div>
                <div className="arch-item">
                  <strong>Pages:</strong> Route-level components that compose the application views
                </div>
                <div className="arch-item">
                  <strong>Store:</strong> Centralized state management with Redux Toolkit slices
                </div>
                <div className="arch-item">
                  <strong>Services:</strong> API integration layer with RTK Query
                </div>
                <div className="arch-item">
                  <strong>Utils:</strong> Shared utilities and helper functions
                </div>
                <div className="arch-item">
                  <strong>Types:</strong> TypeScript definitions for better type safety
                </div>
              </div>
            </div>

            <div className="content-section">
              <h2>🔄 CI/CD Pipeline</h2>
              <p>
                The project includes a comprehensive CI/CD pipeline using Jenkins:
              </p>
              
              <div className="pipeline-stages">
                <div className="stage">
                  <h4>Build Stage</h4>
                  <ul>
                    <li>Dependency installation and caching</li>
                    <li>TypeScript compilation</li>
                    <li>Production build optimization</li>
                    <li>Asset bundling and compression</li>
                  </ul>
                </div>
                
                <div className="stage">
                  <h4>Quality Stage</h4>
                  <ul>
                    <li>Unit tests with Jest</li>
                    <li>Integration tests with React Testing Library</li>
                    <li>End-to-end tests with Cypress</li>
                    <li>Code coverage reporting</li>
                    <li>Linting and formatting checks</li>
                    <li>Security vulnerability scanning</li>
                    <li>SonarQube code quality analysis</li>
                  </ul>
                </div>
                
                <div className="stage">
                  <h4>Release Stage</h4>
                  <ul>
                    <li>Docker image creation</li>
                    <li>Container security scanning</li>
                    <li>Kubernetes deployment</li>
                    <li>Blue-green deployment strategy</li>
                    <li>Health checks and smoke tests</li>
                    <li>Automatic rollback on failure</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h2>🔧 Development Setup</h2>
              <p>
                Getting started with development is straightforward:
              </p>
              
              <div className="setup-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Clone the repository</strong>
                    <code>git clone &lt;repository-url&gt;</code>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Install dependencies</strong>
                    <code>npm install</code>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>Start development server</strong>
                    <code>npm run dev</code>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <strong>Run tests</strong>
                    <code>npm test</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h2>📊 Monitoring & Observability</h2>
              <p>
                The application includes comprehensive monitoring capabilities:
              </p>
              
              <ul>
                <li><strong>Health Checks:</strong> Built-in health endpoints for service monitoring</li>
                <li><strong>Performance Metrics:</strong> Client-side performance tracking</li>
                <li><strong>Error Tracking:</strong> Comprehensive error logging and reporting</li>
                <li><strong>User Analytics:</strong> Usage patterns and user journey tracking</li>
                <li><strong>Infrastructure Monitoring:</strong> Container and Kubernetes metrics</li>
              </ul>
            </div>

            <div className="content-section">
              <h2>🔒 Security</h2>
              <p>
                Security is built into every layer of the application:
              </p>
              
              <ul>
                <li><strong>Authentication:</strong> JWT-based authentication with refresh tokens</li>
                <li><strong>Authorization:</strong> Role-based access control (RBAC)</li>
                <li><strong>Input Validation:</strong> Client and server-side validation</li>
                <li><strong>Dependency Scanning:</strong> Automated vulnerability scanning</li>
                <li><strong>Content Security Policy:</strong> Protection against XSS attacks</li>
                <li><strong>HTTPS Enforcement:</strong> Secure communication protocols</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
