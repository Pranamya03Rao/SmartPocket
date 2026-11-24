import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { AlertTriangle, KeyRound, Globe } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const { isKn, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password, requires2FA ? otp : undefined);

      if (res?.requires2FA) {
        setRequires2FA(true);
        if (res.devOtp) setDevOtp(res.devOtp);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || (isKn ? 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ. ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ.' : 'Login failed. Please check credentials.'));
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
            {isKn ? 'ಸ್ಮಾರ್ಟ್ ಪಾಕೆಟ್ ಲಾಗಿನ್' : 'Welcome to Smart Pocket'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isKn
              ? 'ನಿಮ್ಮ ಖಾತೆಗೆ ಪ್ರವೇಶಿಸಿ, ದಿನಗೂಲಿ & ಖರ್ಚಿನ ಲೆಕ್ಕ ನಿರ್ವಹಿಸಿ'
              : 'Sign in to manage your daily wages & family savings'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'Email Address'} *
            </label>
            <input
              type="email"
              required
              disabled={requires2FA}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="worker@gmail.com"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-950 min-h-[44px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {isKn ? 'ಪಾಸ್‌ವರ್ಡ್' : 'Password'} *
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?' : 'Forgot password?'}
              </Link>
            </div>
            <input
              type="password"
              required
              disabled={requires2FA}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-950 min-h-[44px]"
            />
          </div>

          {requires2FA && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30 animate-fade-in">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-indigo-900 dark:text-indigo-300">
                <KeyRound className="h-4 w-4" />
                {isKn ? 'ದ್ವಿಮುಖ ಭದ್ರತಾ ಕೋಡ್ (OTP)' : 'Two-Factor Authentication OTP'}
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                className="mt-1.5 w-full rounded-xl border border-indigo-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-indigo-800 dark:bg-slate-900 dark:text-white min-h-[44px]"
              />
              {devOtp && (
                <p className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-300">
                  Dev code: <code className="font-mono font-bold">{devOtp}</code>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors min-h-[44px]"
          >
            {loading ? (isKn ? 'ಪ್ರವೇಶಿಸಲಾಗುತ್ತಿದೆ...' : 'Signing in...') : (isKn ? 'ಲಾಗಿನ್ ಮಾಡಿ' : 'Sign in')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {isKn ? 'ಖಾತೆ ಇಲ್ಲವೇ? ' : "Don't have an account? "}{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            {isKn ? 'ಹೊಸ ಖಾತೆ ತೆರೆಯಿರಿ' : 'Register now'}
          </Link>
        </p>

        {/* Link to public user guide */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link to="/public-guide" className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:underline">
            📖 {isKn ? 'ಈ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸುವುದು ಹೇಗೆ? ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ' : 'How to use this app? View beginner guide'}
          </Link>
        </p>
      </div>
    </div>
  );
}
export default Login;
