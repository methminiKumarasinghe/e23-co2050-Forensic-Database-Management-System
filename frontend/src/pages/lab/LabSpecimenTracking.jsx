import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getLabSpecimens } from '../../api/lab.api';

const LabSpecimenTracking = () => {
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecimens();
  }, []);

  const fetchSpecimens = async () => {
    try {
      const data = await getLabSpecimens();
      setSpecimens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lab specimens', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-amber-400 mb-1">
            <Link to="/dashboard/lab-technician" className="hover:underline">Dashboard</Link> &gt; Specimen Tracking
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🧫 Laboratory Specimen Tracking & Chain of Custody
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div></div>
        ) : specimens.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No specimens received for testing in your laboratory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specimens.map(s => (
              <div key={s.specimen_id} className="glass rounded-xl p-5 border border-amber-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-base">{s.specimen_type || 'Forensic Sample'}</span>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
                    {s.priority || 'NORMAL'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300 bg-gray-950 p-3 rounded border border-gray-800">
                  <p><span className="text-gray-400">Case Number:</span> <span className="font-mono text-cyan-400">{s.case_number}</span></p>
                  <p><span className="text-gray-400">Patient:</span> {s.patient_name}</p>
                  <p><span className="text-gray-400">Requesting JMO:</span> Dr. {s.jmo_name}</p>
                  <p><span className="text-gray-400">Collection Date:</span> {new Date(s.collection_datetime).toLocaleString()}</p>
                  {s.remarks && <p><span className="text-gray-400">Remarks:</span> {s.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LabSpecimenTracking;
