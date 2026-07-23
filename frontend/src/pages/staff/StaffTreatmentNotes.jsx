import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getHospitalMlefs } from '../../api/medicalApi';

const StaffTreatmentNotes = () => {
  const [mlefs, setMlefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await getHospitalMlefs();
      setMlefs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-amber-400 mb-1">
            <Link to="/dashboard/medical-officer" className="hover:underline">Dashboard</Link> &gt; Clinical Notes
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            💊 Clinical Observations & Treatment Notes
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div></div>
        ) : mlefs.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No clinical observation notes available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mlefs.map(m => (
              <div key={m.mlef_id} className="glass rounded-xl p-5 border border-gray-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-amber-400 font-bold bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
                    {m.formatted_mlef_id || 'MLEF'}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(m.request_date).toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-white text-base">Patient: {m.patient_name} — Case: {m.case_number}</h3>
                <div className="bg-gray-950 p-4 rounded border border-gray-800 text-xs text-gray-300">
                  <span className="text-gray-400 block font-semibold mb-1">Clinical Reason & History:</span>
                  <p>"{m.reason || 'No specific clinical history provided.'}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffTreatmentNotes;
