import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const NAV_ITEMS = [
  { id: 'overview',      label: 'Admin Home',         icon: '🏠' },
  { id: 'users',         label: 'User Directory',      icon: '👥' },
  { id: 'hospitals',     label: 'Hospitals',          icon: '🏥' },
  { id: 'departments',   label: 'Departments',        icon: '🏢' },
  { id: 'stations',      label: 'Police Stations',     icon: '🚔' },
  { id: 'cases',         label: 'Open Cases',          icon: '📂' },
  { id: 'reports',       label: 'Reports Ledger',      icon: '📄' },
  { id: 'lab_requests',  label: 'Lab Requests',       icon: '🧪' },
  { id: 'audit_logs',    label: 'System Audits',       icon: '📜' },
  { id: 'notifications', label: 'Notifications',       icon: '🔔' },
];

const ROLE_LABELS = {
  ADMIN:             'Administrator',
  POLICE:            'Police Officer',
  JMO:               'Judicial Medical Officer',
  MEDICAL_OFFICER:   'Medical Officer',
  LAB_TECHNICIAN:    'Lab Technician',
  GOVERNMENT_ANALYST:'Forensic Staff',
};

const HOSPITAL_ROLES = ['JMO', 'MEDICAL_OFFICER', 'LAB_TECHNICIAN', 'GOVERNMENT_ANALYST'];
const STATION_ROLES  = ['POLICE'];

const StatusBadge = ({ status }) => {
  const cls = {
    ACTIVE:    'badge-active',
    INACTIVE:  'badge-pending',
    SUSPENDED: 'badge-suspended',
  }[status] || 'badge';
  const label = status === 'INACTIVE' ? 'PENDING' : status;
  return <span className={cls}>{label}</span>;
};

const RoleBadge = ({ role }) => {
  const colors = {
    ADMIN:             'bg-purple-900/50 text-purple-300 border-purple-700/50',
    POLICE:            'bg-blue-900/50 text-blue-300 border-blue-700/50',
    JMO:               'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
    MEDICAL_OFFICER:   'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
    LAB_TECHNICIAN:    'bg-amber-900/50 text-amber-300 border-amber-700/50',
    GOVERNMENT_ANALYST:'bg-rose-900/50 text-rose-300 border-rose-700/50',
  };
  return (
    <span className={`badge border ${colors[role] || 'bg-gray-800 text-gray-400'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
};

const StatCard = ({ value, label, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`stat-card border-l-4 ${color} text-left w-full hover:bg-gray-800/40 hover:-translate-y-0.5 transition-all duration-200`}
  >
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value !== null ? value : '—'}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  </button>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Directory Data States
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({ search: '', role: '', status: '' });

  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsSearch, setHospitalsSearch] = useState('');

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsSearch, setDepartmentsSearch] = useState('');

  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsSearch, setStationsSearch] = useState('');

  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesSearch, setCasesSearch] = useState('');

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsSearch, setReportsSearch] = useState('');

  const [labRequests, setLabRequests] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labSearch, setLabSearch] = useState('');

  // Audits / Notifications States
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsTotal, setAuditsTotal] = useState(0);
  const [auditsPage, setAuditsPage] = useState(1);
  const [auditsSearch, setAuditsSearch] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const [notificationsPage, setNotificationsPage] = useState(1);

  // Modals & User Actions
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ userId: null, action: '', title: '', message: '' });
  const [actionId, setActionId] = useState(null);
  const [resetPassForm, setResetPassForm] = useState({ password: '', confirmPassword: '', error: '', success: false });

  // Creation Modals
  const [isAddHospitalModalOpen, setIsAddHospitalModalOpen] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({ hospital_name: '', hospital_type: 'Teaching Hospital', district: '', telephone: '', email: '', address: '', error: '', loading: false });

  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);
  const [departmentForm, setDepartmentForm] = useState({ hospital_id: '', department_name: '', description: '', error: '', loading: false });

  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [stationForm, setStationForm] = useState({ station_name: '', district: '', telephone: '', email: '', address: '', error: '', loading: false });

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '', password: '', email: '', phone: '', role: 'POLICE',
    first_name: '', last_name: '', nic: '', gender: 'Male', date_of_birth: '', telephone: '', address: '',
    hospital_id: '', station_id: '', badge_number: '', rank: '', registration_number: '', specialization: '', employee_number: '', qualification: '', organization_name: '', designation: '',
    error: '', loading: false
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── FETCH OVERVIEW STATS ──────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to fetch overview stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── LAZY FETCH LISTS (ON DEMAND FOR SPEED) ─────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { role, status } = userFilters;
      let url = '/admin/users';
      const params = [];
      if (role) params.push(`role=${role}`);
      if (status) params.push(`status=${status}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await api.get(url);
      setUsers(res.data.data);
    } catch {
      showToast('Failed to fetch users directory', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [userFilters]);

  const fetchHospitals = useCallback(async () => {
    setHospitalsLoading(true);
    try {
      const res = await api.get('/admin/hospitals');
      setHospitals(res.data.data);
    } catch {
      showToast('Failed to fetch hospital records', 'error');
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data);
    } catch {
      showToast('Failed to fetch department records', 'error');
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  const fetchStations = useCallback(async () => {
    setStationsLoading(true);
    try {
      const res = await api.get('/admin/stations');
      setStations(res.data.data);
    } catch {
      showToast('Failed to fetch station records', 'error');
    } finally {
      setStationsLoading(false);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const res = await api.get('/admin/cases');
      setCases(res.data.data);
    } catch {
      showToast('Failed to fetch case list', 'error');
    } finally {
      setCasesLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data.data);
    } catch {
      showToast('Failed to fetch reports ledger', 'error');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchLabRequests = useCallback(async () => {
    setLabLoading(true);
    try {
      const res = await api.get('/admin/lab-requests');
      setLabRequests(res.data.data);
    } catch {
      showToast('Failed to fetch lab request ledger', 'error');
    } finally {
      setLabLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditsLoading(true);
    try {
      const limit = 15;
      const offset = (auditsPage - 1) * limit;
      const res = await api.get(`/admin/audit-logs?limit=${limit}&offset=${offset}&search=${auditsSearch}`);
      setAuditLogs(res.data.data);
      setAuditsTotal(res.data.meta.total);
    } catch {
      showToast('Failed to fetch audit ledger', 'error');
    } finally {
      setAuditsLoading(false);
    }
  }, [auditsPage, auditsSearch]);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const limit = 15;
      const offset = (notificationsPage - 1) * limit;
      const res = await api.get(`/admin/notifications?limit=${limit}&offset=${offset}`);
      setNotifications(res.data.data);
      setNotificationsTotal(res.data.meta.total);
    } catch {
      showToast('Failed to fetch alerts log', 'error');
    } finally {
      setNotificationsLoading(false);
    }
  }, [notificationsPage]);

  // Load only active tab data to ensure fast, seamless navigation
  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'hospitals') fetchHospitals();
    if (activeTab === 'departments') fetchDepartments();
    if (activeTab === 'stations') fetchStations();
    if (activeTab === 'cases') fetchCases();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'lab_requests') fetchLabRequests();
    if (activeTab === 'audit_logs') fetchAuditLogs();
    if (activeTab === 'notifications') fetchNotifications();
  }, [
    activeTab,
    fetchStats,
    fetchUsers,
    fetchHospitals,
    fetchDepartments,
    fetchStations,
    fetchCases,
    fetchReports,
    fetchLabRequests,
    fetchAuditLogs,
    fetchNotifications,
  ]);

  // Load dropdown lists when opening Add User modal
  useEffect(() => {
    if (isAddUserModalOpen) {
      fetchHospitals();
      fetchStations();
      fetchDepartments();
    }
  }, [isAddUserModalOpen, fetchHospitals, fetchStations, fetchDepartments]);

  // ── CREATION HANDLERS (UPDATES POSTGRES DIRECTLY) ─────────────────────────
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!departmentForm.hospital_id || !departmentForm.department_name.trim()) {
      setDepartmentForm(f => ({ ...f, error: 'Hospital and Department Name are required' }));
      return;
    }
    setDepartmentForm(f => ({ ...f, loading: true, error: '' }));
    try {
      await api.post('/admin/departments', departmentForm);
      showToast('Department created successfully in database');
      setIsAddDepartmentModalOpen(false);
      setDepartmentForm({ hospital_id: '', department_name: '', description: '', error: '', loading: false });
      fetchDepartments();
    } catch (err) {
      setDepartmentForm(f => ({ ...f, error: err.response?.data?.message || 'Failed to create department', loading: false }));
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    if (!hospitalForm.hospital_name.trim()) {
      setHospitalForm(f => ({ ...f, error: 'Hospital name is required' }));
      return;
    }
    setHospitalForm(f => ({ ...f, loading: true, error: '' }));
    try {
      await api.post('/admin/hospitals', hospitalForm);
      showToast('Hospital created successfully in database');
      setIsAddHospitalModalOpen(false);
      setHospitalForm({ hospital_name: '', hospital_type: 'Teaching Hospital', district: '', telephone: '', email: '', address: '', error: '', loading: false });
      fetchHospitals();
      fetchStats();
    } catch (err) {
      setHospitalForm(f => ({ ...f, error: err.response?.data?.message || 'Failed to create hospital', loading: false }));
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!stationForm.station_name.trim()) {
      setStationForm(f => ({ ...f, error: 'Station name is required' }));
      return;
    }
    setStationForm(f => ({ ...f, loading: true, error: '' }));
    try {
      await api.post('/admin/stations', stationForm);
      showToast('Police Station created successfully in database');
      setIsAddStationModalOpen(false);
      setStationForm({ station_name: '', district: '', telephone: '', email: '', address: '', error: '', loading: false });
      fetchStations();
      fetchStats();
    } catch (err) {
      setStationForm(f => ({ ...f, error: err.response?.data?.message || 'Failed to create station', loading: false }));
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!userForm.username || !userForm.password || !userForm.first_name || !userForm.last_name) {
      setUserForm(f => ({ ...f, error: 'Username, password, first & last name are required' }));
      return;
    }
    setUserForm(f => ({ ...f, loading: true, error: '' }));
    try {
      await api.post('/admin/users', userForm);
      showToast('Active User account created successfully in database');
      setIsAddUserModalOpen(false);
      setUserForm({
        username: '', password: '', email: '', phone: '', role: 'POLICE',
        first_name: '', last_name: '', nic: '', gender: 'Male', date_of_birth: '', telephone: '', address: '',
        hospital_id: '', station_id: '', badge_number: '', rank: '', registration_number: '', specialization: '', employee_number: '', qualification: '', organization_name: '', designation: '',
        error: '', loading: false
      });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setUserForm(f => ({ ...f, error: err.response?.data?.message || 'Failed to create user', loading: false }));
    }
  };

  // ── USER MANAGE ACTIONS ────────────────────────────────────────────────────
  const handleUserAction = async (userId, action) => {
    setActionId(userId);
    try {
      let res;
      if (action === 'approve') res = await api.patch(`/admin/users/${userId}/approve`);
      if (action === 'suspend') res = await api.patch(`/admin/users/${userId}/suspend`);
      if (action === 'reactivate') res = await api.patch(`/admin/users/${userId}/reactivate`);
      showToast(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (e) {
      showToast(e.response?.data?.message || 'Access modification failed', 'error');
    } finally {
      setActionId(null);
      setIsConfirmModalOpen(false);
    }
  };

  const handleRejectUser = async (userId) => {
    setActionId(userId);
    try {
      const res = await api.delete(`/admin/users/${userId}/reject`);
      showToast(res.data.message);
      fetchUsers();
      fetchStats();
    } catch {
      showToast('Failed to reject registration request', 'error');
    } finally {
      setActionId(null);
      setIsConfirmModalOpen(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPassForm.password.length < 8) {
      setResetPassForm(f => ({ ...f, error: 'Password must be at least 8 characters' }));
      return;
    }
    if (resetPassForm.password !== resetPassForm.confirmPassword) {
      setResetPassForm(f => ({ ...f, error: 'Passwords do not match' }));
      return;
    }
    try {
      await api.post(`/admin/users/${selectedUser.user_id}/reset-password`, { password: resetPassForm.password });
      setResetPassForm(f => ({ ...f, error: '', success: true }));
      showToast('Password credentials reset successfully');
      setTimeout(() => {
        setIsResetPasswordModalOpen(false);
        setResetPassForm({ password: '', confirmPassword: '', error: '', success: false });
      }, 1500);
    } catch (err) {
      setResetPassForm(f => ({ ...f, error: err.response?.data?.message || 'Credentials update failed' }));
    }
  };

  const openProfile = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data.data);
      setIsProfileModalOpen(true);
    } catch {
      showToast('Unable to load full user card', 'error');
    }
  };

  const openConfirm = (userId, action, title, message) => {
    setConfirmConfig({ userId, action, title, message });
    setIsConfirmModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const term = userFilters.search.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return fullName.includes(term) || (u.username || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-forensic-dark flex flex-col">
      <Navbar />

      {/* Main Layout Container with Fast Sub-page Navigator */}
      <div className="flex flex-1 pt-16">
        
        {/* Left Sidebar Navigator */}
        <aside className="w-64 bg-gray-950/80 border-r border-gray-800/60 hidden md:flex flex-col p-4 space-y-1">
          <div className="text-gray-500 text-xs font-bold px-3 py-2 uppercase tracking-wider">Navigation</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                ${activeTab === item.id 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/10' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/60'}`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Dynamic Sub-page Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-screen-2xl mx-auto w-full">
          
          {/* Mobile Tab Navigator Dropdown */}
          <div className="md:hidden mb-6">
            <label className="text-xs text-gray-400 block mb-1">Select View</label>
            <select value={activeTab} onChange={e => setActiveTab(e.target.value)} className="select-field">
              {NAV_ITEMS.map(i => <option key={i.id} value={i.id}>{i.icon} {i.label}</option>)}
            </select>
          </div>

          {/* Toast Notification Banner */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all page-enter
              ${toast.type === 'success' ? 'bg-emerald-900/90 border border-emerald-700 text-emerald-200' : 'bg-red-900/90 border border-red-700 text-red-200'}`}>
              {toast.msg}
            </div>
          )}

          {/* ── SUB-PAGE: OVERVIEW (HOME) ────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8 page-enter">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">System Home</h1>
                <p className="text-gray-400 text-sm mt-1">Direct system snapshot of case registers, accounts, and organizations</p>
              </div>

              {/* Stat Cards (Click to switch sub-page) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <StatCard value={statsLoading ? null : stats?.pendingUsers} label="Pending Users" icon="⏳" color="border-amber-500" onClick={() => setActiveTab('users')} />
                <StatCard value={statsLoading ? null : stats?.activeUsers} label="Active Users" icon="👥" color="border-primary-500" onClick={() => setActiveTab('users')} />
                <StatCard value={statsLoading ? null : stats?.hospitals} label="Hospitals" icon="🏥" color="border-rose-500" onClick={() => setActiveTab('hospitals')} />
                <StatCard value={statsLoading ? null : stats?.policeStations} label="Stations" icon="🚔" color="border-blue-500" onClick={() => setActiveTab('stations')} />
                <StatCard value={statsLoading ? null : stats?.openCases} label="Open Cases" icon="📂" color="border-emerald-500" onClick={() => setActiveTab('cases')} />
                <StatCard value={statsLoading ? null : stats?.pendingReports} label="Pending Reports" icon="📄" color="border-purple-500" onClick={() => setActiveTab('reports')} />
                <StatCard value={statsLoading ? null : stats?.pendingLabRequests} label="Lab Requests" icon="🧪" color="border-yellow-500" onClick={() => setActiveTab('lab_requests')} />
              </div>

              {/* Progress Summary Charts */}
              {stats?.charts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-white font-semibold text-sm mb-4">👥 User Roles distribution</h3>
                    <div className="space-y-4">
                      {stats.charts.roles.map(r => {
                        const max = Math.max(...stats.charts.roles.map(x => x.count), 1);
                        return (
                          <div key={r.role_name} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                              <span>{ROLE_LABELS[r.role_name] || r.role_name}</span>
                              <span className="text-white">{r.count}</span>
                            </div>
                            <div className="w-full bg-gray-800/80 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-white font-semibold text-sm mb-4">📂 Case status Summary</h3>
                    <div className="space-y-4">
                      {stats.charts.cases.length === 0 ? (
                        <p className="text-gray-500 text-xs text-center py-10">No cases recorded in database</p>
                      ) : (
                        stats.charts.cases.map(c => {
                          const max = Math.max(...stats.charts.cases.map(x => x.count), 1);
                          return (
                            <div key={c.status_name} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium text-gray-400">
                                <span>{c.status_name}</span>
                                <span className="text-white">{c.count}</span>
                              </div>
                              <div className="w-full bg-gray-800/80 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SUB-PAGE: USER DIRECTORY ───────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="space-y-4 page-enter">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">User Directory</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Manage accounts, active permissions, and pending registrations</p>
                </div>
                <button onClick={() => setIsAddUserModalOpen(true)} className="btn-primary w-fit px-5 py-2">
                  + Add User Account
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
                <input
                  type="text"
                  value={userFilters.search}
                  onChange={e => setUserFilters(f => ({ ...f, search: e.target.value }))}
                  placeholder="Search user name, username, email..."
                  className="input-field sm:col-span-2"
                />
                <select value={userFilters.role} onChange={e => setUserFilters(f => ({ ...f, role: e.target.value }))} className="select-field">
                  <option value="">All Roles</option>
                  <option value="POLICE">Police Officer</option>
                  <option value="JMO">Judicial Medical Officer</option>
                  <option value="MEDICAL_OFFICER">Medical Officer</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="GOVERNMENT_ANALYST">Forensic Staff</option>
                </select>
                <select value={userFilters.status} onChange={e => setUserFilters(f => ({ ...f, status: e.target.value }))} className="select-field">
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {usersLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No users match query filter</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Registrant Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>System Role</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.user_id}>
                          <td>
                            <button onClick={() => openProfile(u.user_id)} className="font-semibold text-white hover:text-primary-400 hover:underline">
                              {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                            </button>
                          </td>
                          <td className="font-mono text-xs">{u.username}</td>
                          <td className="text-xs">{u.email || '—'}</td>
                          <td><RoleBadge role={u.role} /></td>
                          <td><StatusBadge status={u.status} /></td>
                          <td className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openProfile(u.user_id)} className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded-lg text-gray-300">View Profile</button>
                              {u.status === 'INACTIVE' && (
                                <>
                                  <button onClick={() => handleUserAction(u.user_id, 'approve')} className="btn-success text-xs py-1 px-3">Approve</button>
                                  <button onClick={() => openConfirm(u.user_id, 'reject', 'Reject Registrant', `Are you sure you want to permanently delete registration request for '${u.username}'?`)} className="btn-danger text-xs py-1 px-3">Reject</button>
                                </>
                              )}
                              {u.status === 'ACTIVE' && (
                                <>
                                  <button onClick={() => openConfirm(u.user_id, 'suspend', 'Suspend Account', `Are you sure you want to suspend access for '${u.username}'?`)} className="btn-danger text-xs py-1 px-3">Deactivate</button>
                                  <button onClick={() => { setSelectedUser(u); setIsResetPasswordModalOpen(true); }} className="px-2.5 py-1 bg-purple-900/30 text-purple-300 border border-purple-800/40 text-xs rounded-lg">Reset Password</button>
                                </>
                              )}
                              {u.status === 'SUSPENDED' && (
                                <button onClick={() => handleUserAction(u.user_id, 'reactivate')} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs">Activate</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: HOSPITALS ────────────────────────────────────────────── */}
          {activeTab === 'hospitals' && (
            <div className="space-y-4 page-enter">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Registered Hospitals</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Directory list of partner medical institutions and hospital points</p>
                </div>
                <button onClick={() => setIsAddHospitalModalOpen(true)} className="btn-primary w-fit px-5 py-2">
                  + Add Hospital
                </button>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={hospitalsSearch}
                  onChange={e => setHospitalsSearch(e.target.value)}
                  placeholder="Search hospital name, district..."
                  className="input-field"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {hospitalsLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : hospitals.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No hospital records stored in database</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Hospital Name</th>
                        <th>Classification</th>
                        <th>District</th>
                        <th>Phone</th>
                        <th>Email Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hospitals.filter(h => h.hospital_name.toLowerCase().includes(hospitalsSearch.toLowerCase()) || h.district?.toLowerCase().includes(hospitalsSearch.toLowerCase())).map(h => (
                        <tr key={h.hospital_id}>
                          <td className="font-semibold text-white">{h.hospital_name}</td>
                          <td><span className="px-2 py-0.5 text-xs rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">{h.hospital_type || 'General'}</span></td>
                          <td>{h.district || '—'}</td>
                          <td className="font-mono text-xs">{h.telephone || '—'}</td>
                          <td className="text-xs text-gray-400">{h.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: DEPARTMENTS ────────────────────────────────────────── */}
          {activeTab === 'departments' && (
            <div className="space-y-4 page-enter">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Registered Departments</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Directory list of departments linked to medical & forensic institutions</p>
                </div>
                <button onClick={() => setIsAddDepartmentModalOpen(true)} className="btn-primary w-fit px-5 py-2">
                  + Add Department
                </button>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={departmentsSearch}
                  onChange={e => setDepartmentsSearch(e.target.value)}
                  placeholder="Search department name, hospital..."
                  className="input-field"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {departmentsLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : departments.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No department records stored in database</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Department Name</th>
                        <th>Parent Hospital</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.filter(d => d.department_name.toLowerCase().includes(departmentsSearch.toLowerCase()) || d.hospital_name?.toLowerCase().includes(departmentsSearch.toLowerCase())).map(d => (
                        <tr key={d.department_id}>
                          <td className="font-semibold text-white">{d.department_name}</td>
                          <td><span className="px-2 py-0.5 text-xs rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">{d.hospital_name || 'Hospital'}</span></td>
                          <td className="text-xs text-gray-400">{d.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: POLICE STATIONS ──────────────────────────────────────── */}
          {activeTab === 'stations' && (
            <div className="space-y-4 page-enter">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Police Stations</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Directory list of connected police stations and districts</p>
                </div>
                <button onClick={() => setIsAddStationModalOpen(true)} className="btn-primary w-fit px-5 py-2">
                  + Add Police Station
                </button>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={stationsSearch}
                  onChange={e => setStationsSearch(e.target.value)}
                  placeholder="Search station name, district..."
                  className="input-field"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {stationsLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : stations.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No police stations records stored in database</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Station Name</th>
                        <th>District</th>
                        <th>Phone</th>
                        <th>Email Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.filter(s => s.station_name.toLowerCase().includes(stationsSearch.toLowerCase()) || s.district?.toLowerCase().includes(stationsSearch.toLowerCase())).map(s => (
                        <tr key={s.station_id}>
                          <td className="font-semibold text-white">{s.station_name}</td>
                          <td>{s.district || '—'}</td>
                          <td className="font-mono text-xs">{s.telephone || '—'}</td>
                          <td className="text-xs text-gray-400">{s.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: OPEN CASES ───────────────────────────────────────────── */}
          {activeTab === 'cases' && (
            <div className="space-y-4 page-enter">
              <div>
                <h1 className="text-2xl font-bold text-white">Cases Register</h1>
                <p className="text-gray-400 text-sm mt-0.5">Overview ledger of registered police investigation cases</p>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={casesSearch}
                  onChange={e => setCasesSearch(e.target.value)}
                  placeholder="Search case title, case number, station..."
                  className="input-field"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {casesLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : cases.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No cases recorded in database</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Case Number</th>
                        <th>Classification Type</th>
                        <th>Title / Subject</th>
                        <th>Originating Station</th>
                        <th>Investigation status</th>
                        <th>Reported Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.filter(c => c.case_number.toLowerCase().includes(casesSearch.toLowerCase()) || c.title?.toLowerCase().includes(casesSearch.toLowerCase()) || c.station_name.toLowerCase().includes(casesSearch.toLowerCase())).map(c => (
                        <tr key={c.case_id}>
                          <td className="font-mono text-xs font-bold text-primary-400">{c.case_number}</td>
                          <td className="text-xs">{c.case_type || '—'}</td>
                          <td className="text-sm text-white font-medium">{c.title || '—'}</td>
                          <td>{c.station_name}</td>
                          <td><span className="px-2 py-0.5 rounded text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">{c.status}</span></td>
                          <td className="text-xs text-gray-500">{new Date(c.date_reported).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: REPORTS LEDGER ───────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-4 page-enter">
              <div>
                <h1 className="text-2xl font-bold text-white">Reports Ledger</h1>
                <p className="text-gray-400 text-sm mt-0.5">Database log of prepared Medico-Legal Reports and Autopsy Reports</p>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={reportsSearch}
                  onChange={e => setReportsSearch(e.target.value)}
                  placeholder="Search report number, patient name..."
                  className="input-field"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {reportsLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : reports.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No report records found in database</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Report Number</th>
                        <th>Document Classification</th>
                        <th>Patient Name</th>
                        <th>Document status</th>
                        <th>Date Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.filter(r => r.report_number?.toLowerCase().includes(reportsSearch.toLowerCase()) || r.patient_name?.toLowerCase().includes(reportsSearch.toLowerCase())).map((r, idx) => (
                        <tr key={r.report_id || idx}>
                          <td className="font-mono text-xs font-bold text-white">{r.report_number || 'PENDING'}</td>
                          <td>
                            <span className={`px-2 py-0.5 text-xs rounded border ${r.report_type === 'AUTOPSY' ? 'bg-purple-950/60 text-purple-300 border-purple-800/40' : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40'}`}>
                              {r.report_type === 'AUTOPSY' ? 'Autopsy Report' : 'Medico-Legal Report'}
                            </span>
                          </td>
                          <td>{r.patient_name || '—'}</td>
                          <td><span className="badge badge-active">{r.status || 'DRAFT'}</span></td>
                          <td className="text-xs text-gray-500">{new Date(r.prepared_date).toLocaleString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: LAB REQUESTS ─────────────────────────────────────────── */}
          {activeTab === 'lab_requests' && (
            <div className="space-y-4 page-enter">
              <div>
                <h1 className="text-2xl font-bold text-white">Laboratory Requests</h1>
                <p className="text-gray-400 text-sm mt-0.5">Database log of lab test requests sent from forensic clinics</p>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={labSearch}
                  onChange={e => setLabSearch(e.target.value)}
                  placeholder="Search specimen type, laboratory..."
                  className="input-field"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {labLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : labRequests.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No laboratory requests stored in database</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Laboratory Name</th>
                        <th>Specimen Type</th>
                        <th>Priority</th>
                        <th>Test status</th>
                        <th>Date Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labRequests.filter(l => l.laboratory_name?.toLowerCase().includes(labSearch.toLowerCase()) || l.specimen_type?.toLowerCase().includes(labSearch.toLowerCase())).map(l => (
                        <tr key={l.request_id}>
                          <td className="font-semibold text-white">{l.laboratory_name}</td>
                          <td><span className="px-2 py-0.5 text-xs rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">{l.specimen_type}</span></td>
                          <td><span className={`badge ${l.priority === 'HIGH' ? 'badge-suspended' : 'badge-pending'}`}>{l.priority || 'NORMAL'}</span></td>
                          <td><span className="badge badge-active">{l.status}</span></td>
                          <td className="text-xs text-gray-500">{new Date(l.request_date).toLocaleString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: SYSTEM AUDIT LOGS ───────────────────────────────────── */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4 page-enter">
              <div>
                <h1 className="text-2xl font-bold text-white">System Audits</h1>
                <p className="text-gray-400 text-sm mt-0.5">Read-only historical security logs and trace record updates</p>
              </div>

              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
                <input
                  type="text"
                  value={auditsSearch}
                  onChange={e => { setAuditsSearch(e.target.value); setAuditsPage(1); }}
                  placeholder="Search logs action, performer, description..."
                  className="input-field"
                />
                <button onClick={fetchAuditLogs} className="btn-primary w-fit px-6">Refresh</button>
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {auditsLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No audit logs stored in database</p>
                ) : (
                  <>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Performer</th>
                          <th>Action</th>
                          <th>Entity Name</th>
                          <th>Description</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map(log => (
                          <tr key={log.audit_id}>
                            <td className="font-semibold text-white">{log.performer_username || 'SYSTEM'}</td>
                            <td><span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-gray-800 text-gray-300 border border-gray-700/60">{log.action}</span></td>
                            <td className="font-mono text-xs text-gray-400">{log.entity_name || '—'}</td>
                            <td className="text-xs text-gray-300 max-w-md truncate" title={log.description}>{log.description}</td>
                            <td className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('en-GB')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-gray-950/20">
                      <span className="text-xs text-gray-500">Showing logs {((auditsPage - 1) * 15) + 1} to {Math.min(auditsPage * 15, auditsTotal)} of {auditsTotal}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setAuditsPage(p => Math.max(p - 1, 1))} disabled={auditsPage === 1} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30">Previous</button>
                        <button onClick={() => setAuditsPage(p => p + 1)} disabled={auditsPage * 15 >= auditsTotal} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30">Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── SUB-PAGE: NOTIFICATIONS ───────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 page-enter">
              <div>
                <h1 className="text-2xl font-bold text-white">System Notifications</h1>
                <p className="text-gray-400 text-sm mt-0.5">Database log of prepared notifications and user alerts</p>
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
                {notificationsLoading ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : notifications.length === 0 ? (
                  <p className="text-center py-20 text-gray-500">No alerts log found</p>
                ) : (
                  <>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Alert Type</th>
                          <th>Message Body</th>
                          <th>Status</th>
                          <th>Date Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.map(n => (
                          <tr key={n.notification_id}>
                            <td className="font-semibold text-white">{n.recipient_username}</td>
                            <td><span className="px-2 py-0.5 rounded text-xs bg-purple-950/60 text-purple-300 border border-purple-800/50">{n.notification_type}</span></td>
                            <td className="text-xs">{n.message}</td>
                            <td><span className={`badge ${n.is_read ? 'badge-active' : 'badge-pending'}`}>{n.is_read ? 'Read' : 'Unread'}</span></td>
                            <td className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('en-GB')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-gray-950/20">
                      <span className="text-xs text-gray-500">Showing alerts {((notificationsPage - 1) * 15) + 1} to {Math.min(notificationsPage * 15, notificationsTotal)} of {notificationsTotal}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setNotificationsPage(p => Math.max(p - 1, 1))} disabled={notificationsPage === 1} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30">Previous</button>
                        <button onClick={() => setNotificationsPage(p => p + 1)} disabled={notificationsPage * 15 >= notificationsTotal} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30">Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL: ADD HOSPITAL ─────────────────────────────────────────────── */}
      {isAddHospitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 glow-blue page-enter">
            <h3 className="text-lg font-bold text-white mb-1">Add New Hospital</h3>
            <p className="text-xs text-gray-400 mb-5">Register a new hospital institution into PostgreSQL</p>
            {hospitalForm.error && <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-xs">{hospitalForm.error}</div>}
            <form onSubmit={handleAddHospital} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Hospital Name *</label>
                <input type="text" value={hospitalForm.hospital_name} onChange={e => setHospitalForm(f => ({ ...f, hospital_name: e.target.value }))} className="input-field" placeholder="e.g. National Hospital of Sri Lanka" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Classification Type</label>
                  <select value={hospitalForm.hospital_type} onChange={e => setHospitalForm(f => ({ ...f, hospital_type: e.target.value }))} className="select-field">
                    <option value="Teaching Hospital">Teaching Hospital</option>
                    <option value="District General Hospital">District General</option>
                    <option value="Base Hospital">Base Hospital</option>
                    <option value="Provincial General Hospital">Provincial General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">District</label>
                  <input type="text" value={hospitalForm.district} onChange={e => setHospitalForm(f => ({ ...f, district: e.target.value }))} className="input-field" placeholder="e.g. Colombo" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Telephone</label>
                  <input type="tel" value={hospitalForm.telephone} onChange={e => setHospitalForm(f => ({ ...f, telephone: e.target.value }))} className="input-field" placeholder="+94 11 269 1111" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                  <input type="email" value={hospitalForm.email} onChange={e => setHospitalForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="info@nhsl.health.gov.lk" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Address</label>
                <textarea rows={2} value={hospitalForm.address} onChange={e => setHospitalForm(f => ({ ...f, address: e.target.value }))} className="input-field resize-none" placeholder="Full address" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddHospitalModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs">Cancel</button>
                <button type="submit" disabled={hospitalForm.loading} className="btn-primary w-fit px-6">
                  {hospitalForm.loading ? 'Creating...' : 'Save Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD DEPARTMENT ───────────────────────────────────────────── */}
      {isAddDepartmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 glow-purple page-enter">
            <h3 className="text-lg font-bold text-white mb-1">Add Department</h3>
            <p className="text-xs text-gray-400 mb-5">Create a department entry linked to a hospital in PostgreSQL</p>
            {departmentForm.error && <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-xs">{departmentForm.error}</div>}
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Parent Institution / Hospital *</label>
                <select value={departmentForm.hospital_id} onChange={e => setDepartmentForm(f => ({ ...f, hospital_id: e.target.value }))} className="select-field" required>
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Department Name *</label>
                <input type="text" value={departmentForm.department_name} onChange={e => setDepartmentForm(f => ({ ...f, department_name: e.target.value }))} className="input-field" placeholder="e.g. Department of Forensic Medicine" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Description / Notes</label>
                <textarea rows={2} value={departmentForm.description} onChange={e => setDepartmentForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" placeholder="Department description" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddDepartmentModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs">Cancel</button>
                <button type="submit" disabled={departmentForm.loading} className="btn-primary w-fit px-6">
                  {departmentForm.loading ? 'Creating...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddStationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 glow-blue page-enter">
            <h3 className="text-lg font-bold text-white mb-1">Add Police Station</h3>
            <p className="text-xs text-gray-400 mb-5">Register a new police station into PostgreSQL</p>
            {stationForm.error && <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-xs">{stationForm.error}</div>}
            <form onSubmit={handleAddStation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Station Name *</label>
                <input type="text" value={stationForm.station_name} onChange={e => setStationForm(f => ({ ...f, station_name: e.target.value }))} className="input-field" placeholder="e.g. Colombo Fort Police Station" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">District</label>
                  <input type="text" value={stationForm.district} onChange={e => setStationForm(f => ({ ...f, district: e.target.value }))} className="input-field" placeholder="e.g. Colombo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Telephone</label>
                  <input type="tel" value={stationForm.telephone} onChange={e => setStationForm(f => ({ ...f, telephone: e.target.value }))} className="input-field" placeholder="+94 11 243 3333" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                <input type="email" value={stationForm.email} onChange={e => setStationForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="fort@police.lk" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Address</label>
                <textarea rows={2} value={stationForm.address} onChange={e => setStationForm(f => ({ ...f, address: e.target.value }))} className="input-field resize-none" placeholder="Station address" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddStationModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs">Cancel</button>
                <button type="submit" disabled={stationForm.loading} className="btn-primary w-fit px-6">
                  {stationForm.loading ? 'Creating...' : 'Save Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD USER (ACTIVE IMMEDIATELY) ───────────────────────────────── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-2xl w-full rounded-2xl p-6 glow-blue page-enter max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Add Active User Account</h3>
            <p className="text-xs text-gray-400 mb-5">Create a user directly into PostgreSQL (automatically Active)</p>
            {userForm.error && <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-xs">{userForm.error}</div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Username *</label>
                  <input type="text" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} className="input-field" placeholder="Username" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Password *</label>
                  <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="Min 8 chars" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@fmis.gov.lk" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">System Role *</label>
                  <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} className="select-field">
                    <option value="POLICE">Police Officer</option>
                    <option value="JMO">Judicial Medical Officer</option>
                    <option value="MEDICAL_OFFICER">Medical Officer</option>
                    <option value="LAB_TECHNICIAN">Lab Technician</option>
                    <option value="GOVERNMENT_ANALYST">Forensic Staff</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">First Name *</label>
                  <input type="text" value={userForm.first_name} onChange={e => setUserForm(f => ({ ...f, first_name: e.target.value }))} className="input-field" placeholder="First Name" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Last Name *</label>
                  <input type="text" value={userForm.last_name} onChange={e => setUserForm(f => ({ ...f, last_name: e.target.value }))} className="input-field" placeholder="Last Name" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">NIC</label>
                  <input type="text" value={userForm.nic} onChange={e => setUserForm(f => ({ ...f, nic: e.target.value }))} className="input-field" placeholder="e.g. 990123456V" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Gender</label>
                  <select value={userForm.gender} onChange={e => setUserForm(f => ({ ...f, gender: e.target.value }))} className="select-field">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Institution / Department link */}
              {['JMO', 'MEDICAL_OFFICER', 'LAB_TECHNICIAN'].includes(userForm.role) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    {userForm.role === 'LAB_TECHNICIAN' ? "Assign Laboratory / Hospital *" : "Assign Hospital *"}
                  </label>
                  <select value={userForm.hospital_id} onChange={e => setUserForm(f => ({ ...f, hospital_id: e.target.value }))} className="select-field" required>
                    <option value="">
                      {userForm.role === 'LAB_TECHNICIAN' ? "Select laboratory / hospital..." : "Select hospital..."}
                    </option>
                    {hospitals.map(h => <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>)}
                  </select>
                </div>
              )}

              {userForm.role === 'GOVERNMENT_ANALYST' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Assign Department *</label>
                  <select value={userForm.organization_name} onChange={e => setUserForm(f => ({ ...f, organization_name: e.target.value }))} className="select-field" required>
                    <option value="">Select department...</option>
                    {departments.map(d => (
                      <option key={d.department_id} value={d.department_name}>
                        {d.department_name} ({d.hospital_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {STATION_ROLES.includes(userForm.role) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Assign Police Station *</label>
                  <select value={userForm.station_id} onChange={e => setUserForm(f => ({ ...f, station_id: e.target.value }))} className="select-field" required>
                    <option value="">Select police station...</option>
                    {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs">Cancel</button>
                <button type="submit" disabled={userForm.loading} className="btn-primary w-fit px-6">
                  {userForm.loading ? 'Creating...' : 'Create Active User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALS: RESET PASSWORD, PROFILE, CONFIRMATION ─────────────────────── */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-md w-full rounded-2xl p-6 glow-purple page-enter">
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-gray-400 mb-6">Setting new credentials for <strong className="text-white">@{selectedUser.username}</strong></p>
            {resetPassForm.error && <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-xs">{resetPassForm.error}</div>}
            {resetPassForm.success && <div className="mb-4 p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">Password updated successfully. Closing...</div>}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">New Password</label>
                <input type="password" value={resetPassForm.password} onChange={e => setResetPassForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="Min 8 characters" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Confirm New Password</label>
                <input type="password" value={resetPassForm.confirmPassword} onChange={e => setResetPassForm(f => ({ ...f, confirmPassword: e.target.value }))} className="input-field" placeholder="Repeat new password" required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsResetPasswordModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold">Save New Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProfileModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-xl w-full rounded-2xl p-6 glow-blue page-enter max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">User Profile</h3>
                <p className="text-xs text-gray-400 mt-1">Detailed system audit information</p>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/40">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Core Account</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div><span className="text-gray-500 text-xs block">Username</span><strong className="text-white font-mono">@{selectedUser.username}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Role</span><strong className="text-white"><RoleBadge role={selectedUser.role} /></strong></div>
                  <div><span className="text-gray-500 text-xs block">Email Address</span><strong className="text-white">{selectedUser.email || '—'}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Phone Connection</span><strong className="text-white">{selectedUser.phone || '—'}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Created At</span><strong className="text-white">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('en-GB') : '—'}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Last Login</span><strong className="text-white">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('en-GB') : 'Never'}</strong></div>
                </div>
              </div>
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/40">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="col-span-2"><span className="text-gray-500 text-xs block">Full Name</span><strong className="text-white">{selectedUser.first_name || '—'} {selectedUser.last_name || ''}</strong></div>
                  <div><span className="text-gray-500 text-xs block">NIC / National ID</span><strong className="text-white font-mono">{selectedUser.nic || '—'}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Gender</span><strong className="text-white">{selectedUser.gender || '—'}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Date of Birth</span><strong className="text-white">{selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString('en-GB') : '—'}</strong></div>
                  <div><span className="text-gray-500 text-xs block">Personal Telephone</span><strong className="text-white">{selectedUser.telephone || '—'}</strong></div>
                  <div className="col-span-2"><span className="text-gray-500 text-xs block">Residential Address</span><strong className="text-white font-normal block mt-0.5 whitespace-pre-line text-xs text-gray-300">{selectedUser.address || '—'}</strong></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-6">
              <button onClick={() => setIsProfileModalOpen(false)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold">Close View</button>
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-sm w-full rounded-2xl p-6 glow-blue page-enter">
            <h3 className="text-lg font-bold text-white mb-2">{confirmConfig.title}</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs">Cancel</button>
              <button type="button" onClick={() => {
                if (confirmConfig.action === 'reject') {
                  handleRejectUser(confirmConfig.userId);
                } else {
                  handleUserAction(confirmConfig.userId, confirmConfig.action);
                }
              }} className={`px-4 py-2 text-white rounded-lg text-xs font-semibold ${confirmConfig.action === 'reject' || confirmConfig.action === 'suspend' ? 'bg-red-600 hover:bg-red-500' : 'bg-primary-600 hover:bg-primary-500'}`}>
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
