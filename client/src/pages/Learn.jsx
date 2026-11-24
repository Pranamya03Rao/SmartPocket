import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  GraduationCap,
  BookOpen,
  Award,
  Flame,
  CheckCircle2,
  Trophy,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Calculator,
  RefreshCw,
} from 'lucide-react';

export function Learn() {
  const { t, isKn } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({
    points: 0,
    streak: 0,
    badges: [],
    completedCount: 0,
    optInLeaderboard: true,
    alias: '',
  });
  const [tip, setTip] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonsRes, tipRes] = await Promise.all([
        api.get('/learn/lessons').catch(() => ({ data: { lessons: [], progress: {} } })),
        api.get('/learn/tip').catch(() => ({ data: { tip: null } })),
      ]);

      if (lessonsRes.data) {
        setLessons(lessonsRes.data.lessons || []);
        if (lessonsRes.data.progress) {
          setProgress(lessonsRes.data.progress);
        }
      }
      if (tipRes.data?.tip) {
        setTip(tipRes.data.tip);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ಪಾಠಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to load lessons'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/learn/leaderboard');
      setLeaderboard(res.data?.leaderboard || []);
      setShowLeaderboard(true);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  };

  const handleToggleLeaderboard = async () => {
    try {
      const res = await api.post('/learn/leaderboard/toggle');
      setProgress(prev => ({ ...prev, optInLeaderboard: res.data.optInLeaderboard }));
    } catch (err) {
      console.error('Failed to toggle leaderboard status', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = ['all', 'banking', 'credit', 'investing', 'budgeting'];
  const filteredLessons = selectedCategory === 'all'
    ? lessons
    : lessons.filter(l => l.category?.toLowerCase() === selectedCategory);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            {t('learn.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('learn.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/calculators"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm min-h-[44px]"
          >
            <Calculator className="h-4 w-4 text-emerald-500" />
            {t('learn.calculatorsBtn')}
          </Link>
          <Link
            to="/scam-awareness"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-sm min-h-[44px]"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            {t('learn.scamBtn')}
          </Link>
        </div>
      </div>

      {/* Gamification / Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('learn.points')}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{progress.points} pts</h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('learn.streak')}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {progress.streak} {isKn ? 'ದಿನಗಳು' : 'days'}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('learn.completed')}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {progress.completedCount} / {lessons.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('learn.badges')}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{progress.badges?.length || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Tip Widget */}
      {tip && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {isKn ? 'ದೈನಂದಿನ ಹಣಕಾಸು ಜಾಗೃತಿ' : 'Daily Financial Safety Tip'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 capitalize">
                {tip.category}
              </span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              "{tip.text}"
            </p>
          </div>
        </div>
      )}

      {/* Category Tabs & Leaderboard Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? (isKn ? 'ಎಲ್ಲಾ ಪಾಠಗಳು' : 'All') : cat}
            </button>
          ))}
        </div>

        <button
          onClick={fetchLeaderboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px]"
        >
          <Trophy className="h-4 w-4 text-amber-500" />
          {isKn ? 'ಕಾರ್ಮಿಕ ಮಿತ್ರರ ಪ್ರಗತಿ ಪಟ್ಟಿ ನೋಡಿ' : 'View Worker Community Scoreboard'}
        </button>
      </div>

      {/* Lesson Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <BookOpen className="h-10 w-10 mx-auto text-slate-400 mb-2" />
          <p className="text-slate-600 dark:text-slate-400">
            {isKn ? 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಪಾಠಗಳಿಲ್ಲ' : 'No lessons found in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredLessons.map((lesson, idx) => (
            <div
              key={lesson._id}
              className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                lesson.completed
                  ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isKn ? `ಭಾಗ 0${idx + 1}` : `Module 0${idx + 1}`} • {lesson.category || 'General'}
                  </span>
                  {lesson.completed && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isKn ? 'ಓದಲಾಗಿದೆ' : 'Completed'}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {lesson.title}
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                  {lesson.content?.replace(/#{1,6}\s?/g, '').slice(0, 140)}...
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isKn ? '+50 ಅಂಕ & ಬ್ಯಾಡ್ಜ್' : '+50 XP & Badge on Quiz'}
                </span>

                <Link
                  to={`/learn/${lesson._id}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl shadow-sm transition-colors min-h-[44px] ${
                    lesson.completed
                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {lesson.completed ? (isKn ? 'ಮರುಪರಿಶೀಲಿಸಿ' : 'Review Lesson') : t('learn.startLesson')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Modal / Drawer */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isKn ? 'ಶ್ರಮಿಕ ಮಿತ್ರರ ಕಲಿಕಾ ಪಟ್ಟಿ' : 'Worker Community Leaderboard'}
                </h3>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {isKn
                ? 'ಕಾರ್ಮಿಕರ ಖಾಸಗಿತನವನ್ನು ರಕ್ಷಿಸಲು ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಗೌಪ್ಯ ಉಪನಾಮ (ಉದಾ: Mitra707) ನೀಡಲಾಗುತ್ತದೆ.'
                : 'To protect privacy, each worker is assigned a confidential alias (e.g., Mitra707).'}
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">
                  {isKn ? 'ಇನ್ನೂ ಯಾರೂ ಶ್ರೇಯಾಂಕ ಪಡೆದಿಲ್ಲ.' : 'No ranked learners yet.'}
                </p>
              ) : (
                leaderboard.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      i === 0
                        ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-bold text-sm ${
                        i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        #{i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.alias}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.streak || 0} {isKn ? 'ದಿನ ಸತತ' : 'day streak'} • {item.completedCount || 0} {isKn ? 'ಪಾಠಗಳು' : 'lessons'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {item.points} XP
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={progress.optInLeaderboard}
                  onChange={handleToggleLeaderboard}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {isKn ? 'ನನ್ನ ಹೆಸರನ್ನು ಪಟ್ಟಿಯಲ್ಲಿ ತೋರಿಸಿ' : 'Show my alias on leaderboard'}
              </label>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 min-h-[40px]"
              >
                {isKn ? 'ಮುಚ್ಚಿ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Learn;
