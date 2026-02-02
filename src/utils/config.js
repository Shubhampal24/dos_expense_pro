// API Configuration
export const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.st9.in';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    USER: '/api/auth/user',
    CHANGE_PIN: '/api/auth/change-pin',
    FORGOT_PIN: '/api/auth/forget-pin',
    RESET_PIN: '/api/auth/reset-pin',
    CHECK_EMAIL: '/api/auth/check-email',
    VERIFY_OTP: '/api/auth/verify-otp',
    REGISTER: '/api/auth/register',
    IS_PUBLIC: '/api/auth/is-public'
  },
  // Expense endpoints
  EXPENSES: {
    BASE: '/api/expenses',
    GET_ALL: '/api/expenses',
    CREATE: '/api/expenses',
    UPDATE: '/api/expenses',
    DELETE: '/api/expenses'
  },
  // Advertising Expense endpoints
  AD_EXPENSES: {
    BASE: '/api/adExpenses',
    GET_ALL: '/api/adExpenses',
    CREATE: '/api/adExpenses',
    UPDATE: '/api/adExpenses',
    DELETE: '/api/adExpenses',
    GET_BY_CENTRE: '/api/adExpenses/centre',
    SSE: '/api/adExpense/sse'
  },
  // Bank Account endpoints
  BANK_ACCOUNTS: {
    BASE: '/api/bankAccount',
    GET_ALL: '/api/bankAccount',
    CREATE: '/api/bankAccount',
    UPDATE: '/api/bankAccount',
    DELETE: '/api/bankAccount',
    GET_BY_ID: '/api/bankAccount'
  },
  // Category endpoints
  CATEGORIES: {
    BASE: '/api/categories',
    GET_ALL: '/api/categories',
    CREATE: '/api/categories'
  }
};

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000;

// Development mode flag
export const IS_DEVELOPMENT = import.meta.env.DEV;

// App configuration
export const APP_CONFIG = {
  NAME: 'Expense Tracker',
  VERSION: '1.0.0',
  SUPPORTED_ROLES: ['HEAD', 'ADDHEAD'], // Only BSS users can access the app
};
