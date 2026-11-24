import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Users,
  Plus,
  UserPlus,
  Receipt,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export function Groups() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t, isKn } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Expense Form
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expSplitType, setExpSplitType] = useState('equal');
  const [customShares, setCustomShares] = useState({});

  // Settle Form
  const [settleToUser, setSettleToUser] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [upiId] = useState('worker@upi');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      const list = res.data?.groups || [];
      setGroups(list);
      if (list.length > 0 && !selectedGroup) {
        setSelectedGroup(list[0]);
        loadGroupDetail(list[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಗುಂಪುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to load expense groups'));
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetail = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroupDetail(res.data);
    } catch (err) {
      console.error('Failed to load group detail', err);
    }
  };

  const handleSelectGroup = (grp) => {
    setSelectedGroup(grp);
    loadGroupDetail(grp._id);
  };

  // Join group room via WebSocket for live updates
  useEffect(() => {
    if (!socket || !selectedGroup?._id) return;

    socket.emit('join_group', selectedGroup._id);

    const handleLiveExpense = () => {
      loadGroupDetail(selectedGroup._id);
    };

    socket.on('group_expense_added', handleLiveExpense);
    socket.on('group_settled', handleLiveExpense);

    return () => {
      socket.emit('leave_group', selectedGroup._id);
      socket.off('group_expense_added', handleLiveExpense);
      socket.off('group_settled', handleLiveExpense);
    };
  }, [socket, selectedGroup?._id]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
      });
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setSuccess(isKn ? 'ಗುಂಪು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ!' : 'Group created successfully!');
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಗುಂಪು ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to create group'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedGroup) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/groups/${selectedGroup._id}/invite`, {
        email: inviteEmail.trim().toLowerCase(),
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setSuccess(isKn ? 'ಸದಸ್ಯರನ್ನು ಗುಂಪಿಗೆ ಸೇರಿಸಲಾಗಿದೆ!' : 'Member added to group!');
      loadGroupDetail(selectedGroup._id);
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ. ಇಮೇಲ್ ಸರಿಯಾಗಿದೆಯೇ ಪರೀಕ್ಷಿಸಿ.' : 'Failed to invite member. Check if the user is registered.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (!expDesc.trim() || amt <= 0 || !selectedGroup) return;

    let payloadShares = undefined;
    if (expSplitType !== 'equal') {
      payloadShares = groupDetail.group.members.map(m => ({
        user: m._id,
        value: Number(customShares[m._id] || 0),
      }));
    }

    setActionLoading(true);
    setError('');
    try {
      await api.post(`/groups/${selectedGroup._id}/expenses`, {
        description: expDesc.trim(),
        amount: amt,
        splitType: expSplitType,
        shares: payloadShares,
      });
      setShowAddExpense(false);
      setExpDesc('');
      setExpAmount('');
      setSuccess(isKn ? 'ಖರ್ಚು ದಾಖಲಿಸಲಾಗಿದೆ!' : 'Expense recorded!');
      loadGroupDetail(selectedGroup._id);
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಖರ್ಚು ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to record group expense'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettleUp = async (e) => {
    e.preventDefault();
    const amt = Number(settleAmount);
    if (!settleToUser || amt <= 0 || !selectedGroup) return;

    setActionLoading(true);
    setError('');
    try {
      await api.post(`/groups/${selectedGroup._id}/settle`, {
        to: settleToUser,
        amount: amt,
      });
      setShowSettleModal(false);
      setSettleAmount('');
      setSuccess(isKn ? 'ಲೆಕ್ಕ ಚುಕ್ತಾ ದಾಖಲಿಸಲಾಗಿದೆ!' : 'Settlement recorded successfully!');
      loadGroupDetail(selectedGroup._id);
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಚುಕ್ತಾ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to settle up'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            {t('groups.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('groups.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowCreateGroup(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-colors min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          {t('groups.createGroup')}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
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

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Group List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {isKn ? 'ನಿಮ್ಮ ತಂಡಗಳು' : 'Your Groups'} ({groups.length})
          </h3>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : groups.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500">
                {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ತಂಡಗಳಿಲ್ಲ. ಹೊಸ ತಂಡ ರಚಿಸಿ!' : 'No groups yet. Create your first crew group!'}
              </p>
            </div>
          ) : (
            groups.map(grp => {
              const isSelected = selectedGroup?._id === grp._id;
              return (
                <button
                  key={grp._id}
                  onClick={() => handleSelectGroup(grp)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all min-h-[60px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {grp.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {grp.members?.length || 1} {isKn ? 'ಸದಸ್ಯರು' : 'members'}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Group View */}
        <div className="lg:col-span-3 space-y-6">
          {selectedGroup && groupDetail ? (
            <>
              {/* Group Banner */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {groupDetail.group?.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {groupDetail.group?.description || (isKn ? 'ಹಂಚಿಕೊಂಡ ಖರ್ಚುಗಳ ನಿರ್ವಹಣೆ' : 'Shared workgroup expense tracking')}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {groupDetail.group?.members?.map(m => (
                      <span
                        key={m._id}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 shadow-sm min-h-[44px]"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {isKn ? 'ಸದಸ್ಯರ ಸೇರ್ಪಡೆ' : 'Invite'}
                  </button>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('groups.addExpense')}
                  </button>
                  <button
                    onClick={() => setShowSettleModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm min-h-[44px]"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {t('groups.settleUp')}
                  </button>
                </div>
              </div>

              {/* Balances Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  {t('groups.netBalances')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {groupDetail.balances?.map(b => {
                    const isOwed = b.balance > 0;
                    const isOwes = b.balance < 0;
                    const isZero = b.balance === 0;

                    return (
                      <div
                        key={b.user._id}
                        className={`p-4 rounded-xl border ${
                          isOwed
                            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20'
                            : isOwes
                            ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {b.user.name} {b.user._id === user?._id && (isKn ? '(ನೀವು)' : '(You)')}
                        </p>
                        <h4
                          className={`text-lg font-bold mt-1 ${
                            isOwed ? 'text-emerald-600' : isOwes ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {isOwed && `+₹${b.balance}`}
                          {isOwes && `-₹${Math.abs(b.balance)}`}
                          {isZero && (isKn ? 'ಎಲ್ಲಾ ಲೆಕ್ಕ ಚುಕ್ತಾ (₹0)' : 'Settled up (₹0)')}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isOwed ? t('groups.youGet') : isOwes ? t('groups.youOwe') : (isKn ? 'ಸಮವಾಗಿದೆ' : 'All clear')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expense History Feed */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  {isKn ? 'ತಂಡದ ಖರ್ಚುಗಳ ಇತಿಹಾಸ' : 'Activity & Expense History'}
                </h3>

                {groupDetail.expenses?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    {isKn
                      ? 'ಈ ತಂಡದಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಖರ್ಚು ದಾಖಲಾಗಿಲ್ಲ. "ಖರ್ಚು ಸೇರಿಸಿ" ಬಟನ್ ಒತ್ತಿ!'
                      : 'No expenses recorded in this group yet. Click "Add Expense" to get started!'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groupDetail.expenses.map(exp => (
                      <div
                        key={exp._id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${exp.isSettlement ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {exp.isSettlement ? <CheckCircle2 className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {exp.description}
                            </p>
                            <p className="text-xs text-slate-500">
                              {isKn ? 'ಪಾವತಿಸಿದವರು: ' : 'Paid by '}<span className="font-medium text-slate-700 dark:text-slate-300">{exp.paidBy?.name}</span> • {isKn ? 'ಹಂಚಿಕೆ: ' : 'Split: '}{exp.splitType}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(exp.createdAt).toLocaleDateString(isKn ? 'kn-IN' : 'en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              {isKn ? 'ಖರ್ಚು ಮತ್ತು ಬಾಕಿ ಹಣವನ್ನು ನೋಡಲು ಒಂದು ತಂಡವನ್ನು ಆಯ್ಕೆಮಾಡಿ.' : 'Select or create a group to view expenses and balances.'}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Create Group */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {t('groups.createGroup')}
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('groups.groupName')} *
                </label>
                <input
                  type="text"
                  placeholder={isKn ? 'ಉದಾ: ಕನ್‌ಸ್ಟ್ರಕ್ಷನ್ ಸೈಟ್ ತಂಡ, ಬಾಡಿಗೆ ರೂಮ್' : 'e.g. Work Crew, Site Lunch, Shared Room'}
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isKn ? 'ವಿವರಣೆ' : 'Description'}
                </label>
                <input
                  type="text"
                  placeholder={isKn ? 'ಉದಾ: ಊಟ, ದಿನನಿತ್ಯದ ಚಹಾ ಮತ್ತು ಸಾಮಗ್ರಿ ಖರ್ಚು' : 'e.g. Shared meals and worksite expenses'}
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ತಂಡ ರಚಿಸಿ' : 'Create Group')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Invite Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isKn ? `${selectedGroup?.name} ಗೆ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ` : `Invite Member to ${selectedGroup?.name}`}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isKn
                ? 'ಸಹ-ಕಾರ್ಮಿಕರ ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.'
                : "Enter the co-worker's registered email address."}
            </p>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t('profile.email')} *
                </label>
                <input
                  type="email"
                  placeholder="coworker@gmail.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : 'Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {isKn ? `${selectedGroup?.name} ಗೆ ಖರ್ಚು ಸೇರಿಸಿ` : `Add Expense to ${selectedGroup?.name}`}
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isKn ? 'ಖರ್ಚಿನ ವಿವರ' : 'Description'} *
                </label>
                <input
                  type="text"
                  placeholder={isKn ? 'ಉದಾ: ಮಧ್ಯಾಹ್ನದ ಊಟ, ಡೀಸೆಲ್ ವೆಚ್ಚ, ರೇಷನ್' : 'e.g. Worksite Lunch, Fuel, Cement bags'}
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isKn ? 'ಒಟ್ಟು ಮೊತ್ತ (₹)' : 'Total Amount (₹)'} *
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isKn ? 'ಹಂಚಿಕೆ ವಿಧಾನ' : 'Split Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'equal', labelEn: 'Equal', labelKn: 'ಸಮನಾಗಿ' },
                    { id: 'percent', labelEn: 'Percent', labelKn: 'ಶೇಕಡಾವಾರು' },
                    { id: 'custom', labelEn: 'Custom', labelKn: 'ನಿಖರ ಮೊತ್ತ' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setExpSplitType(m.id)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all min-h-[40px] ${
                        expSplitType === m.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {isKn ? m.labelKn : m.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uneven Shares inputs if not equal */}
              {expSplitType !== 'equal' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500">
                    {expSplitType === 'percent'
                      ? (isKn ? 'ಪ್ರತಿಯೊಬ್ಬರ ಶೇಕಡಾವಾರು ನಮೂದಿಸಿ (ಒಟ್ಟು 100% ಆಗಿರಬೇಕು)' : 'Enter % for each member (Total = 100%)')
                      : (isKn ? 'ಪ್ರತಿಯೊಬ್ಬರ ರೂಪಾಯಿ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ' : 'Enter ₹ amount for each member')}
                  </p>
                  {groupDetail?.group?.members?.map(m => (
                    <div key={m._id} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-700 dark:text-slate-300">{m.name}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={customShares[m._id] || ''}
                        onChange={e => setCustomShares({ ...customShares, [m._id]: e.target.value })}
                        className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-right min-h-[36px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ಖರ್ಚು ದಾಖಲಿಸಿ' : 'Record Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Settle Up with UPI QR */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-600" />
              {t('groups.settleUp')}
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {isKn
                ? 'ಯಾವುದೇ ಯುಪಿಐ ಆ್ಯಪ್ (PhonePe, GPay, Paytm) ಬಳಸಿ ನೇರವಾಗಿ ಹಣ ಪಾವತಿಸಿ ತಂಡದಲ್ಲಿ ಚುಕ್ತಾ ದಾಖಲಿಸಿ.'
                : 'Pay via your favorite UPI app (PhonePe, GPay, Paytm) and record settlement in the group.'}
            </p>

            <form onSubmit={handleSettleUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isKn ? 'ಯಾರಿಗೆ ಪಾವತಿಸಬೇಕು?' : 'Pay To'} *
                </label>
                <select
                  value={settleToUser}
                  onChange={e => setSettleToUser(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                >
                  <option value="">{isKn ? 'ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select member'}</option>
                  {groupDetail?.group?.members
                    ?.filter(m => m._id !== user?._id)
                    ?.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {isKn ? 'ಪಾವತಿಸುವ ಮೊತ್ತ (₹)' : 'Amount (₹)'} *
                </label>
                <input
                  type="number"
                  placeholder="200"
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm min-h-[44px]"
                />
              </div>

              {/* Dynamic UPI QR Code Preview */}
              {settleAmount > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-2 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isKn ? `₹${settleAmount} ಪಾವತಿಸಲು ಯಾವುದೇ ಯುಪಿಐ ಆ್ಯಪ್‌ನಿಂದ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ` : `Scan with any UPI App to Pay ₹${settleAmount}`}
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `upi://pay?pa=${upiId}&pn=Worker&am=${settleAmount}&cu=INR`
                    )}`}
                    alt="UPI Payment QR"
                    className="mx-auto rounded-lg shadow-sm border border-slate-200"
                  />
                  <p className="text-[10px] text-slate-400">
                    UPI ID: {upiId} • {isKn ? 'ಉಚಿತ ನೇರ ವರ್ಗಾವಣೆ' : 'Zero Transaction Fees'}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ಚುಕ್ತಾ ಖಚಿತಪಡಿಸಿ' : 'Confirm Settlement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Groups;
