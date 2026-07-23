import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getRequestById, submitResult } from '../../api/lab.api';

const PerformTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    testName: '',
    findings: '',
    interpretation: '',
    comments: ''
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const data = await getRequestById(id);
      setRequest(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load request details');
      navigate('/dashboard/lab-technician/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.testName || !formData.findings) {
      return alert('Test Name and Findings are required.');
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('requestId', id);
    data.append('testName', formData.testName);
    data.append('findings', formData.findings);
    data.append('interpretation', formData.interpretation);
    data.append('comments', formData.comments);

    files.forEach(file => {
      data.append('files', file);
    });

    try {
      await submitResult(data);
      alert('Result submitted successfully.');
      navigate(`/dashboard/lab-technician/requests`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-6">
          <div className="text-sm text-amber-500 mb-1">
            <Link to="/dashboard/lab-technician" className="hover:underline">Dashboard</Link> &gt; 
            <Link to="/dashboard/lab-technician/requests" className="hover:underline ml-1">Requests</Link> &gt; 
            <Link to={`/dashboard/lab-technician/request/${id}`} className="hover:underline ml-1">Details</Link> &gt; 
            <span className="text-gray-400 ml-1">Perform Test</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Perform Test & Submit Result</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-xl p-6 border border-amber-900/30">
              <h2 className="text-lg font-semibold text-white mb-4">Request Summary</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Case No</p>
                  <p className="text-amber-400 font-mono text-lg">{request?.case_number}</p>
                </div>
                <div>
                  <p className="text-gray-400">Specimen</p>
                  <p className="text-white font-medium">{request?.specimen_type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Requested By</p>
                  <p className="text-white">{request?.jmo_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Priority</p>
                  <p className={`font-semibold ${request?.priority === 'HIGH' ? 'text-red-400' : 'text-green-400'}`}>{request?.priority}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass rounded-xl p-6 border border-gray-800 space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Name / Type <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="testName"
                  value={formData.testName}
                  onChange={handleInputChange}
                  placeholder="e.g. Toxicology Screen, Blood Alcohol Content"
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Findings <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="findings"
                  value={formData.findings}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Detailed factual observations and measurements..."
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interpretation / Conclusion
                </label>
                <textarea 
                  name="interpretation"
                  value={formData.interpretation}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="What do the findings indicate?"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Comments
                </label>
                <textarea 
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Any procedural notes or issues..."
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Attachments (PDF, Images, Word, CSV)
                </label>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-amber-600 file:text-white
                    hover:file:bg-amber-700
                    cursor-pointer bg-gray-800 rounded-md border border-gray-700 p-2"
                />
                <p className="text-xs text-gray-500 mt-2">Maximum 5 files. Max size 10MB per file.</p>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <Link to={`/dashboard/lab-technician/request/${id}`} className="btn-secondary">Cancel</Link>
                <button type="submit" disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-500 border-green-500">
                  {submitting ? 'Submitting...' : 'Submit Final Result'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PerformTest;
