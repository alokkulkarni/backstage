// filepath: src/utils/constants.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
  },
  USERS: {
    BASE: '/api/users',
    ME: '/api/users/me',
  },
  HEALTH: '/api/health',
} as const;

export const APP_CONFIG = {
  APP_NAME: '{{ values.component_id | title }}',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  HEALTH: '/health',
  NOT_FOUND: '*',
} as const;

export const QUERY_KEYS = {
  USERS: 'users',
  USER_BY_ID: 'user-by-id',
  CURRENT_USER: 'current-user',
  HEALTH_CHECK: 'health-check',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s]+$/,
    MESSAGE: 'Name must be 2-50 characters and contain only letters and spaces',
  },
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  DEBOUNCE: 300, // 300ms
  TOAST_DURATION: 5000, // 5 seconds
  RETRY_DELAY: 1000, // 1 second
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
