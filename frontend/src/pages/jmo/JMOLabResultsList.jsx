import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getLabResults } from '../../api/jmo.api';

const JMOLabResultsList = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getLabResults({ search });
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch lab results', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-cyan-500 mb-1">
              <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; Lab Results
            </div>
            <h1 className="text-2xl font-bold text-white">Laboratory Results</h1>
          </div>
        </div>

        <div className="glass rounded-xl p-4 mb-6 border border-gray-800">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Search by Case No, Patient Name, or Test Type..."
                className="input-field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary bg-cyan-600 hover:bg-cyan-500 border-cyan-500">Search</button>
          </form>
        </div>

        <div className="glass rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
             <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div></div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
               <div className="text-4xl mb-3">📂</div>
               <p>No completed laboratory results found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-4 font-medium">Result ID</th>
                    <th className="px-4 py-4 font-medium">Case Number</th>
                    <th className="px-4 py-4 font-medium">Patient</th>
                    <th className="px-4 py-4 font-medium">Test Type</th>
                    <th className="px-4 py-4 font-medium">Laboratory</th>
                    <th className="px-4 py-4 font-medium">Completed Date</th>
                    <th className="px-4 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {results.map(res => (
                    <tr key={res.result_id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-gray-400">{res.result_id.substring(0,8)}...</td>
                      <td className="px-4 py-4 font-medium text-white">{res.case_number}</td>
                      <td className="px-4 py-4">{res.patient_name}</td>
                      <td className="px-4 py-4">{res.test_name}</td>
                      <td className="px-4 py-4">{res.laboratory_name}</td>
                      <td className="px-4 py-4">{new Date(res.completed_date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <Link to={`/dashboard/jmo/lab-result/${res.result_id}`} className="text-cyan-500 hover:text-cyan-400 font-medium text-sm transition-colors">
                          View Details
                        </Link>
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

export default JMOLabResultsList;
