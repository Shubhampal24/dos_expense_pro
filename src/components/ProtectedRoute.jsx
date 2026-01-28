import { Navigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/apiServices';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authAPI.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
