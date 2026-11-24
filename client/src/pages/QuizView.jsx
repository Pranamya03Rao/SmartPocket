import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

export function QuizView() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const { isKn } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const lessonRes = await api.get(`/learn/lessons/${lessonId}`);
      setLesson(lessonRes.data?.lesson);
      const quizMeta = lessonRes.data?.quiz;

      if (!quizMeta?._id) {
        setError(isKn ? 'ಈ ಪಾಠಕ್ಕೆ ಇನ್ನೂ ರಸಪ್ರಶ್ನೆ ಲಭ್ಯವಿಲ್ಲ.' : 'No quiz found for this lesson yet.');
        return;
      }

      const quizRes = await api.get(`/learn/quiz/${quizMeta._id}`);
      setQuiz(quizRes.data?.quiz);
      setAnswers(new Array(quizRes.data?.quiz?.questions?.length || 0).fill(null));
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ರಸಪ್ರಶ್ನೆ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to load quiz'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx, optIdx) => {
    if (result) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = optIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === null)) {
      alert(isKn ? 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.' : 'Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/learn/quiz/${quiz._id}/submit`, { answers });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || (isKn ? 'ರಸಪ್ರಶ್ನೆ ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Quiz submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-rose-500 font-semibold mb-4">{error || (isKn ? 'ರಸಪ್ರಶ್ನೆ ಲಭ್ಯವಿಲ್ಲ' : 'Quiz unavailable')}</p>
        <Link
          to={`/learn/${lessonId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKn ? 'ಪಾಠಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to Lesson'}
        </Link>
      </div>
    );
  }

  const allAnswered = answers.every(a => a !== null);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/learn/${lessonId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          {isKn ? 'ಪಾಠಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to lesson'}
        </Link>
        <span className="text-xs font-medium text-slate-400">
          {quiz.questions?.length} {isKn ? 'ಪ್ರಶ್ನೆಗಳು' : 'Questions'}
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {quiz.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {isKn
            ? 'ಉತ್ತೀರ್ಣರಾಗಲು ಕನಿಷ್ಠ 60% ಅಂಕ ಅಗತ್ಯ. ಉತ್ತೀರ್ಣರಾದರೆ +50 ಕಲಿಕಾ ಅಂಕಗಳು ಮತ್ತು ಪ್ರಮಾಣಪತ್ರ ಲಭಿಸುತ್ತದೆ.'
            : 'Pass threshold: 60%. Successfully passing awards XP, streak rewards, and a certificate of completion.'}
        </p>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {quiz.questions?.map((q, qIdx) => {
          const resDetail = result?.results?.[qIdx];
          return (
            <div
              key={qIdx}
              className={`p-6 rounded-2xl border transition-all ${
                result
                  ? resDetail?.correct
                    ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                    : 'border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {qIdx + 1}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                  {q.question}
                </h3>
              </div>

              <div className="space-y-2.5 ml-2 sm:ml-9">
                {q.options?.map((opt, optIdx) => {
                  const isSelected = answers[qIdx] === optIdx;
                  const isCorrect = resDetail && resDetail.correctIndex === optIdx;
                  const isWrongChoice = resDetail && isSelected && !resDetail.correct;

                  let optClass = 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60';
                  if (isSelected && !result) {
                    optClass = 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-medium ring-1 ring-indigo-600';
                  } else if (result) {
                    if (isCorrect) {
                      optClass = 'border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isWrongChoice) {
                      optClass = 'border-rose-500 bg-rose-100/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    } else {
                      optClass = 'opacity-60 border-slate-200 dark:border-slate-800';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={Boolean(result)}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between min-h-[48px] ${optClass}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {result && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 ml-2" />}
                      {result && isWrongChoice && <XCircle className="h-5 w-5 text-rose-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submit */}
              {result && resDetail?.explanation && (
                <div className="mt-4 ml-2 sm:ml-9 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {isKn ? 'ವಿವರಣೆ: ' : 'Explanation: '}
                  </span>
                  {resDetail.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission CTA or Result Summary */}
      {!result ? (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all min-h-[48px] ${
              allAnswered && !submitting
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (isKn ? 'ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Scoring Quiz...') : (isKn ? 'ಉತ್ತರಗಳನ್ನು ಸಲ್ಲಿಸಿ' : 'Submit Answers')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-lg ${
              result.passed
                ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-300 dark:border-emerald-800'
                : 'bg-gradient-to-br from-amber-500/10 to-rose-500/10 border-amber-300 dark:border-amber-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {result.passed ? (
                    <Award className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <RotateCcw className="h-6 w-6 text-amber-600" />
                  )}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {result.passed
                      ? (isKn ? 'ಅಭಿನಂದನೆಗಳು! ನೀವು ಉತ್ತೀರ್ಣರಾಗಿದ್ದೀರಿ!' : 'Quiz Passed! Congratulations!')
                      : (isKn ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ!' : 'Keep Practicing!')}
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {isKn ? 'ನಿಮ್ಮ ಅಂಕ: ' : 'You scored '}
                  <span className="font-bold">{result.score}</span> / {result.total} ({result.percentage}%).
                  {result.passed && (isKn ? ' ನಿಮಗೆ +50 ಕಲಿಕಾ ಅಂಕಗಳು ದೊರೆತಿವೆ!' : ' You have earned +50 XP towards your badge!')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchQuiz}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 min-h-[44px]"
                >
                  {isKn ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Retake Quiz'}
                </button>
                <Link
                  to="/learn"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow min-h-[44px] inline-flex items-center"
                >
                  {isKn ? 'ಮುಂದಿನ ಪಾಠ' : 'Next Module'}
                </Link>
              </div>
            </div>

            {/* Certificate of Completion if passed */}
            {result.passed && (
              <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-400 dark:border-emerald-700 shadow-inner">
                <div className="text-center space-y-3">
                  <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
                    {isKn ? 'ಕಾರ್ಮಿಕ ಹಣಕಾಸು ಜಾಗೃತಿ ಪ್ರಮಾಣಪತ್ರ' : 'Certificate of Knowledge Completion'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
                    {isKn ? 'ಸ್ಮಾರ್ಟ್ ಪಾಕೆಟ್ ಆರ್ಥಿಕ ಜಾಗೃತಿ ತರಬೇತಿ' : 'Smart Pocket Financial Literacy Academy'}
                  </h3>
                  <p className="text-xs text-slate-500">{isKn ? 'ಈ ಪ್ರಮಾಣಪತ್ರವನ್ನು' : 'This certifies that'}</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {user?.name || (isKn ? 'ಕಾರ್ಮಿಕ ಮಿತ್ರ' : 'Worker Friend')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    {isKn
                      ? 'ಅವರು ಈ ಕೆಳಗಿನ ಪಾಠವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿಸಿ ರಸಪ್ರಶ್ನೆಯಲ್ಲಿ ಉತ್ತೀರ್ಣರಾಗಿದ್ದಾರೆ ಎಂದು ಧೃಡೀಕರಿಸಲಾಗಿದೆ'
                      : 'has successfully mastered the concepts and passed the examination for'}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    "{lesson?.title || 'Worker Financial Literacy Module'}"
                  </p>
                  <p className="text-[11px] text-slate-400 pt-2">
                    {isKn ? 'ದಿನಾಂಕ: ' : 'Verified on '}
                    {new Date().toLocaleDateString(isKn ? 'kn-IN' : 'en-IN', { month: 'long', day: 'numeric', year: 'numeric' })} • Smart Pocket (ಸ್ಮಾರ್ಟ್ ಪಾಕೆಟ್)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default QuizView;
