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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <InfoCard icon="📋" title="MLEF Requests"
            subtitle="Incoming examination requests"
            color="border-cyan-500" />
          <InfoCard icon="🔬" title="Examinations"
            subtitle="Conduct medico-legal examinations"
            color="border-blue-500" />
          <InfoCard icon="🧪" title="Laboratory Results"
            subtitle="View completed lab results"
            link="/dashboard/jmo/lab-results"
            color="border-amber-500" />
          <InfoCard icon="📑" title="Medico-Legal Reports"
            subtitle="Prepare official MLR documents"
            color="border-emerald-500" />
        </div>

        <div className="glass rounded-xl p-6 border border-cyan-800/30">
          <div className="flex gap-3 items-start">
            <div className="text-cyan-400 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Role: Judicial Medical Officer</p>
              <p className="text-gray-400 text-xs mt-1">
                You can manage medico-legal examinations, injury documentation, specimen collection, autopsy reports,
                laboratory result review, and official medico-legal report generation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JMODashboard;
