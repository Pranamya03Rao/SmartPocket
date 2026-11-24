import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Calculator,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export function Calculators() {
  const { t, isKn } = useLanguage();
  const [activeTab, setActiveTab] = useState('dailySavings');

  // 1. Daily Savings & Post Office RD State
  const [dailySavingAmt, setDailySavingAmt] = useState(50);
  const [savingYears, setSavingYears] = useState(3);
  const rdInterestRate = 6.7; // Official Post Office RD interest rate (~6.7%)

  // 2. Meter Baddi vs Bank Loan State
  const [loanPrincipal, setLoanPrincipal] = useState(10000);
  const [meterBaddiMonthlyRate, setMeterBaddiMonthlyRate] = useState(10); // 10% per month
  const [bankAnnualRate, setBankAnnualRate] = useState(9); // 9% per year (PM SVANidhi/Bank)
  const [loanMonths, setLoanMonths] = useState(12);

  // 3. Inflation / Cost of Living State
  const [currentRationCost, setCurrentRationCost] = useState(3000);
  const [inflationRate, setInflationRate] = useState(6);
  const [inflationYears, setInflationYears] = useState(3);

  // Daily Savings Math
  const dailySavingsResult = useMemo(() => {
    const daily = Number(dailySavingAmt);
    const y = Number(savingYears);
    const monthly = daily * 30;
    const totalDeposited = monthly * 12 * y;
    // Compounded quarterly approx for Post Office RD
    const r = rdInterestRate / 100 / 4;
    const n = y * 4;
    // Total future value with interest
    const interestFactor = 1 + (rdInterestRate * (y + 1) / 2400) * 12 * y; // standard simplified RD formula
    const totalCorpus = Math.round(monthly * 12 * y * (1 + (rdInterestRate * y / 200)));
    const interestEarned = Math.max(0, totalCorpus - totalDeposited);

    return {
      monthly,
      totalDeposited,
      totalCorpus,
      interestEarned,
    };
  }, [dailySavingAmt, savingYears]);

  // Meter Baddi vs Bank Loan Math
  const loanComparisonResult = useMemo(() => {
    const P = Number(loanPrincipal);
    const m = Number(loanMonths);

    // Meter baddi: interest paid every month, principal never decreases
    const meterBaddiMonthlyInterest = Math.round(P * (meterBaddiMonthlyRate / 100));
    const meterBaddiTotalInterest = meterBaddiMonthlyInterest * m;
    const meterBaddiTotalPay = P + meterBaddiTotalInterest;

    // Bank loan: Annual rate divided across months
    const bankMonthlyRate = (bankAnnualRate / 100) / 12;
    // Standard EMI formula
    const emi = bankMonthlyRate > 0
      ? Math.round((P * bankMonthlyRate * Math.pow(1 + bankMonthlyRate, m)) / (Math.pow(1 + bankMonthlyRate, m) - 1))
      : Math.round(P / m);
    const bankTotalPay = emi * m;
    const bankTotalInterest = Math.max(0, bankTotalPay - P);

    const extraMoneyLostToMeterBaddi = Math.max(0, meterBaddiTotalPay - bankTotalPay);

    return {
      meterBaddiMonthlyInterest,
      meterBaddiTotalInterest,
      meterBaddiTotalPay,
      emi,
      bankTotalPay,
      bankTotalInterest,
      extraMoneyLostToMeterBaddi,
    };
  }, [loanPrincipal, meterBaddiMonthlyRate, bankAnnualRate, loanMonths]);

  // Inflation Math
  const inflationResult = useMemo(() => {
    const amt = Number(currentRationCost);
    const r = Number(inflationRate) / 100;
    const y = Number(inflationYears);
    const futureCost = Math.round(amt * Math.pow(1 + r, y));
    const extraNeeded = Math.max(0, futureCost - amt);

    return { futureCost, extraNeeded };
  }, [currentRationCost, inflationRate, inflationYears]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKn ? 'ಕಾರ್ಮಿಕ ಜಾಗೃತಿ ಅಕಾಡೆಮಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Worker Academy'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Calculator className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          {isKn ? 'ಕಾರ್ಮಿಕ ಹಣಕಾಸು ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು' : 'Worker Financial & Loan Calculators'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isKn
            ? 'ದೈನಂದಿನ ಸಣ್ಣ ಉಳಿತಾಯದ ಶಕ್ತಿ, ಮೀಟರ್ ಬಡ್ಡಿ ಸಾಲದ ನಷ್ಟ ಹಾಗೂ ಬೆಲೆ ಏರಿಕೆಯ ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ.'
            : 'Calculate daily small savings in Post Office RD, uncover meter-baddi loan traps, and plan family ration.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('dailySavings')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'dailySavings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isKn ? '💰 ದಿನಕ್ಕೆ ₹30-50 ಉಳಿತಾಯ & ಅಂಚೆ ಆರ್‌ಡಿ' : '💰 Daily Savings & Post Office RD'}
        </button>
        <button
          onClick={() => setActiveTab('meterBaddi')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'meterBaddi'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isKn ? '⚠️ ಮೀಟರ್ ಬಡ್ಡಿ vs ಬ್ಯಾಂಕ್ ಸಾಲ' : '⚠️ Meter-Baddi vs Bank Loan Trap'}
        </button>
        <button
          onClick={() => setActiveTab('inflation')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'inflation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isKn ? '📈 ರೇಷನ್ & ಬೆಲೆ ಏರಿಕೆ' : '📈 Ration & Living Cost Rise'}
        </button>
      </div>

      {/* TAB 1: Daily Savings & Post Office RD */}
      {activeTab === 'dailySavings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isKn ? 'ದೈನಂದಿನ ಉಳಿತಾಯ ವಿವರ' : 'Daily Savings Plan'}
            </h3>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>{isKn ? 'ದಿನಕ್ಕೆ ಎಷ್ಟು ಹಣ ಉಳಿಸುತ್ತೀರಿ?' : 'Daily Saving Amount'}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">₹{dailySavingAmt} / {isKn ? 'ದಿನಕ್ಕೆ' : 'day'}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={dailySavingAmt}
                onChange={e => setDailySavingAmt(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>₹10</span>
                <span>₹50</span>
                <span>₹100</span>
                <span>₹500</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>{isKn ? 'ಉಳಿತಾಯದ ಅವಧಿ (ವರ್ಷಗಳು)' : 'Saving Period'}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{savingYears} {isKn ? 'ವರ್ಷಗಳು' : 'Years'}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={savingYears}
                onChange={e => setSavingYears(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 {isKn ? 'ವರ್ಷ' : 'Yr'}</span>
                <span>5 {isKn ? 'ವರ್ಷ' : 'Yrs'}</span>
                <span>10 {isKn ? 'ವರ್ಷ' : 'Yrs'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              💡 <strong>{isKn ? 'ತಿಂಗಳಿನ ಲೆಕ್ಕ:' : 'Monthly Equivalent:'}</strong>{' '}
              {isKn
                ? `ದಿನಕ್ಕೆ ₹${dailySavingAmt} ಉಳಿಸಿದರೆ ತಿಂಗಳಿಗೆ ₹${dailySavingsResult.monthly.toLocaleString('en-IN')} ಆಗುತ್ತದೆ. ಇದನ್ನು ಸ್ಥಳೀಯ ಅಂಚೆ ಕಚೇರಿ ಆರ್‌ಡಿ (Post Office RD) ಖಾತೆಗೆ ಸುಲಭವಾಗಿ ಜಮೆ ಮಾಡಬಹುದು.`
                : `Saving ₹${dailySavingAmt}/day equals ₹${dailySavingsResult.monthly.toLocaleString('en-IN')}/month. You can deposit this in any Post Office Recurring Deposit.`}
            </div>
          </div>

          {/* Results Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
                {isKn ? `${savingYears} ವರ್ಷಗಳ ನಂತರ ಒಟ್ಟು ಸಿಗುವ ಹಣ` : `Total Corpus at Year ${savingYears}`}
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-6">
                ₹{dailySavingsResult.totalCorpus.toLocaleString('en-IN')}
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-emerald-800">
                  <span className="text-xs text-emerald-200">
                    {isKn ? 'ನೀವು ಜಮೆ ಮಾಡಿದ ಒಟ್ಟು ಮೊತ್ತ' : 'Total Deposited by You'}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    ₹{dailySavingsResult.totalDeposited.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-emerald-800">
                  <span className="text-xs text-emerald-200">
                    {isKn ? 'ಅಂಚೆ ಕಚೇರಿಯಿಂದ ಸಿಗುವ ಬಡ್ಡಿ ಲಾಭ (~6.7%)' : 'Government Interest Earned (~6.7%)'}
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">
                    +₹{dailySavingsResult.interestEarned.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-emerald-200 mt-6 leading-relaxed flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              {isKn
                ? 'ಈ ಹಣವು ಯಾವುದೇ ಮೀಟರ್ ಬಡ್ಡಿ ಸಾಲಗಾರನ ಬಳಿ ಕೈಚಾಚದೆ ನಿಮ್ಮ ಕುಟುಂಬದ ತುರ್ತು ವೈದ್ಯಕೀಯ ಅಥವಾ ಶಾಲಾ ಖರ್ಚನ್ನು ನಿಭಾಯಿಸುತ್ತದೆ!'
                : 'This emergency fund protects your family from private debt traps when emergencies strike!'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Meter-Baddi vs Bank Loan Trap */}
      {activeTab === 'meterBaddi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              {isKn ? 'ಸಾಲದ ವಿವರಗಳು' : 'Loan Parameters'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {isKn ? 'ಸಾಲ ಪಡೆಯುವ ಮೊತ್ತ (₹)' : 'Borrowing Amount (₹)'}
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={loanPrincipal}
                onChange={e => setLoanPrincipal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-semibold text-slate-900 dark:text-white min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>{isKn ? 'ಮೀಟರ್ ಬಡ್ಡಿ ತಿಂಗಳ ಬಡ್ಡಿ ದರ (%)' : 'Meter-Baddi Monthly Interest Rate (%)'}</span>
                <span className="text-rose-600 font-bold">{meterBaddiMonthlyRate}% / {isKn ? 'ತಿಂಗಳಿಗೆ' : 'month'}</span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={meterBaddiMonthlyRate}
                onChange={e => setMeterBaddiMonthlyRate(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>3% / ತಿಂಗಳು (36%/ವರ್ಷ)</span>
                <span>10% / ತಿಂಗಳು (120%/ವರ್ಷ)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>{isKn ? 'ಸಾಲ ತೀರಿಸುವ ಅವಧಿ (ತಿಂಗಳುಗಳು)' : 'Repayment Period (Months)'}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{loanMonths} {isKn ? 'ತಿಂಗಳುಗಳು' : 'Months'}</span>
              </div>
              <input
                type="range"
                min="3"
                max="24"
                step="1"
                value={loanMonths}
                onChange={e => setLoanMonths(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2"
              />
            </div>
          </div>

          {/* Results Comparison Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-wider text-rose-300 uppercase">
                {isKn ? 'ಮೀಟರ್ ಬಡ್ಡಿಗೆ ವ್ಯರ್ಥವಾಗುವ ಹಣ!' : 'Shocking Meter-Baddi Trap!'}
              </span>
              <h2 className="text-3xl font-extrabold text-rose-400 mt-2 mb-2">
                -₹{loanComparisonResult.extraMoneyLostToMeterBaddi.toLocaleString('en-IN')}
              </h2>
              <p className="text-xs text-rose-200 mb-6 leading-relaxed">
                {isKn
                  ? `ಬ್ಯಾಂಕ್ ಅಥವಾ ಪಿಎಂ ಸ್ವನಿಧಿಗೆ ಹೋಲಿಸಿದರೆ ಖಾಸಗಿ ಮೀಟರ್ ಬಡ್ಡಿಗೆ ನೀವು ಕಳೆದುಕೊಳ್ಳುವ ಹೆಚ್ಚುವರಿ ಹಣ ₹${loanComparisonResult.extraMoneyLostToMeterBaddi.toLocaleString('en-IN')}!`
                  : `You lose an extra ₹${loanComparisonResult.extraMoneyLostToMeterBaddi.toLocaleString('en-IN')} to private loan sharks compared to safe bank schemes!`}
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-900/40 border border-rose-800">
                  <div className="flex justify-between text-xs text-rose-200">
                    <span>{isKn ? 'ಮೀಟರ್ ಬಡ್ಡಿ ಒಟ್ಟು ಬಡ್ಡಿ ಮಾತ್ರ' : 'Meter-Baddi Total Interest Only:'}</span>
                    <strong className="text-rose-300 font-bold">₹{loanComparisonResult.meterBaddiTotalInterest.toLocaleString('en-IN')}</strong>
                  </div>
                  <p className="text-[11px] text-rose-300/80 mt-1">
                    {isKn ? `(ಪ್ರತಿ ತಿಂಗಳು ₹${loanComparisonResult.meterBaddiMonthlyInterest} ಕೇವಲ ಬಡ್ಡಿ ಕಟ್ಟಬೇಕು)` : `(₹${loanComparisonResult.meterBaddiMonthlyInterest}/month paid forever with zero principal reduced)`}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-800">
                  <div className="flex justify-between text-xs text-emerald-200">
                    <span>{isKn ? 'ಸರ್ಕಾರಿ ಬ್ಯಾಂಕ್ / ಪಿಎಂ ಸ್ವನಿಧಿ ಬಡ್ಡಿ (~9% ವರ್ಷಕ್ಕೆ):' : 'Bank / PM SVANidhi Total Interest:'}</span>
                    <strong className="text-emerald-300 font-bold">₹{loanComparisonResult.bankTotalInterest.toLocaleString('en-IN')}</strong>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-1">
                    {isKn ? `(ಮಾಸಿಕ ಕಂತು ₹${loanComparisonResult.emi} ಮಾತ್ರ - ಸಾಲವೂ ಪೂರ್ತಿ ತೀರುತ್ತದೆ!)` : `(Affordable EMI ₹${loanComparisonResult.emi}/mo and loan is 100% cleared!)`}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-6 leading-relaxed">
              ⚠️ <strong>{isKn ? 'ಎಚ್ಚರಿಕೆ:' : 'Warning:'}</strong>{' '}
              {isKn
                ? 'ಅನಧಿಕೃತ ಸಾಲಗಾರರಿಗೆ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಅಥವಾ ಆಧಾರ್ ಕಾರ್ಡ್ ಅಡಮಾನ ಇಡಬೇಡಿ. ರಾಷ್ಟ್ರೀಕೃತ ಬ್ಯಾಂಕ್‌ಗಳಲ್ಲಿ ಪಿಎಂ ಸ್ವನಿಧಿ ಯೋಜನೆಯಡಿ ₹10,000 ರಿಂದ ₹50,000 ಸಾಲ ಪಡೆಯಿರಿ.'
                : 'Never surrender your passbook or ATM card to loan sharks. Apply for PM SVANidhi or Bank Gold Loans.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Inflation & Living Cost Rise */}
      {activeTab === 'inflation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isKn ? 'ರೇಷನ್ & ಕುಟುಂಬದ ಖರ್ಚು ಲೆಕ್ಕ' : 'Ration & Family Living Expenses'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {isKn ? 'ಇಂದಿನ ಮಾಸಿಕ ರೇಷನ್ & ಅಕ್ಕಿ ಖರ್ಚು (₹)' : 'Current Monthly Food & Ration Expense (₹)'}
              </label>
              <input
                type="number"
                value={currentRationCost}
                onChange={e => setCurrentRationCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-semibold text-slate-900 dark:text-white min-h-[44px]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>{isKn ? 'ವರ್ಷಕ್ಕೆ ಸರಾಸರಿ ಬೆಲೆ ಏರಿಕೆ ದರ' : 'Annual Inflation Rate'}</span>
                <span className="text-rose-600 font-bold">{inflationRate}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                value={inflationRate}
                onChange={e => setInflationRate(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>3%</span>
                <span>6% (ಭಾರತದ ಸರಾಸರಿ)</span>
                <span>12%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>{isKn ? 'ಮುಂದಿನ ಎಷ್ಟು ವರ್ಷಗಳ ಲೆಕ್ಕ?' : 'Years Ahead'}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{inflationYears} {isKn ? 'ವರ್ಷಗಳು' : 'Years'}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={inflationYears}
                onChange={e => setInflationYears(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2"
              />
            </div>
          </div>

          {/* Results */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-wider text-amber-300 uppercase">
                {isKn ? `${inflationYears} ವರ್ಷಗಳ ನಂತರ ಅದೇ ರೇಷನ್‌ಗೆ ಬೇಕಾಗುವ ಹಣ` : 'Future Equivalent Living Cost'}
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-2">
                ₹{inflationResult.futureCost.toLocaleString('en-IN')}
              </h2>
              <p className="text-xs text-indigo-200 mb-6 leading-relaxed">
                {isKn
                  ? `ಇಂದು ₹${currentRationCost.toLocaleString('en-IN')} ಕ್ಕೆ ಸಿಗುವ ರೇಷನ್ ಸಾಮಗ್ರಿಗೆ ${inflationYears} ವರ್ಷಗಳಲ್ಲಿ ₹${inflationResult.futureCost.toLocaleString('en-IN')} ಬೇಕಾಗುತ್ತದೆ.`
                  : `What costs ₹${currentRationCost.toLocaleString('en-IN')} today will cost ₹${inflationResult.futureCost.toLocaleString('en-IN')} in ${inflationYears} years.`}
              </p>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-xs text-slate-300">
                  {isKn ? 'ಹೆಚ್ಚುವರಿ ಅಗತ್ಯವಿರುವ ಹಣ:' : 'Extra Monthly Inflow Needed:'}
                </span>
                <p className="text-sm font-bold text-amber-300">
                  +₹{inflationResult.extraNeeded.toLocaleString('en-IN')} {isKn ? '/ ತಿಂಗಳಿಗೆ' : '/ month'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-6 leading-relaxed">
              * {isKn
                ? 'ಬೆಲೆ ಏರಿಕೆಯ ಹೊರೆ ತಗ್ಗಿಸಲು, ನಿಮ್ಮ ದಿನಗೂಲಿ ಅಥವಾ ಅಂಗಡಿ ವ್ಯಾಪಾರದ ಕೌಶಲ್ಯವನ್ನು ಹೆಚ್ಚಿಸಿಕೊಳ್ಳುವುದು ಹಾಗೂ ಸಣ್ಣ ಉಳಿತಾಯ ಮುಂದುವರಿಸುವುದು ಅನಿವಾರ್ಯ.'
                : 'To beat rising costs, building daily micro-savings and acquiring new working skills is essential.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export default Calculators;
