import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getResultById } from '../../api/jmo.api';

const JMOLabResultDetails = () => {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
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
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-cyan-500 mb-1">
              <Link to="/dashboard/jmo" className="hover:underline">Dashboard</Link> &gt; 
              <Link to="/dashboard/jmo/lab-results" className="hover:underline ml-1">Lab Results</Link> &gt; 
              <span className="text-gray-400 ml-1">Details</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Laboratory Result: {result.test_name}
            </h1>
          </div>
          <button className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Include in Medico Legal Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <span className="text-cyan-500">🔬</span> Laboratory Findings
              </h2>
              <div className="space-y-6 text-sm">
                <div>
                  <p className="text-gray-400 font-medium mb-1">Findings / Observations</p>
                  <div className="text-white bg-gray-800/50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm leading-relaxed border border-gray-700">
                    {result.findings}
                  </div>
                </div>
                {result.interpretation && (
                  <div>
                    <p className="text-gray-400 font-medium mb-1">Interpretation / Conclusion</p>
                    <div className="text-white bg-cyan-900/20 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border-l-4 border-cyan-500">
                      {result.interpretation}
                    </div>
                  </div>
                )}
                {result.remarks && (
                  <div>
                    <p className="text-gray-400 font-medium mb-1">Technician Comments</p>
                    <p className="text-gray-300">{result.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attached Documents */}
            {result.files && result.files.length > 0 && (
              <div className="glass rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-500">📎</span> Attached Documents
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
                        className="text-cyan-500 hover:text-cyan-400 text-sm font-medium flex items-center gap-1"
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
                  <p className="text-white font-medium">{new Date(result.completed_date).toLocaleString()}</p>
                </div>
                <div className="pt-2 border-t border-gray-700/50">
                  <p className="text-gray-400">Laboratory</p>
                  <p className="text-white font-medium">{result.laboratory_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Performed By</p>
                  <p className="text-white">{result.technician_name}</p>
                </div>
                <div className="pt-4 border-t border-gray-700/50">
                  <p className="text-gray-400">Case Number</p>
                  <p className="text-cyan-400 font-mono text-lg">{result.case_number}</p>
                </div>
                <div>
                  <p className="text-gray-400">Patient Name</p>
                  <p className="text-white font-medium">{result.patient_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Specimen</p>
                  <p className="text-white">{result.specimen_type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Collection Date</p>
                  <p className="text-white">{new Date(result.collection_datetime).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default JMOLabResultDetails;
