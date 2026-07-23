import { useState } from 'react';
import { createPoliceCase } from '../../api/policeApi';

const CASE_TYPES = [
  'Homicide / Unnatural Death',
  'Physical Assault / GBH',
  'Sexual Offense / Assault',
  'Traffic Accident / Vehicular Hit & Run',
  'Domestic Violence',
  'Robbery / Theft with Violence',
  'Kidnapping / Abduction',
  'Poisoning / Substance Overdose',
  'General Criminal Investigation',
];

const CreateCaseModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [caseType, setCaseType] = useState(CASE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDatetime, setIncidentDatetime] = useState('');
  const [weather, setWeather] = useState('Clear');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a case title.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        case_type: caseType,
        description: description.trim(),
        date_reported: new Date().toISOString(),
        incident_location: incidentLocation.trim(),
        incident_datetime: incidentDatetime ? new Date(incidentDatetime).toISOString() : new Date().toISOString(),
        incident_description: description.trim(),
        weather: weather,
      };

      const res = await createPoliceCase(payload);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create police case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 page-enter">
      <div className="bg-gray-950 border border-blue-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xl">
              📂
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Police Case & Incident</h2>
              <p className="text-xs text-gray-400">Register a new criminal case in the forensic database</p>
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
          {/* Case Title */}
          <div>
            <label className="label-text">Case Title / Offense Subject *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Investigation into Fatal Road Accident near Galle Road"
              className="input-field text-xs"
              required
            />
          </div>

          {/* Case Type & Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Case Category / Type *</label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                className="select-field text-xs"
              >
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Incident Weather Condition</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="select-field text-xs"
              >
                <option value="Clear">Clear / Dry</option>
                <option value="Rainy">Rainy / Wet</option>
                <option value="Overcast">Overcast</option>
                <option value="Night / Low Visibility">Night / Low Visibility</option>
              </select>
            </div>
          </div>

          {/* Incident Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Incident Date & Time</label>
              <input
                type="datetime-local"
                value={incidentDatetime}
                onChange={(e) => setIncidentDatetime(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="label-text">Incident Location</label>
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="e.g. 142 Kandy Road, Kiribathgoda"
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <label className="label-text">Incident Details & Facts</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter facts of crime/offense, preliminary police findings, weapon involved, or statements..."
              className="input-field text-xs resize-y"
            />
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
            >
              {submitting ? 'Registering...' : 'Register Police Case 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCaseModal;
