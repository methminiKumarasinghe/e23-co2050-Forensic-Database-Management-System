import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getResults } from '../../api/lab.api';

const LabResultArchive = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const data = await getResults();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load result archive', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="text-xs text-purple-400 mb-1">
              <Link to="/dashboard/lab-technician" className="hover:underline">Dashboard</Link> &gt; Result Archive
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📁 Historical Laboratory Result Archive
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div></div>
        ) : results.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No historical laboratory test results in archive.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(r => (
              <div key={r.result_id} className="glass rounded-xl p-5 border border-purple-800/40 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-purple-400 font-bold bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                      {r.case_number}
                    </span>
                    <span className="text-white font-bold text-base">{r.test_name}</span>
                  </div>
                  <p className="text-xs text-gray-400">Patient: {r.patient_name} | Completed: {new Date(r.completed_date).toLocaleString()}</p>
                </div>
                <Link to={`/dashboard/lab-technician/result/${r.result_id}`} className="btn-secondary text-xs py-1.5 px-4">
                  View Result Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LabResultArchive;
