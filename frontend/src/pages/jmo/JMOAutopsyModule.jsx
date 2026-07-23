import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getAutopsyCases } from '../../api/jmo.api';

const JMOAutopsyModule = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const data = await getAutopsyCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load autopsy cases', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.deceased_name && c.deceased_name.toLowerCase().includes(q)) ||
      (c.case_number && c.case_number.toLowerCase().includes(q)) ||
      (c.station_name && c.station_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="text-xs text-purple-400 mb-1">
              <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; Autopsy Cases
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              ⚰️ Post-Mortem & Autopsy Examination Cases
            </h1>
            <p className="text-xs text-gray-400 mt-1">Select an assigned post-mortem case to complete Health 1328 notification and autopsy records.</p>
          </div>

          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Deceased Name, Case #, Station..."
            className="input-field text-xs py-2 bg-gray-900 border-gray-800 text-white w-full sm:w-80"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div></div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No assigned post-mortem cases pending for autopsy in the system.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => (
              <div key={c.case_id} className="glass rounded-xl p-5 border border-purple-800/40 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                      {c.case_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.autopsy_status === 'Notification Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      c.autopsy_status === 'Autopsy Completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.autopsy_status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{c.deceased_name}</h3>
                  <p className="text-xs text-gray-300 font-medium mb-3">
                    Type: <span className="text-cyan-400">{c.case_type || 'Post-Mortem Investigation'}</span>
                  </p>

                  <div className="space-y-1.5 text-xs text-gray-300 bg-gray-950 p-3 rounded border border-gray-800">
                    <p><span className="text-gray-400">Police Station:</span> <span className="text-white font-medium">{c.station_name}</span></p>
                    <p><span className="text-gray-400">Date of Death:</span> {c.date_of_death ? new Date(c.date_of_death).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="text-gray-400">Place of Death:</span> {c.place_of_death || 'N/A'}</p>
                    <p><span className="text-gray-400">Assigned Date:</span> {new Date(c.assigned_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/dashboard/jmo/autopsy/${c.case_id}/notification`)}
                  className="btn-primary bg-purple-600 hover:bg-purple-500 border-purple-500 text-white w-full text-xs py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  <span>📋</span> Open Autopsy Case ➔
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JMOAutopsyModule;
