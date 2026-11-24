import { Router } from 'express';
import {
  getLessons,
  getLessonById,
  getQuiz,
  submitQuiz,
  getMyProgress,
  toggleLeaderboard,
  getLeaderboard,
  getDailyTip,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminCreateQuiz,
  adminUpdateQuiz,
  adminDeleteQuiz,
  adminGetTips,
  adminCreateTip,
  adminUpdateTip,
  adminDeleteTip,
  adminGetLessons,
  adminGetQuizzes,
} from '../controllers/learnController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  submitQuizSchema,
  createLessonSchema,
  updateLessonSchema,
  createQuizSchema,
  updateQuizSchema,
  createTipSchema,
  updateTipSchema,
} from '../validations/schemas.js';

const router = Router();
router.use(authenticate);

// ── Student endpoints ──
router.get('/lessons', getLessons);
router.get('/lessons/:id', getLessonById);
router.get('/quiz/:quizId', getQuiz);
router.post('/quiz/:quizId/submit', verifyCsrf, validate(submitQuizSchema), submitQuiz);
router.get('/progress', getMyProgress);
router.post('/leaderboard/toggle', verifyCsrf, toggleLeaderboard);
router.get('/leaderboard', getLeaderboard);
router.get('/tip', getDailyTip);

// ── Admin endpoints ──
router.get('/admin/lessons', authorize('admin'), adminGetLessons);
router.post('/admin/lessons', authorize('admin'), verifyCsrf, validate(createLessonSchema), adminCreateLesson);
router.patch('/admin/lessons/:id', authorize('admin'), verifyCsrf, validate(updateLessonSchema), adminUpdateLesson);
router.delete('/admin/lessons/:id', authorize('admin'), verifyCsrf, adminDeleteLesson);

router.get('/admin/quizzes', authorize('admin'), adminGetQuizzes);
router.post('/admin/quizzes', authorize('admin'), verifyCsrf, validate(createQuizSchema), adminCreateQuiz);
router.patch('/admin/quizzes/:id', authorize('admin'), verifyCsrf, validate(updateQuizSchema), adminUpdateQuiz);
router.delete('/admin/quizzes/:id', authorize('admin'), verifyCsrf, adminDeleteQuiz);

router.get('/admin/tips', authorize('admin'), adminGetTips);
router.post('/admin/tips', authorize('admin'), verifyCsrf, validate(createTipSchema), adminCreateTip);
router.patch('/admin/tips/:id', authorize('admin'), verifyCsrf, validate(updateTipSchema), adminUpdateTip);
router.delete('/admin/tips/:id', authorize('admin'), verifyCsrf, adminDeleteTip);

export default router;
