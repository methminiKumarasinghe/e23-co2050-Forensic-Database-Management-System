import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getRequestById, acceptRequest, rejectRequest } from '../../api/lab.api';

const LabRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getRequestById(id);
      setRequest(data);
    } catch (err) {
      console.error('Failed to fetch request details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('Are you sure you want to accept this request?')) return;
    setActionLoading(true);
    try {
      await acceptRequest(id);
      fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    setActionLoading(true);
    try {
      await rejectRequest(id);
      fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to reject request');
    } finally {
      setActionLoading(false);
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

  if (!request) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="pt-24 text-center text-white">Request not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-6">
          <div className="text-sm text-amber-500 mb-1">
            <Link to="/dashboard/lab-technician" className="hover:underline">Dashboard</Link> &gt; 
            <Link to="/dashboard/lab-technician/requests" className="hover:underline ml-1">Requests</Link> &gt; 
            <span className="text-gray-400 ml-1">Details</span>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Request Details
              <span className={`px-3 py-1 rounded-full text-xs ${
                request.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                request.status === 'ACCEPTED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                request.status === 'PROCESSING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                request.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {request.status}
              </span>
            </h1>
            
            <div className="flex gap-3">
              {request.status === 'PENDING' && (
                <>
                  <button onClick={handleReject} disabled={actionLoading} className="btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10">Reject</button>
                  <button onClick={handleAccept} disabled={actionLoading} className="btn-primary">Accept Request</button>
                </>
              )}
              {(request.status === 'ACCEPTED' || request.status === 'PROCESSING') && (
                <Link to={`/dashboard/lab-technician/request/${id}/test`} className="btn-primary bg-yellow-600 hover:bg-yellow-500 border-yellow-500 text-white">
                  {request.status === 'ACCEPTED' ? 'Start Test' : 'Continue Test / Submit Result'}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Specimen Details */}
            <div className="glass rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-500">🧫</span> Specimen Information
              </h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-gray-400">Specimen Type</p>
                  <p className="text-white font-medium">{request.specimen_type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Collection Date</p>
                  <p className="text-white font-medium">{new Date(request.collection_datetime).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Specimen Remarks</p>
                  <p className="text-white bg-gray-800/50 p-3 rounded mt-1">{request.specimen_remarks || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* MLEF & JMO Notes */}
            <div className="glass rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-500">📋</span> MLEF & Examination Notes
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400">Requested By (JMO)</p>
                  <p className="text-white font-medium">{request.jmo_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Reason for Request</p>
                  <p className="text-white bg-gray-800/50 p-3 rounded mt-1">{request.mlef_reason || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">JMO Examination Notes</p>
                  <p className="text-white bg-gray-800/50 p-3 rounded mt-1">{request.examination_notes || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Previous Tests */}
            {request.tests && request.tests.length > 0 && (
              <div className="glass rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-amber-500">🧪</span> Tests Conducted
                </h2>
                <div className="space-y-3">
                  {request.tests.map(test => (
                    <div key={test.test_id} className="border border-gray-700 p-3 rounded-lg bg-gray-800/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{test.test_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${test.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {test.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex justify-between">
                        <span>Started: {new Date(test.started_at).toLocaleString()}</span>
                        {test.completed_at && <span>Completed: {new Date(test.completed_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Patient & Case Info */}
            <div className="glass rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Case & Patient</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400">Case Number</p>
                  <p className="text-white font-mono text-lg text-amber-400">{request.case_number}</p>
                </div>
                <div>
                  <p className="text-gray-400">Case Type</p>
                  <p className="text-white">{request.case_type}</p>
                </div>
                <div className="pt-2 border-t border-gray-700/50">
                  <p className="text-gray-400">Patient Name</p>
                  <p className="text-white font-medium">{request.patient_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Blood Group</p>
                  <p className="text-white">{request.blood_group || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Priority</p>
                  <p className={`font-semibold ${request.priority === 'HIGH' ? 'text-red-400' : request.priority === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {request.priority || 'NORMAL'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Request Date</p>
                  <p className="text-white">{new Date(request.request_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LabRequestDetails;
