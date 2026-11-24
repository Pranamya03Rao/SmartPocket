import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [inputToken, setInputToken] = useState(token || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async tokenToUse => {
    if (!tokenToUse) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/verify-email', { token: tokenToUse });
      setMessage(res.data.message || 'Email successfully verified!');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Email Verification
        </h1>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Verifying your account...</p>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleVerify(inputToken);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Enter verification token"
                value={inputToken}
                onChange={e => setInputToken(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Verify Token
              </button>
            </form>
          </div>
        )}

        {message && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{message}</span>
            </div>
            <Link
              to="/login"
              className="inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Proceed to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
