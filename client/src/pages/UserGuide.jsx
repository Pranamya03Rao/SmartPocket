import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Shield,
  Smartphone,
  PhoneCall,
  UserCheck,
  TrendingUp,
  Receipt,
  PieChart,
  Target,
  GraduationCap,
  Key,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function UserGuide() {
  const { t, isKn, language, setLanguage } = useLanguage();
  const [openSection, setOpenSection] = useState('all'); // or section key

  const toggleSection = (sec) => {
    setOpenSection(openSection === sec ? '' : sec);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              {isKn ? 'ಸರಳ ಬಳಕೆದಾರರ ಕೈಪಿಡಿ' : 'Beginner Friendly Guide'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('guide.title')}
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 max-w-2xl leading-relaxed">
              {t('guide.subtitle')}
            </p>
          </div>

          {/* Quick Language Toggle in Header */}
          <div className="shrink-0 flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
            <button
              onClick={() => setLanguage('kn')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isKn ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              ಕನ್ನಡ (Kannada)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !isKn ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Table of Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'secA', label: isKn ? 'A. ಪರಿಚಯ' : 'A. Intro', icon: HelpCircle },
          { id: 'secB', label: isKn ? 'B. ಪ್ರಾರಂಭ' : 'B. Start', icon: UserCheck },
          { id: 'secC', label: isKn ? 'C. ಸೌಲಭ್ಯಗಳು' : 'C. Features', icon: TrendingUp },
          { id: 'secD', label: isKn ? 'D. ಮುಖಪುಟ' : 'D. Dashboard', icon: PieChart },
          { id: 'secE', label: isKn ? 'E. ಭದ್ರತೆ' : 'E. Security', icon: Shield },
          { id: 'secF', label: isKn ? 'F. ಸಹಾಯವಾಣಿ' : 'F. Support', icon: PhoneCall },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:shadow-md transition-all text-center text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-1.5" />
            <span>{item.label}</span>
          </a>
        ))}
      </div>

      {/* SECTION A: Introduction */}
      <section id="secA" className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('guide.secA_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKn ? 'ಸ್ಮಾರ್ಟ್ ಪಾಕೆಟ್‌ನ ಉದ್ದೇಶ ಮತ್ತು ಇದು ಯಾರಿಗೆ ಪ್ರಯೋಜನಕಾರಿ?' : 'Overview and purpose of this platform'}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 dark:from-indigo-950/30 dark:via-slate-800/60 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50">
          <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
            {t('guide.secA_paragraph')}
          </p>
        </div>
      </section>

      {/* SECTION B: Getting Started */}
      <section id="secB" className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('guide.secB_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKn ? 'ಖಾತೆ ರಚನೆ, ಲಾಗಿನ್ ಮತ್ತು ಮೊದಲ ಬಾರಿಗೆ ಬಳಸುವ ಸುಲಭ ಹಂತಗಳು' : 'Simple steps to create an account and navigate'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { title: t('guide.secB_step1'), desc: t('guide.secB_step1_desc'), step: '1' },
            { title: t('guide.secB_step2'), desc: t('guide.secB_step2_desc'), step: '2' },
            { title: t('guide.secB_step3'), desc: t('guide.secB_step3_desc'), step: '3' },
            { title: t('guide.secB_step4'), desc: t('guide.secB_step4_desc'), step: '4' },
          ].map((st, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shrink-0 mt-0.5">
                {st.step}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {st.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION C: Using Features */}
      <section id="secC" className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('guide.secC_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKn ? 'ಆ್ಯಪ್‌ನ ಪ್ರತಿಯೊಂದು ಸೌಲಭ್ಯವನ್ನು ಹಂತ-ಹಂತವಾಗಿ ಬಳಸುವ ವಿವರ' : 'Step-by-step instructions for all features'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('guide.secC_f1')}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed ml-7">
              {t('guide.secC_f1_desc')}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('guide.secC_f2')}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed ml-7">
              {t('guide.secC_f2_desc')}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-amber-600" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('guide.secC_f3')}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed ml-7">
              {t('guide.secC_f3_desc')}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('guide.secC_f4')}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed ml-7">
              {t('guide.secC_f4_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION D: Understanding Dashboard */}
      <section id="secD" className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('guide.secD_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿರುವ ಮಾಹಿತಿಯನ್ನು ನೋಡಿ ಅರ್ಥೈಸಿಕೊಳ್ಳುವುದು' : 'How to read and interpret your dashboard indicators'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {t('guide.secD_desc')}
          </p>
        </div>
      </section>

      {/* SECTION E: Account & Security */}
      <section id="secE" className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('guide.secE_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKn ? 'ಪಾಸ್‌ವರ್ಡ್ ಸುರಕ್ಷತೆ, ಲಾಗ್‌ಔಟ್ ಮತ್ತು ಮೊಬೈಲ್ ಭದ್ರತೆ' : 'Password safety, logout and account security'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
          <p className="text-xs sm:text-sm text-rose-950 dark:text-rose-200 whitespace-pre-line leading-relaxed font-medium">
            {t('guide.secE_r1')}
          </p>
        </div>
      </section>

      {/* SECTION F: Getting Help & Helpline */}
      <section id="secF" className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('guide.secF_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKn ? 'ಸಮಸ್ಯೆಗಳು ಎದುರಾದಾಗ ಸಹಾಯ ಪಡೆಯುವ ಅಧಿಕೃತ ವಿವರ' : 'Troubleshooting, support and helpline contacts'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('guide.secF_q1')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('guide.secF_a1')}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
            <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              {t('guide.secF_q2')}
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {t('guide.secF_a2')}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('guide.secF_q3')}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('guide.secF_a3')}
            </p>
          </div>
        </div>

        {/* Emergency Call Action Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <PhoneCall className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {isKn ? 'ಸೈಬರ್ ಆನ್‌ಲೈನ್ ಮೋಸಕ್ಕೆ ರಾಷ್ಟ್ರೀಯ ಉಚಿತ ತುರ್ತು ಕರೆ: 1930' : 'National Cyber Fraud Emergency Helpline: Dial 1930'}
              </p>
              <p className="text-xs text-rose-100">
                {isKn ? '24 ಗಂಟೆಯೂ ಸೇವೆ ಲಭ್ಯವಿದೆ (ಕರ್ನಾಟಕ ಸೈಬರ್ ಪೊಲೀಸ್ / ಭಾರತ ಸರ್ಕಾರ)' : '24x7 Free Service (National Cyber Crime Portal)'}
              </p>
            </div>
          </div>
          <a
            href="tel:1930"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-rose-700 font-bold text-xs shadow hover:bg-rose-50 transition-colors"
          >
            {isKn ? 'ಈಗಲೇ ಕರೆ ಮಾಡಿ (1930)' : 'Call 1930 Now'}
          </a>
        </div>
      </section>
    </div>
  );
}
export default UserGuide;

