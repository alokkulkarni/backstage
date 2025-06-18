// filepath: src/components/Header/Header.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import Header from './Header';
import authReducer from '../../store/slices/authSlice';
import counterReducer from '../../store/slices/counterSlice';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      counter: counterReducer,
    },
    preloadedState: initialState,
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store 
}) => {
  const testStore = store || createMockStore();
  
  return (
    <Provider store={testStore}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('Header Component', () => {
  it('renders the application title', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows navigation links', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });

  it('shows login and signup buttons when not authenticated', () => {
    const store = createMockStore({
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      },
    });

    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows user menu and logout button when authenticated', () => {
    const store = createMockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        },
        token: 'fake-token',
        loading: false,
        error: null,
      },
    });

    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByText(/welcome, john doe!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('handles logout button click', () => {
    const store = createMockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        },
        token: 'fake-token',
        loading: false,
        error: null,
      },
    });

    render(
      <TestWrapper store={store}>
        <Header />
      </TestWrapper>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Check if logout action was dispatched
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  it('is accessible', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
  });

  it('has responsive design elements', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    const headerContainer = document.querySelector('.header-container');
    expect(headerContainer).toHaveClass('header-container');
  });
});
