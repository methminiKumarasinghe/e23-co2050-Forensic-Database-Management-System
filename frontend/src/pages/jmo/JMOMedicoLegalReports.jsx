import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getMlrCases } from '../../api/jmo.api';

const JMOMedicoLegalReports = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMlrCases();
  }, []);

  const fetchMlrCases = async () => {
    try {
      const data = await getMlrCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load MLR cases', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.patient_name && c.patient_name.toLowerCase().includes(q)) ||
      (c.case_number && c.case_number.toLowerCase().includes(q)) ||
      (c.formatted_mlef_id && c.formatted_mlef_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="text-xs text-emerald-400 mb-1">
              <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; MLR Cases
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📑 Medico-Legal Report (MLR) Case Management
            </h1>
            <p className="text-xs text-gray-400 mt-1">Select an assigned case to prepare, review, sign, and finalize Medico-Legal Reports.</p>
          </div>

          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Patient Name, Case #, or MLEF #..."
            className="input-field text-xs py-2 bg-gray-900 border-gray-800 text-white w-full sm:w-80"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
        ) : filteredCases.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No assigned forensic cases pending for Medico-Legal Report preparation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCases.map(c => (
              <div key={c.mlef_id} className="glass rounded-xl p-5 border border-emerald-800/40 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                      {c.formatted_mlef_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.mlr_status_label === 'Signed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      c.mlr_status_label === 'Draft MLR' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {c.mlr_status_label}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{c.patient_name}</h3>
                  <p className="text-xs text-gray-300 font-medium mb-3">
                    Case: <span className="font-mono text-cyan-400">{c.case_number}</span> ({c.case_type || 'General'})
                  </p>

                  <div className="space-y-2 text-xs text-gray-300 bg-gray-950 p-3 rounded border border-gray-800">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Police Station:</span>
                      <span className="text-white font-medium">{c.station_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Examination Status:</span>
                      <span className="text-emerald-300 font-semibold">{c.exam_status_label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Laboratory Status:</span>
                      <span className="text-amber-300 font-semibold">{c.lab_status_label}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {c.mlr_status_label === 'Signed' ? (
                    <button 
                      onClick={() => navigate(`/dashboard/jmo/mlr/${c.report_id}/view`)}
                      className="btn-secondary w-full text-center text-xs py-2 block border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold"
                    >
                      View Signed Final MLR ➔
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/dashboard/jmo/mlr/${c.mlef_id}/prepare`)}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white w-full text-xs py-2 font-bold flex items-center justify-center gap-2"
                    >
                      <span>📑</span> {c.mlr_status_label === 'Draft MLR' ? 'Continue Draft MLR' : 'Prepare MLR'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JMOMedicoLegalReports;
