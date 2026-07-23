import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

const InfoCard = ({ icon, title, subtitle, color }) => (
  <div className={`glass rounded-xl p-5 border-l-4 ${color} hover:scale-[1.01] transition-transform`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-semibold text-white text-sm">{title}</div>
    <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
  </div>
);

const PoliceDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-16 max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 page-enter">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-700/30 flex items-center justify-center text-2xl">
              🚔
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome, {user?.username}
              </h1>
              <p className="text-blue-400 text-sm font-medium">Police Officer Dashboard</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <InfoCard icon="📋" title="Case Management"
            subtitle="View and manage your assigned cases"
            color="border-blue-500" />
          <InfoCard icon="🔍" title="Evidence Tracking"
            subtitle="Log and track evidence chain of custody"
            color="border-cyan-500" />
          <InfoCard icon="📝" title="Incident Reports"
            subtitle="Submit and view incident reports"
            color="border-indigo-500" />
          <InfoCard icon="🏥" title="MLEF Requests"
            subtitle="Request medico-legal examinations"
            color="border-purple-500" />
          <InfoCard icon="📊" title="Case Activities"
            subtitle="Track updates on active investigations"
            color="border-emerald-500" />
          <InfoCard icon="🔔" title="Notifications"
            subtitle="View system alerts and messages"
            color="border-amber-500" />
        </div>

        {/* Info banner */}
        <div className="glass rounded-xl p-6 border border-blue-800/30">
          <div className="flex gap-3 items-start">
            <div className="text-blue-400 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Role: Police Officer</p>
              <p className="text-gray-400 text-xs mt-1">
                You have access to case management, evidence tracking, and medico-legal examination request (MLEF) features.
                Full case management modules will be available in upcoming releases.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PoliceDashboard;
