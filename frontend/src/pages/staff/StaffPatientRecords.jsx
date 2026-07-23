import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getHospitalPatients } from '../../api/medicalApi';

const StaffPatientRecords = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getHospitalPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patient records', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.nic && p.nic.toLowerCase().includes(q)) ||
      (p.medical_record_number && p.medical_record_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="text-xs text-emerald-400 mb-1">
              <Link to="/dashboard/medical-officer" className="hover:underline">Dashboard</Link> &gt; Patients
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              👤 Hospital Patient Records
            </h1>
          </div>
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, NIC, or record number..."
            className="input-field text-xs py-2 bg-gray-900 border-gray-800 text-white w-full sm:w-72"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No patient records found in this hospital.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.patient_id} className="glass rounded-xl p-5 border border-emerald-800/40 hover:border-emerald-500/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg">{p.full_name}</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono">
                    MRN: {p.medical_record_number || 'N/A'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-300">
                  <p><span className="text-gray-400">NIC:</span> {p.nic || 'N/A'}</p>
                  <p><span className="text-gray-400">Gender / DOB:</span> {p.gender || 'N/A'} | {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="text-gray-400">Blood Group:</span> <span className="font-bold text-red-400">{p.blood_group || 'Unspecified'}</span></p>
                  <p><span className="text-gray-400">Telephone:</span> {p.telephone || 'N/A'}</p>
                  <p><span className="text-gray-400">Emergency Contact:</span> {p.emergency_contact || 'N/A'} ({p.emergency_phone || 'N/A'})</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-emerald-400 flex justify-between items-center">
                  <span>Requisitions: {p.mlef_count || 0} MLEF(s)</span>
                  <span className="text-gray-400 text-[11px]">{p.address || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffPatientRecords;
