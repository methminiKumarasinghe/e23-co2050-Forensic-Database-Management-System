import { useState, useEffect } from 'react';
import { getAssignedCases, searchPatients, getHospitals, createMlef, getOfficerProfile } from '../../api/policeApi';

const EXAM_TYPES = [
  'Clinical Medico-Legal Examination (General)',
  'Physical Assault / Bodily Injury Examination',
  'Sexual Assault / Abuse Examination',
  'Traffic Accident / Vehicular Injury Examination',
  'Age Estimation Examination',
  'Intoxication / Alcohol & Substance Examination',
  'Domestic Violence Examination',
  'Post-Mortem Medico-Legal Examination Referral',
];

const PRIORITIES = [
  { id: 'Normal', label: 'Normal', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: 'Urgent', label: 'Urgent', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: 'Emergency', label: 'Emergency', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
];

const IssueMLEFForm = ({ onSuccess, onCancel }) => {
  // Officer Profile
  const [officer, setOfficer] = useState(null);
  const [officerLoading, setOfficerLoading] = useState(true);

  // Form selections
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);

  // Patient Search
  const [patientQuery, setPatientQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Hospitals
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Form Fields
  const [reason, setReason] = useState('');
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [priority, setPriority] = useState('Normal');

  // UI state
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const currentTime = new Date().toLocaleString();

  // Load Officer Profile, Cases, Hospitals on Mount
  useEffect(() => {
    const loadInitialData = async () => {
      setOfficerLoading(true);
      setCasesLoading(true);
      setHospitalsLoading(true);

      try {
        const profRes = await getOfficerProfile();
        setOfficer(profRes.data);
      } catch (err) {
        console.error('Failed to load officer profile:', err);
      } finally {
        setOfficerLoading(false);
      }

      try {
        const casesRes = await getAssignedCases();
        setCases(casesRes.data || []);
      } catch (err) {
        console.error('Failed to load assigned cases:', err);
      } finally {
        setCasesLoading(false);
      }

      try {
        const hospRes = await getHospitals();
        setHospitals(hospRes.data || []);
      } catch (err) {
        console.error('Failed to load hospitals:', err);
      } finally {
        setHospitalsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Handle Patient Search (supports filtering by case_id)
  const handlePatientSearch = async (queryStr = '', caseId = selectedCase?.case_id) => {
    setPatientQuery(queryStr);
    setSearchingPatients(true);
    try {
      const res = await searchPatients(queryStr, caseId || '');
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Error searching patients:', err);
    } finally {
      setSearchingPatients(false);
    }
  };

  // Automatically load and auto-select associated case patient when selected case changes
  useEffect(() => {
    const autoLoadPatient = async () => {
      if (selectedCase?.case_id) {
        setSearchingPatients(true);
        try {
          const res = await searchPatients('', selectedCase.case_id);
          const list = res.data || [];
          setSearchResults(list);
          const casePatient = list.find((p) => p.case_match_count > 0);
          if (casePatient) {
            setSelectedPatient(casePatient);
          } else if (list.length === 1) {
            setSelectedPatient(list[0]);
          }
        } catch (err) {
          console.error('Error loading case patient:', err);
        } finally {
          setSearchingPatients(false);
        }
      } else {
        setSelectedPatient(null);
        setSearchResults([]);
      }
    };
    autoLoadPatient();
  }, [selectedCase]);

  // Submission Validation
  const validateForm = () => {
    if (!selectedCase) {
      setValidationError('Please select an assigned police case.');
      return false;
    }
    if (!selectedPatient) {
      setValidationError('Please search and select a patient.');
      return false;
    }
    if (!selectedHospital) {
      setValidationError('Please select a hospital with a forensic/JMO unit.');
      return false;
    }
    if (!reason.trim()) {
      setValidationError('Please enter the reason for referral.');
      return false;
    }
    if (!examType) {
      setValidationError('Please select an examination type.');
      return false;
    }
    setValidationError('');
    return true;
  };

  // Submit Handler
  const handleSubmit = async (isDraft = false) => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        case_id: selectedCase.case_id,
        patient_id: selectedPatient.patient_id,
        hospital_id: selectedHospital.hospital_id,
        reason: reason.trim(),
        exam_type: examType,
        priority: priority,
        is_draft: isDraft,
      };

      const response = await createMlef(payload);
      setSuccessData({
        formatted_id: response.data.formatted_mlef_id,
        status: response.data.status,
        date: response.data.request_date || currentTime,
      });

      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Failed to submit MLEF request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="glass rounded-2xl p-8 max-w-2xl mx-auto border border-emerald-500/30 text-center space-y-6 page-enter">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">MLEF Successfully Issued</h2>
          <p className="text-gray-400 text-sm mt-1">The Medico-Legal Examination Form has been registered in the database.</p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-left space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <span className="text-xs text-gray-400">Generated MLEF ID</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{successData.formatted_id}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <span className="text-xs text-gray-400">Status</span>
            <span className="badge bg-amber-900/50 text-amber-300 border border-amber-700/50">{successData.status}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Issued Timestamp</span>
            <span className="text-sm font-medium text-gray-200">{new Date(successData.date).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setSuccessData(null);
              setSelectedCase(null);
              setSelectedPatient(null);
              setSelectedHospital(null);
              setReason('');
            }}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Issue Another MLEF
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition-all"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <span>📝</span> Issue Medico-Legal Examination Form (MLEF)
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Requisition form to refer a patient for official forensic medical examination
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-950/60 hover:bg-gray-900 border border-gray-800 rounded-lg transition-all"
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {/* Validation Banner */}
      {validationError && (
        <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-sm font-medium flex items-center gap-3">
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: Select Police Case */}
      <div className="glass rounded-2xl p-6 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span>1.</span> Select Assigned Police Case
          </h2>
          <span className="text-xs text-gray-500">Read-Only Incident Data Auto-Loaded</span>
        </div>

        {casesLoading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading assigned cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300 text-xs">
            No assigned cases found. Make sure your account is linked to an active police case assignment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => {
              const isSelected = selectedCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-bold text-blue-400">{c.case_number}</span>
                    <span className="badge bg-gray-800 text-gray-300 border border-gray-700 text-[10px]">
                      {c.case_status}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mt-1">{c.title}</h3>
                  <div className="text-xs text-gray-400 mt-2">
                    Opened: {new Date(c.date_reported || c.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loaded Incident Info (Read-Only) */}
        {selectedCase && (
          <div className="mt-4 p-4 bg-gray-950/80 border border-gray-800/80 rounded-xl space-y-3 text-xs">
            <div className="font-semibold text-gray-300 flex items-center gap-2">
              <span>📌</span> Incident Information (Read-Only)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <span className="text-gray-500 block">Police Report No.</span>
                <span className="text-gray-200 font-mono font-medium">{selectedCase.case_number}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Incident Date/Time</span>
                <span className="text-gray-200 font-medium">
                  {selectedCase.incident_datetime ? new Date(selectedCase.incident_datetime).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Incident Location</span>
                <span className="text-gray-200 font-medium">{selectedCase.incident_location || 'N/A'}</span>
              </div>
            </div>
            {selectedCase.incident_description && (
              <div>
                <span className="text-gray-500 block mb-0.5">Incident Description</span>
                <p className="text-gray-300 bg-gray-900 p-2.5 rounded-lg border border-gray-800/60">
                  {selectedCase.incident_description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: Search and Select Patient */}
      <div className="glass rounded-2xl p-6 border border-gray-800 space-y-4">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <span>2.</span> Search & Select Patient
        </h2>

        {/* Patient Search Input */}
        <div className="relative">
          <input
            type="text"
            value={patientQuery}
            onChange={(e) => handlePatientSearch(e.target.value)}
            placeholder="Search patient by NIC, Name, or Medical Record Number (MRN)..."
            className="input-field pl-10"
          />
          <span className="absolute left-3 top-3 text-gray-500">🔍</span>
          {searchingPatients && (
            <span className="absolute right-3 top-3 text-xs text-gray-400 animate-pulse">Searching...</span>
          )}
        </div>

        {/* Search Results Dropdown / Cards */}
        {searchResults.length > 0 && !selectedPatient && (
          <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-800">
            {searchResults.map((p) => (
              <div
                key={p.patient_id}
                onClick={() => {
                  setSelectedPatient(p);
                }}
                className="p-3 hover:bg-gray-900 cursor-pointer flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{p.full_name}</span>
                    {p.case_match_count > 0 && (
                      <span className="badge bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        📌 Case Patient
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400">NIC: {p.nic || 'N/A'} | MRN: {p.medical_record_number || 'N/A'}</div>
                </div>
                <button className="px-3 py-1 bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white rounded-md font-medium transition-all">
                  Select Patient
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected Patient Details (Read-Only) */}
        {selectedPatient ? (
          <div className="p-4 bg-gray-950/80 border border-blue-900/40 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                <span>👤</span> Selected Patient Details (Read-Only)
              </span>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-[11px] text-gray-400 hover:text-red-400 underline"
              >
                Change Patient
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">Full Name</span>
                <span className="text-white font-medium">{selectedPatient.full_name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">NIC Number</span>
                <span className="text-white font-mono">{selectedPatient.nic || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Medical Record No. (MRN)</span>
                <span className="text-white font-mono">{selectedPatient.medical_record_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Date of Birth</span>
                <span className="text-gray-200">
                  {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Gender</span>
                <span className="text-gray-200">{selectedPatient.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Telephone</span>
                <span className="text-gray-200">{selectedPatient.telephone || 'N/A'}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Address</span>
              <span className="text-gray-300 text-xs">{selectedPatient.address || 'N/A'}</span>
            </div>
          </div>
        ) : (
          !patientQuery && (
            <div className="text-xs text-gray-500 italic">Type a search term above to search existing patient records.</div>
          )
        )}
      </div>

      {/* STEP 3: Select Hospital */}
      <div className="glass rounded-2xl p-6 border border-gray-800 space-y-4">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <span>3.</span> Select Destination Hospital (Forensic/JMO Unit)
        </h2>

        {hospitalsLoading ? (
          <div className="py-4 text-xs text-gray-400">Loading hospitals list...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hospitals.map((h) => {
              const isSelected = selectedHospital?.hospital_id === h.hospital_id;
              return (
                <div
                  key={h.hospital_id}
                  onClick={() => setSelectedHospital(h)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-900/30 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-white text-sm">{h.hospital_name}</div>
                    <span className="badge bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                      {h.hospital_type || 'General'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">District: {h.district || 'N/A'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 4, 5, 6: Reason, Exam Type & Priority */}
      <div className="glass rounded-2xl p-6 border border-gray-800 space-y-6">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <span>4.</span> Examination Requisition & Referral Reason
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Predefined Examination Type */}
          <div>
            <label className="label-text">Select Examination Type *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="select-field text-sm"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="label-text">Select Priority *</label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    priority === p.id ? p.color + ' ring-2 ring-offset-1 ring-offset-gray-950' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reason for Referral Text Area */}
        <div>
          <label className="label-text">Reason for Referral (Detailed Description) *</label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter detailed facts, clinical history, alleged circumstances of offense/incident, or specific examination instructions..."
            className="input-field text-sm leading-relaxed resize-y"
          />
        </div>
      </div>

      {/* STEP 7 & 8: Read-Only Logged-In Officer Details & Generated Info Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STEP 7: Logged-in Officer Details */}
        <div className="glass rounded-2xl p-6 border border-gray-800 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> Requesting Officer Details (Read-Only)
          </h2>
          {officerLoading ? (
            <div className="text-xs text-gray-400 py-2">Loading officer details...</div>
          ) : officer ? (
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Officer Name</span>
                <span className="text-white font-semibold">{officer.first_name} {officer.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rank</span>
                <span className="text-blue-300 font-medium">{officer.rank || 'Police Officer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Badge Number</span>
                <span className="text-white font-mono">{officer.badge_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Police Station</span>
                <span className="text-gray-200">{officer.station_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contact Number</span>
                <span className="text-gray-200">{officer.contact_number || 'N/A'}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* STEP 8: Generated Information Preview */}
        <div className="glass rounded-2xl p-6 border border-blue-900/40 space-y-3">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> Generated Requisition Information
          </h2>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Formatted MLEF ID</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">MLEF-AUTO</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <span className="badge bg-amber-950 text-amber-300 border border-amber-800">Pending Hospital Acceptance</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Issue Date & Time</span>
              <span className="text-gray-300 font-medium">{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-gray-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-sm font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-sm font-semibold rounded-xl transition-all"
        >
          {submitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="px-8 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
        >
          {submitting ? 'Submitting...' : 'Submit MLEF Requisition 🚀'}
        </button>
      </div>
    </div>
  );
};

export default IssueMLEFForm;
