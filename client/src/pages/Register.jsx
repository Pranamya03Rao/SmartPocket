import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { AlertTriangle, CheckCircle, Globe } from 'lucide-react';

const OCCUPATIONS = [
  { id: 'daily-wage', labelEn: 'Daily Wage Worker', labelKn: 'ದಿನಗೂಲಿ ಕಾರ್ಮಿಕರು' },
  { id: 'construction', labelEn: 'Construction / Masonry Worker', labelKn: 'ಕಟ್ಟಡ / ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರು' },
  { id: 'factory', labelEn: 'Factory / Garment Worker', labelKn: 'ಕಾರ್ಖಾನೆ / ಗಾರ್ಮೆಂಟ್ಸ್ ಕಾರ್ಮಿಕರು' },
  { id: 'domestic', labelEn: 'Housekeeping / Domestic Help', labelKn: 'ಮನೆಗೆಲಸ / ಸ್ವಚ್ಛತಾ ಸಿಬ್ಬಂದಿ' },
  { id: 'vendor', labelEn: 'Street Vendor / Hawkers', labelKn: 'ಬೀದಿಬದಿ ವ್ಯಾಪಾರಿ / ಸಣ್ಣ ಅಂಗಡಿ' },
  { id: 'delivery', labelEn: 'Delivery / Auto / Cab Driver', labelKn: 'ಡೆಲಿವರಿ / ಆಟೋ / ಟ್ಯಾಕ್ಸಿ ಚಾಲಕರು' },
  { id: 'agriculture', labelEn: 'Agricultural Labourer / Farmer', labelKn: 'ಕೃಷಿ ಕಾರ್ಮಿಕರು / ರೈತರು' },
  { id: 'other', labelEn: 'Other Low-Income Work', labelKn: 'ಇತರೆ ಅಸಂಘಟಿತ ಕೆಲಸ' },
];

export function Register() {
  const { register } = useAuth();
  const { isKn, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    occupation: 'daily-wage',
    dailyWage: 500,
    incomeType: 'daily',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'dailyWage' ? Number(value) : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'worker',
        profile: {
          occupation: form.occupation,
          incomeType: form.incomeType,
          dailyWage: form.dailyWage,
          monthlyIncome: form.dailyWage * 26,
          monthlyAllowance: form.dailyWage * 26,
        },
      });

      setSuccess(res.message || (isKn ? 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! ದಯವಿಟ್ಟು ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ.' : 'Registration successful! Please check your email.'));
      if (res.devVerifyToken) {
        setSuccess(
          isKn
            ? `ನೋಂದಣಿಯಾಗಿದೆ! ಪರಿಶೀಲನಾ ಕೋಡ್: ${res.devVerifyToken}. ಮುಂದುವರಿಯಲಾಗುತ್ತಿದೆ...`
            : `Registered! Dev verification token: ${res.devVerifyToken}. Redirecting to verify page...`
        );
        setTimeout(() => {
          navigate(`/verify-email?token=${res.devVerifyToken}`);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || (isKn ? 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.' : 'Registration failed. Check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 relative">
        {/* Language switch button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-600" />
            {isKn ? 'English' : 'ಕನ್ನಡ'}
          </button>
        </div>

        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white shadow-md">
            ₹
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isKn ? 'ಸ್ಮಾರ್ಟ್ ಪಾಕೆಟ್ ಹೊಸ ಖಾತೆ ತೆರೆಯಿರಿ' : 'Join Smart Pocket'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isKn
              ? 'ದಿನಗೂಲಿ, ರೇಷನ್ ಮತ್ತು ಸುರಕ್ಷಿತ ಉಳಿತಾಯದ ಸರಳ ನಿರ್ವಹಣೆ'
              : 'Simple daily wage tracking & debt-free savings for workers'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {isKn ? 'ಪೂರ್ಣ ಹೆಸರು' : 'Full Name'} *
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder={isKn ? 'ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್' : 'e.g. Ramesh Kumar'}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'Email Address'} *
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="worker@gmail.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {isKn ? 'ಪಾಸ್‌ವರ್ಡ್ (ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು)' : 'Password (Min 8 chars, 1 uppercase, 1 number)'} *
            </label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {isKn ? 'ಕೆಲಸ / ಉದ್ಯೋಗ' : 'Occupation'}
              </label>
              <select
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              >
                {OCCUPATIONS.map(occ => (
                  <option key={occ.id} value={occ.id}>
                    {isKn ? occ.labelKn : occ.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {isKn ? 'ದಿನಗೂಲಿ ಅಂದಾಜು (₹)' : 'Daily Wage (₹)'}
              </label>
              <input
                type="number"
                name="dailyWage"
                min="0"
                value={form.dailyWage}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors min-h-[44px]"
          >
            {loading ? (isKn ? 'ಖಾತೆ ಸೃಷ್ಟಿಸಲಾಗುತ್ತಿದೆ...' : 'Creating account...') : (isKn ? 'ಖಾತೆ ತೆರೆಯಿರಿ' : 'Create Free Account')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {isKn ? 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ' : 'Already have an account? '}{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            {isKn ? 'ಲಾಗಿನ್ ಮಾಡಿ' : 'Log in'}
          </Link>
        </p>

        {/* Link to public guide */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link to="/public-guide" className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:underline">
            📖 {isKn ? 'ಈ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸುವುದು ಹೇಗೆ? ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ' : 'How to use this app? View beginner guide'}
          </Link>
        </p>
      </div>
    </div>
  );
}
export default Register;
