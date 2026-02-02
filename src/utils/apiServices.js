import { API_ENDPOINTS, API_URL, DEFAULT_HEADERS } from './config';
import { getUserFromToken } from './helpers';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...DEFAULT_HEADERS,
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!response.ok) {
    // Handle 401 errors by redirecting to login
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  
  return data;
};

// Auth API calls
export const authAPI = {
  login: async (credentials) => {
    try {
      const url = `${API_URL}${API_ENDPOINTS.AUTH.LOGIN}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          loginId: credentials.loginId,
          pin: credentials.pin
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return {
        ...data,
        user: data.user
      };
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    try {
      // Remove all auth-related items from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('expenses');
      
      // Clear any other app-specific data if needed
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('auth') || key.startsWith('user') || key.startsWith('expense'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      // Force clear localStorage as fallback
      try {
        localStorage.clear();
      } catch (clearError) {
        // Silent fail
      }
      return false;
    }
  },

  getCurrentUser: () => {
    // First try to get user from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    
    // If no user in localStorage, try to get from token
    const tokenUser = getUserFromToken();
    if (tokenUser) {
      // Save to localStorage for future use
      localStorage.setItem('user', JSON.stringify(tokenUser));
      return tokenUser;
    }
    
    return null;
  },

  // Get enhanced user details including token information
  getEnhancedUserDetails: () => {
    const localUser = localStorage.getItem('user');
    const tokenUser = getUserFromToken();
    
    return {
      localStorageUser: localUser ? JSON.parse(localUser) : null,
      tokenUser: tokenUser,
      token: localStorage.getItem('authToken'),
      isTokenValid: !!tokenUser
    };
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Get user details from API (using the correct endpoint)
  fetchUserDetails: async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      // Get user ID from token or localStorage
      const currentUser = authAPI.getCurrentUser();
      const tokenUser = getUserFromToken();
      
      // Try multiple possible ID field names
      const userId = currentUser?.id || currentUser?.id || 
                    tokenUser?.id || tokenUser?.userId || tokenUser?.id ||
                    currentUser?.userId;
      
      if (!userId) throw new Error('No user ID found in any format');
      
      // Use the correct users endpoint
      const url = `${API_URL}/api/auth/${userId}`;
      
      const data = await makeAuthenticatedRequest(url);
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get detailed user data by ID including centres and expenses
  fetchUserById: async (userId) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      const url = `${API_URL}/api/auth/${userId}`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user's detailed data including centres and expenses
  fetchCurrentUserDetails: async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      // First get current user to get the ID
      const currentUser = authAPI.getCurrentUser();
      const tokenUser = getUserFromToken();
      
      const userId = currentUser?.id || tokenUser?.userId || tokenUser?.id;
      if (!userId) throw new Error('No user ID found');
      
      // Then fetch detailed user data
      return await authAPI.fetchUserById(userId);
    } catch (error) {
      throw error;
    }
  },

  // Change PIN API
  changePin: async (currentPin, newPin) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      const url = `${API_URL}/api/auth/change-pin`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ currentPin, newPin }),
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Forgot PIN API
  forgotPin: async (email) => {
    try {
      const url = `${API_URL}/api/auth/forget-pin`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Reset PIN API
  resetPin: async (email, otp, newPin) => {
    try {
      const url = `${API_URL}/api/auth/reset-pin`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset PIN');
      return data;
    } catch (error) {
      throw error;
    }
  }
};

// Advertising Expense API calls
export const adExpenseAPI = {
  getAdExpenses: async () => {
    try {
      const url = `${API_URL}/api/adexpenses/`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getAdExpenseById: async (id) => {
  try {
    const url = `${API_URL}/api/adexpenses/${id}`;
    const data = await makeAuthenticatedRequest(url);
    return data;
  } catch (error) {
    throw error;
  }
},


  getAdExpensesByUserId: async (userId) => {
    try {
      const url = `${API_URL}/api/adexpenses/user/${userId}`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  addAdExpense: async (expenseData) => {
    try {
      const url = `${API_URL}/api/adexpenses/`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateAdExpense: async (id, expenseData) => {
    try {
      const url = `${API_URL}/api/adexpenses/${id}`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(expenseData),
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  deleteAdExpense: async (id) => {
    try {
      const url = `${API_URL}/api/adexpenses/${id}`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Import expenses from Excel file
  importFromExcel: async (file) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const formData = new FormData();
      formData.append('file', file);

      const url = `${API_URL}/api/adexpenses/import/excel`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Import failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  getAnalysis: async (type) => {
    try {
      const url = `${API_URL}/api/adexpenses/analysis?type=${type}`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getAllCentresAnalysis: async () => {
    try {
      const url = `${API_URL}/api/adexpenses/all-centres`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // User Analysis by Time - Get user expense analysis grouped by time units
  getUserAnalysisByTime: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.unit) queryParams.append('unit', params.unit); // 'month', 'week', 'quarter', 'year'
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/api/adexpenses/analysis-user-time${queryString ? `?${queryString}` : ''}`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // HEAD Users Analysis by Time - Get HEAD users expense analysis grouped by time units
  getHeadUsersAnalysisByTime: async (params = {}) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const queryParams = new URLSearchParams();
      
      // Time unit for grouping
      if (params.unit) queryParams.append('unit', params.unit); // 'day', 'week', 'month', 'quarter', 'year'
      
      // Date filtering parameters based on backend API structure
      if (params.selectedDate) {
        queryParams.append('selectedDate', params.selectedDate); // YYYY-MM-DD format
      }
      
      if (params.selectedMonth !== undefined && params.selectedYear !== undefined) {
        queryParams.append('selectedMonth', params.selectedMonth); // Number 1-12
        queryParams.append('selectedYear', params.selectedYear); // Number YYYY
      }
      
      if (params.selectedQuarter !== undefined && params.selectedYear !== undefined) {
        queryParams.append('selectedQuarter', params.selectedQuarter); // Number 1-4
        queryParams.append('selectedYear', params.selectedYear); // Number YYYY
      }
      
      if (params.selectedYear !== undefined && params.selectedMonth === undefined && params.selectedQuarter === undefined) {
        queryParams.append('selectedYear', params.selectedYear); // Number YYYY
      }
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/api/adexpenses/head-analysis${queryString ? `?${queryString}` : ''}`;
      
      const data = await makeAuthenticatedRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return data;
    } catch (error) {
      // Provide more specific error messages
      if (error.message.includes('Server error') || error.message.includes('500')) {
        throw new Error('Backend server error: The HEAD time analysis endpoint may have missing dependencies. Please check server logs.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.message.includes('404')) {
        throw new Error('HEAD time analysis endpoint not found. Please check the API route configuration.');
      } else {
        throw new Error(`Failed to fetch HEAD users time analysis: ${error.message}`);
      }
    }
  },

  // HEAD Dashboard - Get comprehensive HEAD users analysis with table data
  getHeadDashboard: async (params = {}) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const queryParams = new URLSearchParams();
      
      // Date filtering parameters based on backend API structure
      if (params.selectedDate) {
        queryParams.append('selectedDate', params.selectedDate); // YYYY-MM-DD format
      }
      
      if (params.selectedMonth !== undefined && params.selectedYear !== undefined) {
        queryParams.append('selectedMonth', params.selectedMonth); // Number 1-12
        queryParams.append('selectedYear', params.selectedYear); // Number YYYY
      }
      
      if (params.selectedQuarter !== undefined && params.selectedYear !== undefined) {
        queryParams.append('selectedQuarter', params.selectedQuarter); // Number 1-4
        queryParams.append('selectedYear', params.selectedYear); // Number YYYY
      }
      
      if (params.selectedYear !== undefined && params.selectedMonth === undefined && params.selectedQuarter === undefined) {
        queryParams.append('selectedYear', params.selectedYear); // Number YYYY
      }
      
      // Explicit date range (takes precedence when provided)
      if (params.startDate && params.endDate) {
        queryParams.append('startDate', params.startDate); // YYYY-MM-DD
        queryParams.append('endDate', params.endDate); // YYYY-MM-DD
      }
      
      // Pagination parameters
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.page) queryParams.append('page', params.page);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/api/adexpenses/head-dashboard${queryString ? `?${queryString}` : ''}`;
      
      const data = await makeAuthenticatedRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return data;
    } catch (error) {
      // Provide more specific error messages
      if (error.message.includes('Server error') || error.message.includes('500')) {
        throw new Error('Backend server error: The HEAD dashboard endpoint may have missing dependencies. Please check server logs.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.message.includes('404')) {
        throw new Error('HEAD dashboard endpoint not found. Please check the API route configuration.');
      } else if (error.message.includes('Invalid date filters')) {
        throw new Error('Invalid date filter format. Please check your date selections.');
      } else {
        throw new Error(`Failed to fetch HEAD dashboard: ${error.message}`);
      }
    }
  }
};

// Location/Geography API calls
export const locationAPI = {
  // Get all regions
  getRegions: async () => {
    try {
      const url = `${API_URL}/api/regions`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get all branches
  getBranches: async () => {
    try {
      const url = `${API_URL}/api/branches`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get branches by region
  getBranchesByRegion: async (regionId) => {
    try {
      const url = `${API_URL}/api/branches/region/${regionId}`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get all centres
  getCentres: async () => {
    try {
      const url = `${API_URL}/api/centres`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get centres by branch
  getCentresByBranch: async (branchId) => {
    try {
      const url = `${API_URL}/api/centres/branch/${branchId}`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get centres with full details (regions, branches included)
  getCentresWithDetails: async () => {
    try {
      const url = `${API_URL}/api/centres/full`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  }
};

// Categories API calls
export const categoryAPI = {
  getCategories: async () => {
    try {
      const url = `${API_URL}/api/categories`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  },

  addCategory: async (categoryData) => {
    try {
      const url = `${API_URL}/api/categories`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export const userAPI = {
  checkEmailOrMobile: async (identifier) => {
    try {
      const url = `${API_URL}/api/auth/check-email`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: identifier }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP
  verifyOtp: async (identifier, otp) => {
    try {
      const url = `${API_URL}/api/auth/verify-otp`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  registerUser: async (userData) => {
    try {
      const url = `${API_URL}/api/auth/register`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update user details
  updateUserDeails: async (userData) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      // Get user ID from token or localStorage
      const currentUser = authAPI.getCurrentUser();
      const tokenUser = getUserFromToken();
      
      const userId = currentUser?.id || tokenUser?.userId || tokenUser?.id;
      if (!userId) throw new Error('No user ID found');
      
      const url = `${API_URL}/api/auth/${userId}`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's public/private status
  getIsPublic: async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      // Get user ID from token or localStorage
      const currentUser = authAPI.getCurrentUser();
      const tokenUser = getUserFromToken();
      
      const userId = currentUser?.id || tokenUser?.userId || tokenUser?.id;
      if (!userId) throw new Error('No user ID found');
      
      const url = `${API_URL}/api/auth/${userId}`;
      const data = await makeAuthenticatedRequest(url);
      return data?.isPublic;
    } catch (error) {
      throw error;
    }
  },

  // Update user's public visibility
  updateIsPublic: async (isPublic) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No token found');
      
      const url = `${API_URL}/api/auth/is-public`;
      const data = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ isPublic }),
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const url = `${API_URL}/api/auth`;
      const data = await makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      throw error;
    }
  }
};

// Bank Account API calls
export const bankAccountAPI = {
  // Get all bank accounts
  getAllBankAccounts: async () => {
    try {
      const url = `${API_URL}/api/bank-accounts/`;
      const result = await makeAuthenticatedRequest(url);
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single bank account by ID
  getBankAccountById: async (id) => {
    try {
      const url = `${API_URL}/api/bank-accounts/${id}`;
      const result = await makeAuthenticatedRequest(url);
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Add a new bank account
  addBankAccount: async (accountData) => {
    try {
      const url = `${API_URL}/api/bank-accounts/`;
      const result = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(accountData),
      });
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a bank account
  updateBankAccount: async (id, accountData) => {
    try {
      const url = `${API_URL}/api/bank-accounts/${id}`;
      const result = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(accountData),
      });
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a bank account
  deleteBankAccount: async (id) => {
    try {
      const url = `${API_URL}/api/bank-accounts/${id}`;
      const result = await makeAuthenticatedRequest(url, {
        method: 'DELETE',
      });
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Get bank accounts by user ID
  getBankAccountsByUser: async (userId) => {
    try {
      const url = `${API_URL}/api/bank-accounts/user/${userId}`;
      const result = await makeAuthenticatedRequest(url);
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Get analysis for all bank accounts
  getAllBankAccountsAnalysis: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }

      const url = `${API_URL}/api/bank-accounts/analysis${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await makeAuthenticatedRequest(url);
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Get analysis for a specific bank account
  getBankAccountAnalysisById: async (id, filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const url = `${API_URL}/api/bank-accounts/analysis/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const result = await makeAuthenticatedRequest(url);
      return result.data;
    } catch (error) {
      throw error;
    }
  }
};
