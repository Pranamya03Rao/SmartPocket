import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  exportMyData,
  deleteAccount,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/schemas.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', authenticate, verifyCsrf, logoutAll);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, verifyCsrf, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, verifyCsrf, validate(changePasswordSchema), changePassword);
router.get('/export-my-data', authenticate, exportMyData);
router.delete('/account', authenticate, verifyCsrf, deleteAccount);

export default router;
