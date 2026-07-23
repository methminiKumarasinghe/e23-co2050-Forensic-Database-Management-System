import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Role-based route guard.
 * Redirects to /unauthorized if the logged-in user doesn't have one of the allowed roles.
 *
 * Usage:
 *   <RoleRoute roles={['ADMIN']}>
 *     <AdminDashboard />
 *   </RoleRoute>
 */
const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
