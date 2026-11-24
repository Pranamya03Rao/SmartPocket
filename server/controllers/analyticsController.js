import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';

// 1. SUMMARY
export async function getSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const aggregates = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let income = 0;
    let expense = 0;
    for (const item of aggregates) {
      if (item._id === 'income') income = item.total;
      if (item._id === 'expense') expense = item.total;
    }

    const netSavings = income - expense;
    const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

    res.json({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      income,
      expense,
      netSavings,
      savingsRate,
    });
  } catch (err) {
    next(err);
  }
}

// 2. CATEGORY SPLIT
export async function getCategorySplit(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = breakdown.reduce((sum, item) => sum + item.total, 0);

    const result = breakdown.map(item => ({
      category: item._id,
      amount: item.total,
      percentage: totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
      count: item.count,
    }));

    res.json({ totalExpense, categories: result });
  } catch (err) {
    next(err);
  }
}

// 3. MONTHLY TREND (Last 6 months)
export async function getMonthlyTrend(req, res, next) {
  try {
    const userId = req.user._id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trends = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const trendMap = {};
    trends.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!trendMap[key]) {
        trendMap[key] = { month: key, income: 0, expense: 0 };
      }
      trendMap[key][item._id.type] = item.total;
    });

    res.json({ trends: Object.values(trendMap) });
  } catch (err) {
    next(err);
  }
}

// 4. MONTH-OVER-MONTH INSIGHT TEXT
export async function getInsights(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [currentMonthData, lastMonthData] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: currentMonthStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);

    const lastMap = new Map(lastMonthData.map(i => [i._id, i.total]));
    const currentMap = new Map(currentMonthData.map(i => [i._id, i.total]));

    const insights = [];

    const currentTotal = currentMonthData.reduce((s, i) => s + i.total, 0);
    const lastTotal = lastMonthData.reduce((s, i) => s + i.total, 0);

    if (lastTotal > 0) {
      const diffPercent = Math.round(((currentTotal - lastTotal) / lastTotal) * 100);
      if (diffPercent < 0) {
        insights.push(`Overall, you've spent ${Math.abs(diffPercent)}% less compared to this time last month!`);
      } else if (diffPercent > 0) {
        insights.push(`Your spending is up by ${diffPercent}% compared to last month.`);
      }
    }

    currentMap.forEach((currAmount, cat) => {
      const prev = lastMap.get(cat) || 0;
      if (prev > 0) {
        const change = Math.round(((currAmount - prev) / prev) * 100);
        if (change >= 25) {
          insights.push(`⚠️ ${cat.toUpperCase()} spending increased by ${change}% over last month.`);
        } else if (change <= -20) {
          insights.push(`🎉 Great job! You saved ${Math.abs(change)}% on ${cat} compared to last month.`);
        }
      }
    });

    if (insights.length === 0) {
      insights.push('Add more transactions across multiple months to unlock rich comparative insights!');
    }

    res.json({ insights });
  } catch (err) {
    next(err);
  }
}

// 5. MOVING AVERAGE FORECAST
export async function getForecast(req, res, next) {
  try {
    const userId = req.user._id;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const history = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: threeMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const count = history.length || 1;
    const sum = history.reduce((acc, h) => acc + h.total, 0);
    const movingAverage = Math.round(sum / count);

    res.json({
      historicalMonthsAnalyzed: count,
      forecastNextMonthExpense: movingAverage,
      confidence: count >= 3 ? 'high' : 'low (limited historical data)',
    });
  } catch (err) {
    next(err);
  }
}

// 6. FINANCIAL HEALTH SCORE (0-100)
export async function getFinancialHealthScore(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [txns, budget, goals] = await Promise.all([
      Transaction.find({ user: userId, date: { $gte: startOfMonth } }),
      Budget.findOne({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Goal.find({ user: userId }),
    ]);

    let score = 50; // base score

    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // 1. Savings Ratio (+/- 20 pts)
    if (income > 0) {
      const savingsRate = (income - expense) / income;
      if (savingsRate >= 0.2) score += 20;
      else if (savingsRate >= 0.1) score += 10;
      else if (savingsRate < 0) score -= 15;
    }

    // 2. Budget adherence (+/- 15 pts)
    if (budget && budget.totalLimit > 0) {
      if (expense <= budget.totalLimit) score += 15;
      else score -= 15;
    }

    // 3. Active Goal Setting (+15 pts)
    if (goals.length > 0) {
      score += 10;
      const onTrack = goals.some(g => (g.saved / g.target) >= 0.5);
      if (onTrack) score += 5;
    }

    score = Math.max(0, Math.min(100, score));

    let tier = 'Needs Attention';
    if (score >= 80) tier = 'Excellent';
    else if (score >= 65) tier = 'Good';
    else if (score >= 50) tier = 'Fair';

    res.json({ score, tier });
  } catch (err) {
    next(err);
  }
}

// 7. WHAT-IF SIMULATOR
export async function simulateWhatIf(req, res, next) {
  try {
    const { reduceCategory, percentReduction = 20, extraMonthlySavings = 1000 } = req.query;
    const userId = req.user._id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const targetCategory = reduceCategory || 'food';
    const reductionFactor = Number(percentReduction) / 100;

    const currentSpentDoc = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          category: targetCategory,
          date: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const currentSpent = currentSpentDoc[0]?.total || 3000;
    const simulatedMonthlySaved = Math.round(currentSpent * reductionFactor);
    const simulatedAnnualSaved = (simulatedMonthlySaved * 12) + (Number(extraMonthlySavings) * 12);

    res.json({
      scenario: `Reducing ${targetCategory} spending by ${percentReduction}% plus an extra ${extraMonthlySavings}/mo saved`,
      estimatedMonthlySaved: simulatedMonthlySaved,
      estimatedAnnualSavings: simulatedAnnualSaved,
      studentImpact: `With this simulation, you could build an emergency fund of ₹${simulatedAnnualSaved} in 12 months!`,
    });
  } catch (err) {
    next(err);
  }
}
