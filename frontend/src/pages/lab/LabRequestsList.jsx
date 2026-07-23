import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getRequests } from '../../api/lab.api';

const LabRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  useEffect(() => {
    fetchRequests();
  }, [filters.status, filters.priority]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getRequests(filters);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-amber-500 mb-1">
              <Link to="/dashboard/lab-technician" className="hover:underline">Dashboard</Link> &gt; Requests
            </div>
            <h1 className="text-2xl font-bold text-white">Laboratory Requests</h1>
          </div>
        </div>

        <div className="glass rounded-xl p-4 mb-6 border border-gray-800">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Search by Case No or Patient Name..."
                className="input-field"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div className="w-full md:w-48">
              <select 
                className="input-field"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <select 
                className="input-field"
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        <div className="glass rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
             <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div></div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
               <div className="text-4xl mb-3">📭</div>
               <p>No laboratory requests found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-4 font-medium">Request ID</th>
                    <th className="px-4 py-4 font-medium">Case Number</th>
                    <th className="px-4 py-4 font-medium">Patient</th>
                    <th className="px-4 py-4 font-medium">Specimen</th>
                    <th className="px-4 py-4 font-medium">Priority</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                    <th className="px-4 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {requests.map(req => (
                    <tr key={req.request_id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-gray-400">{req.request_id.substring(0,8)}...</td>
                      <td className="px-4 py-4 font-medium text-white">{req.case_number}</td>
                      <td className="px-4 py-4">{req.patient_name}</td>
                      <td className="px-4 py-4">{req.specimen_type}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          req.priority === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          req.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                          'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {req.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          req.status === 'ACCEPTED' ? 'bg-blue-500/20 text-blue-400' :
                          req.status === 'PROCESSING' ? 'bg-yellow-500/20 text-yellow-400' :
                          req.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link to={`/dashboard/lab-technician/request/${req.request_id}`} className="text-amber-500 hover:text-amber-400 font-medium text-sm transition-colors">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LabRequestsList;
