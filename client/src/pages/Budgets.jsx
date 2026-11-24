import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Home,
  ShoppingBag,
  Factory,
  Hammer,
  Save,
} from 'lucide-react';

const CATEGORIES = [
  'groceries', 'rent', 'health', 'transport', 'education',
  'utilities', 'shopping', 'entertainment', 'food', 'other',
];

export function Budgets() {
  const { user } = useAuth();
  const { t, isKn } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [budgetVsActual, setBudgetVsActual] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Form state
  const [period, setPeriod] = useState('monthly');
  const defaultIncome = user?.profile?.dailyWage
    ? user.profile.dailyWage * 26
    : user?.profile?.monthlyIncome || user?.profile?.monthlyAllowance || 12000;
  const [totalLimit, setTotalLimit] = useState(defaultIncome);
  const [categoryLimits, setCategoryLimits] = useState([
    { category: 'groceries', limit: 4500 },
    { category: 'rent', limit: 3000 },
    { category: 'health', limit: 1500 },
    { category: 'transport', limit: 1000 },
    { category: 'other', limit: 2000 },
  ]);

  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const [vsRes, tplRes] = await Promise.all([
        api.get('/budgets/vs-actual').catch(() => ({ data: null })),
        api.get('/budgets/templates').catch(() => ({ data: null })),
      ]);
      setBudgetVsActual(vsRes.data);
      setTemplates(tplRes.data?.templates);

      if (vsRes.data?.categories?.length) {
        setCategoryLimits(
          vsRes.data.categories.map(c => ({ category: c.category, limit: c.budgetLimit }))
        );
        if (vsRes.data.totalBudget) setTotalLimit(vsRes.data.totalBudget);
      }
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const applyTemplate = templateKey => {
    if (!templates || !templates[templateKey]) return;
    const tpl = templates[templateKey];
    const income = user?.profile?.dailyWage
      ? user.profile.dailyWage * 26
      : user?.profile?.monthlyIncome || 12000;
    setTotalLimit(income);

    const limits = tpl.categories.map(c => ({
      category: c.category,
      limit: c.recommendedAmount,
    }));
    setCategoryLimits(limits);
    setShowEditor(true);
    const msg = isKn
      ? `"${templateKey}" ಮಾದರಿ ಬಜೆಟ್ ಅನ್ವಯಿಸಲಾಗಿದೆ! ಪರಿಶೀಲಿಸಿ 'ಉಳಿಸಿ' ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.`
      : `Applied "${templateKey}" template! Review and click Save.`;
    setSaveSuccess(msg);
  };

  const apply503020Rule = async () => {
    try {
      const res = await api.get('/budgets/50-30-20');
      const rule = res.data?.rule;
      if (!rule) return;

      const income = res.data.totalIncome || defaultIncome;
      setTotalLimit(income);

      // 50% Needs (Groceries, Rent, Health), 30% Wants (Personal, Shopping, Transport), 20% Emergency Savings
      const needsShare = Math.round(rule.needs.amount / 3);
      const wantsShare = Math.round(rule.wants.amount / 2);

      const newLimits = [
        { category: 'groceries', limit: needsShare },
        { category: 'rent', limit: needsShare },
        { category: 'health', limit: rule.needs.amount - (needsShare * 2) },
        { category: 'transport', limit: wantsShare },
        { category: 'shopping', limit: rule.wants.amount - wantsShare },
        { category: 'other', limit: rule.savings.amount },
      ];

      setCategoryLimits(newLimits);
      setShowEditor(true);
      const msg = isKn
        ? '50/30/20 ನಿಯಮ ಅನ್ವಯಿಸಲಾಗಿದೆ (50% ಅಗತ್ಯ ಖರ್ಚು, 30% ಇತರೆ, 20% ಉಳಿತಾಯ)!'
        : 'Applied 50/30/20 budgeting rule (50% essentials, 30% personal, 20% savings)!';
      setSaveSuccess(msg);
    } catch (_err) {
      setSaveError(isKn ? '50/30/20 ಲೆಕ್ಕಾಚಾರ ವಿಫಲವಾಗಿದೆ' : 'Failed to calculate 50/30/20 guideline');
    }
  };

  const handleLimitChange = (index, value) => {
    const updated = [...categoryLimits];
    updated[index].limit = Math.max(0, Number(value));
    setCategoryLimits(updated);
  };

  const handleAddCategoryRow = () => {
    const unused = CATEGORIES.find(c => !categoryLimits.some(l => l.category === c));
    if (unused) {
      setCategoryLimits([...categoryLimits, { category: unused, limit: 1000 }]);
    }
  };

  const handleRemoveCategoryRow = index => {
    setCategoryLimits(categoryLimits.filter((_, i) => i !== index));
  };

  const handleSaveBudget = async e => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const now = new Date();
      await api.post('/budgets', {
        period,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        totalLimit: Number(totalLimit),
        categoryLimits: categoryLimits.map(c => ({
          category: c.category,
          limit: Number(c.limit),
        })),
      });

      setSaveSuccess(isKn ? 'ಬಜೆಟ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' : 'Budget saved successfully!');
      setShowEditor(false);
      fetchBudgetData();
    } catch (err) {
      setSaveError(err.response?.data?.error || (isKn ? 'ಬಜೆಟ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to save budget'));
    } finally {
      setSaving(false);
    }
  };

  const overspentCategories = budgetVsActual?.categories?.filter(c => c.isOverBudget) || [];
  const isTotalOver = budgetVsActual?.totalBudget > 0 && budgetVsActual.totalSpent > budgetVsActual.totalBudget;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {t('budgets.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('budgets.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditor(prev => !prev)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 min-h-[44px]"
          >
            {showEditor ? (isKn ? 'ವರದಿ ನೋಡಿ' : 'View Report') : (isKn ? '+ ಬಜೆಟ್ ಮಿತಿ ಬದಲಾಯಿಸಿ' : '+ Edit Spending Caps')}
          </button>
        </div>
      </div>

      {/* Overspend Alert Banner */}
      {(isTotalOver || overspentCategories.length > 0) && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {isKn ? '⚠️ ಎಚ್ಚರಿಕೆ: ಬಜೆಟ್ ಮಿತಿ ಮೀರಿದೆ!' : '⚠️ Budget Alert: You have exceeded spending limits!'}
              </p>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                {isTotalOver && (isKn
                  ? `ಒಟ್ಟು ಮಾಸಿಕ ಖರ್ಚು (₹${budgetVsActual.totalSpent.toLocaleString('en-IN')}) ನಿಮ್ಮ ನಿಗದಿಪಡಿಸಿದ ಮಿತಿ ₹${budgetVsActual.totalBudget.toLocaleString('en-IN')} ಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿದೆ. `
                  : `Total monthly expenses (₹${budgetVsActual.totalSpent.toLocaleString('en-IN')}) exceed your overall cap of ₹${budgetVsActual.totalBudget.toLocaleString('en-IN')}. `)}
                {overspentCategories.length > 0 && (isKn
                  ? `ಹೆಚ್ಚುವರಿ ಖರ್ಚಾದ ವಿಭಾಗಗಳು: ${overspentCategories.map(c => `${t(`categories.${c.category}`) || c.category} (+₹${c.actualSpent - c.budgetLimit})`).join(', ')}.`
                  : `Overspent categories: ${overspentCategories.map(c => `${t(`categories.${c.category}`) || c.category} (+₹${c.actualSpent - c.budgetLimit})`).join(', ')}.`)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Quick Templates Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('budgets.quickTemplates')}
        </span>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => applyTemplate('daily-wage')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
          >
            <Hammer className="h-4 w-4 text-indigo-500 shrink-0" />
            {t('budgets.templateDailyWage')}
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('vendor')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
          >
            <ShoppingBag className="h-4 w-4 text-emerald-500 shrink-0" />
            {t('budgets.templateVendor')}
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('factory-worker')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
          >
            <Factory className="h-4 w-4 text-amber-500 shrink-0" />
            {t('budgets.templateFactory')}
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('domestic-help')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
          >
            <Home className="h-4 w-4 text-rose-500 shrink-0" />
            {t('budgets.templateDomestic')}
          </button>

          <button
            type="button"
            onClick={apply503020Rule}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 ml-auto min-h-[44px]"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {t('budgets.rule503020')}
          </button>
        </div>
      </div>

      {/* View 1: Budget VS Actual Report */}
      {!showEditor && (
        <div className="space-y-6">
          {/* Total Budget Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {t('budgets.overallLimit')}
                </span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  ₹{(budgetVsActual?.totalSpent || 0).toLocaleString('en-IN')}{' '}
                  <span className="text-sm font-normal text-slate-400">
                    / ₹{(budgetVsActual?.totalBudget || totalLimit).toLocaleString('en-IN')}
                  </span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {t('budgets.remaining')}
                </span>
                <p className={`text-2xl font-bold mt-1 ${isTotalOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{(budgetVsActual?.remainingBudget || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Total Progress Bar */}
            <div className="mt-4">
              {(() => {
                const totalCap = budgetVsActual?.totalBudget || totalLimit || 1;
                const spent = budgetVsActual?.totalSpent || 0;
                const percent = Math.min(100, Math.round((spent / totalCap) * 100));
                const barColor = percent >= 100 ? 'bg-rose-600' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                      <span>{percent}% {isKn ? 'ಖರ್ಚಾಗಿದೆ' : 'Used'}</span>
                      <span>{Math.max(0, 100 - percent)}% {isKn ? 'ಉಳಿದಿದೆ' : 'Buffer'}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {t('budgets.budgetVsActual')}
            </h2>

            {!budgetVsActual?.categories?.length ? (
              <p className="text-center text-xs text-slate-400 py-8">
                {isKn
                  ? 'ಇನ್ನೂ ಯಾವುದೇ ಬಜೆಟ್ ಮಿತಿಗಳನ್ನು ನಿಗದಿಪಡಿಸಿಲ್ಲ. ಮೇಲಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಮಾದರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ!'
                  : 'No active budget limits configured yet. Click "+ Edit Spending Caps" or choose a template above!'}
              </p>
            ) : (
              <div className="space-y-5">
                {budgetVsActual.categories.map((cat, idx) => {
                  const percent = cat.percentUsed;
                  const barColor =
                    percent >= 100
                      ? 'bg-rose-500'
                      : percent >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize text-slate-800 dark:text-slate-200">
                          {t(`categories.${cat.category}`) || cat.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            ₹{cat.actualSpent.toLocaleString('en-IN')} / ₹{cat.budgetLimit.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              percent >= 100
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : percent >= 70
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Budget Editor Form */}
      {showEditor && (
        <form onSubmit={handleSaveBudget} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isKn ? 'ಖರ್ಚಿನ ಮಿತಿಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ' : 'Configure Spending Caps'}
            </h2>
            <button
              type="button"
              onClick={() => setShowEditor(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {t('common.cancel')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {isKn ? 'ಬಜೆಟ್ ಅವಧಿ' : 'Budget Period'}
              </label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              >
                <option value="monthly">{isKn ? 'ಮಾಸಿಕ (ತಿಂಗಳಿಗೆ)' : 'Monthly'}</option>
                <option value="weekly">{isKn ? 'ವಾರಕ್ಕೆ' : 'Weekly'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                {t('budgets.overallLimit')} (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={totalLimit}
                onChange={e => setTotalLimit(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
              />
            </div>
          </div>

          {/* Category Rows */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
              {isKn ? 'ವಿಭಾಗವಾರು ಮಿತಿಗಳು (ರೂ)' : 'Per-Category Limits (₹)'}
            </label>

            {categoryLimits.map((row, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <select
                  value={row.category}
                  onChange={e => {
                    const next = [...categoryLimits];
                    next[idx].category = e.target.value;
                    setCategoryLimits(next);
                  }}
                  className="w-48 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white capitalize min-h-[44px]"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{t(`categories.${c}`) || c}</option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={row.limit}
                    onChange={e => handleLimitChange(idx, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCategoryRow(idx)}
                  className="rounded-lg p-2 text-slate-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Remove limit"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddCategoryRow}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              + {isKn ? 'ಇನ್ನೊಂದು ವಿಭಾಗದ ಮಿತಿ ಸೇರಿಸಿ' : 'Add Another Category Limit'}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEditor(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 min-h-[44px]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 min-h-[44px]"
            >
              <Save className="h-4 w-4" />
              {saving ? t('common.loading') : t('budgets.saveBudget')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
