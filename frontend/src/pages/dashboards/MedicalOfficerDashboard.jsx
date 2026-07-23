import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const MedicalOfficerDashboard = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-700/30 flex items-center justify-center text-2xl">
              👨‍⚕️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.username}</h1>
              <p className="text-emerald-400 text-sm font-medium">Medical Officer Dashboard</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid of Flash Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MlefFlashCard
            pendingCount={pendingCount}
            onClick={() => setIsModalOpen(true)}
          />

          <InfoCard
            icon="👤"
            title="Patient Records"
            subtitle="View and manage hospital patient records"
            link="/dashboard/medical-officer/patients"
            color="border-emerald-500"
          />
          <InfoCard
            icon="📋"
            title="Medical Reports"
            subtitle="Create and review medico-legal reports"
            link="/dashboard/medical-officer/reports"
            color="border-blue-500"
          />
          <InfoCard
            icon="🔍"
            title="Case Consultation"
            subtitle="Assist with medico-legal case investigations"
            link="/dashboard/medical-officer/cases"
            color="border-purple-500"
          />
          <InfoCard
            icon="💊"
            title="Treatment Notes"
            subtitle="Document clinical observations and notes"
            link="/dashboard/medical-officer/notes"
            color="border-amber-500"
          />
          <InfoCard
            icon="🔔"
            title="Notifications"
            subtitle="View alerts and system messages"
            link="/dashboard/medical-officer/notifications"
            color="border-rose-500"
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

export default MedicalOfficerDashboard;
