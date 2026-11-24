import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

export function Goals() {
  const { t, isKn } = useLanguage();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    saved: '',
    deadline: '',
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/goals');
      setGoals(res.data.goals || []);
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಉಳಿತಾಯ ಗುರಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to load savings goals'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    const defaultDate = d.toISOString().split('T')[0];

    setFormData({
      name: '',
      target: '',
      saved: '0',
      deadline: defaultDate,
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (goal) => {
    setSelectedGoal(goal);
    const dateStr = goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '';
    setFormData({
      name: goal.name,
      target: goal.target.toString(),
      saved: (goal.saved || 0).toString(),
      deadline: dateStr,
    });
    setShowEditModal(true);
  };

  const handleOpenDeposit = (goal) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setShowDepositModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: formData.name.trim(),
        target: parseFloat(formData.target),
        saved: parseFloat(formData.saved) || 0,
        deadline: formData.deadline,
      };
      await api.post('/goals', payload);
      setSuccess(isKn ? 'ಹೊಸ ಉಳಿತಾಯ ಗುರಿ ರಚಿಸಲಾಗಿದೆ!' : 'Goal created successfully!');
      setShowCreateModal(false);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಗುರಿ ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to create goal'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: formData.name.trim(),
        target: parseFloat(formData.target),
        saved: parseFloat(formData.saved) || 0,
        deadline: formData.deadline,
      };
      await api.patch(`/goals/${selectedGoal._id}`, payload);
      setSuccess(isKn ? 'ಗುರಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Goal updated successfully!');
      setShowEditModal(false);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಗುರಿ ತಿದ್ದಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to update goal'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) {
      setError(isKn ? 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ಧನಾತ್ಮಕ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ' : 'Please enter a valid positive deposit amount');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/goals/${selectedGoal._id}/savings`, { amount: amountNum });
      const newMilestones = res.data.newMilestones || [];
      if (newMilestones.length > 0) {
        setSuccess(isKn
          ? `🎉 ಅಭಿನಂದನೆಗಳು! ನೀವು ${newMilestones.join('%, ')}% ಮೈಲಿಗಲ್ಲು ಬ್ಯಾಡ್ಜ್ ಅನ್‌ಲಾಕ್ ಮಾಡಿದ್ದೀರಿ!`
          : `🎉 Awesome! You unlocked the ${newMilestones.join('%, ')}% milestone badge!`);
      } else {
        setSuccess(isKn
          ? `₹${amountNum.toLocaleString('en-IN')} ಅನ್ನು "${selectedGoal.name}" ಗೆ ಜಮೆ ಮಾಡಲಾಗಿದೆ!`
          : `Added ₹${amountNum.toLocaleString('en-IN')} to "${selectedGoal.name}"!`);
      }
      setShowDepositModal(false);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಉಳಿತಾಯ ಜಮೆ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to add savings'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmMsg = isKn ? `ನಿಜವಾಗಿಯೂ "${name}" ಗುರಿಯನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ?` : `Are you sure you want to delete goal "${name}"?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/goals/${id}`);
      setSuccess(isKn ? `ಗುರಿ "${name}" ಅಳಿಸಲಾಗಿದೆ` : `Goal "${name}" deleted`);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಗುರಿ ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to delete goal'));
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + (g.target || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + (g.saved || 0), 0);
  const completedGoals = goals.filter((g) => (g.saved || 0) >= (g.target || 1)).length;

  const calculateRequiredSaving = (goal) => {
    const remaining = Math.max(0, goal.target - (goal.saved || 0));
    if (remaining === 0) return { weekly: 0, monthly: 0, daysLeft: 0, isPassed: false };

    const now = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return { weekly: remaining, monthly: remaining, daysLeft: 0, isPassed: true };
    }

    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));

    return {
      weekly: Math.ceil(remaining / weeksLeft),
      monthly: Math.ceil(remaining / monthsLeft),
      daysLeft,
      isPassed: false,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('goals.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('goals.subtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          {t('goals.newGoal')}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isKn ? 'ಒಟ್ಟು ಗುರಿ ಮೊತ್ತ' : 'Total Target'}
            </span>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Target className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{totalTarget.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500">
            {goals.length} {isKn ? 'ಸಕ್ರಿಯ ಉಳಿತಾಯ ಗುರಿಗಳು' : `active target${goals.length === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('goals.savedSoFar')}
            </span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{totalSaved.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500">
            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% {isKn ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'achieved'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isKn ? 'ಉಳಿಸಬೇಕಾದ ಮೊತ್ತ' : 'Remaining to Save'}
            </span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{Math.max(0, totalTarget - totalSaved).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-500">
            {isKn ? 'ಎಲ್ಲಾ ಕುಟುಂಬದ ಗುರಿಗಳಲ್ಲಿ' : 'Across all goals'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isKn ? 'ಪೂರ್ಣಗೊಂಡ ಗುರಿಗಳು' : 'Completed Goals'}
            </span>
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Award className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {completedGoals} / {goals.length}
          </p>
          <span className="text-xs text-slate-500">
            {isKn ? '100% ಗುರಿ ತಲುಪಿದೆ' : '100% funded'}
          </span>
        </div>
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 mb-4">
            <Target className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('goals.emptyGoals')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {isKn
              ? 'ಮಕ್ಕಳ ಶಾಲಾ ಶುಲ್ಕ, ಹಬ್ಬದ ಖರ್ಚು, ತುರ್ತು ಆರೋಗ್ಯ ನಿಧಿ ಅಥವಾ ಕೆಲಸದ ಸಾಮಗ್ರಿಗಳನ್ನು ಕೊಳ್ಳಲು ಇಂದೇ ಸಣ್ಣ ಉಳಿತಾಯ ಆರಂಭಿಸಿ.'
              : 'Save small daily amounts for children’s education, festival expenses, tool purchase, or medical emergency fund.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            {t('goals.newGoal')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.round(((goal.saved || 0) / goal.target) * 100));
            const calc = calculateRequiredSaving(goal);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {goal.name}
                        </h2>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle className="h-3 w-3" /> {isKn ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Completed'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {isKn ? 'ಕೊನೆಯ ದಿನಾಂಕ: ' : 'Deadline: '}
                        {goal.deadline
                          ? new Date(goal.deadline).toLocaleDateString(isKn ? 'kn-IN' : 'en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : (isKn ? 'ದಿನಾಂಕ ನಿಗದಿಯಾಗಿಲ್ಲ' : 'No deadline')}
                        {calc.isPassed && !isCompleted && (
                          <span className="font-semibold text-red-500">
                            ({isKn ? 'ದಿನಾಂಕ ಮೀರಿದೆ' : 'Deadline passed'})
                          </span>
                        )}
                        {!calc.isPassed && !isCompleted && (
                          <span className="text-slate-400">
                            ({calc.daysLeft} {isKn ? 'ದಿನಗಳು ಬಾಕಿ' : 'days left'})
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('common.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal._id, goal.name)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amount & Progress */}
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-bold text-slate-900 text-lg dark:text-white">
                        ₹{(goal.saved || 0).toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          / ₹{goal.target.toLocaleString('en-IN')}
                        </span>
                      </span>
                      <span
                        className={`font-bold ${
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : progress >= 75
                            ? 'bg-indigo-600'
                            : progress >= 25
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestone Badges */}
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> {t('goals.badgesUnlocked')}
                      </span>
                      <span>
                        {(goal.milestones || []).length} / {MILESTONE_THRESHOLDS.length} {isKn ? 'ಬ್ಯಾಡ್ಜ್‌ಗಳು' : 'Badges'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {MILESTONE_THRESHOLDS.map((thresh) => {
                        const earned = (goal.milestones || []).some((m) => m.percent === thresh);
                        return (
                          <div
                            key={thresh}
                            className={`flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs transition ${
                              earned
                                ? 'bg-amber-50 border border-amber-200 text-amber-900 font-semibold dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300'
                                : 'bg-slate-50 border border-dashed border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-600'
                            }`}
                          >
                            <Award
                              className={`h-4 w-4 mb-1 ${
                                earned ? 'text-amber-500 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                            <span>{thresh}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Required weekly/monthly saving recommendation */}
                  {!isCompleted && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        {isKn ? 'ಉಳಿತಾಯದ ನಿಯಮಿತ ಲೆಕ್ಕಾಚಾರ:' : 'Target Savings Plan:'}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>{t('goals.weeklyNeeded')}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{calc.weekly.toLocaleString('en-IN')} {isKn ? '/ ವಾರಕ್ಕೆ' : '/ week'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>{t('goals.monthlyNeeded')}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{calc.monthly.toLocaleString('en-IN')} {isKn ? '/ ತಿಂಗಳಿಗೆ' : '/ month'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deposit Savings Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenDeposit(goal)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition min-h-[44px]"
                  >
                    <Plus className="h-4 w-4" />
                    {t('goals.addDeposit')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('goals.newGoal')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.goalName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('goals.goalNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.targetAmount')} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 15000"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.savedSoFar')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.saved}
                  onChange={(e) => setFormData({ ...formData, saved: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.targetDate')} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ಗುರಿ ರಚಿಸಿ' : 'Create Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isKn ? 'ಗುರಿಯನ್ನು ಬದಲಾಯಿಸಿ' : 'Edit Savings Goal'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.goalName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.targetAmount')} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.savedSoFar')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.saved}
                  onChange={(e) => setFormData({ ...formData, saved: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.targetDate')} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ನವೀಕರಿಸಿ' : 'Update Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('goals.addDeposit')}
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleDepositSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKn ? 'ಗುರಿಗೆ ಹಣ ಜಮೆ ಮಾಡಿ: ' : 'Deposit money towards '}{' '}
                <strong className="text-slate-800 dark:text-slate-200">{selectedGoal.name}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('goals.depositAmount')} *
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="100"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition min-h-[40px]"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading ? t('common.loading') : (isKn ? 'ಜಮೆ ಖಚಿತಪಡಿಸಿ' : 'Confirm Deposit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
