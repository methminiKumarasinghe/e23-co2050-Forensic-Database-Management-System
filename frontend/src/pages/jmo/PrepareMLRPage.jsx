import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getMlrCaseData, saveMlrReport } from '../../api/jmo.api';

const PrepareMLRPage = () => {
  const { mlefId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nonGrievousInjuries: '',
    grievousInjuries: '',
    fatalInjuries: '',
    penalCodeCategories: [],
    grievousRemarks: '',
    bluntWeaponInjuries: '',
    cutInjuries: '',
    sharpInjuries: '',
    stabInjuries: '',
    firearmInjuries: '',
    burnInjuries: '',
    biteInjuries: '',
    furtherNotices: '',
    historyCompatibility: 'Compatible with history given',
    selfInfliction: 'No signs of self-infliction',
    additionalRemarks: '',
    smellingLiquor: 'no',
    underInfluenceLiquor: 'no',
    otherIntoxicants: '',
    finalJmoOpinion: '',
    qualifications: 'MBBS, MD (Forensic Medicine)',
    designation: 'Judicial Medical Officer',
    dispatchDate: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    fetchCaseData();
  }, [mlefId]);

  const fetchCaseData = async () => {
    try {
      const data = await getMlrCaseData(mlefId);
      setCaseData(data);

      if (data.existingReport?.findings) {
        try {
          const parsed = JSON.parse(data.existingReport.findings);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
      if (data.existingReport?.medical_opinion) {
        setFormData(prev => ({ ...prev, finalJmoOpinion: data.existingReport.recommendations || data.existingReport.medical_opinion }));
      }
    } catch (err) {
      console.error('Failed to load case data', err);
      alert('Failed to load case information.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePenalCodeCategoryChange = (cat) => {
    setFormData(prev => {
      const current = prev.penalCodeCategories || [];
      const updated = current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat];
      return { ...prev, penalCodeCategories: updated };
    });
  };

  const handleSave = async (status = 'DRAFT') => {
    setSaving(true);
    try {
      const result = await saveMlrReport(mlefId, { ...formData, reportStatus: status });
      alert(`MLR Report saved as ${status}!`);
      if (status === 'PENDING_SIGNATURE' || status === 'DRAFT') {
        navigate(`/dashboard/jmo/mlr/${result.report_id}/signature`);
      }
    } catch (err) {
      console.error('Failed to save MLR', err);
      alert(err.response?.data?.message || 'Failed to save MLR Report.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  const { officialInfo, policeDetails, jmoProfile, examination, injuries, labResults } = caseData || {};

  return (
    <div className="min-h-screen bg-forensic-dark text-gray-100">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-emerald-400 mb-1">
              <Link to="/dashboard/jmo/mlr-reports" className="hover:underline">MLR Cases</Link> &gt; Prepare MLR
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              📑 Prepare Medico-Legal Report (Health 886)
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-mono">
                {officialInfo?.serialNumber}
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleSave('DRAFT')} disabled={saving} className="btn-secondary">
              💾 Save Draft
            </button>
            <button onClick={() => handleSave('PENDING_SIGNATURE')} disabled={saving} className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500">
              Proceed to Digital Signature ➔
            </button>
          </div>
        </div>

        {/* SECTION 1 — Official Report Information */}
        <div className="glass rounded-xl p-6 border border-emerald-800/40 space-y-4">
          <h2 className="text-base font-bold text-emerald-400 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 1: Official Report Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-950 p-3 rounded border border-gray-800">
              <span className="text-gray-400 block">Serial Number:</span>
              <span className="text-white font-mono font-bold">{officialInfo?.serialNumber}</span>
            </div>
            <div className="bg-gray-950 p-3 rounded border border-gray-800">
              <span className="text-gray-400 block">Form Number:</span>
              <span className="text-white font-mono font-bold">{officialInfo?.mlefNumber}</span>
            </div>
            <div className="bg-gray-950 p-3 rounded border border-gray-800">
              <span className="text-gray-400 block">Magistrate Court:</span>
              <span className="text-white font-medium">{officialInfo?.magistrateCourt}</span>
            </div>
            <div className="bg-gray-950 p-3 rounded border border-gray-800">
              <span className="text-gray-400 block">Police Station:</span>
              <span className="text-white font-medium">{officialInfo?.policeStation}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Identification (Read-only) */}
        <div className="glass rounded-xl p-6 border border-cyan-800/40 space-y-4">
          <h2 className="text-base font-bold text-cyan-400 border-l-4 border-cyan-500 pl-3 uppercase tracking-wider">
            SECTION 2: Examinee Identification & Admission Details (Read-only)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <p><span className="text-gray-400">Full Name:</span> <span className="text-white font-bold text-sm">{policeDetails?.patient_name}</span></p>
            <p><span className="text-gray-400">NIC:</span> <span className="text-gray-200">{policeDetails?.nic || 'N/A'}</span></p>
            <p><span className="text-gray-400">Gender / DOB:</span> <span className="text-gray-200">{policeDetails?.gender} | {policeDetails?.date_of_birth ? new Date(policeDetails.date_of_birth).toLocaleDateString() : 'N/A'}</span></p>
            <p><span className="text-gray-400">Hospital:</span> <span className="text-gray-200">{policeDetails?.hospital_name}</span></p>
            <p><span className="text-gray-400">Medical Record No (BHT):</span> <span className="text-gray-200">{policeDetails?.medical_record_number || 'N/A'}</span></p>
            <p><span className="text-gray-400">Address:</span> <span className="text-gray-200">{policeDetails?.patient_address || 'N/A'}</span></p>
          </div>
        </div>

        {/* SECTION 3 — History */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 3: Case History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <span className="text-gray-400 block font-bold mb-1">Police Provided History:</span>
              <p className="text-gray-200">"{policeDetails?.mlef_reason || 'N/A'}"</p>
            </div>
            <div className="bg-gray-950 p-4 rounded border border-gray-800">
              <span className="text-gray-400 block font-bold mb-1">Examinee Patient History (JMO Exam):</span>
              <p className="text-gray-200">"{examination?.examination_notes?.slice(0, 200) || 'N/A'}..."</p>
            </div>
          </div>
        </div>

        {/* SECTION 4 — Examination Summary */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 4: Clinical Examination & Vital Signs Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs bg-gray-950 p-4 rounded border border-gray-800">
            <div><span className="text-gray-400 block">BP:</span> <span className="text-white font-bold">{examination?.blood_pressure || '120/80 mmHg'}</span></div>
            <div><span className="text-gray-400 block">Pulse:</span> <span className="text-white font-bold">{examination?.pulse_rate || 72} bpm</span></div>
            <div><span className="text-gray-400 block">Resp. Rate:</span> <span className="text-white font-bold">{examination?.respiratory_rate || 16} /min</span></div>
            <div><span className="text-gray-400 block">Temp:</span> <span className="text-white font-bold">{examination?.temperature || 36.6} °C</span></div>
            <div><span className="text-gray-400 block">SPO2:</span> <span className="text-white font-bold">{examination?.oxygen_saturation || 99} %</span></div>
            <div><span className="text-gray-400 block">Weight:</span> <span className="text-white font-bold">{examination?.weight || '68'} kg</span></div>
          </div>
        </div>

        {/* SECTION 5 — Injuries */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 5: Recorded Injuries & Photographs
          </h2>
          {injuries.length === 0 ? (
            <p className="text-xs text-gray-400">No specific injury items logged in examination record.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900 uppercase text-gray-400">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Nature of Injury</th>
                    <th className="p-3">Size / Shape</th>
                    <th className="p-3">Body Location</th>
                    <th className="p-3">Probable Weapon</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {injuries.map((inj, idx) => (
                    <tr key={inj.injury_id} className="border-b border-gray-800">
                      <td className="p-3 font-bold text-emerald-400">Injury #{idx + 1}</td>
                      <td className="p-3 font-medium text-white">{inj.injury_type}</td>
                      <td className="p-3">{inj.size || 'N/A'}</td>
                      <td className="p-3">{inj.body_location}</td>
                      <td className="p-3 text-cyan-400">{inj.probable_weapon || 'N/A'}</td>
                      <td className="p-3">{inj.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 6 — Laboratory Investigations */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 6: Laboratory Test Findings (Read-only)
          </h2>
          {labResults.length === 0 ? (
            <p className="text-xs text-gray-400">No laboratory test results linked to this case.</p>
          ) : (
            <div className="space-y-3">
              {labResults.map(lab => (
                <div key={lab.result_id} className="bg-gray-950 p-4 rounded border border-gray-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-white text-sm">{lab.test_name}</span>
                    <span className="text-gray-400">{new Date(lab.completed_date).toLocaleDateString()}</span>
                  </div>
                  <p><span className="text-gray-400">Laboratory:</span> {lab.laboratory_name} | <span className="text-gray-400">Technician:</span> {lab.technician_name || 'Lab Staff'}</p>
                  <p className="text-emerald-300 pt-1"><span className="text-gray-400">Findings:</span> {lab.findings}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 7 — Medical Opinion (EDITABLE) */}
        <div className="glass rounded-xl p-6 border border-emerald-800/40 space-y-4">
          <h2 className="text-base font-bold text-emerald-400 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 7: Medical Opinion — Injury Classification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-300 font-medium mb-1">Non-Grievous Injuries (Injury #s)</label>
              <input type="text" name="nonGrievousInjuries" value={formData.nonGrievousInjuries} onChange={handleInputChange} placeholder="e.g. Injury #1, #2" className="input-field w-full text-xs" />
            </div>
            <div>
              <label className="block text-xs text-gray-300 font-medium mb-1">Grievous Injuries (Injury #s)</label>
              <input type="text" name="grievousInjuries" value={formData.grievousInjuries} onChange={handleInputChange} placeholder="e.g. Injury #3" className="input-field w-full text-xs" />
            </div>
            <div>
              <label className="block text-xs text-gray-300 font-medium mb-1">Injuries Sufficient to Cause Death</label>
              <input type="text" name="fatalInjuries" value={formData.fatalInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" />
            </div>
          </div>
        </div>

        {/* SECTION 8 — Grievous Injury Details (Penal Code Sec 311) */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 8: Grievous Injury Penal Code Sec. 311 Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-950 p-4 rounded border border-gray-800 text-xs">
            {[
              'Emasculation',
              'Permanent privation of sight of either eye',
              'Permanent privation of hearing of either ear',
              'Privation of any member or joint',
              'Destruction or permanent impairing of power of member/joint',
              'Permanent disfiguration of head or face',
              'Fracture or dislocation of a bone or tooth',
              'Endangers life or causes severe bodily pain for 20 days'
            ].map(cat => (
              <label key={cat} className="flex items-center gap-2 text-gray-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.penalCodeCategories.includes(cat)}
                  onChange={() => handlePenalCodeCategoryChange(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs text-gray-300 font-medium mb-1">Explanatory Remarks on Grievous Hurt</label>
            <input type="text" name="grievousRemarks" value={formData.grievousRemarks} onChange={handleInputChange} placeholder="Additional medical justification..." className="input-field w-full text-xs" />
          </div>
        </div>

        {/* SECTION 9 — Cause of Injuries by Weapon */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 9: Cause of Injuries by Weapon Type (Injury #s)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div><label className="block text-gray-300 mb-1">Blunt Weapon #s:</label><input type="text" name="bluntWeaponInjuries" value={formData.bluntWeaponInjuries} onChange={handleInputChange} placeholder="e.g. #1, #2" className="input-field w-full text-xs" /></div>
            <div><label className="block text-gray-300 mb-1">Cut Weapon #s:</label><input type="text" name="cutInjuries" value={formData.cutInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" /></div>
            <div><label className="block text-gray-300 mb-1">Sharp Instrument #s:</label><input type="text" name="sharpInjuries" value={formData.sharpInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" /></div>
            <div><label className="block text-gray-300 mb-1">Stab Weapon #s:</label><input type="text" name="stabInjuries" value={formData.stabInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" /></div>
            <div><label className="block text-gray-300 mb-1">Firearm #s:</label><input type="text" name="firearmInjuries" value={formData.firearmInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" /></div>
            <div><label className="block text-gray-300 mb-1">Burn #s:</label><input type="text" name="burnInjuries" value={formData.burnInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" /></div>
            <div><label className="block text-gray-300 mb-1">Bite Mark #s:</label><input type="text" name="biteInjuries" value={formData.biteInjuries} onChange={handleInputChange} placeholder="e.g. None" className="input-field w-full text-xs" /></div>
          </div>
        </div>

        {/* SECTION 10 & 11 — Observations & Intoxication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
              SECTION 10: Additional Observations
            </h2>
            <div className="space-y-3 text-xs">
              <div><label className="block text-gray-300 mb-1">Compatibility with history:</label><input type="text" name="historyCompatibility" value={formData.historyCompatibility} onChange={handleInputChange} className="input-field w-full text-xs" /></div>
              <div><label className="block text-gray-300 mb-1">Self-infliction possibility:</label><input type="text" name="selfInfliction" value={formData.selfInfliction} onChange={handleInputChange} className="input-field w-full text-xs" /></div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
              SECTION 11: Intoxication Findings
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex gap-4">
                <span>Smelling of liquor:</span>
                <label><input type="radio" name="smellingLiquor" value="yes" checked={formData.smellingLiquor === 'yes'} onChange={handleInputChange} /> Yes</label>
                <label><input type="radio" name="smellingLiquor" value="no" checked={formData.smellingLiquor === 'no'} onChange={handleInputChange} /> No</label>
              </div>
              <div className="flex gap-4">
                <span>Under influence of liquor:</span>
                <label><input type="radio" name="underInfluenceLiquor" value="yes" checked={formData.underInfluenceLiquor === 'yes'} onChange={handleInputChange} /> Yes</label>
                <label><input type="radio" name="underInfluenceLiquor" value="no" checked={formData.underInfluenceLiquor === 'no'} onChange={handleInputChange} /> No</label>
              </div>
              <div><label className="block text-gray-300 mb-1">Other Intoxicants / Substances:</label><input type="text" name="otherIntoxicants" value={formData.otherIntoxicants} onChange={handleInputChange} placeholder="Specify if any" className="input-field w-full text-xs" /></div>
            </div>
          </div>
        </div>

        {/* SECTION 12 — Final JMO Opinion */}
        <div className="glass rounded-xl p-6 border border-emerald-800/50 space-y-4">
          <h2 className="text-base font-bold text-emerald-400 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 12: Final Professional JMO Opinion
          </h2>
          <textarea 
            name="finalJmoOpinion"
            value={formData.finalJmoOpinion}
            onChange={handleInputChange}
            rows="5"
            placeholder="Write your official medico-legal opinion summarizing findings, causative factors, and medical conclusions..."
            className="input-field w-full text-xs"
          />
        </div>

        {/* SECTION 13 & 14 — Declaration & Attachments */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4 text-xs">
          <h2 className="text-base font-bold text-white border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
            SECTION 13 & 14: JMO Declaration & Linked Attachments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-950 p-4 rounded border border-gray-800">
            <div><span className="text-gray-400 block">JMO Name:</span> <span className="text-white font-bold">Dr. {jmoProfile?.jmo_name}</span></div>
            <div><span className="text-gray-400 block">Qualifications:</span> <span className="text-white">{formData.qualifications}</span></div>
            <div><span className="text-gray-400 block">Hospital / Station:</span> <span className="text-white">{jmoProfile?.hospital_name}</span></div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={() => handleSave('DRAFT')} disabled={saving} className="btn-secondary">
            💾 Save Draft
          </button>
          <button onClick={() => handleSave('PENDING_SIGNATURE')} disabled={saving} className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 font-bold px-8 py-3">
            Proceed to Digital Signature ➔
          </button>
        </div>

      </main>
    </div>
  );
};

export default PrepareMLRPage;
