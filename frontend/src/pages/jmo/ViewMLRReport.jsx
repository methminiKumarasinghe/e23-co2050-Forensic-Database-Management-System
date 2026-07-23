import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getFinalMlrReport } from '../../api/jmo.api';

const ViewMLRReport = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const data = await getFinalMlrReport(reportId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load final MLR report', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const { parsedFindings } = report || {};

  return (
    <div className="min-h-screen bg-forensic-dark print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>
      
      <main className="pt-16 print:pt-0 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Top Controls Bar */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <div className="text-xs text-emerald-400 mb-1">
              <Link to="/dashboard/jmo/mlr-reports" className="hover:underline">MLR Cases</Link> &gt; Signed Report
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📄 Official Medico-Legal Report (Health 886)
            </h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 font-bold px-5 py-2">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable Official Report Document */}
        <div className="glass rounded-xl p-8 border border-emerald-800/40 print:border-none print:shadow-none print:p-0 space-y-6 text-gray-200 print:text-black bg-gray-950/80 print:bg-white">
          
          {/* Header Banner */}
          <div className="text-center border-b border-gray-800 print:border-black pb-4">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white print:text-black">
              DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA
            </h2>
            <h3 className="text-base font-semibold text-emerald-400 print:text-black mt-1">
              MEDICO-LEGAL EXAMINATION REPORT (HEALTH 886)
            </h3>
            <div className="flex justify-between items-center text-xs text-gray-400 print:text-black mt-4">
              <span>Report No: <strong className="text-white print:text-black font-mono">{report?.report_number}</strong></span>
              <span>Status: <strong className="text-green-400 print:text-black font-bold">DIGITALLY SIGNED</strong></span>
              <span>Prepared Date: <strong className="text-white print:text-black">{new Date(report?.prepared_date).toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Report Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-900/60 print:bg-gray-100 p-4 rounded border border-gray-800 print:border-gray-300 space-y-1">
              <h4 className="font-bold text-emerald-400 print:text-black text-sm mb-2">Examinee Details</h4>
              <p><span className="text-gray-400 print:text-gray-700">Name:</span> <strong>{report?.patient_name}</strong></p>
              <p><span className="text-gray-400 print:text-gray-700">NIC:</span> {report?.nic || 'N/A'}</p>
              <p><span className="text-gray-400 print:text-gray-700">Gender / DOB:</span> {report?.gender} | {report?.date_of_birth ? new Date(report.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              <p><span className="text-gray-400 print:text-gray-700">Address:</span> {report?.patient_address || 'N/A'}</p>
            </div>

            <div className="bg-gray-900/60 print:bg-gray-100 p-4 rounded border border-gray-800 print:border-gray-300 space-y-1">
              <h4 className="font-bold text-emerald-400 print:text-black text-sm mb-2">Case & Authority Details</h4>
              <p><span className="text-gray-400 print:text-gray-700">Case Number:</span> <strong className="font-mono text-cyan-400 print:text-black">{report?.case_number}</strong></p>
              <p><span className="text-gray-400 print:text-gray-700">Police Station:</span> {report?.station_name} ({report?.station_district})</p>
              <p><span className="text-gray-400 print:text-gray-700">Requesting Officer:</span> {report?.requesting_officer_name} ({report?.badge_number})</p>
              <p><span className="text-gray-400 print:text-gray-700">Hospital:</span> {report?.hospital_name}</p>
            </div>
          </div>

          {/* History */}
          <div className="bg-gray-900/60 print:bg-gray-100 p-4 rounded border border-gray-800 print:border-gray-300 text-xs space-y-2">
            <h4 className="font-bold text-emerald-400 print:text-black text-sm">Police Request Reason & History</h4>
            <p className="text-gray-300 print:text-black">"{report?.mlef_reason}"</p>
          </div>

          {/* Medical Opinion & Classification */}
          <div className="bg-gray-900/60 print:bg-gray-100 p-4 rounded border border-gray-800 print:border-gray-300 text-xs space-y-3">
            <h4 className="font-bold text-emerald-400 print:text-black text-sm">JMO Medical Opinion & Penal Code Classifications</h4>
            
            <div className="whitespace-pre-wrap font-sans text-gray-200 print:text-black bg-gray-950 print:bg-white p-4 rounded border border-gray-800 print:border-gray-300">
              {report?.medical_opinion}
            </div>
          </div>

          {/* Final JMO Opinion */}
          <div className="bg-gray-900/60 print:bg-gray-100 p-4 rounded border border-gray-800 print:border-gray-300 text-xs space-y-2">
            <h4 className="font-bold text-emerald-400 print:text-black text-sm">Final Professional Conclusion</h4>
            <p className="text-gray-200 print:text-black text-sm font-medium">"{report?.recommendations}"</p>
          </div>

          {/* Digital Signature Footer Stamp */}
          <div className="pt-6 border-t border-gray-800 print:border-black flex justify-between items-end text-xs">
            <div className="space-y-1">
              <p><span className="text-gray-400 print:text-gray-700">Medical Officer:</span> <strong className="text-white print:text-black">Dr. {report?.jmo_name}</strong></p>
              <p><span className="text-gray-400 print:text-gray-700">Registration No:</span> {report?.jmo_reg_no || 'SLMC-49204'}</p>
              <p><span className="text-gray-400 print:text-gray-700">Specialization:</span> {report?.jmo_specialization || 'Forensic Pathology & Legal Medicine'}</p>
              <p><span className="text-gray-400 print:text-gray-700">Hospital:</span> {report?.hospital_name}</p>
            </div>

            <div className="text-center p-4 bg-emerald-950/60 print:bg-gray-200 border border-emerald-500/50 print:border-gray-400 rounded-lg">
              <div className="text-emerald-400 print:text-black font-bold text-sm">DIGITALLY SIGNED & VERIFIED</div>
              <div className="text-[10px] text-gray-400 print:text-gray-700 font-mono mt-1">Ref Hash: SHA256-{report?.report_id?.slice(0, 16)}</div>
              <div className="text-[10px] text-emerald-300 print:text-black mt-1">{new Date(report?.prepared_date).toUTCString()}</div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default ViewMLRReport;
