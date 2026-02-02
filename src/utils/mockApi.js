// Mock API responses for development/demo purposes
// Replace with actual API calls when backend is ready

const DEMO_USER = {
  id: '1',
  loginId: 'demo123',
  name: 'Demo User',
  role: 'user',
  panelIds: [],
  centres: [
    {
      centreId: 'centre1',
      name: 'Main Centre'
    }
  ]
};

const DEMO_TOKEN = 'demo-jwt-token-12345';

// Mock login function
export const mockLogin = async (credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credentials.loginId === 'demo123' && credentials.pin === '1234') {
        resolve({
          message: 'Login successful',
          token: DEMO_TOKEN,
          user: DEMO_USER,
          role: DEMO_USER.role
        });
      } else {
        reject({ message: 'Invalid login ID or PIN' });
      }
    }, 1000); // Simulate network delay
  });
};

// Mock add expense function
export const mockAddExpense = async (expenseData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!expenseData.title || !expenseData.amount) {
        reject({ message: 'Title and amount are required' });
        return;
      }

      const newExpense = {
        id: Date.now(),
        ...expenseData,
        userId: DEMO_USER.id,
        createdAt: new Date().toISOString()
      };

      // Store in localStorage for demo
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      expenses.push(newExpense);
      localStorage.setItem('expenses', JSON.stringify(expenses));

      resolve(newExpense);
    }, 800);
  });
};

// Mock get expenses function
export const mockGetExpenses = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      resolve(expenses);
    }, 500);
  });
};
