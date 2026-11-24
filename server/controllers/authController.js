import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../services/emailService.js';
import { setCsrfToken } from '../middleware/csrf.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}

// 1. REGISTER
export async function register(req, res, next) {
  try {
    const { name, email, password, profile } = req.validated;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      passwordHash,
      emailVerifyToken: hashToken(verifyToken),
      emailVerifyExpires: verifyExpires,
      profile: profile || {},
    });

    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify your Smart Budget Account',
      text: `Hello ${name},\n\nPlease verify your email by clicking the link: ${verifyUrl}\nThis link expires in 24 hours.`,
      html: `<p>Hello ${name},</p><p>Please verify your email by <a href="${verifyUrl}">clicking here</a>.</p><p>Link expires in 24 hours.</p>`,
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user,
      devVerifyToken: env.NODE_ENV !== 'production' ? verifyToken : undefined,
    });
  } catch (err) {
    next(err);
  }
}

// 2. VERIFY EMAIL
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.validated;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerifyToken: tokenHash,
      emailVerifyExpires: { $gt: new Date() },
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: 'Email successfully verified. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// 3. LOGIN
export async function login(req, res, next) {
  try {
    const { email, password, otp } = req.validated;

    const user = await User.findOne({ email }).select(
      '+passwordHash +twoFactor.otpHash +twoFactor.otpExpires'
    );
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      throw new AppError(`Account is temporarily locked. Try again in ${waitMinutes} minute(s).`, 429);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        user.failedLoginCount = 0;
        await user.save();
        throw new AppError(`Account locked due to 5 consecutive failed attempts. Try again in 15 minutes.`, 429);
      }
      await user.save();
      throw new AppError('Invalid email or password', 401);
    }

    // Reset failed login counter on valid password
    user.failedLoginCount = 0;
    user.lockUntil = undefined;

    // Optional 2FA handling
    if (user.twoFactor?.enabled) {
      if (!otp) {
        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactor.otpHash = hashToken(rawOtp);
        user.twoFactor.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        await sendEmail({
          to: user.email,
          subject: 'Your 2FA Login Code',
          text: `Your security code is: ${rawOtp}. Valid for 5 minutes.`,
          html: `<h2>${rawOtp}</h2><p>Valid for 5 minutes.</p>`,
        });

        return res.json({
          requires2FA: true,
          message: 'Two-factor code sent to your email.',
          devOtp: env.NODE_ENV !== 'production' ? rawOtp : undefined,
        });
      }

      // Verify OTP
      const otpHash = hashToken(otp);
      if (
        user.twoFactor.otpHash !== otpHash ||
        !user.twoFactor.otpExpires ||
        user.twoFactor.otpExpires < new Date()
      ) {
        throw new AppError('Invalid or expired 2FA code', 401);
      }

      user.twoFactor.otpHash = undefined;
      user.twoFactor.otpExpires = undefined;
    }

    await user.save();

    // Create Refresh Token Family
    const rawRefreshToken = generateRefreshToken();
    const family = crypto.randomUUID();
    await RefreshToken.create({
      tokenHash: hashToken(rawRefreshToken),
      user: user._id,
      family,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    const accessToken = generateAccessToken(user);
    setRefreshCookie(res, rawRefreshToken);
    setCsrfToken(res);

    res.json({
      message: 'Login successful',
      accessToken,
      user,
    });
  } catch (err) {
    next(err);
  }
}

// 4. REFRESH TOKEN (Rotation + Reuse Detection)
export async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      throw new AppError('No refresh token provided', 401);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingToken = await RefreshToken.findOne({ tokenHash });

    if (!existingToken) {
      clearRefreshCookie(res);
      throw new AppError('Invalid refresh token', 401);
    }

    // Reuse detection: token already invalidated/replaced!
    if (existingToken.replacedBy) {
      console.warn(`[SECURITY] Refresh token reuse detected! Revoking family: ${existingToken.family}`);
      await RefreshToken.deleteMany({ family: existingToken.family });
      clearRefreshCookie(res);
      throw new AppError('Token reuse detected. All sessions revoked for security.', 403);
    }

    // Check expiry
    if (existingToken.expiresAt < new Date()) {
      clearRefreshCookie(res);
      throw new AppError('Refresh token expired', 401);
    }

    const user = await User.findById(existingToken.user);
    if (!user) {
      clearRefreshCookie(res);
      throw new AppError('User not found', 401);
    }

    // Rotate: Issue new refresh token in same family
    const nextRawRefreshToken = generateRefreshToken();
    const nextRefreshTokenDoc = await RefreshToken.create({
      tokenHash: hashToken(nextRawRefreshToken),
      user: user._id,
      family: existingToken.family,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    existingToken.replacedBy = nextRefreshTokenDoc._id;
    await existingToken.save();

    const accessToken = generateAccessToken(user);
    setRefreshCookie(res, nextRawRefreshToken);
    setCsrfToken(res);

    res.json({
      accessToken,
      user,
    });
  } catch (err) {
    next(err);
  }
}

// 5. LOGOUT
export async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.deleteOne({ tokenHash });
    }
    clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// 6. LOGOUT ALL SESSIONS
export async function logoutAll(req, res, next) {
  try {
    await RefreshToken.deleteMany({ user: req.user._id });
    clearRefreshCookie(res);
    res.json({ message: 'All sessions successfully revoked' });
  } catch (err) {
    next(err);
  }
}

// 7. FORGOT PASSWORD
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.validated;
    const user = await User.findOne({ email });

    // Always respond with success to prevent user enumeration
    if (user) {
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = hashToken(rawResetToken);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawResetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click the link to reset: ${resetUrl}\nLink expires in 1 hour.`,
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>Expires in 1 hour.</p>`,
      });
    }

    res.json({ message: 'If that email exists, password reset instructions have been sent.' });
  } catch (err) {
    next(err);
  }
}

// 8. RESET PASSWORD
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.validated;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginCount = 0;
    user.lockUntil = undefined;
    await user.save();

    // Revoke all existing sessions for security
    await RefreshToken.deleteMany({ user: user._id });
    clearRefreshCookie(res);

    res.json({ message: 'Password successfully reset. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// 9. ME (Current User Profile)
export async function getMe(req, res) {
  setCsrfToken(res);
  res.json({ user: req.user });
}

// 10. UPDATE PROFILE
export async function updateProfile(req, res, next) {
  try {
    const updates = req.validated;
    const user = req.user;

    if (updates.name) user.name = updates.name;
    if (updates.occupation !== undefined) user.profile.occupation = updates.occupation;
    if (updates.incomeType !== undefined) user.profile.incomeType = updates.incomeType;
    if (updates.dailyWage !== undefined) user.profile.dailyWage = updates.dailyWage;
    if (updates.monthlyIncome !== undefined) {
      user.profile.monthlyIncome = updates.monthlyIncome;
      user.profile.monthlyAllowance = updates.monthlyIncome;
    }
    if (updates.course !== undefined) user.profile.course = updates.course;
    if (updates.year !== undefined) user.profile.year = updates.year;
    if (updates.monthlyAllowance !== undefined) user.profile.monthlyAllowance = updates.monthlyAllowance;
    if (updates.currency !== undefined) user.profile.currency = updates.currency;
    if (updates.language !== undefined) user.profile.language = updates.language;
    if (updates.twoFactorEnabled !== undefined) user.twoFactor.enabled = updates.twoFactorEnabled;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
  }
}

// 11. CHANGE PASSWORD
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validated;
    const user = await User.findById(req.user._id).select('+passwordHash');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

// 12. EXPORT MY DATA (GDPR / Data Portability)
export async function exportMyData(req, res, next) {
  try {
    const userId = req.user._id;

    const [transactions, budgets, goals, notifications] = await Promise.all([
      Transaction.find({ user: userId }).lean(),
      Budget.find({ user: userId }).lean(),
      Goal.find({ user: userId }).lean(),
      Notification.find({ user: userId }).lean(),
    ]);

    res.setHeader('Content-Disposition', 'attachment; filename="smart-budget-data.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      exportedAt: new Date().toISOString(),
      user: req.user,
      transactions,
      budgets,
      goals,
      notifications,
    });
  } catch (err) {
    next(err);
  }
}

// 13. DELETE ACCOUNT
export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user._id;

    await Promise.all([
      Transaction.deleteMany({ user: userId }),
      Budget.deleteMany({ user: userId }),
      Goal.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
      RefreshToken.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    clearRefreshCookie(res);
    res.json({ message: 'Account and associated data deleted permanently' });
  } catch (err) {
    next(err);
  }
}
