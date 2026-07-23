import { useState, useEffect } from 'react';
import { addEvidence, uploadEvidencePhoto } from '../../api/policeApi';

const EVIDENCE_TYPES = [
  'Physical / Weapons (Knife, Firearm, Blunt Object)',
  'Biological / DNA (Blood, Hair, Saliva, Semen)',
  'Toxicology / Chemical / Drug Evidence',
  'Documentary / Financial / Digital Evidence',
  'Trace Evidence (Fibers, Soil, Glass, Explosive Residue)',
  'Personal Belongings / Clothing',
  'Autopsy / Mortuary Specimen',
  'General Crime Scene Evidence',
];

const AddEvidenceModal = ({ isOpen, onClose, cases = [], preselectedCaseId = null, onSuccess }) => {
  const [selectedCaseId, setSelectedCaseId] = useState(preselectedCaseId || '');
  const [evidenceType, setEvidenceType] = useState(EVIDENCE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('SECURED_IN_STATION');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoDescription, setPhotoDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedCaseId) {
      setSelectedCaseId(preselectedCaseId);
    } else if (cases.length > 0) {
      setSelectedCaseId(cases[0].case_id);
    }
  }, [preselectedCaseId, cases]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setError('Please select a police case.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description for the evidence.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        case_id: selectedCaseId,
        evidence_type: evidenceType,
        description: description.trim(),
        collected_date: new Date().toISOString(),
        current_status: status,
      };

      const res = await addEvidence(payload);
      const newEvidence = res.data;

      // If photo attached, upload evidence photo
      if (photoFile && newEvidence?.evidence_id) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('description', photoDescription.trim() || 'Evidence Photo');
        await uploadEvidencePhoto(newEvidence.evidence_id, formData);
      }

      if (onSuccess) onSuccess(newEvidence);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 page-enter">
      <div className="bg-gray-950 border border-emerald-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-xl">
              📦
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Case Evidence & Upload Photo</h2>
              <p className="text-xs text-gray-400">Register evidence item into official chain of custody</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 text-base rounded-lg bg-gray-900 border border-gray-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Case */}
          <div>
            <label className="label-text">Select Police Case *</label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="select-field text-xs"
              required
            >
              {cases.length === 0 ? (
                <option value="">No assigned cases available</option>
              ) : (
                cases.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    {c.case_number} — {c.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Evidence Type */}
          <div>
            <label className="label-text">Evidence Category / Type *</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="select-field text-xs"
            >
              {EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="label-text">Initial Storage / Custody Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select-field text-xs"
            >
              <option value="SECURED_IN_STATION">Secured in Police Station Locker</option>
              <option value="SENT_TO_FORENSIC_LAB">Transferred to Forensic Lab</option>
              <option value="STORED_IN_MORTUARY">Stored in Mortuary / Hospital Storage</option>
              <option value="PRODUCED_IN_COURT">Produced in Court</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label-text">Evidence Description & Tag Details *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Stained shirt found at crime scene, sealed in tamper-evident bag #EV-892"
              className="input-field text-xs resize-y"
              required
            />
          </div>

          {/* Photo Upload File */}
          <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3">
            <label className="label-text text-emerald-400 font-bold flex items-center gap-1.5">
              <span>📷</span> Upload Evidence Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setPhotoFile(e.target.files[0] || null)}
              className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30 cursor-pointer"
            />
            {photoFile && (
              <input
                type="text"
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="Photo caption or angle description..."
                className="input-field text-xs mt-2"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
            >
              {submitting ? 'Adding Evidence...' : 'Add Evidence to Case 📦'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEvidenceModal;
