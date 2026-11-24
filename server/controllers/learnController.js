import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import UserProgress from '../models/UserProgress.js';
import Tip from '../models/Tip.js';
import { AppError } from '../utils/AppError.js';

// Random animal adjective aliases for leaderboard
const ADJECTIVES = ['Clever', 'Swift', 'Bold', 'Wise', 'Lucky', 'Brave', 'Calm', 'Sharp', 'Keen', 'Quick'];
const ANIMALS = ['Owl', 'Fox', 'Hawk', 'Tiger', 'Panda', 'Eagle', 'Wolf', 'Dolphin', 'Bear', 'Lynx'];

function generateAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${animal}${num}`;
}

async function getOrCreateProgress(userId) {
  let progress = await UserProgress.findOne({ user: userId });
  if (!progress) {
    progress = await UserProgress.create({
      user: userId,
      alias: generateAlias(),
    });
  }
  return progress;
}

function updateStreak(progress) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (progress.lastActivityDate) {
    const last = new Date(progress.lastActivityDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      progress.streak += 1;
    } else if (diffDays > 1) {
      progress.streak = 1;
    }
    // diffDays === 0 means same day, keep streak
  } else {
    progress.streak = 1;
  }

  progress.lastActivityDate = new Date();
}

function checkAndAwardBadges(progress) {
  const newBadges = [];
  const badgeNames = progress.badges.map(b => b.name);

  const rules = [
    { name: 'First Lesson', condition: () => progress.completedLessons.length >= 1 },
    { name: '5 Lessons', condition: () => progress.completedLessons.length >= 5 },
    { name: 'All 10 Lessons', condition: () => progress.completedLessons.length >= 10 },
    { name: '3 Day Streak', condition: () => progress.streak >= 3 },
    { name: '7 Day Streak', condition: () => progress.streak >= 7 },
    { name: '100 Points', condition: () => progress.points >= 100 },
    { name: '500 Points', condition: () => progress.points >= 500 },
  ];

  for (const rule of rules) {
    if (!badgeNames.includes(rule.name) && rule.condition()) {
      progress.badges.push({ name: rule.name, earnedAt: new Date() });
      newBadges.push(rule.name);
    }
  }

  return newBadges;
}

// ── LESSONS ──

export async function getLessons(req, res, next) {
  try {
    const lessons = await Lesson.find({ published: true }).sort({ order: 1 }).lean();
    const progress = await getOrCreateProgress(req.user._id);

    const lessonsWithStatus = lessons.map(l => ({
      ...l,
      completed: progress.completedLessons.some(cl => cl.toString() === l._id.toString()),
    }));

    res.json({
      lessons: lessonsWithStatus,
      progress: {
        points: progress.points,
        streak: progress.streak,
        badges: progress.badges,
        completedCount: progress.completedLessons.length,
        alias: progress.alias,
        optInLeaderboard: progress.optInLeaderboard,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLessonById(req, res, next) {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.id, published: true });
    if (!lesson) throw new AppError('Lesson not found', 404);

    const quiz = await Quiz.findOne({ lesson: lesson._id, published: true }).lean();

    // Check if user already completed this lesson
    const progress = await getOrCreateProgress(req.user._id);
    const completed = progress.completedLessons.some(cl => cl.toString() === lesson._id.toString());

    // Check best quiz attempt
    let bestAttempt = null;
    if (quiz) {
      bestAttempt = await QuizAttempt.findOne({ user: req.user._id, quiz: quiz._id })
        .sort({ score: -1 })
        .lean();
    }

    res.json({ lesson, quiz: quiz ? { _id: quiz._id, title: quiz.title, questionCount: quiz.questions.length } : null, completed, bestAttempt });
  } catch (err) {
    next(err);
  }
}

// ── QUIZ ──

export async function getQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, published: true }).lean();
    if (!quiz) throw new AppError('Quiz not found', 404);

    // Strip correct answers for client
    const sanitized = {
      ...quiz,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        // Don't send correctIndex or explanation
      })),
    };

    res.json({ quiz: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    const { answers } = req.validated;
    const quiz = await Quiz.findOne({ _id: req.params.quizId, published: true });
    if (!quiz) throw new AppError('Quiz not found', 404);

    if (answers.length !== quiz.questions.length) {
      throw new AppError(`Expected ${quiz.questions.length} answers, got ${answers.length}`, 400);
    }

    let score = 0;
    const results = quiz.questions.map((q, i) => {
      const correct = q.correctIndex === answers[i];
      if (correct) score++;
      return {
        question: q.question,
        options: q.options,
        yourAnswer: answers[i],
        correctIndex: q.correctIndex,
        correct,
        explanation: q.explanation,
      };
    });

    const total = quiz.questions.length;
    const passed = score >= Math.ceil(total * 0.6);

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      lesson: quiz.lesson,
      answers,
      score,
      total,
      passed,
    });

    // Update user progress
    const progress = await getOrCreateProgress(req.user._id);
    const pointsEarned = score * 10 + (passed ? 20 : 0);
    progress.points += pointsEarned;

    if (passed && !progress.completedLessons.some(cl => cl.toString() === quiz.lesson.toString())) {
      progress.completedLessons.push(quiz.lesson);
    }

    updateStreak(progress);
    const newBadges = checkAndAwardBadges(progress);
    await progress.save();

    res.json({
      score,
      total,
      passed,
      pointsEarned,
      results,
      newBadges,
      progress: {
        points: progress.points,
        streak: progress.streak,
        badges: progress.badges,
        completedCount: progress.completedLessons.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── USER PROGRESS & LEADERBOARD ──

export async function getMyProgress(req, res, next) {
  try {
    const progress = await getOrCreateProgress(req.user._id);
    res.json({ progress });
  } catch (err) {
    next(err);
  }
}

export async function toggleLeaderboard(req, res, next) {
  try {
    const progress = await getOrCreateProgress(req.user._id);
    progress.optInLeaderboard = !progress.optInLeaderboard;
    if (!progress.alias) progress.alias = generateAlias();
    await progress.save();
    res.json({ optInLeaderboard: progress.optInLeaderboard, alias: progress.alias });
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const entries = await UserProgress.find({ optInLeaderboard: true })
      .sort({ points: -1 })
      .limit(50)
      .select('alias points streak badges completedLessons')
      .lean();

    const board = entries.map((e, i) => ({
      rank: i + 1,
      alias: e.alias,
      points: e.points,
      streak: e.streak,
      badgeCount: e.badges?.length || 0,
      lessonsCompleted: e.completedLessons?.length || 0,
    }));

    res.json({ leaderboard: board });
  } catch (err) {
    next(err);
  }
}

// ── DAILY TIP ──

export async function getDailyTip(req, res, next) {
  try {
    const count = await Tip.countDocuments({ published: true });
    if (count === 0) {
      return res.json({ tip: null });
    }
    // Rotate by day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % count;
    const tip = await Tip.findOne({ published: true }).skip(index).lean();
    res.json({ tip });
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: Lessons ──

export async function adminCreateLesson(req, res, next) {
  try {
    const lesson = await Lesson.create(req.validated);
    res.status(201).json({ message: 'Lesson created', lesson });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateLesson(req, res, next) {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.validated, { new: true, runValidators: true });
    if (!lesson) throw new AppError('Lesson not found', 404);
    res.json({ message: 'Lesson updated', lesson });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteLesson(req, res, next) {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) throw new AppError('Lesson not found', 404);
    await Quiz.deleteMany({ lesson: lesson._id });
    res.json({ message: 'Lesson and associated quizzes deleted' });
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: Quizzes ──

export async function adminCreateQuiz(req, res, next) {
  try {
    const quiz = await Quiz.create(req.validated);
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.validated, { new: true, runValidators: true });
    if (!quiz) throw new AppError('Quiz not found', 404);
    res.json({ message: 'Quiz updated', quiz });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: Tips ──

export async function adminGetTips(req, res, next) {
  try {
    const tips = await Tip.find().sort({ createdAt: -1 });
    res.json({ tips });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateTip(req, res, next) {
  try {
    const tip = await Tip.create(req.validated);
    res.status(201).json({ message: 'Tip created', tip });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateTip(req, res, next) {
  try {
    const tip = await Tip.findByIdAndUpdate(req.params.id, req.validated, { new: true, runValidators: true });
    if (!tip) throw new AppError('Tip not found', 404);
    res.json({ message: 'Tip updated', tip });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteTip(req, res, next) {
  try {
    const tip = await Tip.findByIdAndDelete(req.params.id);
    if (!tip) throw new AppError('Tip not found', 404);
    res.json({ message: 'Tip deleted' });
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: Get all lessons (including unpublished) ──

export async function adminGetLessons(req, res, next) {
  try {
    const lessons = await Lesson.find().sort({ order: 1 });
    res.json({ lessons });
  } catch (err) {
    next(err);
  }
}

export async function adminGetQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find().populate('lesson', 'title slug').sort({ createdAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
}
