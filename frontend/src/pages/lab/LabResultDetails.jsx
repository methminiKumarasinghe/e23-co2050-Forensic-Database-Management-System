import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getResultById } from '../../api/lab.api';

const LabResultDetails = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const data = await getResultById(id);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load result details');
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (filePath) => {
    const fileName = filePath.split(/[\\/]/).pop();
    return `http://localhost:5000/uploads/${fileName}`; 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="pt-24 text-center text-white">Result not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 print:pt-0 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="text-sm text-amber-500 mb-1">
              <Link to="/dashboard/lab-technician" className="hover:underline">Dashboard</Link> &gt; 
              <span className="text-gray-400 ml-1">Result Details</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Result: {result.test_name}
              <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                COMPLETED
              </span>
            </h1>
          </div>
          <Link to="/dashboard/lab-technician" className="btn-secondary">Back to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Findings & Interpretation</h2>
              <div className="space-y-6 text-sm">
                <div>
                  <p className="text-gray-400 font-medium mb-1">Findings</p>
                  <div className="text-white bg-gray-800/50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {result.findings}
                  </div>
                </div>
                {result.interpretation && (
                  <div>
                    <p className="text-gray-400 font-medium mb-1">Interpretation / Conclusion</p>
                    <div className="text-white bg-gray-800/50 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border-l-4 border-amber-500">
                      {result.interpretation}
                    </div>
                  </div>
                )}
                {result.remarks && (
                  <div>
                    <p className="text-gray-400 font-medium mb-1">Additional Comments</p>
                    <p className="text-white">{result.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attached Documents */}
            {result.files && result.files.length > 0 && (
              <div className="glass rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📎</span> Attached Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.files.map(file => (
                    <div key={file.file_id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700 hover:bg-gray-700/50 transition-colors">
                      <div className="truncate max-w-[200px] text-sm text-gray-300">
                        {file.file_name}
                      </div>
                      <a 
                        href={getFileUrl(file.file_path)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1"
                        download
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Information</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400">Result ID</p>
                  <p className="text-white font-mono text-xs">{result.result_id}</p>
                </div>
                <div>
                  <p className="text-gray-400">Completed Date</p>
                  <p className="text-white font-medium text-green-400">{new Date(result.completed_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Performed By</p>
                  <p className="text-white">{result.technician_name}</p>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-gray-400">Case Number</p>
                  <p className="text-amber-400 font-mono text-lg">{result.case_number}</p>
                </div>
                <div>
                  <p className="text-gray-400">Patient Name</p>
                  <p className="text-white">{result.patient_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Specimen</p>
                  <p className="text-white">{result.specimen_type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Requested Priority</p>
                  <p className="text-gray-300">{result.priority || 'NORMAL'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LabResultDetails;
