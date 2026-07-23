import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';

// Public pages
import LoginPage            from './pages/LoginPage';
import SignupPage           from './pages/SignupPage';
import PendingApprovalPage  from './pages/PendingApprovalPage';
import UnauthorizedPage     from './pages/UnauthorizedPage';

// Dashboards
import AdminDashboard           from './pages/dashboards/AdminDashboard';
import PoliceDashboard          from './pages/dashboards/PoliceDashboard';
import JMODashboard             from './pages/dashboards/JMODashboard';
import MedicalOfficerDashboard  from './pages/dashboards/MedicalOfficerDashboard';
import LabTechnicianDashboard   from './pages/dashboards/LabTechnicianDashboard';
import GovernmentAnalystDashboard from './pages/dashboards/GovernmentAnalystDashboard';

const ROLE_DASHBOARDS = {
  ADMIN:             '/admin',
  POLICE:            '/dashboard/police',
  JMO:               '/dashboard/jmo',
  MEDICAL_OFFICER:   '/dashboard/medical-officer',
  LAB_TECHNICIAN:    '/dashboard/lab-technician',
  GOVERNMENT_ANALYST:'/dashboard/forensic-staff',
};

/**
 * /dashboard → redirect to role-specific dashboard
 */
const DashboardRedirect = () => {
  const { user } = useAuth();
  const dest = ROLE_DASHBOARDS[user?.role] || '/unauthorized';
  return <Navigate to={dest} replace />;
};

const App = () => (
  <Routes>
    {/* ── Public ─────────────────────────────────── */}
    <Route path="/login"   element={<LoginPage />} />
    <Route path="/signup"  element={<SignupPage />} />
    <Route path="/pending" element={<PendingApprovalPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    {/* ── Root redirect ──────────────────────────── */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* ── Protected ──────────────────────────────── */}
    <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />

    {/* Admin */}
    <Route path="/admin" element={
      <PrivateRoute>
        <RoleRoute roles={['ADMIN']}>
          <AdminDashboard />
        </RoleRoute>
      </PrivateRoute>
    } />

    {/* Police */}
    <Route path="/dashboard/police" element={
      <PrivateRoute>
        <RoleRoute roles={['POLICE']}>
          <PoliceDashboard />
        </RoleRoute>
      </PrivateRoute>
    } />

    {/* JMO */}
    <Route path="/dashboard/jmo" element={
      <PrivateRoute>
        <RoleRoute roles={['JMO']}>
          <JMODashboard />
        </RoleRoute>
      </PrivateRoute>
    } />

    {/* Medical Officer */}
    <Route path="/dashboard/medical-officer" element={
      <PrivateRoute>
        <RoleRoute roles={['MEDICAL_OFFICER']}>
          <MedicalOfficerDashboard />
        </RoleRoute>
      </PrivateRoute>
    } />

    {/* Lab Technician */}
    <Route path="/dashboard/lab-technician" element={
      <PrivateRoute>
        <RoleRoute roles={['LAB_TECHNICIAN']}>
          <LabTechnicianDashboard />
        </RoleRoute>
      </PrivateRoute>
    } />

    {/* Forensic Staff */}
    <Route path="/dashboard/forensic-staff" element={
      <PrivateRoute>
        <RoleRoute roles={['GOVERNMENT_ANALYST']}>
          <GovernmentAnalystDashboard />
        </RoleRoute>
      </PrivateRoute>
    } />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
