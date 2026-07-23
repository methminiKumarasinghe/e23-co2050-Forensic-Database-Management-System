import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getMlefPoliceDetails, submitMlefExamination } from '../../api/jmo.api';

const CompleteMLEFForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policeData, setPoliceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nic: '',
    consent: 'given',
    officerProducedBy: '',
    hospitalName: 'Teaching Hospital Kandy',
    ward: '',
    bhtNumber: '',
    admissionDate: '',
    examDateTime: '',
    dischargeDate: '',
    bodilyHarm: [],
    internalInjuries: '',
    otherInjuries: '',
    causativeWeapon: [],
    categoryOfHurt: 'non-grievous',
    endangersLife: 'no',
    alcoholExam: [],
    sexualAssault: [],
    history: '',
    investigations: '',
    referrals: '',
    otherOpinions: '',
    remarks: ''
  });

  useEffect(() => {
    fetchPoliceDetails();
  }, [id]);

  const fetchPoliceDetails = async () => {
    try {
      const data = await getMlefPoliceDetails(id);
      setPoliceData(data);
      if (data?.nic) setFormData(prev => ({ ...prev, nic: data.nic }));
      
      // Default exam date time to now
      const now = new Date();
      const localStr = now.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, examDateTime: localStr }));
    } catch (err) {
      console.error('Failed to load police details', err);
      alert('Failed to load police details for this case.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroup = (groupName, item) => {
    setFormData(prev => {
      const current = prev[groupName] || [];
      const updated = current.includes(item) 
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [groupName]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitMlefExamination(id, formData);
      alert('MLEF Examination completed and saved successfully!');
      navigate(`/dashboard/jmo/mlef/${id}/report`);
    } catch (err) {
      console.error('Failed to save examination', err);
      alert(err.response?.data?.message || 'Failed to save examination details.');
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
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="text-sm text-cyan-500 mb-1">
              <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; 
              <span className="text-gray-400 ml-1">Complete MLEF (Health 886)</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              📄 Complete Medico-Legal Examination Form
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-mono">
                {policeData?.formatted_mlef_id || 'MLEF'}
              </span>
            </h1>
          </div>
        </div>

        {/* SECTION A: POLICE COMPLETED INFORMATION (READ ONLY) */}
        <div className="glass rounded-xl p-6 border border-cyan-800/40 mb-8">
          <div className="flex items-center justify-between border-b border-cyan-800/50 pb-3 mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">🔒</span> SECTION A: Police Requisition & Case Information (Read-Only)
            </h2>
            <span className="text-xs px-2.5 py-1 bg-gray-800 text-gray-400 rounded border border-gray-700">
              Completed by Police
            </span>
          </div>

          {policeData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Case Number / Title</p>
                <p className="text-cyan-400 font-mono font-bold text-base">{policeData.case_number}</p>
                <p className="text-white font-medium">{policeData.case_title}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Examinee / Patient</p>
                <p className="text-white font-bold text-base">{policeData.patient_name}</p>
                <p className="text-gray-300">NIC: {policeData.nic || 'N/A'} | Gender: {policeData.gender || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Police Station & Officer</p>
                <p className="text-white font-medium">{policeData.station_name} ({policeData.station_district})</p>
                <p className="text-gray-300">Officer: {policeData.requesting_officer_name} (Badge #{policeData.badge_number || 'N/A'})</p>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-400 text-xs">Reason for Examination Requisition</p>
                <p className="text-gray-200 bg-gray-900/60 p-3 rounded border border-gray-800 mt-1">{policeData.mlef_reason || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Requisition Date</p>
                <p className="text-white">{new Date(policeData.request_date).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Police data unavailable.</p>
          )}
        </div>

        {/* SECTION B: JMO COMPLETED MLEF INFORMATION (EDITABLE) */}
        <form onSubmit={handleSubmit} className="glass rounded-xl p-6 border border-gray-800 space-y-8">
          
          <div className="border-b border-gray-700 pb-4 flex justify-between items-center">
            <div>
              <p className="text-cyan-400 font-semibold text-xs uppercase tracking-wider">Part B (9-22): To be filled by Judicial Medical Officer</p>
              <h2 className="text-xl font-bold text-white">Medico-Legal Examination Form (Health 886)</h2>
            </div>
            <span className="text-xs px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-semibold">
              JMO Editable Section
            </span>
          </div>

          {/* 1. Identification and Consent */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              1. Identification & Consent
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Identification (NIC / Passport No.)</label>
                <input 
                  type="text" 
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  placeholder="e.g. 851234567V"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Consent of Examinee</label>
                <div className="flex gap-4 items-center mt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input 
                      type="radio" 
                      name="consent" 
                      value="given" 
                      checked={formData.consent === 'given'}
                      onChange={handleInputChange}
                    /> Given
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input 
                      type="radio" 
                      name="consent" 
                      value="refused" 
                      checked={formData.consent === 'refused'}
                      onChange={handleInputChange}
                    /> Refused
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Examinee Signature / Biometric</label>
                <div className="border border-dashed border-gray-700 bg-gray-900/50 h-16 rounded flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-cyan-500/50 transition-colors">
                  Signature Pad / Biometric Scanner Capture Point
                </div>
              </div>
            </div>
          </div>

          {/* 2. Admission and Production Details */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              2. Admission & Production Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">9. Officer Produced By</label>
              <input 
                type="text"
                name="officerProducedBy"
                value={formData.officerProducedBy}
                onChange={handleInputChange}
                placeholder="Name, Rank, and Badge No. of Police Officer producing the examinee"
                className="input-field w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">10. Hospital</label>
                <input 
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ward</label>
                <input 
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="e.g. Ward 5"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">B.H.T. No.</label>
                <input 
                  type="text"
                  name="bhtNumber"
                  value={formData.bhtNumber}
                  onChange={handleInputChange}
                  placeholder="Bed Head Ticket No."
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date of Admission</label>
                <input 
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">11. Date & Time of Exam <span className="text-red-500">*</span></label>
                <input 
                  type="datetime-local"
                  name="examDateTime"
                  value={formData.examDateTime}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">12. Date of Discharge</label>
                <input 
                  type="date"
                  name="dischargeDate"
                  value={formData.dischargeDate}
                  onChange={handleInputChange}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* 3. Nature of Bodily Harm */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              3. Nature of Bodily Harm (Item 13)
            </h3>

            <div className="flex flex-wrap gap-4 bg-gray-900/50 p-4 rounded border border-gray-800">
              {[
                'Abrasion', 'Contusion', 'Laceration', 'Cut', 'Fracture', 
                'Dislocation/Subluxation', 'Bite', 'Firearm inj.', 'Explosive inj.', 'Burns', 'None'
              ].map(item => (
                <label key={item} className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.bodilyHarm.includes(item)}
                    onChange={() => handleCheckboxGroup('bodilyHarm', item)}
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Internal Injuries</label>
                <input 
                  type="text"
                  name="internalInjuries"
                  value={formData.internalInjuries}
                  onChange={handleInputChange}
                  placeholder="Specify if any"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Other Injuries</label>
                <input 
                  type="text"
                  name="otherInjuries"
                  value={formData.otherInjuries}
                  onChange={handleInputChange}
                  placeholder="Specify if any"
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* 4. Causative Weapon and Hurt Category */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              4. Causative Weapon & Category of Hurt (Items 14 & 15)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">14. Causative Weapon</label>
                <div className="flex flex-wrap gap-4 bg-gray-900/50 p-4 rounded border border-gray-800">
                  {['Blunt', 'Cut', 'Sharp', 'Firearm', 'Explosive devices', 'Others'].map(w => (
                    <label key={w} className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.causativeWeapon.includes(w)}
                        onChange={() => handleCheckboxGroup('causativeWeapon', w)}
                      />
                      {w}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">15. Category of Hurt</label>
                <div className="space-y-2 bg-gray-900/50 p-4 rounded border border-gray-800">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                      <input 
                        type="radio" 
                        name="categoryOfHurt" 
                        value="non-grievous"
                        checked={formData.categoryOfHurt === 'non-grievous'}
                        onChange={handleInputChange}
                      /> Non-grievous
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                      <input 
                        type="radio" 
                        name="categoryOfHurt" 
                        value="grievous"
                        checked={formData.categoryOfHurt === 'grievous'}
                        onChange={handleInputChange}
                      /> Grievous
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                      <input 
                        type="radio" 
                        name="categoryOfHurt" 
                        value="fatal"
                        checked={formData.categoryOfHurt === 'fatal'}
                        onChange={handleInputChange}
                      /> Fatal in ordinary course
                    </label>
                  </div>

                  <div className="pt-2 border-t border-gray-800 text-xs text-gray-400 flex items-center gap-3">
                    <span>If Grievous, does it endanger life?</span>
                    <label className="flex items-center gap-1 cursor-pointer text-white">
                      <input type="radio" name="endangersLife" value="yes" checked={formData.endangersLife === 'yes'} onChange={handleInputChange} /> Yes
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-white">
                      <input type="radio" name="endangersLife" value="no" checked={formData.endangersLife === 'no'} onChange={handleInputChange} /> No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Alcohol / Drugs & Sexual Assault */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
            <div>
              <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide mb-3">
                5. Alcohol / Drugs Exam (Item 16)
              </h3>
              <div className="flex flex-col gap-2 bg-gray-900/50 p-4 rounded border border-gray-800">
                {['Breathing smelling', 'Under influence', 'Consumed', 'Negative'].map(item => (
                  <label key={item} className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.alcoholExam.includes(item)}
                      onChange={() => handleCheckboxGroup('alcoholExam', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide mb-3">
                6. Alleged Sexual Assault (Item 18)
              </h3>
              <div className="flex flex-col gap-2 bg-gray-900/50 p-4 rounded border border-gray-800">
                {[
                  'Signs of vaginal / hymen penetration present',
                  'Signs of anal penetration present',
                  'Signs consistent with inter labial penetration'
                ].map(item => (
                  <label key={item} className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.sexualAssault.includes(item)}
                      onChange={() => handleCheckboxGroup('sexualAssault', item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 7. History and Findings */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              7. Brief History & Findings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Brief history given by examinee / Findings relevant to history</label>
              <textarea 
                name="history"
                value={formData.history}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter history given by examinee, particularly for trauma, assault, or sexual assault..."
                className="input-field w-full"
              />
            </div>
          </div>

          {/* 8. Conclusions and Opinions */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-base font-bold text-white border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              8. Conclusions, Recommendations & Remarks (Items 19-22)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">19. Investigations</label>
                <input 
                  type="text"
                  name="investigations"
                  value={formData.investigations}
                  onChange={handleInputChange}
                  placeholder="e.g. X-Ray Chest, CT Brain"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">20. Referrals</label>
                <input 
                  type="text"
                  name="referrals"
                  value={formData.referrals}
                  onChange={handleInputChange}
                  placeholder="e.g. Surgical clinic, ENT"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">21. Other opinions / Recommendations</label>
                <input 
                  type="text"
                  name="otherOpinions"
                  value={formData.otherOpinions}
                  onChange={handleInputChange}
                  placeholder="Official medical recommendations"
                  className="input-field w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">22. Remarks</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional JMO remarks or observations..."
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
            <Link to="/dashboard/jmo" className="btn-secondary">Cancel</Link>
            <button 
              type="submit" 
              disabled={submitting}
              className="btn-primary bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white font-bold px-8 py-3 flex items-center gap-2"
            >
              <span>💾</span> {submitting ? 'Saving Examination...' : 'Save MLEF Examination'}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};

export default CompleteMLEFForm;
