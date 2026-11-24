import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { BUDGET_TEMPLATES } from '../utils/constants.js';
import { AppError } from '../utils/AppError.js';

// 1. SET / CREATE / UPDATE BUDGET
export async function setBudget(req, res, next) {
  try {
    const { period, month, year, totalLimit, categoryLimits } = req.validated;
    const userId = req.user._id;

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const calculatedTotal = totalLimit > 0
      ? totalLimit
      : categoryLimits.reduce((sum, item) => sum + item.limit, 0);

    const budget = await Budget.findOneAndUpdate(
      { user: userId, period, month: targetMonth, year: targetYear },
      {
        user: userId,
        period,
        month: targetMonth,
        year: targetYear,
        totalLimit: calculatedTotal,
        categoryLimits,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Budget saved successfully', budget });
  } catch (err) {
    next(err);
  }
}

// 2. GET CURRENT BUDGET
export async function getCurrentBudget(req, res, next) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year,
    });

    if (!budget) {
      return res.json({ budget: null, message: 'No budget set for the current period' });
    }

    res.json({ budget });
  } catch (err) {
    next(err);
  }
}

// 3. GET TEMPLATES (Hostel, Day Scholar, PG)
export async function getTemplates(req, res) {
  const allowance = req.user.profile?.monthlyAllowance || 10000;

  const customizedTemplates = {};
  for (const [key, categoryPercents] of Object.entries(BUDGET_TEMPLATES)) {
    customizedTemplates[key] = {
      description: `Tailored for ${key.replace('-', ' ')} students`,
      categories: Object.entries(categoryPercents).map(([category, percent]) => ({
        category,
        percentage: percent,
        recommendedAmount: Math.round((percent / 100) * allowance),
      })),
    };
  }

  res.json({
    allowance,
    currency: req.user.profile?.currency || 'INR',
    templates: customizedTemplates,
  });
}

// 4. 50/30/20 RULE SUGGESTION
export async function get503020Suggestion(req, res) {
  const allowance = req.user.profile?.monthlyAllowance || 10000;

  const needs = Math.round(allowance * 0.5);
  const wants = Math.round(allowance * 0.3);
  const savings = Math.round(allowance * 0.2);

  res.json({
    totalIncome: allowance,
    rule: {
      needs: {
        percent: 50,
        amount: needs,
        categories: ['food', 'rent', 'utilities', 'groceries', 'transport', 'education', 'health'],
      },
      wants: {
        percent: 30,
        amount: wants,
        categories: ['entertainment', 'shopping', 'subscriptions', 'travel', 'personal', 'gifts'],
      },
      savings: {
        percent: 20,
        amount: savings,
        description: 'Emergency fund, student loan repayment, or future goals',
      },
    },
  });
}

// 5. BUDGET VS ACTUAL REPORT
export async function getBudgetVsActual(req, res, next) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year,
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Aggregate actual expenses for this user in this month
    const actualExpenses = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const actualMap = new Map();
    let grandActualTotal = 0;
    actualExpenses.forEach(item => {
      actualMap.set(item._id, item.totalSpent);
      grandActualTotal += item.totalSpent;
    });

    const categoryComparison = (budget?.categoryLimits || []).map(cat => {
      const spent = actualMap.get(cat.category) || 0;
      return {
        category: cat.category,
        budgetLimit: cat.limit,
        actualSpent: spent,
        remaining: Math.max(0, cat.limit - spent),
        percentUsed: cat.limit > 0 ? Math.round((spent / cat.limit) * 100) : 0,
        isOverBudget: spent > cat.limit,
      };
    });

    res.json({
      month,
      year,
      totalBudget: budget?.totalLimit || 0,
      totalSpent: grandActualTotal,
      remainingBudget: Math.max(0, (budget?.totalLimit || 0) - grandActualTotal),
      categories: categoryComparison,
    });
  } catch (err) {
    next(err);
  }
}
