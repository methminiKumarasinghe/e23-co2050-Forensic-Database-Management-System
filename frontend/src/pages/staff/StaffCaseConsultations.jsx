import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getHospitalCases } from '../../api/medicalApi';

const StaffCaseConsultations = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const data = await getHospitalCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cases', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-purple-400 mb-1">
            <Link to="/dashboard/medical-officer" className="hover:underline">Dashboard</Link> &gt; Case Consultations
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🔍 Medico-Legal Case Consultations
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div></div>
        ) : cases.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No active case consultations registered for this hospital.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map(c => (
              <div key={c.case_id} className="glass rounded-xl p-5 border border-purple-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                      {c.case_number}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{c.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
                    {c.case_type || 'General'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300">
                  <p><span className="text-gray-400">Patient / Examinee:</span> <span className="text-white font-medium">{c.patient_name}</span></p>
                  <p><span className="text-gray-400">Police Station:</span> {c.station_name}</p>
                  <p><span className="text-gray-400">Date Reported:</span> {new Date(c.date_reported).toLocaleDateString()}</p>
                </div>

                {c.description && (
                  <p className="text-xs text-gray-300 bg-gray-950 p-3 rounded border border-gray-800">
                    "{c.description}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffCaseConsultations;
