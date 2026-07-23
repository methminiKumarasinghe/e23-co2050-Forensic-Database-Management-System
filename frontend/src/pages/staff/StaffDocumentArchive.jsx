import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getHospitalDocuments } from '../../api/medicalApi';

const StaffDocumentArchive = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await getHospitalDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs text-cyan-400 mb-1">
            <Link to="/dashboard/medical-officer" className="hover:underline">Dashboard</Link> &gt; Document Archive
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📁 Hospital Document Archive
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div></div>
        ) : documents.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400 border border-gray-800">
            <p>No uploaded medical documents in archive.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(d => (
              <div key={d.file_id} className="glass rounded-xl p-5 border border-cyan-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded bg-cyan-950 flex items-center justify-center text-xl text-cyan-400">
                    📄
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                    {(d.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm truncate">{d.file_name}</h3>
                  <p className="text-xs text-gray-400 mt-1">Uploaded: {new Date(d.uploaded_at).toLocaleString()}</p>
                </div>
                <a 
                  href={`http://localhost:5000/${d.file_path}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-secondary w-full text-center text-xs py-1.5 block border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Download Document
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDocumentArchive;
