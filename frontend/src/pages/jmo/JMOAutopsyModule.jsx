import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getAutopsies } from '../../api/jmo.api';

const JMOAutopsyModule = () => {
  const [autopsies, setAutopsies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutopsies();
  }, []);

  const fetchAutopsies = async () => {
    try {
      const data = await getAutopsies();
      setAutopsies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load autopsies', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-purple-400 mb-1">
            <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; Autopsy Module
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            ⚰️ Post-Mortem & Autopsy Examination Module
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div></div>
        ) : autopsies.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No post-mortem examination notifications or deceased records pending in database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autopsies.map(a => (
              <div key={a.deceased_id} className="glass rounded-xl p-5 border border-purple-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{a.deceased_name}</h3>
                    <p className="text-xs text-gray-400">NIC: {a.nic || 'N/A'} | Gender: {a.gender || 'N/A'}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    a.identified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {a.identified ? 'IDENTIFIED' : 'UNIDENTIFIED'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300 bg-gray-950 p-3 rounded border border-gray-800">
                  <p><span className="text-gray-400">Date of Death:</span> {a.date_of_death ? new Date(a.date_of_death).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="text-gray-400">Place of Death:</span> {a.place_of_death || 'N/A'}</p>
                  {a.identification_notes && (
                    <p><span className="text-gray-400">Notes:</span> {a.identification_notes}</p>
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

export default JMOAutopsyModule;
