import { Link } from 'react-router-dom';

const PendingApprovalPage = () => (
  <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
    <div className="w-full max-w-md page-enter">
      <div className="glass rounded-2xl p-10 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
          <svg className="w-10 h-10 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Registration Submitted</h1>

        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 mb-6 text-left">
          <p className="text-amber-300 font-medium text-sm mb-1">⏳ Awaiting Administrator Approval</p>
          <p className="text-amber-400/70 text-xs leading-relaxed">
            Your account is waiting for administrator approval. You will be able to log in once an
            administrator has reviewed and approved your registration.
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-400 mb-8">
          <p>Please check with your department supervisor or</p>
          <p>contact the system administrator for approval status.</p>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors text-sm"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  </div>
);

export default PendingApprovalPage;
