import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getAutopsyNotification } from '../../api/jmo.api';

const JMOAutopsyExam = () => {
  const { caseId } = useParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotification();
  }, [caseId]);

  const fetchNotification = async () => {
    try {
      const data = await getAutopsyNotification(caseId);
      setNotification(data);
    } catch (err) {
      console.error('Failed to load notification summary', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forensic-dark">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <div className="text-xs text-purple-400 mb-1">
              <Link to="/dashboard/jmo/autopsies" className="hover:underline">Autopsy Cases</Link> &gt; Examination Workflow
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              🔬 Post-Mortem Autopsy Examination & Findings
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Health 1328 Notification status: <span className="text-emerald-400 font-bold">{notification?.status || 'Notification Completed'}</span>
            </p>
          </div>
          <Link to={`/dashboard/jmo/autopsy/${caseId}/notification`} className="btn-secondary text-xs py-2 px-4">
            ✏️ Edit Health 1328 Notification
          </Link>
        </div>

        {/* Saved Health 1328 Notification Summary */}
        <div className="glass rounded-xl p-6 border border-purple-800/40 space-y-4">
          <h2 className="text-base font-bold text-purple-400 border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
            Health 1328 Notification Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-gray-950 p-4 rounded border border-gray-800">
            <div><span className="text-gray-400 block">PM Serial #:</span> <span className="text-cyan-400 font-mono font-bold">{notification?.post_mortem_serial_number}</span></div>
            <div><span className="text-gray-400 block">Deceased Name:</span> <span className="text-white font-bold">{notification?.deceased_name}</span></div>
            <div><span className="text-gray-400 block">Court Case #:</span> <span className="text-purple-300 font-mono">{notification?.court_case_number}</span></div>
            <div><span className="text-gray-400 block">Inquirer:</span> <span className="text-white">{notification?.inquirer_name} ({notification?.inquirer_type})</span></div>
            <div><span className="text-gray-400 block">Date of Death:</span> <span className="text-white">{notification?.date_of_death ? new Date(notification.date_of_death).toLocaleDateString() : 'N/A'}</span></div>
            <div><span className="text-gray-400 block">Conducting JMO:</span> <span className="text-white font-medium">{notification?.conducting_jmo_name}</span></div>
          </div>

          <div className="bg-gray-950 p-4 rounded border border-gray-800 text-xs space-y-2">
            <h4 className="font-bold text-purple-300">Formulated Cause of Death Chain (WHO Format):</h4>
            <p><span className="text-gray-400">(a) Immediate Cause:</span> <strong className="text-white">{notification?.immediate_cause || 'Under investigation'}</strong></p>
            {notification?.cause_due_to_1 && <p><span className="text-gray-400">(b) Due to:</span> {notification.cause_due_to_1}</p>}
            {notification?.cause_due_to_2 && <p><span className="text-gray-400">(c) Due to:</span> {notification.cause_due_to_2}</p>}
            {notification?.contributory_causes && <p><span className="text-gray-400">Contributory Causes:</span> {notification.contributory_causes}</p>}
          </div>
        </div>

        {/* Examination & Post-Mortem Findings Note */}
        <div className="glass rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white border-l-4 border-purple-500 pl-3 uppercase tracking-wider">
            Autopsy Findings & Organ Dissection Records
          </h2>
          <p className="text-xs text-gray-300">
            Post-mortem anatomical examination and toxicological sample tracking is linked to autopsy ID 
            <span className="font-mono text-purple-400 ml-1">AUTOPSY-{caseId.slice(0, 8)}</span>.
          </p>
        </div>

      </main>
    </div>
  );
};

export default JMOAutopsyExam;
