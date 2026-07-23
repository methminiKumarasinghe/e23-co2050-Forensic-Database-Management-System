import { useState, useEffect } from 'react';
import { getHospitalMlefs, getHospitalJmos, assignMlefToJmo } from '../../api/medicalApi';

/**
 * Flash Card Component to be rendered inside Dashboard Grid
 */
export const MlefFlashCard = ({ onClick, pendingCount = 0 }) => (
  <div
    onClick={onClick}
    className="glass rounded-xl p-5 border-l-4 border-amber-500 hover:scale-[1.02] transition-all cursor-pointer relative group border border-amber-500/20 shadow-lg"
  >
    {pendingCount > 0 ? (
      <span className="absolute top-4 right-4 bg-amber-500 text-gray-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
        {pendingCount} PENDING
      </span>
    ) : (
      <span className="absolute top-4 right-4 bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold px-2 py-0.5 rounded-md">
        UP TO DATE
      </span>
    )}
    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📥</div>
    <div className="font-bold text-white text-base flex items-center gap-1.5">
      <span>Pending MLEF Requisitions</span>
    </div>
    <div className="text-xs text-gray-400 mt-1">
      Touch to view full details & assign available JMOs
    </div>
    <div className="mt-3 text-amber-400 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
      <span>View Full Details & Assign JMO</span>
      <span>➔</span>
    </div>
  </div>
);

/**
 * Full Details Modal Component
 */
export const MlefDetailsModal = ({ isOpen, onClose, onDataChange }) => {
  const [mlefs, setMlefs] = useState([]);
  const [jmos, setJmos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI state
  const [filter, setFilter] = useState('PENDING'); // 'PENDING' | 'ASSIGNED' | 'ALL'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJmoMap, setSelectedJmoMap] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [mlefRes, jmoRes] = await Promise.all([
        getHospitalMlefs(),
        getHospitalJmos(),
      ]);
      const mData = mlefRes.data || [];
      const jData = jmoRes.data || [];
      setMlefs(mData);
      setJmos(jData);
      if (onDataChange) onDataChange(mData);
    } catch (err) {
      console.error('Error loading forensic staff data:', err);
      setError(err.response?.data?.message || 'Failed to load hospital MLEF requisitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJmoSelectChange = (mlefId, jmoId) => {
    setSelectedJmoMap((prev) => ({
      ...prev,
      [mlefId]: jmoId,
    }));
  };

  const handleAssignJmo = async (mlefId) => {
    const jmoId = selectedJmoMap[mlefId];
    if (!jmoId) {
      alert('Please select an available Judicial Medical Officer (JMO) from the dropdown.');
      return;
    }

    setAssigningId(mlefId);
    setSuccessToast('');
    try {
      const res = await assignMlefToJmo(mlefId, jmoId);
      const assignedJmoName = res.data?.assigned_jmo || 'JMO';
      const formattedMlefId = res.data?.formatted_mlef_id || 'MLEF';

      setSuccessToast(`Successfully assigned ${formattedMlefId} to Dr. ${assignedJmoName}!`);
      setTimeout(() => setSuccessToast(''), 5000);

      // Refresh data
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign JMO. Please try again.');
    } finally {
      setAssigningId(null);
    }
  };

  // Filtered MLEFs
  const filteredMlefs = mlefs.filter((m) => {
    if (filter === 'PENDING' && m.status !== 'PENDING') return false;
    if (filter === 'ASSIGNED' && m.status !== 'ASSIGNED') return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (m.formatted_mlef_id && m.formatted_mlef_id.toLowerCase().includes(q)) ||
      (m.patient_name && m.patient_name.toLowerCase().includes(q)) ||
      (m.case_number && m.case_number.toLowerCase().includes(q)) ||
      (m.requesting_officer_name && m.requesting_officer_name.toLowerCase().includes(q))
    );
  });

  const pendingCount = mlefs.filter((m) => m.status === 'PENDING').length;
  const assignedCount = mlefs.filter((m) => m.status === 'ASSIGNED').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 page-enter">
      <div className="bg-gray-950 border border-amber-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              📥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">MLEF Requisitions & JMO Assignment</h2>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-extrabold animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Full Details View — Requisitions submitted by Police Officers needing JMO assignment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center text-base transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Toast Notification */}
          {successToast && (
            <div className="p-3 bg-emerald-950 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✅</span>
                <span>{successToast}</span>
              </div>
              <button onClick={() => setSuccessToast('')} className="text-gray-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-800">
            {/* Filter Tabs */}
            <div className="bg-gray-950 p-1 rounded-xl border border-gray-800 flex items-center text-xs w-full sm:w-auto">
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('ASSIGNED')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === 'ASSIGNED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Assigned ({assignedCount})
              </button>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === 'ALL'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({mlefs.length})
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-xl text-xs flex items-center gap-1.5"
            >
              🔄 {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by MLEF ID (e.g. MLEF-000001), Patient Name, Case Number, or Officer..."
              className="input-field pl-9 text-xs py-2 bg-gray-900/80 border-gray-800"
            />
            <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* List of Requisitions */}
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs animate-pulse space-y-1">
              <div className="text-2xl">⏳</div>
              <p>Fetching hospital MLEF requisitions and available JMOs...</p>
            </div>
          ) : filteredMlefs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800 text-xs space-y-1">
              <p className="text-2xl">📭</p>
              <p className="font-semibold text-gray-400">No MLEF requisitions in this view.</p>
              <p className="text-gray-600">
                {filter === 'PENDING'
                  ? 'All incoming MLEF requisitions have been assigned to JMOs.'
                  : 'No matching records match your filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMlefs.map((mlef) => {
                const isPending = mlef.status === 'PENDING';

                return (
                  <div
                    key={mlef.mlef_id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPending
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                        : 'bg-gray-900/50 border-gray-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Details */}
                      <div className="space-y-2.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Formatted MLEF ID */}
                          <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono font-extrabold text-xs shadow-sm">
                            {mlef.formatted_mlef_id}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`badge text-[10px] font-semibold ${
                              isPending
                                ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            }`}
                          >
                            {isPending ? '⏳ PENDING JMO ASSIGNMENT' : '✓ ASSIGNED TO JMO'}
                          </span>

                          {mlef.hospital_name && (
                            <span className="text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded">
                              🏛️ {mlef.hospital_name}
                            </span>
                          )}
                        </div>

                        {/* Pending Message Container */}
                        <div className="p-3 bg-gray-950 border border-gray-800/80 rounded-xl text-xs space-y-1.5">
                          <div className="font-bold text-white text-sm flex flex-wrap justify-between items-center gap-2">
                            <span>👤 Patient: {mlef.patient_name || 'N/A'}</span>
                            <span className="text-gray-400 text-xs font-mono">Case: {mlef.case_number || 'N/A'}</span>
                          </div>
                          <p className="text-gray-300 text-xs">
                            <span className="text-gray-400 font-medium">Requesting Officer:</span>{' '}
                            {mlef.requesting_officer_name || 'Police Officer'} (Badge: {mlef.officer_badge || 'N/A'})
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Date Requested: {mlef.request_date ? new Date(mlef.request_date).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        {/* Referral Reason */}
                        {mlef.reason && (
                          <div className="text-xs text-gray-300">
                            <span className="text-gray-400 font-semibold block mb-0.5">Referral Reason:</span>
                            <p className="bg-gray-950 p-2.5 rounded-lg border border-gray-800/60 text-gray-300">
                              "{mlef.reason}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: JMO Assignment Selector */}
                      <div className="lg:w-80 bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3 text-xs">
                        {isPending ? (
                          <>
                            <label className="font-bold text-amber-400 flex items-center gap-1 text-xs">
                              <span>👨‍⚕️</span> Assign Available JMO *
                            </label>

                            <select
                              value={selectedJmoMap[mlef.mlef_id] || ''}
                              onChange={(e) => handleJmoSelectChange(mlef.mlef_id, e.target.value)}
                              className="select-field text-xs py-2 bg-gray-900 border-amber-500/40 text-white"
                            >
                              <option value="">-- Select Available JMO --</option>
                              {jmos.map((jmo) => (
                                <option key={jmo.jmo_id} value={jmo.jmo_id}>
                                  Dr. {jmo.full_name} ({jmo.specialization || 'Forensic Medicine'})
                                </option>
                              ))}
                            </select>

                            {jmos.length === 0 && (
                              <p className="text-[11px] text-amber-300">
                                ⚠️ No JMOs registered for this hospital.
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAssignJmo(mlef.mlef_id)}
                              disabled={assigningId === mlef.mlef_id || !selectedJmoMap[mlef.mlef_id]}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                selectedJmoMap[mlef.mlef_id]
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                              }`}
                            >
                              {assigningId === mlef.mlef_id ? 'Assigning...' : 'Assign JMO Now ➔'}
                            </button>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-gray-400 font-semibold block text-xs">Assigned JMO:</span>
                            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 font-bold text-xs">
                              Dr. {mlef.assigned_jmo_name || 'Assigned JMO'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* JMO Specialist Roster Footer inside Modal */}
          <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>🩺</span> Hospital JMO Specialists Roster ({jmos.length} Available)
            </h3>
            <div className="flex flex-wrap gap-2">
              {jmos.map((j) => (
                <span key={j.jmo_id} className="text-[11px] bg-gray-950 px-2.5 py-1 rounded-md text-gray-300 border border-gray-800">
                  Dr. {j.full_name} ({j.specialization || 'Pathology'})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-900/80 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition-all"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
