import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

const TABS = [
  { id: 'pending',  label: 'Pending Approval', color: 'amber' },
  { id: 'all',      label: 'All Users',         color: 'blue'  },
];

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
  const labels = {
    ADMIN: 'Admin', POLICE: 'Police', JMO: 'JMO',
    MEDICAL_OFFICER: 'Med. Officer', LAB_TECHNICIAN: 'Lab Tech',
    GOVERNMENT_ANALYST: 'Hosp. Staff',
  };
  return (
    <span className={`badge border ${colors[role] || 'bg-gray-800 text-gray-400'}`}>
      {labels[role] || role}
    </span>
  );
};

const StatCard = ({ value, label, icon, color }) => (
  <div className={`stat-card border-l-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [tab, setTab]           = useState('pending');
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === 'pending' ? '/admin/users/pending' : '/admin/users';
      const res = await api.get(url);
      setUsers(res.data.data);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId, action) => {
    setActionId(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/${action}`);
      showToast(res.data.message);
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionId(null);
    }
  };

  const pendingCount  = users.filter(u => u.status === 'INACTIVE').length;
  const activeCount   = users.filter(u => u.status === 'ACTIVE').length;
  const suspendCount  = users.filter(u => u.status === 'SUSPENDED').length;

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8 page-enter">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage user registrations and access control</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 page-enter">
          <StatCard value={users.length} label="Total Users"     icon="👥" color="border-primary-600" />
          <StatCard value={tab === 'pending' ? pendingCount : users.filter(u=>u.status==='INACTIVE').length || '—'}
            label="Pending"      icon="⏳" color="border-amber-500" />
          <StatCard value={activeCount}   label="Active"        icon="✅" color="border-emerald-500" />
          <StatCard value={suspendCount}  label="Suspended"     icon="🚫" color="border-red-500" />
        </div>

        {/* Toast notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl transition-all
            ${toast.type === 'success'
              ? 'bg-emerald-900/90 border border-emerald-700 text-emerald-200'
              : 'bg-red-900/90 border border-red-700 text-red-200'}`}>
            {toast.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/50 rounded-xl p-1 w-fit border border-gray-800">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-400 font-medium">
                {tab === 'pending' ? 'No pending registrations' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id}>
                      <td className="font-medium text-white">
                        {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : '—'}
                      </td>
                      <td className="font-mono text-xs">{u.username}</td>
                      <td className="text-xs">{u.email || '—'}</td>
                      <td><RoleBadge role={u.role} /></td>
                      <td><StatusBadge status={u.status} /></td>
                      <td className="text-xs text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {u.status === 'INACTIVE' && (
                            <button
                              onClick={() => handleAction(u.user_id, 'approve')}
                              disabled={actionId === u.user_id}
                              className="btn-success text-xs py-1 px-3"
                            >
                              {actionId === u.user_id ? '...' : '✓ Approve'}
                            </button>
                          )}
                          {u.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleAction(u.user_id, 'suspend')}
                              disabled={actionId === u.user_id}
                              className="btn-danger text-xs py-1 px-3"
                            >
                              {actionId === u.user_id ? '...' : 'Suspend'}
                            </button>
                          )}
                          {u.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleAction(u.user_id, 'reactivate')}
                              disabled={actionId === u.user_id}
                              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors"
                            >
                              {actionId === u.user_id ? '...' : 'Reactivate'}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
