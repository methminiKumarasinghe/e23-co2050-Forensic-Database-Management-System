import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import IssueMLEFForm from '../../components/police/IssueMLEFForm';
import { getAssignedCases, getOfficerMlefs, getOfficerProfile } from '../../api/policeApi';
import api from '../../api/axios';

const NAV_ITEMS = [
  { id: 'overview',     label: 'Police Home',          icon: '🏠' },
  { id: 'issue_mlef',   label: 'Issue MLEF Requisition', icon: '📝' },
  { id: 'mlef_history', label: 'Issued MLEF Register', icon: '🏥' },
  { id: 'cases',        label: 'Assigned Cases',      icon: '📋' },
  { id: 'notifications',label: 'Notifications',       icon: '🔔' },
];

const StatCard = ({ value, label, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`stat-card border-l-4 ${color} text-left w-full hover:bg-gray-800/40 hover:-translate-y-0.5 transition-all duration-200`}
  >
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold text-white">{value !== null && value !== undefined ? value : '—'}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  </button>
);

const PoliceDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  // Officer Profile
  const [profile, setProfile] = useState(null);

  // Cases List
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesSearch, setCasesSearch] = useState('');

  // MLEFs List
  const [mlefs, setMlefs] = useState([]);
  const [mlefsLoading, setMlefsLoading] = useState(false);
  const [mlefsSearch, setMlefsSearch] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Officer Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getOfficerProfile();
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch officer profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch Cases
  const fetchCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const res = await getAssignedCases();
      setCases(res.data || []);
    } catch {
      showToast('Failed to fetch assigned cases', 'error');
    } finally {
      setCasesLoading(false);
    }
  }, []);

  // Fetch Issued MLEFs
  const fetchMlefs = useCallback(async () => {
    setMlefsLoading(true);
    try {
      const res = await getOfficerMlefs();
      setMlefs(res.data || []);
    } catch {
      showToast('Failed to fetch issued MLEF records', 'error');
    } finally {
      setMlefsLoading(false);
    }
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get('/admin/notifications?limit=20');
      setNotifications(res.data.data?.notifications || []);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'cases') fetchCases();
    if (activeTab === 'overview' || activeTab === 'mlef_history') fetchMlefs();
    if (activeTab === 'notifications') fetchNotifications();
  }, [activeTab, fetchCases, fetchMlefs, fetchNotifications]);

  const filteredCases = cases.filter(c => {
    const term = casesSearch.toLowerCase();
    return (c.case_number || '').toLowerCase().includes(term) ||
           (c.title || '').toLowerCase().includes(term) ||
           (c.case_status || '').toLowerCase().includes(term);
  });

  const filteredMlefs = mlefs.filter(m => {
    const term = mlefsSearch.toLowerCase();
    return (m.formatted_mlef_id || '').toLowerCase().includes(term) ||
           (m.case_number || '').toLowerCase().includes(term) ||
           (m.patient_name || '').toLowerCase().includes(term) ||
           (m.hospital_name || '').toLowerCase().includes(term) ||
           (m.status || '').toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-forensic-dark flex flex-col">
      <Navbar />

      {/* Main Layout Container with Sidebar Navigator */}
      <div className="flex flex-1 pt-16">

        {/* Left Sidebar Navigator */}
        <aside className="w-64 bg-gray-950/80 border-r border-gray-800/60 hidden md:flex flex-col p-4 space-y-1 shrink-0">
          <div className="text-gray-500 text-xs font-bold px-3 py-2 uppercase tracking-wider">Police Module</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Officer badge info footer inside sidebar */}
          {profile && (
            <div className="mt-auto pt-4 border-t border-gray-800/60">
              <div className="bg-blue-950/40 border border-blue-900/40 rounded-xl p-3 text-xs space-y-1">
                <div className="text-blue-300 font-bold">{profile.first_name} {profile.last_name}</div>
                <div className="text-gray-400">{profile.rank || 'Officer'} | Badge #{profile.badge_number || 'N/A'}</div>
                <div className="text-gray-500 text-[11px]">{profile.station_name || 'Police Station'}</div>
              </div>
            </div>
          )}
        </aside>

        {/* Dynamic Sub-page Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-screen-2xl mx-auto w-full">
          
          {/* Mobile Tab Navigator Dropdown */}
          <div className="md:hidden mb-6">
            <label className="text-xs text-gray-400 block mb-1">Select Police Module View</label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="select-field"
            >
              {NAV_ITEMS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.icon} {i.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toast Notification Banner */}
          {toast && (
            <div
              className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all page-enter ${
                toast.type === 'success'
                  ? 'bg-emerald-900/90 border border-emerald-700 text-emerald-200'
                  : 'bg-red-900/90 border border-red-700 text-red-200'
              }`}
            >
              {toast.msg}
            </div>
          )}

          {/* SUB-PAGE 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 page-enter">
              {/* Welcome header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-700/30 flex items-center justify-center text-2xl">
                  🚔
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Welcome, {user?.username}
                  </h1>
                  <p className="text-blue-400 text-sm font-medium">
                    {profile ? `${profile.rank || 'Officer'} • ${profile.station_name || 'Police Station'}` : 'Police Officer Dashboard'}
                  </p>
                </div>
              </div>

              {/* Quick Stat Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  value={cases.length}
                  label="Assigned Cases"
                  icon="📋"
                  color="border-blue-500"
                  onClick={() => setActiveTab('cases')}
                />
                <StatCard
                  value={mlefs.length}
                  label="Issued MLEFs"
                  icon="📝"
                  color="border-purple-500"
                  onClick={() => setActiveTab('mlef_history')}
                />
                <StatCard
                  value={mlefs.filter(m => m.status === 'Pending Hospital Acceptance').length}
                  label="Pending MLEF Requisitions"
                  icon="🏥"
                  color="border-amber-500"
                  onClick={() => setActiveTab('mlef_history')}
                />
                <StatCard
                  value={mlefs.filter(m => m.status === 'DRAFT').length}
                  label="Saved Draft MLEFs"
                  icon="💾"
                  color="border-indigo-500"
                  onClick={() => setActiveTab('mlef_history')}
                />
              </div>

              {/* Primary Call-to-Action to Issue MLEF */}
              <div className="glass rounded-2xl p-6 border border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-purple-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>📝</span> Issue Medico-Legal Examination Form (MLEF)
                  </h2>
                  <p className="text-gray-300 text-xs max-w-xl">
                    Create and submit official forensic medical examination requisitions to hospital JMO units for your assigned cases.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('issue_mlef')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all shrink-0 flex items-center gap-2"
                >
                  <span>+</span> Issue New MLEF
                </button>
              </div>

              {/* Recent Assigned Cases Overview Table */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-bold text-sm">Assigned Cases Summary</h3>
                  <button onClick={() => setActiveTab('cases')} className="text-xs text-blue-400 hover:underline">
                    View All Cases →
                  </button>
                </div>
                {casesLoading ? (
                  <div className="text-center py-6 text-xs text-gray-400">Loading cases...</div>
                ) : cases.length === 0 ? (
                  <div className="text-xs text-gray-500 py-4">No assigned police cases found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-gray-400 uppercase bg-gray-900/60 border-b border-gray-800">
                        <tr>
                          <th className="p-3">Case Number</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Incident Location</th>
                          <th className="p-3">Date Reported</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-gray-200">
                        {cases.slice(0, 5).map((c) => (
                          <tr key={c.case_id} className="hover:bg-gray-900/40">
                            <td className="p-3 font-mono font-bold text-blue-400">{c.case_number}</td>
                            <td className="p-3 font-medium">{c.title}</td>
                            <td className="p-3">
                              <span className="badge bg-gray-800 border border-gray-700 text-gray-300">
                                {c.case_status}
                              </span>
                            </td>
                            <td className="p-3">{c.incident_location || 'N/A'}</td>
                            <td className="p-3">{new Date(c.date_reported || c.created_at).toLocaleDateString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setActiveTab('issue_mlef')}
                                className="px-2.5 py-1 bg-blue-600/20 text-blue-300 border border-blue-700/40 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                              >
                                Issue MLEF
                              </button>
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

          {/* SUB-PAGE 2: ISSUE MLEF FORM */}
          {activeTab === 'issue_mlef' && (
            <IssueMLEFForm
              onSuccess={() => {
                fetchMlefs();
                showToast('MLEF requisition submitted successfully');
              }}
              onCancel={() => setActiveTab('overview')}
            />
          )}

          {/* SUB-PAGE 3: ISSUED MLEF HISTORY */}
          {activeTab === 'mlef_history' && (
            <div className="space-y-6 page-enter">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">Issued MLEF Register</h1>
                  <p className="text-gray-400 text-xs mt-1">Full history of medico-legal examination requisitions</p>
                </div>
                <button
                  onClick={() => setActiveTab('issue_mlef')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all"
                >
                  + Issue New MLEF
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={mlefsSearch}
                  onChange={(e) => setMlefsSearch(e.target.value)}
                  placeholder="Filter MLEF history by MLEF ID, Case Number, Patient Name, or Hospital..."
                  className="input-field pl-10"
                />
                <span className="absolute left-3 top-3 text-gray-500">🔍</span>
              </div>

              {/* MLEFs Table */}
              <div className="glass rounded-2xl p-6">
                {mlefsLoading ? (
                  <div className="py-12 text-center text-sm text-gray-400">Loading MLEF register...</div>
                ) : filteredMlefs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">No issued MLEF records found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-gray-400 uppercase bg-gray-900/60 border-b border-gray-800">
                        <tr>
                          <th className="p-3">Formatted MLEF ID</th>
                          <th className="p-3">Case Number</th>
                          <th className="p-3">Patient Name</th>
                          <th className="p-3">Hospital Unit</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Issue Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-gray-200">
                        {filteredMlefs.map((m) => (
                          <tr key={m.mlef_id} className="hover:bg-gray-900/40">
                            <td className="p-3 font-mono font-bold text-emerald-400">{m.formatted_mlef_id}</td>
                            <td className="p-3 font-mono text-blue-400">{m.case_number}</td>
                            <td className="p-3 font-medium text-white">{m.patient_name}</td>
                            <td className="p-3">{m.hospital_name}</td>
                            <td className="p-3">
                              <span
                                className={`badge border ${
                                  m.status === 'DRAFT'
                                    ? 'bg-gray-800 text-gray-300 border-gray-700'
                                    : 'bg-amber-900/40 text-amber-300 border-amber-800'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="p-3 text-gray-400">
                              {new Date(m.request_date).toLocaleString()}
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

          {/* SUB-PAGE 4: ASSIGNED CASES */}
          {activeTab === 'cases' && (
            <div className="space-y-6 page-enter">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Assigned Police Cases</h1>
                <p className="text-gray-400 text-xs mt-1">Cases assigned to your police station or badge</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={casesSearch}
                  onChange={(e) => setCasesSearch(e.target.value)}
                  placeholder="Filter cases by Case Number, Title, or Status..."
                  className="input-field pl-10"
                />
                <span className="absolute left-3 top-3 text-gray-500">🔍</span>
              </div>

              {/* Cases Register */}
              <div className="glass rounded-2xl p-6">
                {casesLoading ? (
                  <div className="py-12 text-center text-sm text-gray-400">Loading cases directory...</div>
                ) : filteredCases.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">No matching police cases found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-gray-400 uppercase bg-gray-900/60 border-b border-gray-800">
                        <tr>
                          <th className="p-3">Case Number</th>
                          <th className="p-3">Case Title</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Incident Date</th>
                          <th className="p-3">Location</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-gray-200">
                        {filteredCases.map((c) => (
                          <tr key={c.case_id} className="hover:bg-gray-900/40">
                            <td className="p-3 font-mono font-bold text-blue-400">{c.case_number}</td>
                            <td className="p-3 font-medium text-white">{c.title}</td>
                            <td className="p-3">
                              <span className="badge bg-gray-800 border border-gray-700 text-gray-300">
                                {c.case_status}
                              </span>
                            </td>
                            <td className="p-3">
                              {c.incident_datetime ? new Date(c.incident_datetime).toLocaleString() : 'N/A'}
                            </td>
                            <td className="p-3">{c.incident_location || 'N/A'}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setActiveTab('issue_mlef')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
                              >
                                Requisition MLEF
                              </button>
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

          {/* SUB-PAGE 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 page-enter max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Police Notifications & Alerts</h1>
                <p className="text-gray-400 text-xs mt-1">System updates, MLEF status changes, and case alerts</p>
              </div>

              <div className="glass rounded-2xl p-6">
                {notificationsLoading ? (
                  <div className="py-12 text-center text-sm text-gray-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">No system notifications found.</div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.notification_id}
                        className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl flex items-start gap-3"
                      >
                        <div className="text-xl mt-0.5">🔔</div>
                        <div className="flex-1">
                          <p className="text-white text-xs font-medium leading-relaxed">{n.message}</p>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {new Date(n.created_at).toLocaleString()} | Type: {n.notification_type || 'SYSTEM'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PoliceDashboard;
