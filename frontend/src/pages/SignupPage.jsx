import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ROLES = [
  { label: 'Police Officer',            value: 'POLICE' },
  { label: 'Judicial Medical Officer',  value: 'JMO' },
  { label: 'Medical Officer',           value: 'MEDICAL_OFFICER' },
  { label: 'Laboratory Technician',     value: 'LAB_TECHNICIAN' },
  { label: 'Forensic Staff',            value: 'GOVERNMENT_ANALYST' },
];

const HOSPITAL_ROLES = ['JMO', 'MEDICAL_OFFICER', 'LAB_TECHNICIAN', 'GOVERNMENT_ANALYST'];
const STATION_ROLES  = ['POLICE'];

const GENDERS = ['Male', 'Female', 'Other'];

const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {[1, 2, 3].map((s) => (
      <div key={s} className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
          ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
          {step > s ? '✓' : s}
        </div>
        {s < 3 && <div className={`w-10 h-0.5 transition-all ${step > s ? 'bg-primary-600' : 'bg-gray-700'}`} />}
      </div>
    ))}
  </div>
);

const FormField = ({ label, id, required, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals]       = useState([]);
  const [stations, setStations]         = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [errors, setErrors]             = useState({});
  const [submitError, setSubmitError]   = useState('');

  const [form, setForm] = useState({
    // Account
    username: '', password: '', confirmPassword: '', email: '', phone: '',
    // Role
    role: '',
    // Personal
    first_name: '', last_name: '', nic: '',
    gender: '', date_of_birth: '', telephone: '', address: '',
    // Role-specific
    hospital_id: '', station_id: '',
    badge_number: '', rank: '',
    registration_number: '', specialization: '',
    employee_number: '', qualification: '',
    organization_name: '', designation: '',
  });

  useEffect(() => {
    api.get('/auth/hospitals').then(r => setHospitals(r.data.data)).catch(() => {});
    api.get('/auth/stations').then(r => setStations(r.data.data)).catch(() => {});
    api.get('/auth/laboratories').then(r => setLaboratories(r.data.data)).catch(() => {});
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setSubmitError('');
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.username.trim() || form.username.length < 3)
      errs.username = 'Username must be at least 3 characters';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Invalid email address';
    if (!form.role) errs.role = 'Please select a role';
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim())  errs.last_name = 'Last name is required';
    return errs;
  };

  const validateStep3 = () => {
    const errs = {};
    if (STATION_ROLES.includes(form.role) && !form.station_id)
      errs.station_id = 'Please select a police station';
    if (HOSPITAL_ROLES.includes(form.role) && !form.hospital_id)
      errs.hospital_id = 'Please select a hospital';
    return errs;
  };

  const nextStep = () => {
    const errs = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep3();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setSubmitError('');
    try {
      await api.post('/auth/register', form);
      navigate('/pending', { replace: true });
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors?.length) {
        const fieldErrors = {};
        serverErrors.forEach(e => { fieldErrors[e.path] = e.msg; });
        setErrors(fieldErrors);
        setStep(1);
      } else {
        setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const needsHospital = HOSPITAL_ROLES.includes(form.role);
  const needsStation  = STATION_ROLES.includes(form.role);

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 py-12">
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="w-full max-w-2xl page-enter relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Request Access</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Create your account — admin approval required before login
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <StepIndicator step={step} />

          {/* Step labels */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white">
              {step === 1 ? 'Account & Role' : step === 2 ? 'Personal Details' : 'Professional Details'}
            </h2>
            <p className="text-gray-500 text-xs mt-1">Step {step} of 3</p>
          </div>

          {submitError && (
            <div className="mb-5 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
              {submitError}
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>

            {/* ── STEP 1: Account & Role ─────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Username" id="s-username" required error={errors.username}>
                    <input id="s-username" className="input-field" type="text"
                      value={form.username} onChange={set('username')} placeholder="Choose a username" />
                  </FormField>
                  <FormField label="Email" id="s-email" error={errors.email}>
                    <input id="s-email" className="input-field" type="email"
                      value={form.email} onChange={set('email')} placeholder="your@email.com" />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Password" id="s-password" required error={errors.password}>
                    <input id="s-password" className="input-field" type="password"
                      value={form.password} onChange={set('password')} placeholder="Min 8 characters" />
                  </FormField>
                  <FormField label="Confirm Password" id="s-cpassword" required error={errors.confirmPassword}>
                    <input id="s-cpassword" className="input-field" type="password"
                      value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
                  </FormField>
                </div>

                <FormField label="Phone" id="s-phone" error={errors.phone}>
                  <input id="s-phone" className="input-field" type="tel"
                    value={form.phone} onChange={set('phone')} placeholder="+94 71 234 5678" />
                </FormField>

                <FormField label="Role" id="s-role" required error={errors.role}>
                  <select id="s-role" className="select-field" value={form.role} onChange={set('role')}>
                    <option value="">Select your role...</option>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            )}

            {/* ── STEP 2: Personal Details ───────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First Name" id="s-fname" required error={errors.first_name}>
                    <input id="s-fname" className="input-field" type="text"
                      value={form.first_name} onChange={set('first_name')} placeholder="First name" />
                  </FormField>
                  <FormField label="Last Name" id="s-lname" required error={errors.last_name}>
                    <input id="s-lname" className="input-field" type="text"
                      value={form.last_name} onChange={set('last_name')} placeholder="Last name" />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="NIC Number" id="s-nic" error={errors.nic}>
                    <input id="s-nic" className="input-field" type="text"
                      value={form.nic} onChange={set('nic')} placeholder="e.g. 990123456V" />
                  </FormField>
                  <FormField label="Gender" id="s-gender" error={errors.gender}>
                    <select id="s-gender" className="select-field" value={form.gender} onChange={set('gender')}>
                      <option value="">Select gender...</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Date of Birth" id="s-dob" error={errors.date_of_birth}>
                    <input id="s-dob" className="input-field" type="date"
                      value={form.date_of_birth} onChange={set('date_of_birth')} />
                  </FormField>
                  <FormField label="Telephone" id="s-tel" error={errors.telephone}>
                    <input id="s-tel" className="input-field" type="tel"
                      value={form.telephone} onChange={set('telephone')} placeholder="Personal telephone" />
                  </FormField>
                </div>

                <FormField label="Address" id="s-address" error={errors.address}>
                  <textarea id="s-address" className="input-field resize-none" rows={3}
                    value={form.address} onChange={set('address')} placeholder="Permanent address" />
                </FormField>
              </div>
            )}

            {/* ── STEP 3: Professional Details ───────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Hospital / Laboratory / Station */}
                {needsHospital && (
                  <FormField 
                    label={form.role === 'LAB_TECHNICIAN' ? "Assigned Laboratory" : "Hospital"} 
                    id="s-hospital" 
                    required 
                    error={errors.hospital_id}
                  >
                    <select id="s-hospital" className="select-field" value={form.hospital_id} onChange={set('hospital_id')}>
                      <option value="">
                        {form.role === 'LAB_TECHNICIAN' ? "Select laboratory / hospital..." : "Select hospital..."}
                      </option>
                      {form.role === 'LAB_TECHNICIAN' && laboratories.length > 0
                        ? laboratories.map(l => (
                            <option key={l.laboratory_id} value={l.hospital_id}>
                              {l.laboratory_name} ({l.hospital_name})
                            </option>
                          ))
                        : hospitals.map(h => (
                            <option key={h.hospital_id} value={h.hospital_id}>
                              {h.hospital_name} {h.district ? `— ${h.district}` : ''}
                            </option>
                          ))
                      }
                    </select>
                  </FormField>
                )}

                {needsStation && (
                  <FormField label="Police Station" id="s-station" required error={errors.station_id}>
                    <select id="s-station" className="select-field" value={form.station_id} onChange={set('station_id')}>
                      <option value="">Select police station...</option>
                      {stations.map(s => (
                        <option key={s.station_id} value={s.station_id}>
                          {s.station_name} {s.district ? `— ${s.district}` : ''}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                {/* Police-specific */}
                {form.role === 'POLICE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Badge Number" id="s-badge" error={errors.badge_number}>
                      <input id="s-badge" className="input-field" type="text"
                        value={form.badge_number} onChange={set('badge_number')} placeholder="e.g. P12345" />
                    </FormField>
                    <FormField label="Rank" id="s-rank" error={errors.rank}>
                      <input id="s-rank" className="input-field" type="text"
                        value={form.rank} onChange={set('rank')} placeholder="e.g. Inspector" />
                    </FormField>
                  </div>
                )}

                {/* JMO-specific */}
                {form.role === 'JMO' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Registration Number" id="s-jmo-reg" error={errors.registration_number}>
                      <input id="s-jmo-reg" className="input-field" type="text"
                        value={form.registration_number} onChange={set('registration_number')} placeholder="SLMC registration" />
                    </FormField>
                    <FormField label="Specialization" id="s-spec" error={errors.specialization}>
                      <input id="s-spec" className="input-field" type="text"
                        value={form.specialization} onChange={set('specialization')} placeholder="e.g. Forensic Medicine" />
                    </FormField>
                  </div>
                )}

                {/* Medical Officer specific */}
                {form.role === 'MEDICAL_OFFICER' && (
                  <FormField label="Registration Number" id="s-mo-reg" error={errors.registration_number}>
                    <input id="s-mo-reg" className="input-field" type="text"
                      value={form.registration_number} onChange={set('registration_number')} placeholder="SLMC registration number" />
                  </FormField>
                )}

                {/* Lab Technician specific */}
                {form.role === 'LAB_TECHNICIAN' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Employee Number" id="s-emp" error={errors.employee_number}>
                      <input id="s-emp" className="input-field" type="text"
                        value={form.employee_number} onChange={set('employee_number')} placeholder="Employee ID" />
                    </FormField>
                    <FormField label="Qualification" id="s-qual" error={errors.qualification}>
                      <input id="s-qual" className="input-field" type="text"
                        value={form.qualification} onChange={set('qualification')} placeholder="e.g. B.Sc MLT" />
                    </FormField>
                  </div>
                )}

                {/* Forensic Staff / Government Analyst specific */}
                {form.role === 'GOVERNMENT_ANALYST' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Employee Number" id="s-ga-emp" error={errors.employee_number}>
                        <input id="s-ga-emp" className="input-field" type="text"
                          value={form.employee_number} onChange={set('employee_number')} placeholder="Employee ID" />
                      </FormField>
                      <FormField label="Designation" id="s-desg" error={errors.designation}>
                        <input id="s-desg" className="input-field" type="text"
                          value={form.designation} onChange={set('designation')} placeholder="Job title" />
                      </FormField>
                    </div>
                    <FormField label="Organization / Department" id="s-org" error={errors.organization_name}>
                      <input id="s-org" className="input-field" type="text"
                        value={form.organization_name} onChange={set('organization_name')} placeholder="Department or organization" />
                    </FormField>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-2.5 px-4 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium">
                  ← Back
                </button>
              )}
              <button type="submit" disabled={loading}
                className={`flex-1 btn-primary ${step < 3 ? '' : ''}`}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                ) : step < 3 ? 'Next →' : 'Submit Registration'}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
