// filepath: src/pages/NotFoundPage/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">404</div>
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-description">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="error-actions">
            <Link to="/" className="btn btn-primary">
              Go to Homepage
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              Go Back
            </button>
          </div>
          
          <div className="helpful-links">
            <h3>Popular Pages</h3>
            <ul className="link-list">
              <li>
                <Link to="/" className="helpful-link">
                  🏠 Homepage
                </Link>
              </li>
              <li>
                <Link to="/about" className="helpful-link">
                  ℹ️ About Us
                </Link>
              </li>
              <li>
                <Link to="/health" className="helpful-link">
                  💚 Health Check
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="error-illustration">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
