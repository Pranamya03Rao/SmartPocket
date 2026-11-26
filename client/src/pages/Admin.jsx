import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  ShieldCheck,
  Users,
  Activity,
  Server,
  Unlock,
  UserCheck,
  Search,
  Bell,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Database,
} from 'lucide-react';

export function Admin() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Announcement Form
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState('normal');

  useEffect(() => {
    fetchDashboard();
  }, [page]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsRes, healthRes, usersRes, annRes] = await Promise.all([
        api.get('/admin/metrics').catch(() => ({ data: null })),
        api.get('/admin/health').catch(() => ({ data: null })),
        api.get(`/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`).catch(() => ({ data: { users: [], pages: 1 } })),
        api.get('/admin/announcements').catch(() => ({ data: [] })),
      ]);

      setMetrics(metricsRes.data);
      setHealth(healthRes.data);
      setUsers(usersRes.data?.users || []);
      setTotalPages(usersRes.data?.pages || 1);
      setAnnouncements(annRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin controls');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDashboard();
  };

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: nextRole });
      setSuccess(`User role updated to ${nextRole}`);
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/unlock`);
      setSuccess('User account successfully unlocked');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlock user');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    const confirmPrompt = t('announcements.confirmSend') || 'Send this announcement to all users?';
    if (!window.confirm(confirmPrompt)) return;
    try {
      await api.post('/admin/announcements', {
        title: newTitle.trim(),
        body: newBody.trim(),
        priority: newPriority,
      });
      setNewTitle('');
      setNewBody('');
      setSuccess(t('announcements.publishedSuccess') || 'Public announcement published!');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/admin/announcements/${id}`);
      setSuccess('Announcement removed');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            System Administration & Telemetry
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor platform metrics, manage student roles, inspect server health, and broadcast updates.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Metrics
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500">&times;</button>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500">&times;</button>
        </div>
      )}

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered Students</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalStudents ?? 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">24h Transactions</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {metrics?.dailyTransactions ?? 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Transactions</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalTransactions ?? 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Server Memory</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {health?.memory?.heapUsedMB ?? 0} MB
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Server Health Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-600" />
          Server Environment & Health Diagnostic
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400">Process Uptime</span>
            <p className="font-bold text-slate-900 dark:text-white mt-1">
              {Math.floor((health?.uptime || 0) / 60)} minutes
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400">Node Runtime</span>
            <p className="font-bold text-slate-900 dark:text-white mt-1">
              {health?.nodeVersion || 'v20.x'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400">Operating System</span>
            <p className="font-bold text-slate-900 dark:text-white mt-1">
              {health?.platform || 'Node Platform'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400">Status</span>
            <p className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Healthy (Operational)
            </p>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            User Accounts & Security Controls
          </h3>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs w-60"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-2">Name / Email</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Verified</th>
                <th className="py-3 px-2">Security Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => {
                const isLocked = u.lockUntil && new Date(u.lockUntil) > new Date();
                return (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2">
                      <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {u.isVerified ? (
                        <span className="text-emerald-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isLocked ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          Locked ({u.loginAttempts || 5} attempts)
                        </span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      {isLocked && (
                        <button
                          onClick={() => handleUnlockUser(u._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[11px] font-semibold border border-emerald-200"
                        >
                          <Unlock className="h-3 w-3" />
                          Unlock
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleRole(u._id, u.role)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[11px] font-semibold border border-indigo-200"
                      >
                        <UserCheck className="h-3 w-3" />
                        {u.role === 'admin' ? 'Make Student' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Announcements Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Creator */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            {t('announcements.publishTitle') || 'Publish Public Announcement'}
          </h3>

          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('announcements.titleLabel') || 'Announcement Title *'}
              </label>
              <input
                type="text"
                placeholder={t('announcements.titlePlaceholder') || 'e.g. UPI Fraud Alert, Free Budgeting Workshop'}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('announcements.bodyLabel') || 'Announcement Body *'}
              </label>
              <textarea
                rows={3}
                placeholder={t('announcements.bodyPlaceholder') || 'Detailed message shown to all users on their dashboards...'}
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t('announcements.priorityLabel') || 'Priority'}
              </label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
              >
                <option value="low">{t('announcements.priorityLow') || 'Low'}</option>
                <option value="normal">{t('announcements.priorityNormal') || 'Normal'}</option>
                <option value="high">{t('announcements.priorityHigh') || 'High (Urgent Banner)'}</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
            >
              {t('announcements.broadcastBtn') || 'Broadcast to Everyone'}
            </button>
          </form>
        </div>

        {/* Existing Announcements */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('announcements.title') || 'Announcements'} ({announcements.length})
          </h3>

          {announcements.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">{t('announcements.noActive') || 'No active announcements.'}</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {announcements.map(a => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        a.priority === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {a.priority}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {a.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {a.body}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(a._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 shrink-0"
                    title="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Admin;
