import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getFinalMlrReport, signMlrReport } from '../../api/jmo.api';

const DigitalSignatureMLR = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const data = await getFinalMlrReport(reportId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report for signing', err);
      alert('Failed to load report details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      alert('Please enter your JMO Security PIN to sign this report.');
      return;
    }

    setSigning(true);
    try {
      await signMlrReport(reportId, { signaturePin: pin });
      alert('Report digitally signed and finalized successfully!');
      navigate(`/dashboard/jmo/mlr/${reportId}/view`);
    } catch (err) {
      console.error('Signature failed', err);
      alert(err.response?.data?.message || 'Digital signature authorization failed.');
    } finally {
      setSigning(false);
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

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-md mx-auto px-4 py-12">
        <div className="mb-6 text-center">
          <div className="text-xs text-emerald-400 mb-1">
            <Link to="/dashboard/jmo/mlr-reports" className="hover:underline">MLR Cases</Link> &gt; Digital Signature
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            🔏 Digital Signature & Authorization
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            You are authorizing the release of official Medico-Legal Report 
            <span className="text-emerald-400 font-mono font-bold ml-1">{report?.report_number}</span>.
          </p>
        </div>

        {/* Report Summary Card */}
        <div className="glass rounded-xl p-6 border border-emerald-800/40 space-y-4 mb-8">
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <div>
              <span className="text-xs text-gray-400 block">Examinee Patient:</span>
              <span className="text-lg font-bold text-white">{report?.patient_name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Case Number:</span>
              <span className="text-cyan-400 font-mono font-bold">{report?.case_number}</span>
            </div>
          </div>

          <div className="text-xs text-gray-300 space-y-2 bg-gray-950 p-4 rounded border border-gray-800">
            <p><span className="text-gray-400">Examining JMO:</span> <span className="text-white font-medium">Dr. {report?.jmo_name}</span> ({report?.jmo_reg_no || 'Reg # JMO-SL-884'})</p>
            <p><span className="text-gray-400">Hospital:</span> {report?.hospital_name}</p>
            <p><span className="text-gray-400">Police Station:</span> {report?.station_name}</p>
            <p><span className="text-gray-400">Status Workflow:</span> <span className="text-amber-400 font-bold">Draft ➔ Completed ➔ PENDING SIGNATURE ➔ Signed</span></p>
          </div>
        </div>

        {/* Digital Signature Pin Form */}
        <form onSubmit={handleSign} className="glass rounded-xl p-8 border border-emerald-500/50 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
              ✍️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Enter JMO Security PIN</h2>
              <p className="text-xs text-gray-400">Confirm your digital identity to apply an cryptographic signature mark.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              JMO Authorization PIN / Passcode:
            </label>
            <input 
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN (e.g. 1234 or JMO Key)"
              className="input-field text-center text-lg tracking-widest bg-gray-900 border-gray-700 text-white w-full py-3"
              required
            />
          </div>

          <div className="pt-2 flex justify-between items-center gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn-secondary text-xs py-2.5 px-5"
            >
              ← Return to Edit Report
            </button>
            <button 
              type="submit" 
              disabled={signing}
              className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white text-xs py-2.5 px-8 font-bold flex items-center gap-2"
            >
              {signing ? 'Signing Report...' : 'Confirm & Apply Digital Signature 🔏'}
            </button>
          </div>
        </form>

      </main>
    </div>
  );
};

export default DigitalSignatureMLR;
