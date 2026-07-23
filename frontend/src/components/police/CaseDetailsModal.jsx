import { useState, useEffect } from 'react';
import { getCaseDetails, assignOfficerToCase, updateCaseStatus, getOfficersList } from '../../api/policeApi';

const STATUS_OPTIONS = [
  { id: 1, name: 'OPEN' },
  { id: 2, name: 'UNDER_INVESTIGATION' },
  { id: 3, name: 'AWAITING_EXAMINATION' },
  { id: 4, name: 'IN_COURT' },
  { id: 5, name: 'CLOSED' },
];

const CaseDetailsModal = ({ isOpen, onClose, caseId, onRequestMlef, onAddEvidence }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab within Case Modal
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'evidence' | 'timeline' | 'reports' | 'officers'

  // Officer assignment state
  const [availableOfficers, setAvailableOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('INVESTIGATOR');
  const [assigning, setAssigning] = useState(false);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDetails = async () => {
    if (!caseId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getCaseDetails(caseId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load case details:', err);
      setError(err.response?.data?.message || 'Failed to fetch case details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await getOfficersList();
      setAvailableOfficers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch officers list:', err);
    }
  };

  useEffect(() => {
    if (isOpen && caseId) {
      fetchDetails();
      fetchOfficers();
    }
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  const handleStatusChange = async (newStatusId) => {
    setUpdatingStatus(true);
    try {
      await updateCaseStatus({ case_id: caseId, status_id: parseInt(newStatusId, 10) });
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update case status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId) return;

    setAssigning(true);
    try {
      await assignOfficerToCase({
        case_id: caseId,
        officer_id: selectedOfficerId,
        assignment_role: assignmentRole,
      });
      setSelectedOfficerId('');
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 page-enter">
      <div className="bg-gray-950 border border-blue-500/40 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-blue-400">
                  {data?.caseInfo?.case_number || 'Loading...'}
                </span>
                {data?.caseInfo?.case_status && (
                  <span className="badge bg-gray-800 text-gray-300 border border-gray-700 text-xs">
                    {data.caseInfo.case_status}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {data?.caseInfo?.title || 'Police Case Investigation File'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center text-base transition-all"
          >
            ✕
          </button>
        </div>

        {/* Status Tracker Bar */}
        {data?.caseInfo && (
          <div className="bg-gray-900/40 border-b border-gray-800 p-4 px-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-semibold">Track Case Status:</span>
              <select
                value={data.caseInfo.status_id}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="select-field text-xs py-1 px-3 bg-gray-950 border-blue-500/40 text-white font-bold"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRequestMlef && onRequestMlef(data.caseInfo)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center gap-1.5"
              >
                <span>📝</span> Issue MLEF Requisition
              </button>
              <button
                onClick={() => onAddEvidence && onAddEvidence(data.caseInfo.case_id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center gap-1.5"
              >
                <span>📦</span> Add Evidence
              </button>
            </div>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="bg-gray-950 border-b border-gray-800 px-6 flex space-x-6 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Incident', icon: '📌' },
            { id: 'evidence', label: `Evidence & Photos (${data?.evidence?.length || 0})`, icon: '📦' },
            { id: 'timeline', label: `Case Timeline (${data?.timeline?.length || 0})`, icon: '⏳' },
            { id: 'reports', label: `Completed Reports (${data?.completedReports?.length || 0})`, icon: '📜' },
            { id: 'officers', label: `Assigned Officers (${data?.officers?.length || 0})`, icon: '🛡️' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-blue-500 text-blue-400 font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-400 animate-pulse space-y-2">
              <div className="text-2xl">⏳</div>
              <p>Loading case file details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-xs">
              ⚠️ {error}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-xs">
                  {/* Incident Info Card */}
                  <div className="p-5 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>📍</span> Incident Details & Location
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-300">
                      <div>
                        <span className="text-gray-500 block">Incident Location</span>
                        <span className="text-white font-medium">{data.caseInfo.incident_location || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Incident Date & Time</span>
                        <span className="text-white font-medium">
                          {data.caseInfo.incident_datetime ? new Date(data.caseInfo.incident_datetime).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Weather Condition</span>
                        <span className="text-white font-medium">{data.caseInfo.weather || 'N/A'}</span>
                      </div>
                    </div>
                    {data.caseInfo.incident_description && (
                      <div className="pt-2">
                        <span className="text-gray-500 block mb-1">Incident Summary / Facts</span>
                        <p className="p-3 bg-gray-950 rounded-lg border border-gray-800/80 text-gray-300 leading-relaxed">
                          {data.caseInfo.incident_description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Role Restriction Banner */}
                  <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start gap-3">
                    <div className="text-blue-400 text-lg">🛡️</div>
                    <div>
                      <p className="text-white font-bold text-xs">Police Role Permissions & Boundary</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        Police officers can manage cases, collect evidence, upload photos, and issue MLEF requisitions. Medical examinations, injuries, autopsy findings, and lab results are read-only and maintained strictly by medical and lab staff.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EVIDENCE & PHOTOS */}
              {activeTab === 'evidence' && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Collected Case Evidence</h3>
                    <button
                      onClick={() => onAddEvidence && onAddEvidence(caseId)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all"
                    >
                      + Add Evidence
                    </button>
                  </div>

                  {data.evidence.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
                      No evidence records currently attached to this case.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.evidence.map((ev) => (
                        <div key={ev.evidence_id} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded font-bold text-[11px]">
                                {ev.evidence_type}
                              </span>
                              <p className="text-white font-medium mt-1.5">{ev.description}</p>
                            </div>
                            <span className="badge bg-gray-800 text-gray-300 border border-gray-700">
                              {ev.current_status || 'SECURED'}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-400 flex flex-wrap gap-4 pt-2 border-t border-gray-800/60">
                            <span>Collected By: {ev.collector_name || 'Officer'} (Badge: {ev.collector_badge || 'N/A'})</span>
                            <span>Date: {new Date(ev.collected_date).toLocaleString()}</span>
                          </div>

                          {/* Photos */}
                          {ev.photos && ev.photos.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <span className="text-[11px] font-bold text-emerald-400 block">Uploaded Evidence Photos:</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {ev.photos.map((p) => (
                                  <div key={p.photo_id} className="bg-gray-950 p-2 rounded-lg border border-gray-800 space-y-1">
                                    <a
                                      href={`http://localhost:5000${p.file_path}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block font-mono text-blue-400 underline truncate hover:text-blue-300"
                                    >
                                      📷 View Photo File
                                    </a>
                                    <p className="text-[10px] text-gray-400 truncate">{p.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-white text-sm">Chronological Case Timeline & Activity Log</h3>
                  {data.timeline.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
                      No case activities logged yet.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-blue-600/40 ml-3 pl-6 space-y-4">
                      {data.timeline.map((act) => (
                        <div key={act.activity_id} className="relative group">
                          <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-gray-950" />
                          <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-400">{act.activity_type}</span>
                              <span className="text-gray-500 text-[10px]">
                                {new Date(act.activity_time).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-200 text-xs">{act.description}</p>
                            <div className="text-[10px] text-gray-400">By: {act.performer || 'System User'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COMPLETED REPORTS (READ & DOWNLOAD ONLY) */}
              {activeTab === 'reports' && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Completed Forensic Medical Reports</h3>
                    <span className="text-[11px] text-emerald-400 font-medium">Read-Only Official Legal Reports</span>
                  </div>

                  {data.completedReports.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
                      No completed Medico-Legal or Autopsy reports available for download yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.completedReports.map((rep) => (
                        <div key={rep.report_id} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono font-bold text-emerald-400 text-sm">{rep.report_number}</span>
                              <p className="text-gray-300 text-xs mt-0.5">Prepared By: Dr. {rep.jmo_name}</p>
                            </div>
                            <button
                              onClick={() => {
                                alert(`Downloading Medico-Legal Report ${rep.report_number}...`);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center gap-1"
                            >
                              📥 Download Report PDF
                            </button>
                          </div>
                          {rep.findings && (
                            <div className="p-2.5 bg-gray-950 rounded-lg text-gray-300 text-xs">
                              <span className="text-gray-500 font-bold block mb-0.5">Medical Findings Summary:</span>
                              {rep.findings}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ASSIGNED OFFICERS */}
              {activeTab === 'officers' && (
                <div className="space-y-6 text-xs">
                  {/* Assign Officer Form */}
                  <form onSubmit={handleAssignOfficer} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
                    <h3 className="font-bold text-white text-xs">Assign Officer to this Case</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={selectedOfficerId}
                        onChange={(e) => setSelectedOfficerId(e.target.value)}
                        className="select-field text-xs py-1.5"
                        required
                      >
                        <option value="">-- Select Officer --</option>
                        {availableOfficers.map((o) => (
                          <option key={o.officer_id} value={o.officer_id}>
                            {o.full_name} ({o.rank || 'Officer'} - #{o.badge_number})
                          </option>
                        ))}
                      </select>

                      <select
                        value={assignmentRole}
                        onChange={(e) => setAssignmentRole(e.target.value)}
                        className="select-field text-xs py-1.5"
                      >
                        <option value="PRIMARY_INVESTIGATOR">Primary Investigator</option>
                        <option value="ASSISTING_OFFICER">Assisting Officer</option>
                        <option value="EVIDENCE_OFFICER">Evidence Officer</option>
                      </select>

                      <button
                        type="submit"
                        disabled={assigning || !selectedOfficerId}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                      >
                        {assigning ? 'Assigning...' : 'Assign Officer 🛡️'}
                      </button>
                    </div>
                  </form>

                  {/* Officers Roster */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-white text-xs">Assigned Officers List</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.officers.map((o) => (
                        <div key={o.assignment_id} className="p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-1">
                          <div className="font-bold text-white flex justify-between">
                            <span>{o.officer_name}</span>
                            <span className="text-blue-400 font-mono text-[10px]">{o.assignment_role}</span>
                          </div>
                          <div className="text-gray-400 text-[11px]">Rank: {o.rank || 'Officer'} | Badge #{o.badge_number}</div>
                          <div className="text-gray-500 text-[10px]">Phone: {o.telephone || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-900/80 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition-all"
          >
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal;
