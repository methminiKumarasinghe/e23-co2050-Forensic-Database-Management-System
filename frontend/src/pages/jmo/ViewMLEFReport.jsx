import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getMlefReport } from '../../api/jmo.api';

const ViewMLEFReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const data = await getMlefReport(id);
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch MLEF report', err);
    } finally {
      setLoading(false);
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

  const police = report?.policeSection;
  const exam = report?.jmoSection;

  return (
    <div className="min-h-screen bg-forensic-dark print:bg-white print:text-black">
      <Navbar />
      <main className="pt-24 print:pt-0 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        <div className="mb-6 flex justify-between items-center print:hidden">
          <div>
            <div className="text-sm text-cyan-500 mb-1">
              <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; 
              <span className="text-gray-400 ml-1">Official Report</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              📄 Official Medico-Legal Examination Form (Health 886)
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="btn-secondary flex items-center gap-2"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <Link to="/dashboard/jmo" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Official Document Container */}
        <div className="glass rounded-xl p-8 border border-cyan-800/40 bg-gray-900/90 text-gray-100 print:border-none print:shadow-none print:bg-white print:text-black space-y-8">
          
          {/* Document Header */}
          <div className="text-center border-b border-gray-700 pb-6 print:border-black">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest print:text-black">Government of Sri Lanka — Forensic Medical Information System</p>
            <h2 className="text-2xl font-bold text-white mt-1 print:text-black">MEDICO-LEGAL EXAMINATION FORM</h2>
            <p className="text-sm text-gray-400 print:text-gray-600 font-mono mt-1">Health 886 | Ref: {police?.formatted_mlef_id || 'MLEF'}</p>
          </div>

          {/* Section A: Police Information */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-cyan-400 print:text-black border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              PART A: Requisition Information (Police Officer)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-950/60 p-5 rounded border border-gray-800 print:bg-gray-100 print:text-black text-sm">
              <div>
                <p className="text-xs text-gray-400 print:text-gray-600 font-medium">1. Case Number & Title</p>
                <p className="font-bold text-white print:text-black font-mono">{police?.case_number}</p>
                <p className="text-gray-300 print:text-black">{police?.case_title}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 print:text-gray-600 font-medium">2. Examinee Details</p>
                <p className="font-bold text-white print:text-black">{police?.patient_name}</p>
                <p className="text-gray-300 print:text-black">NIC: {police?.nic || 'N/A'} | Gender: {police?.gender || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 print:text-gray-600 font-medium">3. Police Station & Officer</p>
                <p className="font-bold text-white print:text-black">{police?.station_name} ({police?.station_district})</p>
                <p className="text-gray-300 print:text-black">{police?.requesting_officer_name} (Badge #{police?.badge_number})</p>
              </div>

              <div className="md:col-span-3 border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-400 print:text-gray-600 font-medium">4. Reason for Requisition</p>
                <p className="text-gray-200 print:text-black mt-0.5">{police?.mlef_reason || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Section B: JMO Examination Findings */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-cyan-400 print:text-black border-l-4 border-cyan-500 pl-3 uppercase tracking-wide">
              PART B: Medical Examination Findings & Opinion (JMO)
            </h3>

            {exam ? (
              <div className="space-y-6 bg-gray-950/60 p-5 rounded border border-gray-800 print:bg-gray-100 print:text-black text-sm">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-800">
                  <div>
                    <p className="text-xs text-gray-400 print:text-gray-600">Examining Officer (JMO)</p>
                    <p className="font-bold text-white print:text-black">Dr. {exam.jmo_name}</p>
                    <p className="text-gray-300 print:text-black">Reg No: {exam.jmo_reg_no || 'N/A'} | Hospital: {exam.hospital_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 print:text-gray-600">Examination Date & Status</p>
                    <p className="font-bold text-white print:text-black">{new Date(exam.examination_date || exam.created_at).toLocaleString()}</p>
                    <p className="text-green-400 print:text-black font-semibold">STATUS: COMPLETED</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-cyan-400 print:text-black font-bold uppercase tracking-wide mb-2">Detailed Clinical Examination Notes:</p>
                  <pre className="font-sans whitespace-pre-wrap bg-gray-900 p-4 rounded text-gray-200 border border-gray-800 print:bg-white print:text-black print:border-gray-400 leading-relaxed text-xs">
                    {exam.examination_notes}
                  </pre>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-cyan-400 print:text-black font-bold uppercase tracking-wide mb-1">Final Conclusion & Medical Opinion:</p>
                  <p className="font-semibold text-white print:text-black bg-cyan-950/40 p-4 rounded border border-cyan-800/40 print:bg-gray-200">
                    {exam.conclusion}
                  </p>
                </div>

                {/* Signature Box */}
                <div className="pt-8 flex justify-between items-end">
                  <div className="text-xs text-gray-400">
                    Document generated automatically by DFMIS Sri Lanka System.
                  </div>
                  <div className="text-center border-t border-gray-500 pt-2 px-8">
                    <p className="font-bold text-white print:text-black">Dr. {exam.jmo_name}</p>
                    <p className="text-xs text-gray-400 print:text-gray-600">Judicial Medical Officer</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-6 bg-amber-900/20 border border-amber-500/30 rounded text-amber-300 text-center">
                <p>Medical examination has not been completed for this case yet.</p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};

export default ViewMLEFReport;
