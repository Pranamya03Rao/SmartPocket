import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Sparkles,
  RefreshCw,
  Lightbulb,
  PlusCircle,
  HeartPulse,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#6366f1',
  '#8b5cf6', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4',
  '#eab308', '#a855f7', '#64748b', '#d946ef',
];

const WORKER_TIPS_EN = [
  "Never enter your UPI PIN to receive money or daily wages. A PIN is strictly required to SEND money out!",
  "Save ₹30 to ₹50 every single working day into a Post Office Recurring Deposit (RD) to build a family safety net.",
  "Avoid private 'Meter Baddi' lenders who charge 10% interest per month (120% per year). Ask your bank for PM SVANidhi or gold loans.",
  "Always wait for the voice alert from your Soundbox or check your bank SMS before handing over goods to a customer.",
  "Register for your free e-Shram Card to get ₹2 Lakh accident protection and access to government welfare schemes.",
  "Set aside money for next month's room rent and rice/ration right on payday before spending on non-essentials.",
];

const WORKER_TIPS_KN = [
  "ದಿನಗೂಲಿ ಅಥವಾ ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ ಯುಪಿಐ ಪಿನ್ (UPI PIN) ಹಾಕಬೇಡಿ. ಪಿನ್ ಕೇವಲ ಹಣ ಕಳುಹಿಸಲು ಮಾತ್ರ!",
  "ದಿನಕ್ಕೆ ₹30 ರಿಂದ ₹50 ರೂಪಾಯಿಗಳನ್ನು ಅಂಚೆ ಕಚೇರಿ ಆರ್‌ಡಿ (Post Office RD) ಯಲ್ಲಿ ಉಳಿಸಿ, ತುರ್ತು ನಿಧಿ ನಿರ್ಮಿಸಿ.",
  "ತಿಂಗಳಿಗೆ 10% ರಷ್ಟು ಹೆಚ್ಚಿನ ಬಡ್ಡಿ ವಸೂಲಿ ಮಾಡುವ ಮೀಟರ್ ಬಡ್ಡಿ ಸಾಲಗಾರರಿಂದ ದೂರವಿರಿ. ಸರ್ಕಾರಿ ಪಿಎಂ ಸ್ವನಿಧಿ ಯೋಜನೆಯ ಸಾಲ ಪಡೆಯಿರಿ.",
  "ವ್ಯಾಪಾರಿಗಳೇ, ಗ್ರಾಹಕರ ಮೊಬೈಲ್ ಸ್ಕ್ರೀನ್ ನೋಡಬೇಡಿ; ಸೌಂಡ್‌ಬಾಕ್ಸ್ ಧ್ವನಿ ಕೇಳಿದ ನಂತರವೇ ಹಣ ಬಂದಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
  "ಪ್ರತಿಯೊಬ್ಬ ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರು ಉಚಿತ 'ಇ-ಶ್ರಮ್ ಕಾರ್ಡ್' (e-Shram) ಮಾಡಿಸಿ, ₹2 ಲಕ್ಷದ ಉಚಿತ ಅಪಘಾತ ವಿಮೆ ಸೌಲಭ್ಯ ಪಡೆಯಿರಿ.",
  "ದಿನಗೂಲಿ ಬಂದ ಕೂಡಲೇ ಮೊದಲು ಮನೆ ಬಾಡಿಗೆ ಹಾಗೂ ರೇಷನ್ ಸಾಮಗ್ರಿಗಾಗಿ ಹಣವನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಎತ್ತಿಡಿ.",
];

export function Dashboard() {
  const { user } = useAuth();
  const { t, language, isKn } = useLanguage();
  const [loading, setLoading] = useState(true);

  // Quick Action notification state
  const [quickActionMsg, setQuickActionMsg] = useState('');

  // Analytics states
  const [summary, setSummary] = useState({ income: 0, expense: 0, netSavings: 0, savingsRate: 0 });
  const [categorySplit, setCategorySplit] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [insights, setInsights] = useState([]);
  const [forecast, setForecast] = useState({ forecastNextMonthExpense: 0, confidence: 'normal' });

  // Daily tip
  const tipsArray = isKn ? WORKER_TIPS_KN : WORKER_TIPS_EN;
  const [dailyTip] = useState(() => {
    const day = new Date().getDate();
    return tipsArray[day % tipsArray.length];
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumRes, splitRes, trendRes, insRes, fcRes] = await Promise.all([
        api.get('/analytics/summary').catch(() => ({ data: {} })),
        api.get('/analytics/category-split').catch(() => ({ data: { categories: [] } })),
        api.get('/analytics/monthly-trend').catch(() => ({ data: { trends: [] } })),
        api.get('/analytics/insights').catch(() => ({ data: { insights: [] } })),
        api.get('/analytics/forecast').catch(() => ({ data: { forecastNextMonthExpense: 0 } })),
      ]);

      setSummary(sumRes.data || { income: 0, expense: 0, netSavings: 0, savingsRate: 0 });
      setCategorySplit(splitRes.data?.categories || []);
      setMonthlyTrend(trendRes.data?.trends || []);
      setInsights(insRes.data?.insights || []);
      setForecast(fcRes.data || { forecastNextMonthExpense: 0 });
    } catch (err) {
      console.error('Failed to load dashboard analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (type, category, amount, title) => {
    try {
      await api.post('/transactions', {
        type,
        category,
        amount,
        title,
        paymentMethod: 'cash',
        date: new Date().toISOString(),
      });
      const msg = isKn
        ? `ಯಶಸ್ವಿಯಾಗಿದೆ: ${title} (₹${amount}) ದಾಖಲಿಸಲಾಗಿದೆ!`
        : `Success: ${title} (₹${amount}) recorded!`;
      setQuickActionMsg(msg);
      setTimeout(() => setQuickActionMsg(''), 4000);
      fetchAnalytics();
    } catch (err) {
      const errMsg = isKn ? 'ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to record entry';
      setQuickActionMsg(errMsg);
      setTimeout(() => setQuickActionMsg(''), 4000);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const baseEarnings = user?.profile?.dailyWage
    ? user.profile.dailyWage * 26
    : user?.profile?.monthlyIncome || user?.profile?.monthlyAllowance || 12000;
  const balance = Math.max(0, baseEarnings + summary.income - summary.expense);

  return (
    <div className="space-y-6">
      {/* Header with Greeting & Daily Tip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard.welcome', { name: user?.name || (isKn ? 'ಕಾರ್ಮಿಕ ಮಿತ್ರ' : 'Worker Friend') })}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('dashboard.welcomeSub')}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 self-start md:self-auto min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* 1-Click Quick Logging Bar for low-literacy users */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 p-4 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/20">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t('dashboard.quickActionsTitle')}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            {isKn ? 'ಕೇವಲ 1 ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಸುಲಭವಾಗಿ ಬರೆಯಿರಿ' : 'Save with 1 quick tap'}
          </span>
        </div>

        {quickActionMsg && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            {quickActionMsg}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleQuickLog('income', 'other', 500, isKn ? 'ದಿನಗೂಲಿ ಜಮೆ' : 'Daily Wage Earned')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 border border-emerald-200 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-900/50 min-h-[48px]"
          >
            <PlusCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>+₹500 {isKn ? 'ದಿನಗೂಲಿ' : 'Wage'}</span>
          </button>

          <button
            onClick={() => handleQuickLog('expense', 'groceries', 300, isKn ? 'ಪಡಿತರ / ರೇಷನ್ ಖರ್ಚು' : 'Ration & Groceries')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 border border-rose-200 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900/50 min-h-[48px]"
          >
            <ShoppingBag className="h-4 w-4 text-rose-600 shrink-0" />
            <span>-₹300 {isKn ? 'ರೇಷನ್ / ಊಟ' : 'Ration'}</span>
          </button>

          <button
            onClick={() => handleQuickLog('expense', 'health', 150, isKn ? 'ಔಷಧಿ / ಡಾಕ್ಟರ್ ಶುಲ್ಕ' : 'Medicine / Health')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50 border border-amber-200 dark:bg-slate-900 dark:text-amber-300 dark:border-amber-900/50 min-h-[48px]"
          >
            <HeartPulse className="h-4 w-4 text-amber-600 shrink-0" />
            <span>-₹150 {isKn ? 'ಔಷಧಿ' : 'Medicine'}</span>
          </button>

          <button
            onClick={() => handleQuickLog('income', 'other', 50, isKn ? 'ದೈನಂದಿನ ಉಳಿತಾಯ' : 'Daily RD Savings')}
            className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 border border-blue-200 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-900/50 min-h-[48px]"
          >
            <PiggyBank className="h-4 w-4 text-blue-600 shrink-0" />
            <span>+₹50 {isKn ? 'ಉಳಿತಾಯ' : 'Savings'}</span>
          </button>
        </div>
      </div>

      {/* Daily Money Tip Banner */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              {t('dashboard.tipTitle')}
            </p>
            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {dailyTip}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Effective Balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.netSavings')}
            </span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isKn ? 'ಮನೆಯಲ್ಲಿರುವ ಉಳಿಕೆ ಹಣ' : 'Available cash balance'}
          </p>
        </div>

        {/* Total Income */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.totalIncome')}
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{summary.income.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isKn ? 'ದಿನಗೂಲಿ, ಅಂಗಡಿ ಮಾರಾಟ & ಸಹಾಯಧನ' : 'Daily wages & business earnings'}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.totalExpense')}
            </span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
            ₹{summary.expense.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isKn ? 'ರೇಷನ್, ಬಾಡಿಗೆ & ಕುಟುಂಬದ ಖರ್ಚು' : 'Ration, rent & family expenses'}
          </p>
        </div>

        {/* Net Savings Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.savingsRate')}
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {summary.savingsRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isKn ? `ಉಳಿಸಿದ ಹಣ: ₹${summary.netSavings.toLocaleString('en-IN')}` : `Saved: ₹${summary.netSavings.toLocaleString('en-IN')}`}
          </p>
        </div>
      </div>

      {/* Row 2: Charts (Category Pie & Monthly Bar) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Split Donut Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('dashboard.spendingSplit')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKn ? 'ನಿಮ್ಮ ಕುಟುಂಬದ ಹಣ ಎಲ್ಲೆಲ್ಲಿ ಖರ್ಚಾಗಿದೆ ಎಂಬುದನ್ನು ನೋಡಿ' : 'Where your money was spent this month'}
              </p>
            </div>
          </div>

          <div className="h-64 w-full mt-4 flex items-center justify-center">
            {categorySplit.length === 0 ? (
              <p className="text-xs text-slate-400">{t('dashboard.noTransactions')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySplit}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categorySplit.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, isKn ? 'ಖರ್ಚು' : 'Spent']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend
                    formatter={val => (
                      <span className="text-xs capitalize text-slate-600 dark:text-slate-300">
                        {t(`categories.${val}`) || val}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 6-Month Monthly Trend Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('dashboard.sixMonthTrend')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKn ? 'ಕಳೆದ 6 ತಿಂಗಳುಗಳ ಆದಾಯ ಮತ್ತು ಖರ್ಚಿನ ಹೋಲಿಕೆ' : 'Comparison over past 6 months'}
              </p>
            </div>
          </div>

          <div className="h-64 w-full mt-4 flex items-center justify-center">
            {monthlyTrend.length === 0 ? (
              <p className="text-xs text-slate-400">
                {isKn ? 'ಇನ್ನೂ ಸಾಕಷ್ಟು ಹಳೆಯ ಲೆಕ್ಕಾಚಾರ ಲಭ್ಯವಿಲ್ಲ' : 'Not enough historical transaction data yet'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`]}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend
                    formatter={val => (
                      <span className="text-xs capitalize text-slate-600 dark:text-slate-300">
                        {val === 'income' ? (isKn ? 'ಆದಾಯ' : 'Income') : (isKn ? 'ಖರ್ಚು' : 'Expense')}
                      </span>
                    )}
                  />
                  <Bar dataKey="income" name="income" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Next Month Forecast & Smart Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Next Month Expense Forecast */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isKn ? 'ಮುಂದಿನ ತಿಂಗಳ ಅಂದಾಜು ಖರ್ಚು' : 'Next Month Expense Estimate'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isKn ? 'ಕಳೆದ ತಿಂಗಳ ಸರಾಸರಿಯ ಆಧಾರದ ಮುನ್ನೋಟ' : 'Prediction based on your past spending pattern'}
            </p>
          </div>

          <div className="my-6 rounded-2xl bg-slate-50 p-6 text-center dark:bg-slate-800/60">
            <span className="text-xs font-semibold uppercase text-slate-400">
              {isKn ? 'ಅಂದಾಜು ಮಾಡಲಾದ ಖರ್ಚು' : 'Projected Spending'}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              ₹{(forecast.forecastNextMonthExpense || summary.expense || 4500).toLocaleString('en-IN')}
            </p>
            <span className="inline-block mt-2 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {isKn ? 'ನಿಖರತೆ: ಸಾಮಾನ್ಯ' : `Confidence: ${forecast.confidence || 'normal'}`}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {isKn
              ? 'ಸಲಹೆ: ಮುಂಚಿತವಾಗಿಯೇ ಮಾಸಿಕ ಬಜೆಟ್ ಮಿತಿ ನಿಗದಿಪಡಿಸುವುದು ತುರ್ತು ಸಾಲದ ಹೊರೆಯನ್ನು ತಪ್ಪಿಸುತ್ತದೆ.'
              : 'Tip: Setting monthly budget limits helps avoid high-interest borrowing traps.'}
          </p>
        </div>

        {/* Month-over-Month Automated Insights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {isKn ? 'ತಿಂಗಳಿನ ಬುದ್ಧಿವಂತ ಸಲಹೆಗಳು' : 'Smart Monthly Insights'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {isKn ? 'ಖರ್ಚು ಕಡಿಮೆ ಮಾಡಲು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಲೆಕ್ಕಾಚಾರ' : 'Automated analysis of your spending habits'}
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {insights.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {isKn
                  ? 'ಕೆಲವು ದಿನಗಳ ಖರ್ಚು ದಾಖಲಿಸಿದ ನಂತರ ನಿಖರ ಸಲಹೆಗಳು ಇಲ್ಲಿ ಗೋಚರಿಸುತ್ತವೆ!'
                  : 'Log transactions for a few weeks to unlock personalized advice!'}
              </p>
            ) : (
              insights.map((ins, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200"
                >
                  {ins}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
