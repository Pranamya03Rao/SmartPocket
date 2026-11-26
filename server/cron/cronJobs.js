import cron from 'node-cron';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { sendPushToUser } from '../services/pushService.js';
import { generateFingerprint } from '../utils/fingerprint.js';

export function getNextRecurringDate(date, frequency) {
  const next = new Date(date);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function processRecurringAndAlerts() {
  const now = new Date();

  // 1. Process Due Recurring Transactions
  try {
    const dueRecurring = await Transaction.find({
      'recurring.frequency': { $exists: true, $ne: null },
      'recurring.nextDate': { $lte: now },
    });

    for (const tx of dueRecurring) {
      const nextDate = getNextRecurringDate(tx.recurring.nextDate, tx.recurring.frequency);

      // Create new transaction instance
      const fp = generateFingerprint(tx.user, now, tx.amount, tx.merchant);
      await Transaction.create({
        user: tx.user,
        date: now,
        merchant: tx.merchant,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        paymentMode: tx.paymentMode,
        notes: tx.notes,
        source: 'manual',
        fingerprint: fp,
      }).catch(() => null); // Ignore if duplicate already exists

      // Update parent recurring nextDate
      tx.recurring.nextDate = nextDate;
      await tx.save();

      // Create Notification
      await Notification.create({
        user: tx.user,
        type: 'recurring',
        message: `Recurring ${tx.type} recorded: ₹${tx.amount} for ${tx.merchant}.`,
      });
      sendPushToUser(tx.user, {
        title: 'Recurring Transaction',
        body: `Recurring ${tx.type} recorded: ₹${tx.amount} for ${tx.merchant}.`,
        url: '/transactions',
        tag: 'recurring-tx',
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Error processing recurring transactions:', err.message);
  }

  // 2. Goal Due Reminders (due in next 3 days)
  try {
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const pendingGoals = await Goal.find({
      deadline: { $gte: now, $lte: threeDaysLater },
    });

    for (const goal of pendingGoals) {
      if (goal.saved < goal.target) {
        const daysLeft = Math.max(1, Math.ceil((goal.deadline - now) / (24 * 60 * 60 * 1000)));
        await Notification.create({
          user: goal.user,
          type: 'goal_reminder',
          message: `⏰ Reminder: Goal "${goal.name}" deadline is in ${daysLeft} day(s)! You have ₹${goal.target - goal.saved} left to save.`,
        });
        sendPushToUser(goal.user, {
          title: 'Goal Deadline Reminder',
          body: `⏰ Reminder: Goal "${goal.name}" deadline is in ${daysLeft} day(s)!`,
          url: '/goals',
          tag: `goal-due-${goal._id}`,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error checking goal deadlines:', err.message);
  }

  // 3. Monthly Budget Alerts (exceeded 90%)
  try {
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgets = await Budget.find({ month: currentMonth, year: currentYear });
    for (const b of budgets) {
      if (!b.totalLimit || b.totalLimit <= 0) continue;

      const spentAgg = await Transaction.aggregate([
        {
          $match: {
            user: b.user,
            type: 'expense',
            date: {
              $gte: new Date(currentYear, currentMonth - 1, 1),
              $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const spent = spentAgg[0]?.total || 0;
      if (spent >= b.totalLimit * 0.9) {
        await Notification.create({
          user: b.user,
          type: 'budget_alert',
          message: `⚠️ Budget Alert: You have used ${Math.round((spent / b.totalLimit) * 100)}% of your monthly budget (₹${spent}/₹${b.totalLimit}).`,
        });
        sendPushToUser(b.user, {
          title: 'Budget Alert',
          body: `⚠️ Budget Alert: You have used ${Math.round((spent / b.totalLimit) * 100)}% of your monthly budget.`,
          url: '/budgets',
          tag: 'budget-alert',
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error checking budget alerts:', err.message);
  }
}

export function initCronJobs() {
  // Run every midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily recurring transactions and alerts check...');
    await processRecurringAndAlerts();
  });
}
