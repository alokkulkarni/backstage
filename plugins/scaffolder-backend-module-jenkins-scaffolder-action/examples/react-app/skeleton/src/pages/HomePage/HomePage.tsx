// filepath: src/pages/HomePage/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { increment, decrement, reset } from '../../store/slices/counterSlice';
import './HomePage.css';

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { value: count } = useAppSelector((state) => state.counter);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to {{ values.component_id | title }}
          </h1>
          <p className="hero-subtitle">
            A modern React application built with TypeScript, Redux Toolkit, and best practices
          </p>
          
          {isAuthenticated ? (
            <div className="authenticated-welcome">
              <h2>Hello, {user?.name}! 👋</h2>
              <p>You're successfully authenticated and ready to explore the application.</p>
            </div>
          ) : (
            <div className="auth-prompt">
              <p>Get started by creating an account or signing in</p>
              <div className="auth-buttons">
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-content">
          <h2>Interactive Counter Demo</h2>
          <p>This demo showcases Redux state management in action</p>
          
          <div className="counter-widget">
            <div className="counter-display">
              <span className="counter-value">{count}</span>
            </div>
            
            <div className="counter-controls">
              <button 
                onClick={() => dispatch(decrement())}
                className="btn btn-secondary"
              >
                -
              </button>
              <button 
                onClick={() => dispatch(reset())}
                className="btn btn-outline"
              >
                Reset
              </button>
              <button 
                onClick={() => dispatch(increment())}
                className="btn btn-primary"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-content">
          <h2>Application Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Modern</h3>
              <p>Built with React 18, TypeScript, and Vite for lightning-fast development and performance</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>State Management</h3>
              <p>Redux Toolkit with RTK Query for efficient state management and API interactions</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Modern UI</h3>
              <p>Responsive design with CSS Grid, Flexbox, and modern styling techniques</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>JWT authentication, role-based access control, and security best practices</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Production Ready</h3>
              <p>Complete CI/CD pipeline with testing, security scanning, and automated deployment</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Monitoring</h3>
              <p>Health checks, performance monitoring, and comprehensive logging</p>
            </div>
          </div>
        </div>
      </section>

      <section className="tech-stack-section">
        <div className="tech-stack-content">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Frontend:</strong> React 18, TypeScript, Redux Toolkit
            </div>
            <div className="tech-item">
              <strong>Styling:</strong> CSS3, CSS Grid, Flexbox
            </div>
            <div className="tech-item">
              <strong>Build Tool:</strong> Vite
            </div>
            <div className="tech-item">
              <strong>Testing:</strong> Jest, React Testing Library, Cypress
            </div>
            <div className="tech-item">
              <strong>Quality:</strong> ESLint, Prettier, SonarQube
            </div>
            <div className="tech-item">
              <strong>CI/CD:</strong> Jenkins, Docker, Kubernetes
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
