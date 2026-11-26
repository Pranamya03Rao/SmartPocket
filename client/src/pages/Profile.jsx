import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../api/client.js';
import {
  User,
  Shield,
  Download,
  Trash2,
  Key,
  CheckCircle,
  AlertTriangle,
  Bell,
  BellOff,
  Send,
  HelpCircle,
  Smartphone,
} from 'lucide-react';
import {
  getSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from '../utils/push.js';

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

export function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { t, isKn } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [occupation, setOccupation] = useState(user?.profile?.occupation || 'daily-wage');
  const [incomeType, setIncomeType] = useState(user?.profile?.incomeType || 'daily');
  const [dailyWage, setDailyWage] = useState(user?.profile?.dailyWage || 500);
  const [monthlyIncome, setMonthlyIncome] = useState(user?.profile?.monthlyIncome || user?.profile?.monthlyAllowance || 12000);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactor?.enabled || false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  // Push notifications state: 'loading' | 'unsupported' | 'blocked' | 'on' | 'off' | 'error'
  const [pushStatus, setPushStatus] = useState('loading');
  const [pushReason, setPushReason] = useState('');
  const [pushError, setPushError] = useState('');
  const [pushSuccess, setPushSuccess] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushTesting, setPushTesting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function initPushStatus() {
      try {
        const res = await getSubscriptionStatus();
        if (mounted) {
          setPushStatus(res.state);
          if (res.reason) setPushReason(res.reason);
        }
      } catch (err) {
        if (mounted) {
          setPushStatus('error');
          setPushError(err.message || 'Failed to detect push state');
        }
      }
    }
    initPushStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    setPushError('');
    setPushSuccess('');

    try {
      if (pushStatus === 'on') {
        await unsubscribeFromPush();
        setPushStatus('off');
        setPushSuccess(isKn ? 'ಸೂಚನೆಗಳನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ' : 'Push notifications disabled on this device.');
      } else {
        await subscribeToPush();
        setPushStatus('on');
        setPushSuccess(isKn ? 'ಸೂಚನೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಆನ್ ಮಾಡಲಾಗಿದೆ!' : 'Push notifications enabled successfully!');
      }
    } catch (err) {
      const res = await getSubscriptionStatus();
      setPushStatus(res.state);
      if (res.reason) setPushReason(res.reason);
      setPushError(err.message || 'Failed to update push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setPushTesting(true);
    setPushError('');
    setPushSuccess('');

    try {
      const res = await api.post('/push/test');
      setPushSuccess(
        res.data?.message || t('profile.testSentSuccess')
      );
    } catch (err) {
      setPushError(err.response?.data?.error || (isKn ? 'ಪರೀಕ್ಷಾರ್ಥ ಸೂಚನೆ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to send test notification.'));
    } finally {
      setPushTesting(false);
    }
  };

  const handleUpdateProfile = async e => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileMsg('');
    setProfileErr('');

    try {
      await api.patch('/auth/profile', {
        name,
        occupation,
        incomeType,
        dailyWage: Number(dailyWage),
        monthlyIncome: Number(monthlyIncome),
        monthlyAllowance: Number(monthlyIncome),
        twoFactorEnabled,
      });
      setProfileMsg(isKn ? 'ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Profile updated successfully!');
      await refreshUser();
    } catch (err) {
      setProfileErr(err.response?.data?.error || (isKn ? 'ವಿವರ ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to update profile.'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    setLoadingPwd(true);
    setPwdMsg('');
    setPwdErr('');

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPwdMsg(isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ!' : 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdErr(err.response?.data?.error || (isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾವಣೆ ವಿಫಲವಾಗಿದೆ' : 'Failed to change password.'));
    } finally {
      setLoadingPwd(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/auth/export-my-data');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-pocket-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_err) {
      alert(isKn ? 'ಮಾಹಿತಿ ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ' : 'Failed to export data');
    }
  };

  const handleLogoutAll = async () => {
    const confirmMsg = isKn
      ? 'ಎಲ್ಲಾ ಮೊಬೈಲ್ ಮತ್ತು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಂದ ಲಾಗ್‌ಔಟ್ ಮಾಡಲು ಖಚಿತಪಡಿಸಿ?'
      : 'Are you sure you want to log out from all devices?';
    if (confirm(confirmMsg)) {
      try {
        await api.post('/auth/logout-all');
        await logout();
      } catch (_err) {
        alert(isKn ? 'ಲಾಗ್‌ಔಟ್ ವಿಫಲವಾಗಿದೆ' : 'Failed to log out all sessions');
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmPrompt = isKn
      ? 'ಎಚ್ಚರಿಕೆ: ಇದು ನಿಮ್ಮ ಎಲ್ಲಾ ದಿನಗೂಲಿ ಲೆಕ್ಕ, ಬಜೆಟ್ ಮತ್ತು ಗುರಿಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ. ಖಚಿತಪಡಿಸಲು DELETE ಎಂದು ಬರೆಯಿರಿ:'
      : 'WARNING: This will permanently delete your account, ledger, and goals. Type DELETE to confirm:';
    const confirmed = prompt(confirmPrompt);
    if (confirmed === 'DELETE') {
      try {
        await api.delete('/auth/account');
        await logout();
      } catch (err) {
        alert(err.response?.data?.error || (isKn ? 'ಖಾತೆ ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to delete account'));
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('profile.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Details Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          {isKn ? 'ಕಾರ್ಮಿಕರ ವಿವರಗಳು ಮತ್ತು ದಿನಗೂಲಿ ಮಾಹಿತಿ' : 'Worker & Income Information'}
        </h2>

        {profileMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{profileMsg}</span>
          </div>
        )}
        {profileErr && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{profileErr}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {t('profile.name')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {t('profile.email')}
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {t('profile.occupation')}
              </label>
              <select
                value={occupation}
                onChange={e => setOccupation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
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
                {isKn ? 'ಆದಾಯ ಪಡೆಯುವ ವಿಧ' : 'Income Frequency'}
              </label>
              <select
                value={incomeType}
                onChange={e => setIncomeType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              >
                <option value="daily">{isKn ? 'ದಿನಗೂಲಿ (Daily)' : 'Daily Wage'}</option>
                <option value="weekly">{isKn ? 'ವಾರದ ಕೂಲಿ (Weekly)' : 'Weekly'}</option>
                <option value="monthly">{isKn ? 'ಮಾಸಿಕ ವೇತನ (Monthly)' : 'Monthly'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {t('profile.dailyWage')} (₹)
              </label>
              <input
                type="number"
                min="0"
                value={dailyWage}
                onChange={e => {
                  const val = Number(e.target.value);
                  setDailyWage(val);
                  setMonthlyIncome(val * 26);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="2fa"
              checked={twoFactorEnabled}
              onChange={e => setTwoFactorEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="2fa" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              {isKn
                ? 'ದ್ವಿಮುಖ ಭದ್ರತೆ (ಇಮೇಲ್ OTP ಮೂಲಕ ಲಾಗಿನ್ ಭದ್ರಪಡಿಸಿ)'
                : 'Enable Two-Factor Authentication (Email OTP for logins)'}
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loadingProfile}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 min-h-[44px]"
            >
              {loadingProfile ? t('common.loading') : (isKn ? 'ವಿವರಗಳನ್ನು ಉಳಿಸಿ' : 'Save Profile Changes')}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          {t('profile.security')}
        </h2>

        {pwdMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{pwdMsg}</span>
          </div>
        )}
        {pwdErr && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{pwdErr}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {t('profile.currentPassword')}
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {t('profile.newPassword')}
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            disabled={loadingPwd}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 min-h-[44px]"
          >
            {loadingPwd ? t('common.loading') : (isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ' : 'Update Password')}
          </button>
        </form>
      </div>

      {/* Push Notifications Toggle on this Device */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              {t('profile.notificationsTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('profile.notificationsSubtitle')}
            </p>
          </div>

          {pushStatus === 'on' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Bell className="h-3.5 w-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <BellOff className="h-3.5 w-3.5" />
              {pushStatus === 'blocked' ? 'Blocked' : pushStatus === 'unsupported' ? 'Unsupported' : 'Off'}
            </span>
          )}
        </div>

        {pushSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{pushSuccess}</span>
          </div>
        )}

        {pushError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{pushError}</span>
          </div>
        )}

        {/* State-specific UI helpers */}
        {pushStatus === 'blocked' && (
          <div className="mb-4 rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t('profile.notificationsBlocked')}
            </p>
            <p className="mt-1 leading-relaxed">
              {t('profile.notificationsBlockedHelp')}
            </p>
          </div>
        )}

        {pushStatus === 'unsupported' && (
          <div className="mb-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300">
            <p className="font-bold flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-slate-500 shrink-0" />
              {t('profile.notificationsUnsupported')}
            </p>
            <p className="mt-1 leading-relaxed">
              {pushReason === 'ios_not_standalone'
                ? t('profile.notificationsIosHelp')
                : pushReason === 'insecure_context'
                ? t('profile.notificationsInsecureHelp')
                : t('profile.notificationsUnsupported')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Main Toggle Button */}
          {pushStatus !== 'unsupported' && pushStatus !== 'blocked' && (
            <button
              type="button"
              disabled={pushLoading}
              onClick={handleTogglePush}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors min-h-[44px] ${
                pushStatus === 'on'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {pushLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>{t('common.loading')}</span>
                </>
              ) : pushStatus === 'on' ? (
                <>
                  <BellOff className="h-4 w-4" />
                  <span>{t('profile.disableNotifications')}</span>
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  <span>{t('profile.enableNotifications')}</span>
                </>
              )}
            </button>
          )}

          {/* Test Notification Button (only shown when active/on) */}
          {pushStatus === 'on' && (
            <button
              type="button"
              disabled={pushTesting}
              onClick={handleSendTestPush}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 text-sm font-semibold transition-colors min-h-[44px]"
            >
              <Send className="h-4 w-4" />
              <span>
                {pushTesting
                  ? (isKn ? 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...' : 'Sending...')
                  : t('profile.sendTestNotification')}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Data Management & Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5" />
          {isKn ? 'ಖಾತೆ ನಿಯಂತ್ರಣ ಮತ್ತು ನಿರ್ಗಮನ' : 'Data Portability & Sessions'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {isKn
            ? 'ನಿಮ್ಮ ಹಣಕಾಸು ಲೆಕ್ಕಪತ್ರವನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿಕೊಳ್ಳಿ ಅಥವಾ ಎಲ್ಲಾ ಸಾಧನಗಳಿಂದ ಲಾಗ್‌ಔಟ್ ಮಾಡಿ.'
            : 'Export your financial records or manage active device logins.'}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 min-h-[44px]"
          >
            <Download className="h-4 w-4" />
            {isKn ? 'ನನ್ನ ಸಂಪೂರ್ಣ ಲೆಕ್ಕ ಡೌನ್‌ಲೋಡ್ (JSON)' : 'Export My Data (JSON)'}
          </button>

          <button
            type="button"
            onClick={handleLogoutAll}
            className="flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30 min-h-[44px]"
          >
            {isKn ? 'ಎಲ್ಲಾ ಸಾಧನಗಳಿಂದ ಲಾಗ್‌ಔಟ್' : 'Log Out All Other Devices'}
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 ml-auto min-h-[44px]"
          >
            <Trash2 className="h-4 w-4" />
            {isKn ? 'ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ' : 'Delete Account Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default Profile;
