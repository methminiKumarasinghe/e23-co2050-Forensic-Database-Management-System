import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getHospitalReports } from '../../api/medicalApi';

const StaffMedicalReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await getHospitalReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-emerald-400 mb-1">
            <Link to="/dashboard/medical-officer" className="hover:underline">Dashboard</Link> &gt; Medical Reports
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📋 Hospital Medico-Legal Reports
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
        ) : reports.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No Medico-Legal Reports found for this hospital.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.report_id} className="glass rounded-xl p-5 border border-gray-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                      {r.report_number || 'MLR-RECORD'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{r.patient_name} — {r.case_title || r.case_number}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    r.report_status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {r.report_status || 'DRAFT'}
                  </span>
                </div>

                <div className="text-xs text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-950/60 p-4 rounded border border-gray-800">
                  <div>
                    <span className="text-gray-400 block font-semibold mb-1">Examining JMO:</span>
                    <p className="text-white font-medium">Dr. {r.jmo_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold mb-1">Prepared Date:</span>
                    <p className="text-white">{new Date(r.prepared_date).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-400 block font-semibold mb-1">Medical Opinion & Conclusion:</span>
                    <p className="text-gray-200">{r.medical_opinion || 'Pending JMO conclusion'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffMedicalReports;
