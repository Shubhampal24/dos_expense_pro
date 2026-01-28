// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Validate login ID (alphanumeric)
export const isValidLoginId = (loginId) => {
  return loginId && loginId.length >= 1 && loginId.length <= 20;
};

// Validate PIN (numeric)
export const isValidPin = (pin) => {
  return pin && /^\d+$/.test(pin) && pin.length >= 1 && pin.length <= 6;
};

// Generate random ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Local storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // localStorage save failed silently
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// JWT Token decoder
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64url
    const decoded = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

// Get user profile from token
export const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    const decoded = decodeJWT(token);
    if (!decoded) return null;
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

// Format token expiry time
export const formatTokenExpiry = (exp) => {
  if (!exp) return 'Unknown';
  
  const expiryDate = new Date(exp * 1000);
  const now = new Date();
  const timeDiff = expiryDate - now;
  
  if (timeDiff <= 0) return 'Expired';
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

// Get expense categories with colors
export const expenseCategories = [
  { id: 'food', name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
  { id: 'transport', name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
  { id: 'entertainment', name: 'Entertainment', color: '#45B7D1', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', color: '#96CEB4', icon: '🛍️' },
  { id: 'bills', name: 'Bills & Utilities', color: '#FFEAA7', icon: '💡' },
  { id: 'health', name: 'Healthcare', color: '#DDA0DD', icon: '🏥' },
  { id: 'education', name: 'Education', color: '#98D8C8', icon: '📚' },
  { id: 'other', name: 'Other', color: '#F7DC6F', icon: '📝' },
];

// Role-based access control helpers
export const hasAdminRole = (user) => {
  return user && ['HEAD', 'ADDHEAD'].includes(user.role);
};

export const checkUserRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

export const ROLES = {
  HEAD: 'HEAD',
  ADDHEAD: 'ADDHEAD',
  USER: 'USER'
};

export const ADMIN_ROLES = [ROLES.HEAD, ROLES.ADDHEAD];
