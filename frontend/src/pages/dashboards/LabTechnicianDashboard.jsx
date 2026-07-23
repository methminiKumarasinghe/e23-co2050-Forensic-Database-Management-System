import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getDashboardStats } from '../../api/lab.api';

const StatCard = ({ icon, title, value, colorClass, link }) => (
  <Link to={link || '/dashboard/lab-technician/requests'} className={`glass rounded-xl p-5 border-l-4 ${colorClass} hover:scale-[1.01] transition-transform block`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-400 text-sm font-medium">{title}</div>
        <div className="text-3xl font-bold text-white mt-1">{value ?? 0}</div>
      </div>
      <div className={`text-4xl ${colorClass.replace('border-', 'text-')}`}>
        {icon}
      </div>
    </div>
  </Link>
);

const InfoCard = ({ icon, title, subtitle, color, link }) => (
  <Link to={link || '#'} className={`glass rounded-xl p-5 border-l-4 ${color} hover:scale-[1.01] transition-transform block`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-semibold text-white text-sm">{title}</div>
    <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
  </Link>
);

const LabTechnicianDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    processing: 0,
    completed: 0,
    todayRequests: 0,
    recentResults: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        if (data) {
          setStats({
            pending: data.pending || 0,
            accepted: data.accepted || 0,
            processing: data.processing || 0,
            completed: data.completed || 0,
            todayRequests: data.todayRequests || 0,
            recentResults: Array.isArray(data.recentResults) ? data.recentResults : []
          });
        }
      } catch (err) {
        console.error('Failed to fetch lab stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="flex justify-between items-center mb-8 page-enter">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-700/30 flex items-center justify-center text-2xl">
              🔬
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Laboratory Dashboard</h1>
              <p className="text-amber-400 text-sm font-medium">Welcome back, {user?.username}</p>
            </div>
          </div>
          <Link to="/dashboard/lab-technician/requests" className="btn-primary flex items-center gap-2">
            View All Requests
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {loading ? (
           <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon="📥" title="Today's Requests" value={stats.todayRequests} colorClass="border-blue-500" link="/dashboard/lab-technician/requests" />
              <StatCard icon="⏳" title="Pending Requests" value={stats.pending} colorClass="border-amber-500" link="/dashboard/lab-technician/requests?status=PENDING" />
              <StatCard icon="✓" title="Accepted Requests" value={stats.accepted} colorClass="border-green-500" link="/dashboard/lab-technician/requests?status=ACCEPTED" />
              <StatCard icon="⚗️" title="Tests in Progress" value={stats.processing} colorClass="border-yellow-500" link="/dashboard/lab-technician/requests?status=PROCESSING" />
              <StatCard icon="📊" title="Completed Tests" value={stats.completed} colorClass="border-purple-500" link="/dashboard/lab-technician/requests?status=COMPLETED" />
            </div>

            {/* Quick Action Navigation Grid */}
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🧫</span> Laboratory Actions & Navigation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <InfoCard icon="🧪" title="Lab Requests" subtitle="View incoming laboratory test requests" link="/dashboard/lab-technician/requests" color="border-amber-500" />
              <InfoCard icon="⚗️" title="Active Tests" subtitle="Manage tests currently in progress" link="/dashboard/lab-technician/requests?status=PROCESSING" color="border-yellow-500" />
              <InfoCard icon="🧫" title="Specimen Tracking" subtitle="Track specimen collection and chain of custody" link="/dashboard/lab-technician/specimens" color="border-purple-500" />
              <InfoCard icon="📁" title="Result Archive" subtitle="View historical completed laboratory results" link="/dashboard/lab-technician/archive" color="border-blue-500" />
            </div>

            <div className="glass rounded-xl p-6 border border-amber-800/30">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Results</h2>
              {!stats.recentResults || stats.recentResults.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent results found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3">Result ID</th>
                        <th className="px-4 py-3">Case No</th>
                        <th className="px-4 py-3">Test Type</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Completed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentResults.map((result) => (
                        <tr key={result.result_id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                          <td className="px-4 py-3 font-mono text-xs">{result.result_id ? result.result_id.substring(0, 8) : ''}...</td>
                          <td className="px-4 py-3">{result.case_number}</td>
                          <td className="px-4 py-3">{result.test_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              result.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' : 
                              result.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {result.priority || 'NORMAL'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{result.completed_date ? new Date(result.completed_date).toLocaleDateString() : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LabTechnicianDashboard;
