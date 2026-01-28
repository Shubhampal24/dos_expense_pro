import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AddExpense from './components/AddExpense';
import Analysis from './components/Analysis';
import BankAccount from './components/BankAccount';
import Login from './components/Login';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import HeadUserManagement from './components/HeadUserManagement';
import { authAPI } from './utils/apiServices';
import AdminAnalysis from './components/Analysis/AdminAnalysis';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const refreshUserData = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const user = await authAPI.getCurrentUser();
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const user = await authAPI.getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Silent auth check failure
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="font-Plus">
        <Routes>
          {/* Public Route - Login */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/expenses" replace /> : 
                <Login onLogin={(user) => {
                  setCurrentUser(user);
                  setIsAuthenticated(true);
                }} />
            } 
          />
          
          {/* Protected Routes with Navigation */}
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Navigation 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    onUserUpdate={refreshUserData}
                  />
                  <AddExpense 
                    currentUser={currentUser}
                    onUserUpdate={refreshUserData}
                  />
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/bank-accounts" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Navigation 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    onUserUpdate={refreshUserData}
                  />
                  <BankAccount 
                    currentUser={currentUser}
                  />
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/head-user-management" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Navigation 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    onUserUpdate={refreshUserData}
                  />
                  <HeadUserManagement 
                    currentUser={currentUser}
                  />
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/analysis" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Navigation 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    onUserUpdate={refreshUserData}
                  />
                  <Analysis />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-analysis" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Navigation 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    onUserUpdate={refreshUserData}
                  />
                  <AdminAnalysis />
                </div>
              </ProtectedRoute>
            } 
          />
          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;