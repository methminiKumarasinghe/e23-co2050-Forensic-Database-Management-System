import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getHospitalMlefs } from '../../api/medicalApi';

const StaffNotifications = () => {
  const [mlefs, setMlefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getHospitalMlefs();
      setMlefs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-rose-400 mb-1">
            <Link to="/dashboard/medical-officer" className="hover:underline">Dashboard</Link> &gt; Notifications
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🔔 System Alerts & Notifications
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div></div>
        ) : (
          <div className="space-y-3">
            {mlefs.map(m => (
              <div key={m.mlef_id} className="glass rounded-xl p-4 border border-rose-800/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📥</span>
                  <div>
                    <p className="text-white font-medium text-sm">
                      New MLEF Requisition ({m.formatted_mlef_id}) received for Case {m.case_number}.
                    </p>
                    <p className="text-xs text-gray-400">Patient: {m.patient_name} | Requested: {new Date(m.request_date).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  m.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffNotifications;
