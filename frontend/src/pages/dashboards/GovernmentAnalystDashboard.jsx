import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { MlefFlashCard, MlefDetailsModal } from '../../components/staff/ForensicStaffMlefSection';
import { getHospitalMlefs } from '../../api/medicalApi';

const InfoCard = ({ icon, title, subtitle, color, link }) => (
  <Link to={link || '#'} className={`glass rounded-xl p-5 border-l-4 ${color} hover:scale-[1.01] transition-transform block`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-semibold text-white text-sm">{title}</div>
    <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
  </Link>
);

const GovernmentAnalystDashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Load initial pending MLEF count for flash card badge
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const res = await getHospitalMlefs();
        const list = res.data || [];
        const count = list.filter((m) => m.status === 'PENDING').length;
        setPendingCount(count);
      } catch (err) {
        console.error('Failed to load pending MLEF count:', err);
      }
    };
    loadPendingCount();
  }, []);

  const handleDataChange = (mlefList) => {
    const count = mlefList.filter((m) => m.status === 'PENDING').length;
    setPendingCount(count);
  };

  return (
    <div className="min-h-screen bg-forensic-dark">
      <Navbar />
      <main className="pt-24 max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="page-enter">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-700/30 flex items-center justify-center text-2xl">
              🏥
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.username}</h1>
              <p className="text-rose-400 text-sm font-medium">Forensic Staff Dashboard</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid of Flash Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* New Interactive Flash Card for MLEF Requisitions */}
          <MlefFlashCard
            pendingCount={pendingCount}
            onClick={() => setIsModalOpen(true)}
          />

          {/* Connected Dashboard Cards */}
          <InfoCard
            icon="🏛️"
            title="Court Documents"
            subtitle="Track documents submitted to court"
            link="/dashboard/medical-officer/reports"
            color="border-purple-500"
          />
          <InfoCard
            icon="📬"
            title="Document Recipients"
            subtitle="Manage document delivery and examinee records"
            link="/dashboard/medical-officer/patients"
            color="border-blue-500"
          />
          <InfoCard
            icon="🔍"
            title="Case References"
            subtitle="View cases linked to hospital documents"
            link="/dashboard/medical-officer/cases"
            color="border-emerald-500"
          />
          <InfoCard
            icon="🔔"
            title="Notifications"
            subtitle="System alerts and document requests"
            link="/dashboard/medical-officer/notifications"
            color="border-cyan-500"
          />
        </div>

        {/* Full Details Modal */}
        <MlefDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onDataChange={handleDataChange}
        />
      </main>
    </div>
  );
};

export default GovernmentAnalystDashboard;
