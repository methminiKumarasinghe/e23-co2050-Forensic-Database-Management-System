import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const TABS = [
  { id: 'users',         label: 'User Directory',      icon: '👥' },
  { id: 'audit_logs',    label: 'System Audits',       icon: '📜' },
  { id: 'notifications', label: 'System Notifications',icon: '🔔' },
];

const ROLE_LABELS = {
  ADMIN:             'Administrator',
  POLICE:            'Police Officer',
  JMO:               'Judicial Medical Officer',
  MEDICAL_OFFICER:   'Medical Officer',
  LAB_TECHNICIAN:    'Lab Technician',
  GOVERNMENT_ANALYST:'Forensic Staff',
};

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

const StatCard = ({ value, label, icon, color }) => (
  <div className={`stat-card border-l-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value !== null ? value : '—'}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users Tab States
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
  });

  // Audits Tab States
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsTotal, setAuditsTotal] = useState(0);
  const [auditsPage, setAuditsPage] = useState(1);
  const [auditsSearch, setAuditsSearch] = useState('');

  // Notifications Tab States
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const [notificationsPage, setNotificationsPage] = useState(1);

  // Action / Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ userId: null, action: '', title: '', message: '' });
  const [actionId, setActionId] = useState(null);
  const [resetPassForm, setResetPassForm] = useState({ password: '', confirmPassword: '', error: '', success: false });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── FETCH STATS ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to fetch dashboard stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── FETCH USERS ─────────────────────────────────────────────────────────────
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
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to fetch users list', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [userFilters]);

  // ── FETCH AUDIT LOGS ────────────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setAuditsLoading(true);
    try {
      const limit = 15;
      const offset = (auditsPage - 1) * limit;
      const res = await api.get(`/admin/audit-logs?limit=${limit}&offset=${offset}&search=${auditsSearch}`);
      setAuditLogs(res.data.data);
      setAuditsTotal(res.data.meta.total);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to fetch audit logs', 'error');
    } finally {
      setAuditsLoading(false);
    }
  }, [auditsPage, auditsSearch]);

  // ── FETCH NOTIFICATIONS ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const limit = 15;
      const offset = (notificationsPage - 1) * limit;
      const res = await api.get(`/admin/notifications?limit=${limit}&offset=${offset}`);
      setNotifications(res.data.data);
      setNotificationsTotal(res.data.meta.total);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to fetch notifications', 'error');
    } finally {
      setNotificationsLoading(false);
    }
  }, [notificationsPage]);

  // Reload tab specific data on active tab change
  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit_logs') fetchAuditLogs();
    if (activeTab === 'notifications') fetchNotifications();
  }, [activeTab, fetchStats, fetchUsers, fetchAuditLogs, fetchNotifications]);

  // User list searches locally for responsive typing
  const filteredUsers = users.filter(u => {
    const term = userFilters.search.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  // ── TRIGGER APPROVAL / SUSPEND / ACTIVATE ──────────────────────────────────
  const handleUserAction = async (userId, action) => {
    setActionId(userId);
    try {
      let res;
      if (action === 'approve') {
        res = await api.patch(`/admin/users/${userId}/approve`);
      } else if (action === 'suspend') {
        res = await api.patch(`/admin/users/${userId}/suspend`);
      } else if (action === 'reactivate') {
        res = await api.patch(`/admin/users/${userId}/reactivate`);
      }
      showToast(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionId(null);
      setIsConfirmModalOpen(false);
    }
  };

  // ── REJECT (DELETE) USER ────────────────────────────────────────────────────
  const handleRejectUser = async (userId) => {
    setActionId(userId);
    try {
      const res = await api.delete(`/admin/users/${userId}/reject`);
      showToast(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to reject user', 'error');
    } finally {
      setActionId(null);
      setIsConfirmModalOpen(false);
    }
  };

  // ── RESET PASSWORD ──────────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassForm.password || resetPassForm.password.length < 8) {
      setResetPassForm(f => ({ ...f, error: 'Password must be at least 8 characters' }));
      return;
    }
    if (resetPassForm.password !== resetPassForm.confirmPassword) {
      setResetPassForm(f => ({ ...f, error: 'Passwords do not match' }));
      return;
    }

    try {
      await api.post(`/admin/users/${selectedUser.user_id}/reset-password`, {
        password: resetPassForm.password
      });
      setResetPassForm(f => ({ ...f, error: '', success: true }));
      showToast('Password reset successfully');
      setTimeout(() => {
        setIsResetPasswordModalOpen(false);
        setResetPassForm({ password: '', confirmPassword: '', error: '', success: false });
      }, 1500);
    } catch (err) {
      setResetPassForm(f => ({ ...f, error: err.response?.data?.message || 'Reset failed' }));
    }
  };

  // ── VIEW PROFILE DETAILS ────────────────────────────────────────────────────
  const openProfile = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data.data);
      setIsProfileModalOpen(true);
    } catch (err) {
      showToast('Failed to load user profile', 'error');
    }
  };

  const openConfirm = (userId, action, title, message) => {
    setConfirmConfig({ userId, action, title, message });
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-forensic-dark pb-16">
      <Navbar />

      <main className="pt-20 max-w-screen-2xl mx-auto px-4 sm:px-6">
        
        {/* Toast Alert */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all page-enter
            ${toast.type === 'success'
              ? 'bg-emerald-900/90 border border-emerald-700 text-emerald-200 glow-blue'
              : 'bg-red-900/90 border border-red-700 text-red-200'}`}>
            {toast.msg}
          </div>
        )}

        {/* Dashboard Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">System Administrator</h1>
            <p className="text-gray-400 text-sm mt-1">Manage system configurations, user accounts, and review audit history</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <StatCard value={stats?.pendingUsers} label="Pending Users" icon="⏳" color="border-amber-500" />
          <StatCard value={stats?.activeUsers} label="Active Users" icon="👥" color="border-primary-500" />
          <StatCard value={stats?.hospitals} label="Hospitals" icon="🏥" color="border-rose-500" />
          <StatCard value={stats?.policeStations} label="Police Stations" icon="🚔" color="border-blue-500" />
          <StatCard value={stats?.openCases} label="Open Cases" icon="📂" color="border-emerald-500" />
          <StatCard value={stats?.pendingReports} label="Pending Reports" icon="📄" color="border-purple-500" />
          <StatCard value={stats?.pendingLabRequests} label="Lab Requests" icon="🧪" color="border-yellow-500" />
        </div>

        {/* Charts & Graphs Grid */}
        {stats?.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <span>📊</span> User Roles Distribution
              </h3>
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
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(r.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <span>📁</span> Cases status Summary
              </h3>
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
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${(c.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-gray-800 gap-6 mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all
                ${activeTab === t.id 
                  ? 'border-primary-500 text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT: USERS DIRECTORY ──────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            
            {/* Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
              <input
                type="text"
                value={userFilters.search}
                onChange={e => setUserFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search user name, username, email..."
                className="input-field sm:col-span-2"
              />
              <select
                value={userFilters.role}
                onChange={e => setUserFilters(f => ({ ...f, role: e.target.value }))}
                className="select-field"
              >
                <option value="">All Roles</option>
                <option value="POLICE">Police Officer</option>
                <option value="JMO">Judicial Medical Officer</option>
                <option value="MEDICAL_OFFICER">Medical Officer</option>
                <option value="LAB_TECHNICIAN">Lab Technician</option>
                <option value="GOVERNMENT_ANALYST">Forensic Staff</option>
              </select>
              <select
                value={userFilters.status}
                onChange={e => setUserFilters(f => ({ ...f, status: e.target.value }))}
                className="select-field"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Table Container */}
            <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400 text-sm">Querying system directory...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="text-gray-400">No users match your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                            <button onClick={() => openProfile(u.user_id)} className="font-semibold text-white hover:text-primary-400 hover:underline text-left">
                              {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                            </button>
                          </td>
                          <td className="font-mono text-xs">{u.username}</td>
                          <td className="text-xs">{u.email || '—'}</td>
                          <td><RoleBadge role={u.role} /></td>
                          <td><StatusBadge status={u.status} /></td>
                          <td className="text-xs text-gray-500">
                            {new Date(u.created_at).toLocaleDateString('en-GB')}
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openProfile(u.user_id)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded-lg transition-colors">
                                View Profile
                              </button>

                              {u.status === 'INACTIVE' && (
                                <>
                                  <button
                                    onClick={() => handleUserAction(u.user_id, 'approve')}
                                    disabled={actionId === u.user_id}
                                    className="btn-success text-xs py-1 px-3"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openConfirm(u.user_id, 'reject', 'Reject Registration Request', `Are you sure you want to permanently delete registration request for '${u.username}'?`)}
                                    disabled={actionId === u.user_id}
                                    className="btn-danger text-xs py-1 px-3"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {u.status === 'ACTIVE' && (
                                <>
                                  <button
                                    onClick={() => openConfirm(u.user_id, 'suspend', 'Suspend Account Access', `Are you sure you want to suspend account access for '${u.username}'?`)}
                                    disabled={actionId === u.user_id}
                                    className="btn-danger text-xs py-1 px-3"
                                  >
                                    Deactivate
                                  </button>
                                  <button
                                    onClick={() => { setSelectedUser(u); setIsResetPasswordModalOpen(true); }}
                                    className="px-2 py-1 bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 text-xs rounded-lg transition-colors border border-purple-700/30"
                                  >
                                    Reset Password
                                  </button>
                                </>
                              )}

                              {u.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => handleUserAction(u.user_id, 'reactivate')}
                                  disabled={actionId === u.user_id}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors"
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: SYSTEM AUDIT LOGS ────────────────────────────────────── */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            
            {/* Search filter */}
            <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50 flex gap-4">
              <input
                type="text"
                value={auditsSearch}
                onChange={e => { setAuditsSearch(e.target.value); setAuditsPage(1); }}
                placeholder="Search audit actions, descriptions, performing users..."
                className="input-field"
              />
              <button onClick={fetchAuditLogs} className="btn-primary w-fit px-6">Refresh</button>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
              {auditsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400 text-sm">Querying system ledger...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-3xl mb-3">📜</div>
                  <p className="text-gray-400">No logs found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
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
                            <td>
                              <span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-gray-800 text-gray-300 border border-gray-700/60">
                                {log.action}
                              </span>
                            </td>
                            <td className="font-mono text-xs text-gray-400">{log.entity_name || '—'}</td>
                            <td className="text-xs text-gray-300 max-w-md truncate" title={log.description}>{log.description}</td>
                            <td className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString('en-GB')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-gray-950/20">
                    <span className="text-xs text-gray-500">
                      Showing logs {((auditsPage - 1) * 15) + 1} to {Math.min(auditsPage * 15, auditsTotal)} of {auditsTotal}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAuditsPage(p => Math.max(p - 1, 1))}
                        disabled={auditsPage === 1}
                        className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setAuditsPage(p => p + 1)}
                        disabled={auditsPage * 15 >= auditsTotal}
                        className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: NOTIFICATIONS ────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
              {notificationsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400 text-sm">Querying system alerts...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-3xl mb-3">🔔</div>
                  <p className="text-gray-400">No system notifications found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Notification Type</th>
                          <th>Message</th>
                          <th>Status</th>
                          <th>Date Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.map(n => (
                          <tr key={n.notification_id}>
                            <td className="font-semibold text-white">{n.recipient_username}</td>
                            <td>
                              <span className="px-2 py-0.5 rounded text-xs bg-purple-950/60 text-purple-300 border border-purple-800/50">
                                {n.notification_type}
                              </span>
                            </td>
                            <td className="text-xs">{n.message}</td>
                            <td>
                              <span className={`badge ${n.is_read ? 'badge-active' : 'badge-pending'}`}>
                                {n.is_read ? 'Read' : 'Unread'}
                              </span>
                            </td>
                            <td className="text-xs text-gray-500">
                              {new Date(n.created_at).toLocaleString('en-GB')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-gray-950/20">
                    <span className="text-xs text-gray-500">
                      Showing alerts {((notificationsPage - 1) * 15) + 1} to {Math.min(notificationsPage * 15, notificationsTotal)} of {notificationsTotal}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNotificationsPage(p => Math.max(p - 1, 1))}
                        disabled={notificationsPage === 1}
                        className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setNotificationsPage(p => p + 1)}
                        disabled={notificationsPage * 15 >= notificationsTotal}
                        className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL: RESET PASSWORD ─────────────────────────────────────────────── */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-md w-full rounded-2xl p-6 glow-purple page-enter">
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-gray-400 mb-6">
              Setting new credentials for <strong className="text-white">@{selectedUser.username}</strong>
            </p>

            {resetPassForm.error && (
              <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
                {resetPassForm.error}
              </div>
            )}
            {resetPassForm.success && (
              <div className="mb-4 p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
                Password updated successfully. Closing...
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={resetPassForm.password}
                  onChange={e => setResetPassForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={resetPassForm.confirmPassword}
                  onChange={e => setResetPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="input-field"
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: USER PROFILE ───────────────────────────────────────────────── */}
      {isProfileModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-xl w-full rounded-2xl p-6 glow-blue page-enter max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">User Profile Profile</h3>
                <p className="text-xs text-gray-400 mt-1">Detailed system audit information</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Profile Grid */}
            <div className="space-y-6">
              
              {/* Core Account Details */}
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/40">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Core Account</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Username</span>
                    <strong className="text-white font-mono">@{selectedUser.username}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Role</span>
                    <strong className="text-white"><RoleBadge role={selectedUser.role} /></strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Email Address</span>
                    <strong className="text-white">{selectedUser.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Phone Connection</span>
                    <strong className="text-white">{selectedUser.phone || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Created At</span>
                    <strong className="text-white">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('en-GB') : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Last Login</span>
                    <strong className="text-white">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('en-GB') : 'Never'}</strong>
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/40">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="col-span-2">
                    <span className="text-gray-500 text-xs block">Full Name</span>
                    <strong className="text-white">{selectedUser.first_name || '—'} {selectedUser.last_name || ''}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">NIC / National ID</span>
                    <strong className="text-white font-mono">{selectedUser.nic || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Gender</span>
                    <strong className="text-white">{selectedUser.gender || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Date of Birth</span>
                    <strong className="text-white">{selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString('en-GB') : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Personal Telephone</span>
                    <strong className="text-white">{selectedUser.telephone || '—'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 text-xs block">Residential Address</span>
                    <strong className="text-white font-normal block mt-0.5 whitespace-pre-line text-xs leading-relaxed text-gray-300">
                      {selectedUser.address || '—'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM ACTION ─────────────────────────────────────────────── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-sm w-full rounded-2xl p-6 glow-blue page-enter">
            <h3 className="text-lg font-bold text-white mb-2">{confirmConfig.title}</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              {confirmConfig.message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmConfig.action === 'reject') {
                    handleRejectUser(confirmConfig.userId);
                  } else {
                    handleUserAction(confirmConfig.userId, confirmConfig.action);
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors
                  ${confirmConfig.action === 'reject' || confirmConfig.action === 'suspend'
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-primary-600 hover:bg-primary-500'}`}
              >
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
