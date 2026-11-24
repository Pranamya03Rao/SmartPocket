import { z } from 'zod';
import { CATEGORIES, PAYMENT_MODES, TRANSACTION_TYPES, BUDGET_PERIODS, FREQUENCIES } from '../utils/constants.js';

// --- AUTH SCHEMAS ---
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  profile: z
    .object({
      occupation: z.string().max(100).optional(),
      incomeType: z.enum(['daily', 'weekly', 'monthly']).optional(),
      dailyWage: z.number().min(0).optional(),
      monthlyIncome: z.number().min(0).optional(),
      course: z.string().max(100).optional(),
      year: z.number().min(1).max(6).optional(),
      monthlyAllowance: z.number().min(0).optional(),
      currency: z.string().max(3).optional(),
      language: z.string().max(5).optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  otp: z.string().length(6).optional(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  occupation: z.string().max(100).optional(),
  incomeType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  dailyWage: z.number().min(0).optional(),
  monthlyIncome: z.number().min(0).optional(),
  course: z.string().max(100).optional(),
  year: z.number().min(1).max(6).optional(),
  monthlyAllowance: z.number().min(0).optional(),
  currency: z.string().max(3).optional(),
  language: z.string().max(5).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

// --- TRANSACTION SCHEMAS ---
export const createTransactionSchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  merchant: z.string().min(1, 'Merchant name is required').max(200).trim(),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(TRANSACTION_TYPES),
  category: z.enum(CATEGORIES),
  paymentMode: z.enum(PAYMENT_MODES).default('other'),
  notes: z.string().max(1000).optional().default(''),
  recurring: z
    .object({
      frequency: z.enum(FREQUENCIES),
      nextDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    })
    .optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'merchant', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// --- BUDGET SCHEMAS ---
export const createBudgetSchema = z.object({
  period: z.enum(BUDGET_PERIODS),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
  totalLimit: z.number().min(0).default(0),
  categoryLimits: z
    .array(
      z.object({
        category: z.enum(CATEGORIES),
        limit: z.number().min(0),
      })
    )
    .min(1, 'At least one category limit must be set'),
});

// --- GOAL SCHEMAS ---
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(200).trim(),
  target: z.number().positive('Target must be positive'),
  saved: z.number().min(0).default(0),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateGoalSchema = createGoalSchema.partial();

export const addSavingsSchema = z.object({
  amount: z.number().positive('Savings amount must be positive'),
});

// --- UPLOAD PIPELINE SCHEMAS ---
export const confirmedRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  merchant: z.string().min(1).max(200).trim(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(CATEGORIES),
  paymentMode: z.enum(PAYMENT_MODES).default('other'),
  notes: z.string().max(1000).optional().default(''),
  selected: z.boolean().default(true),
});

export const confirmUploadSchema = z.object({
  transactions: z.array(confirmedRowSchema).min(1).max(500, 'Maximum 500 rows allowed per batch'),
  source: z.enum(['receipt', 'statement']).default('receipt'),
});

// --- LEARN / LESSON SCHEMAS ---
export const createLessonSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(200).trim().toLowerCase(),
  content: z.string().min(1).max(5000),
  order: z.number().int().min(0).default(0),
  category: z.string().max(100).default('general'),
  published: z.boolean().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();

const questionItemSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().max(1000).default(''),
});

export const createQuizSchema = z.object({
  lesson: z.string().min(1), // ObjectId string
  title: z.string().min(1).max(200).trim(),
  questions: z.array(questionItemSchema).min(1),
  published: z.boolean().default(true),
});

export const updateQuizSchema = createQuizSchema.partial();

export const submitQuizSchema = z.object({
  answers: z.array(z.number().int().min(0)).min(1),
});

export const createTipSchema = z.object({
  text: z.string().min(1).max(500),
  category: z.string().max(100).default('general'),
  published: z.boolean().default(true),
});

export const updateTipSchema = createTipSchema.partial();

// --- GROUP EXPENSE SCHEMAS ---
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(200).trim(),
  description: z.string().max(500).default(''),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const createGroupExpenseSchema = z.object({
  description: z.string().min(1).max(300).trim(),
  amount: z.number().positive('Amount must be positive'),
  splitType: z.enum(['equal', 'percent', 'custom']),
  shares: z.array(z.object({
    user: z.string().min(1),
    value: z.number().min(0),
  })).optional(),
});

export const settleSchema = z.object({
  to: z.string().min(1), // userId to settle with
  amount: z.number().positive(),
});

// --- ADMIN SCHEMAS ---
export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(2000),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  published: z.boolean().default(true),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

