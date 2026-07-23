import { useState } from 'react';
import { registerPatient } from '../../api/policeApi';

const RegisterPatientModal = ({ isOpen, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nic, setNic] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [mrn, setMrn] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter first name and last name.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nic: nic.trim(),
        gender,
        date_of_birth: dob || null,
        telephone: telephone.trim(),
        address: address.trim(),
        email: email.trim(),
        blood_group: bloodGroup,
        medical_record_number: mrn.trim(),
        emergency_contact: emergencyContact.trim(),
        emergency_phone: emergencyPhone.trim(),
      };

      const res = await registerPatient(payload);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 page-enter">
      <div className="bg-gray-950 border border-purple-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Register Patient Record</h2>
              <p className="text-xs text-gray-400">Add a new patient to the forensic medical database</p>
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
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Kamal"
                className="input-field text-xs"
                required
              />
            </div>
            <div>
              <label className="label-text">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Perera"
                className="input-field text-xs"
                required
              />
            </div>
          </div>

          {/* NIC, Gender, DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-text">NIC Number</label>
              <input
                type="text"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                placeholder="e.g. 199012345678"
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="label-text">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="select-field text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="label-text">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Phone, Blood Group, MRN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Telephone</label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="0771234567"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="label-text">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="select-field text-xs"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">MRN (Optional / Auto)</label>
              <input
                type="text"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                placeholder="Auto-generated if empty"
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Emergency Contact Person</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Relative or Next of Kin name"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="label-text">Emergency Contact Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="0719876543"
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label-text">Residential Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address of patient"
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
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20"
            >
              {submitting ? 'Registering...' : 'Register Patient 👤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPatientModal;
