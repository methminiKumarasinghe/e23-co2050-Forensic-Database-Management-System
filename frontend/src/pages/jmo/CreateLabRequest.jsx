import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getLaboratories, getJmoSpecimens, createLabRequest } from '../../api/jmo.api';

const CreateLabRequest = () => {
  const navigate = useNavigate();
  const [laboratories, setLaboratories] = useState([]);
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    specimenId: '',
    laboratoryId: '',
    testName: '',
    priority: 'NORMAL',
    clinicalNotes: ''
  });

  const [selectedSpecimen, setSelectedSpecimen] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [labsData, specData] = await Promise.all([
          getLaboratories(),
          getJmoSpecimens()
        ]);
        setLaboratories(Array.isArray(labsData) ? labsData : []);
        setSpecimens(Array.isArray(specData) ? specData : []);
      } catch (err) {
        console.error('Failed to load initial form data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSpecimenChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, specimenId: val }));
    const found = specimens.find(s => s.specimen_id === val || s.specimen_type === val);
    setSelectedSpecimen(found || null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.specimenId || !formData.laboratoryId || !formData.testName) {
      alert('Please enter or select a specimen, target laboratory, and test type.');
      return;
    }

    setSubmitting(true);
    try {
      await createLabRequest(formData);
      alert('Laboratory Request submitted successfully!');
      navigate('/dashboard/jmo/lab-requests');
    } catch (err) {
      console.error('Failed to submit lab request', err);
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-6">
          <div className="text-sm text-cyan-500 mb-1">
            <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; 
            <Link to="/dashboard/jmo/lab-requests" className="hover:underline ml-1">Lab Requests</Link> &gt; 
            <span className="text-gray-400 ml-1">New Request</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🧪 Create Laboratory Request
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass rounded-xl p-6 border border-gray-800 space-y-6">
              
              {/* Typeable Specimen Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specimen Details / Type <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  name="specimenId"
                  list="specimen-suggestions"
                  value={formData.specimenId}
                  onChange={handleSpecimenChange}
                  placeholder="Type specimen description (e.g. Blood Sample, Viscera, Fingerprint Swab) or choose suggestion..."
                  className="input-field w-full text-white bg-gray-900 border-gray-700"
                  required
                />
                <datalist id="specimen-suggestions">
                  {specimens.map(s => (
                    <option key={s.specimen_id} value={s.specimen_id}>
                      {s.specimen_type} — Case {s.case_number} ({s.patient_name})
                    </option>
                  ))}
                  <option value="Blood Sample (Toxicology / DNA)" />
                  <option value="Urine Sample (Drug Screen)" />
                  <option value="Visceral Tissue Sample" />
                  <option value="Vaginal / Cervical Swab" />
                  <option value="Gastric Contents" />
                  <option value="Hair & Nail Clippings" />
                  <option value="Fingerprint / Latent Trace Evidence" />
                </datalist>
                <p className="text-xs text-gray-400 mt-1">
                  You can type any custom specimen description or select from previous examinations.
                </p>
              </div>

              {/* Select Laboratory */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Target Laboratory <span className="text-red-500">*</span>
                </label>
                <select 
                  name="laboratoryId"
                  value={formData.laboratoryId}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                >
                  <option value="">-- Choose Laboratory --</option>
                  {laboratories.map(lab => (
                    <option key={lab.laboratory_id} value={lab.laboratory_id}>
                      {lab.laboratory_name} ({lab.laboratory_type || 'General'}) — {lab.hospital_name || 'Hospital'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Requested Test Type / Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  name="testName"
                  value={formData.testName}
                  onChange={handleInputChange}
                  placeholder="e.g. DNA Profiling, Toxicology Screen, Histopathology, Blood Alcohol"
                  className="input-field w-full"
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority Level
                </label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input-field w-full"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Urgent)</option>
                </select>
              </div>

              {/* Clinical Notes / Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Clinical Notes / Special Instructions
                </label>
                <textarea 
                  name="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter specific forensic instructions, clinical context, or suspected substances..."
                  className="input-field w-full"
                />
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <Link to="/dashboard/jmo/lab-requests" className="btn-secondary">Cancel</Link>
                <button type="submit" disabled={submitting} className="btn-primary bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white">
                  {submitting ? 'Submitting Request...' : 'Submit Laboratory Request'}
                </button>
              </div>

            </form>
          </div>

          {/* Auto-populated Context Box */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border border-cyan-800/30">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <span className="text-cyan-400">📋</span> Specimen & Case Summary
              </h2>
              {selectedSpecimen ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Case Number</p>
                    <p className="text-cyan-400 font-mono text-lg font-bold">{selectedSpecimen.case_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Patient Name</p>
                    <p className="text-white font-medium">{selectedSpecimen.patient_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Specimen Type</p>
                    <p className="text-white font-medium">{selectedSpecimen.specimen_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Collection Date</p>
                    <p className="text-white">{new Date(selectedSpecimen.collection_datetime).toLocaleString()}</p>
                  </div>
                  {selectedSpecimen.remarks && (
                    <div>
                      <p className="text-gray-400">Collection Remarks</p>
                      <p className="text-gray-300 text-xs bg-gray-800/50 p-2 rounded mt-1">{selectedSpecimen.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Type any custom specimen description or select from suggestions.
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default CreateLabRequest;
