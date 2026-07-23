import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getAutopsyNotification, saveAutopsyNotification } from '../../api/jmo.api';

const PrepareAutopsyNotification = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    case_id: caseId,
    hospital_name: '',
    post_mortem_serial_number: '',
    court_case_number: '',
    inquirer_name: '',
    inquirer_designation: '',
    inquirer_type: 'Inquirer into Sudden Deaths',
    area: '',
    deceased_name: '',
    age: '',
    sex: 'Male',
    place_of_death: 'Hospital admission',
    hospital_name_if_applicable: '',
    bht_number: '',
    ward_number: '',
    date_of_death: '',
    time_of_death: '',
    immediate_cause: '',
    cause_due_to_1: '',
    cause_due_to_2: '',
    cause_due_to_3: '',
    contributory_causes: '',
    interval_between_onset_and_death: '',
    cause_under_investigation: 'Yes',
    specimens_retained: 'Yes',
    specimen_details: '',
    maternal_death: 'No',
    maternal_category: '',
    comments_opinions: '',
    conducting_jmo_name: '',
    designation: 'Judicial Medical Officer',
    conducted_date: new Date().toISOString().slice(0, 10),
    expected_report_completion_time: '6 weeks'
  });

  useEffect(() => {
    fetchNotificationData();
  }, [caseId]);

  const fetchNotificationData = async () => {
    try {
      const data = await getAutopsyNotification(caseId);
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...data,
          date_of_death: data.date_of_death ? new Date(data.date_of_death).toISOString().slice(0, 10) : '',
          conducted_date: data.conducted_date ? new Date(data.conducted_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
        }));
      }
    } catch (err) {
      console.error('Failed to load autopsy notification data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        status: 'Notification Completed'
      };
      await saveAutopsyNotification(payload);
      alert('Health 1328 Medicolegal Autopsy Notification saved successfully!');
      navigate(`/dashboard/jmo/autopsy/${caseId}/exam`);
    } catch (err) {
      console.error('Failed to save autopsy notification', err);
      alert(err.response?.data?.message || 'Failed to save Autopsy Notification.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forensic-dark text-gray-100">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <div className="text-xs text-purple-400 mb-1">
              <Link to="/dashboard/jmo/autopsies" className="hover:underline">Autopsy Cases</Link> &gt; Health 1328 Notification
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              📋 Medicolegal Autopsy Notification Form (Health 1328)
            </h1>
            <p className="text-xs text-gray-400 mt-1">Department of Health Services — Ministry of Health, Sri Lanka</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate('/dashboard/jmo/autopsies')} 
            className="btn-secondary text-xs py-2 px-4"
          >
            ← Back to Cases
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1-3: Header Details */}
          <div className="glass rounded-xl p-6 border border-purple-800/40 space-y-4">
            <h2 className="text-base font-bold text-purple-400 border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Sections 1-3: Header & Case Identification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Hospital / Institution Name:</label>
                <input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleInputChange} required className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Post-Mortem Serial Number:</label>
                <input type="text" name="post_mortem_serial_number" value={formData.post_mortem_serial_number} onChange={handleInputChange} required className="input-field w-full text-xs font-mono text-cyan-400" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Court Case Number / Inquest Number:</label>
                <input type="text" name="court_case_number" value={formData.court_case_number} onChange={handleInputChange} required className="input-field w-full text-xs font-mono text-purple-300" />
              </div>
            </div>
          </div>

          {/* Section 4: Inquirer Details */}
          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 4: Inquirer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Inquirer Name:</label>
                <input type="text" name="inquirer_name" value={formData.inquirer_name} onChange={handleInputChange} required className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Designation:</label>
                <input type="text" name="inquirer_designation" value={formData.inquirer_designation} onChange={handleInputChange} required className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Inquirer Type:</label>
                <select name="inquirer_type" value={formData.inquirer_type} onChange={handleInputChange} className="input-field w-full text-xs bg-gray-900">
                  <option value="Magistrate">Magistrate</option>
                  <option value="Inquirer into Sudden Deaths">Inquirer into Sudden Deaths</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Jurisdiction Area:</label>
                <input type="text" name="area" value={formData.area} onChange={handleInputChange} required className="input-field w-full text-xs" />
              </div>
            </div>
          </div>

          {/* Section 5: Deceased Details */}
          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 5: Deceased Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Full Name of Deceased:</label>
                <input type="text" name="deceased_name" value={formData.deceased_name} onChange={handleInputChange} required className="input-field w-full text-xs font-bold text-white" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Age:</label>
                <input type="text" name="age" value={formData.age} onChange={handleInputChange} required className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Sex:</label>
                <select name="sex" value={formData.sex} onChange={handleInputChange} className="input-field w-full text-xs bg-gray-900">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Place of Death:</label>
                <select name="place_of_death" value={formData.place_of_death} onChange={handleInputChange} className="input-field w-full text-xs bg-gray-900">
                  <option value="Scene">Scene of Incident</option>
                  <option value="Hospital admission">Hospital admission</option>
                </select>
              </div>
              {formData.place_of_death === 'Hospital admission' && (
                <>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Hospital Name:</label>
                    <input type="text" name="hospital_name_if_applicable" value={formData.hospital_name_if_applicable} onChange={handleInputChange} className="input-field w-full text-xs" />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">B.H.T. Number:</label>
                    <input type="text" name="bht_number" value={formData.bht_number} onChange={handleInputChange} className="input-field w-full text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">Ward Number:</label>
                    <input type="text" name="ward_number" value={formData.ward_number} onChange={handleInputChange} className="input-field w-full text-xs" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-gray-300 font-medium mb-1">Date of Death:</label>
                <input type="date" name="date_of_death" value={formData.date_of_death} onChange={handleInputChange} required className="input-field w-full text-xs bg-gray-900" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Time of Death:</label>
                <input type="text" name="time_of_death" value={formData.time_of_death} onChange={handleInputChange} placeholder="e.g. 14:30" className="input-field w-full text-xs" />
              </div>
            </div>
          </div>

          {/* Section 6: Cause of Death / Probable Cause (WHO Style) */}
          <div className="glass rounded-xl p-6 border border-purple-800/40 space-y-4">
            <h2 className="text-base font-bold text-purple-400 border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 6: Cause of Death Chain (WHO International Format)
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">(a) Immediate Cause:</label>
                <input type="text" name="immediate_cause" value={formData.immediate_cause} onChange={handleInputChange} placeholder="Immediate disease or condition leading to death..." required className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">(b) Due to (or as a consequence of):</label>
                <input type="text" name="cause_due_to_1" value={formData.cause_due_to_1} onChange={handleInputChange} placeholder="Underlying cause 1..." className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">(c) Due to (or as a consequence of):</label>
                <input type="text" name="cause_due_to_2" value={formData.cause_due_to_2} onChange={handleInputChange} placeholder="Underlying cause 2..." className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">(d) Due to (or as a consequence of):</label>
                <input type="text" name="cause_due_to_3" value={formData.cause_due_to_3} onChange={handleInputChange} placeholder="Underlying cause 3..." className="input-field w-full text-xs" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Contributory Causes (Part II):</label>
                  <input type="text" name="contributory_causes" value={formData.contributory_causes} onChange={handleInputChange} placeholder="Other significant conditions..." className="input-field w-full text-xs" />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Approximate Interval Onset to Death:</label>
                  <input type="text" name="interval_between_onset_and_death" value={formData.interval_between_onset_and_death} onChange={handleInputChange} placeholder="e.g. Minutes / Hours" className="input-field w-full text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Investigation & Specimens */}
          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 7: Ancillary Investigations & Specimens
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Is the cause of death under investigation?</label>
                <div className="flex gap-4 pt-1">
                  <label className="cursor-pointer"><input type="radio" name="cause_under_investigation" value="Yes" checked={formData.cause_under_investigation === 'Yes'} onChange={handleInputChange} /> Yes</label>
                  <label className="cursor-pointer"><input type="radio" name="cause_under_investigation" value="No" checked={formData.cause_under_investigation === 'No'} onChange={handleInputChange} /> No</label>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">If yes, specimens retained for further investigation?</label>
                <div className="flex gap-4 pt-1">
                  <label className="cursor-pointer"><input type="radio" name="specimens_retained" value="Yes" checked={formData.specimens_retained === 'Yes'} onChange={handleInputChange} /> Yes</label>
                  <label className="cursor-pointer"><input type="radio" name="specimens_retained" value="No" checked={formData.specimens_retained === 'No'} onChange={handleInputChange} /> No</label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-300 font-medium mb-1">Specimens Retained & Institutions Referred To:</label>
                <textarea name="specimen_details" value={formData.specimen_details} onChange={handleInputChange} rows="3" placeholder="Detail retained organs, blood, toxicological samples and receiving labs..." className="input-field w-full text-xs" />
              </div>
            </div>
          </div>

          {/* Section 8: Maternal Death */}
          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 8: Maternal Death Assessment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Maternal Death?</label>
                <div className="flex gap-4 pt-1">
                  <label className="cursor-pointer"><input type="radio" name="maternal_death" value="Yes" checked={formData.maternal_death === 'Yes'} onChange={handleInputChange} /> Yes</label>
                  <label className="cursor-pointer"><input type="radio" name="maternal_death" value="No" checked={formData.maternal_death === 'No'} onChange={handleInputChange} /> No</label>
                </div>
              </div>
              {formData.maternal_death === 'Yes' && (
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Maternal Death Category:</label>
                  <select name="maternal_category" value={formData.maternal_category} onChange={handleInputChange} className="input-field w-full text-xs bg-gray-900">
                    <option value="Direct">Direct Obstetric Cause</option>
                    <option value="Indirect">Indirect Obstetric Cause</option>
                    <option value="Incidental">Incidental / Accidental</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 9: Comments and Opinions */}
          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 9: JMO Comments & Opinions
            </h2>
            <textarea name="comments_opinions" value={formData.comments_opinions} onChange={handleInputChange} rows="4" placeholder="Enter post-mortem examination observations, injury circumstances, or preliminary findings..." className="input-field w-full text-xs" />
          </div>

          {/* Section 10: Conducted By */}
          <div className="glass rounded-xl p-6 border border-purple-800/40 space-y-4">
            <h2 className="text-base font-bold text-purple-400 border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
              Section 10: Autopsy Conducted By & Completion Target
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Conducting JMO Name:</label>
                <input type="text" name="conducting_jmo_name" value={formData.conducting_jmo_name} onChange={handleInputChange} required className="input-field w-full text-xs font-bold text-white" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Designation:</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} required className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Date Conducted:</label>
                <input type="date" name="conducted_date" value={formData.conducted_date} onChange={handleInputChange} required className="input-field w-full text-xs bg-gray-900" />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Expected Completion Time:</label>
                <input type="text" name="expected_report_completion_time" value={formData.expected_report_completion_time} onChange={handleInputChange} placeholder="e.g. 6 weeks" required className="input-field w-full text-xs" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard/jmo/autopsies')} 
              className="btn-secondary text-xs px-6 py-3"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary bg-purple-600 hover:bg-purple-500 border-purple-500 text-white font-bold text-xs px-8 py-3 flex items-center gap-2"
            >
              {saving ? 'Saving Notification...' : 'Save Autopsy Notification (Health 1328) ➔'}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};

export default PrepareAutopsyNotification;
