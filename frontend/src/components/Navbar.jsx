import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  ADMIN:             'Administrator',
  POLICE:            'Police Officer',
  JMO:               'Judicial Medical Officer',
  MEDICAL_OFFICER:   'Medical Officer',
  LAB_TECHNICIAN:    'Lab Technician',
  GOVERNMENT_ANALYST:'Hospital Staff',
};

const ROLE_COLORS = {
  ADMIN:             'text-purple-400',
  POLICE:            'text-blue-400',
  JMO:               'text-cyan-400',
  MEDICAL_OFFICER:   'text-emerald-400',
  LAB_TECHNICIAN:    'text-amber-400',
  GOVERNMENT_ANALYST:'text-rose-400',
};

const ShieldIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-gray-800">
      <div className="max-w-screen-2xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="p-1.5 rounded-lg bg-primary-600/20 text-primary-400 group-hover:bg-primary-600/30 transition-colors">
            <ShieldIcon />
          </div>
          <div className="leading-none">
            <div className="font-bold text-white text-sm tracking-wide">FMIS</div>
            <div className="text-xs text-gray-500">Forensic Medical System</div>
          </div>
        </Link>

        {/* Right side */}
        {user && (
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-sm font-medium text-white">{user.username}</span>
              <span className={`text-xs font-medium ${ROLE_COLORS[user.role] || 'text-gray-400'}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary-600/30 border border-primary-700/50 flex items-center justify-center">
              <span className="text-primary-300 font-bold text-sm">
                {user.username?.[0]?.toUpperCase()}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
