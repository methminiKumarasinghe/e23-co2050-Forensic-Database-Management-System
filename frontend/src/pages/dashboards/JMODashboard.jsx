import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { getNotifications, markNotificationRead, getAssignedMlefs } from '../../api/jmo.api';

const InfoCard = ({ icon, title, subtitle, color, link }) => (
  <Link to={link || '#'} className={`glass rounded-xl p-5 border-l-4 ${color} hover:scale-[1.01] transition-transform block`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-semibold text-white text-sm">{title}</div>
    <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
  </Link>
);

const JMODashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [assignedMlefs, setAssignedMlefs] = useState([]);
  const [loadingMlefs, setLoadingMlefs] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchAssignedMlefs();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const fetchAssignedMlefs = async () => {
    try {
      const data = await getAssignedMlefs();
      setAssignedMlefs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch assigned MLEFs', err);
    } finally {
      setLoadingMlefs(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Notifications Alert Area */}
        {Array.isArray(notifications) && notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map(notif => (
              <div key={notif.notification_id} className="flex justify-between items-center bg-blue-900/40 border border-blue-500/50 p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-3 text-blue-200">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <p className="font-medium">{notif.message}</p>
                    <p className="text-xs opacity-75">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleMarkRead(notif.notification_id)}
                  className="px-3 py-1 bg-blue-800/50 hover:bg-blue-700/50 text-blue-100 rounded text-sm transition-colors"
                >
                  Mark Read
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-8 page-enter">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-700/30 flex items-center justify-center text-2xl">
              🩺
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, Dr. {user?.username}</h1>
              <p className="text-cyan-400 text-sm font-medium">Judicial Medical Officer Dashboard</p>
            </div>
          </div>
        </div>

        {/* Assigned MLEF Cases Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📄</span> Assigned MLEF Cases
            </h2>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-semibold">
              {assignedMlefs.filter(m => m.status !== 'COMPLETED').length} Pending Examination(s)
            </span>
          </div>

          {loadingMlefs ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div></div>
          ) : assignedMlefs.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">No assigned MLEF cases pending for examination.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedMlefs.map(mlef => (
                <div key={mlef.mlef_id} className="glass rounded-xl p-5 border border-cyan-800/40 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/50">
                        {mlef.formatted_mlef_id || mlef.case_number}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mlef.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                        mlef.status === 'ASSIGNED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {mlef.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{mlef.patient_name}</h3>
                    <p className="text-xs text-gray-300 font-medium mb-3 flex items-center gap-1">
                      <span>🏷️</span> {mlef.case_title || mlef.case_type || 'Medico-Legal Examination'}
                    </p>

                    <div className="space-y-1.5 text-xs text-gray-400 border-t border-gray-800/80 pt-3 mb-4">
                      <div className="flex justify-between">
                        <span>Police Station:</span>
                        <span className="text-gray-200 font-medium">{mlef.station_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Date:</span>
                        <span className="text-gray-200">{new Date(mlef.request_date || mlef.assigned_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {mlef.status === 'COMPLETED' ? (
                      <Link 
                        to={`/dashboard/jmo/mlef/${mlef.mlef_id}/report`}
                        className="btn-secondary w-full text-center text-xs py-2 block border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        View MLEF Report
                      </Link>
                    ) : (
                      <button 
                        onClick={() => navigate(`/dashboard/jmo/mlef/${mlef.mlef_id}/complete`)}
                        className="btn-primary bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white w-full text-xs py-2 flex items-center justify-center gap-2"
                      >
                        <span>📝</span> Complete MLEF
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Cards */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🔬</span> Laboratory & Quick Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <InfoCard 
            icon="🧪" 
            title="Create Laboratory Request"
            subtitle="Submit a new lab request to a hospital laboratory"
            link="/dashboard/jmo/create-lab-request"
            color="border-cyan-500" 
          />
          <InfoCard 
            icon="📋" 
            title="My Laboratory Requests"
            subtitle="Track status of submitted lab requests"
            link="/dashboard/jmo/lab-requests"
            color="border-amber-500" 
          />
          <InfoCard 
            icon="📊" 
            title="Completed Lab Results"
            subtitle="View & download findings from laboratories"
            link="/dashboard/jmo/lab-results"
            color="border-green-500" 
          />
          <InfoCard 
            icon="📑" 
            title="Medico-Legal Reports"
            subtitle="Prepare official MLR documents"
            color="border-emerald-500" 
          />
          <InfoCard 
            icon="⚰️" 
            title="Autopsy Module"
            subtitle="Conduct autopsies and COD reports"
            color="border-purple-500" 
          />
        </div>

      </main>
    </div>
  );
};

export default JMODashboard;
