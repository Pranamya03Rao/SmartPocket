import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  ArrowLeft,
  Award,
  HelpCircle,
  Clock,
} from 'lucide-react';

export function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { isKn } = useLanguage();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/learn/lessons/${lessonId}`);
        setLesson(res.data?.lesson);
      } catch (err) {
        setError(err.response?.data?.message || (isKn ? 'ಪಾಠದ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to load lesson details'));
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-rose-500 font-semibold mb-4">{error || (isKn ? 'ಪಾಠ ಕಂಡುಬಂದಿಲ್ಲ' : 'Lesson not found')}</p>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKn ? 'ಎಲ್ಲಾ ಪಾಠಗಳಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Lessons'}
        </Link>
      </div>
    );
  }

  const renderFormattedContent = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-5 mb-2">
            {trimmed.replace('#### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        const boldMatch = itemText.match(/^\*\*(.*?)\*\*(.*)/);
        if (boldMatch) {
          return (
            <li key={idx} className="ml-5 list-disc text-sm text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">{boldMatch[1]}</strong>
              {boldMatch[2]}
            </li>
          );
        }
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
            {itemText}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="ml-5 list-decimal text-sm text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-3" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-2">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKn ? 'ಎಲ್ಲಾ ಪಾಠಗಳ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to all modules'}
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              {lesson.category || 'General'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-indigo-300">
              <Clock className="h-3.5 w-3.5" /> {isKn ? '3 ನಿಮಿಷಗಳ ಓದು' : '3-min read'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
            {lesson.title}
          </h1>

          <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
            {isKn
              ? 'ಈ ಪಾಠವನ್ನು ಗಮನವಿಟ್ಟು ಓದಿ, ಕೆಳಗಿನ ರಸಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿ 50 ಅಂಕಗಳನ್ನು ಪಡೆಯಿರಿ.'
              : 'Master this essential financial concept, pass the comprehension quiz, and earn XP to level up your badge tier.'}
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="prose dark:prose-invert max-w-none">
          {renderFormattedContent(lesson.content)}
        </div>

        {/* Action Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isKn ? 'ರಸಪ್ರಶ್ನೆ ಪರೀಕ್ಷೆ ಸಿದ್ಧವಾಗಿದೆ' : 'Knowledge Check Ready'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKn ? '70% ಕ್ಕಿಂತ ಹೆಚ್ಚು ಅಂಕ ಪಡೆದು ಬ್ಯಾಡ್ಜ್ ಅನ್‌ಲಾಕ್ ಮಾಡಿ' : 'Score 70%+ to unlock badge & streak rewards'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/learn/${lessonId}/quiz`)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-colors min-h-[44px]"
          >
            <HelpCircle className="h-4 w-4" />
            {isKn ? 'ರಸಪ್ರಶ್ನೆ ಪ್ರಾರಂಭಿಸಿ' : 'Take Comprehension Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default LessonDetail;
