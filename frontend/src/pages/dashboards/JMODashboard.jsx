import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { getNotifications, markNotificationRead } from '../../api/jmo.api';

const InfoCard = ({ icon, title, subtitle, color, link }) => (
  <Link to={link || '#'} className={`glass rounded-xl p-5 border-l-4 ${color} hover:scale-[1.01] transition-transform block`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-semibold text-white text-sm">{title}</div>
    <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
  </Link>
);

const JMODashboard = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
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
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.username}</h1>
              <p className="text-cyan-400 text-sm font-medium">Judicial Medical Officer Dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <InfoCard icon="📋" title="MLEF Requests"
            subtitle="View incoming examination requests from police"
            color="border-cyan-500" />
          <InfoCard icon="🔬" title="Examinations"
            subtitle="Conduct and manage medico-legal examinations"
            color="border-blue-500" />
          <InfoCard icon="🩹" title="Injury Records"
            subtitle="Document injuries and body diagrams"
            color="border-red-500" />
          <InfoCard icon="🧪" title="Create Laboratory Request"
            subtitle="Submit new lab requests to hospital laboratories"
            link="/dashboard/jmo/create-lab-request"
            color="border-purple-500" />
          <InfoCard icon="📋" title="My Laboratory Requests"
            subtitle="Track status of submitted lab requests"
            link="/dashboard/jmo/lab-requests"
            color="border-amber-500" />
          <InfoCard icon="📊" title="Completed Lab Results"
            subtitle="View & download findings from laboratories"
            link="/dashboard/jmo/lab-results"
            color="border-green-500" />
          <InfoCard icon="📑" title="Medico-Legal Reports"
            subtitle="Prepare and sign official MLR documents"
            color="border-emerald-500" />
          <InfoCard icon="⚰️" title="Autopsy Module"
            subtitle="Conduct autopsies and cause of death reports"
            color="border-gray-500" />
        </div>

      </main>
    </div>
  );
};

export default JMODashboard;
