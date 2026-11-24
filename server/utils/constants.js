export const CATEGORIES = [
  'food', 'transport', 'groceries', 'entertainment', 'education',
  'health', 'shopping', 'utilities', 'rent', 'subscriptions',
  'travel', 'personal', 'gifts', 'other',
];

export const PAYMENT_MODES = ['cash', 'upi', 'card', 'netbanking', 'wallet', 'other'];
export const TRANSACTION_TYPES = ['income', 'expense'];
export const BUDGET_PERIODS = ['weekly', 'monthly', 'semester'];
export const ROLES = ['student', 'worker', 'admin'];
export const SOURCES = ['manual', 'receipt', 'statement'];
export const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
export const NOTIFICATION_TYPES = ['recurring', 'budget_alert', 'goal_reminder', 'goal_milestone', 'system'];

/** Percentage-based budget templates tailored for working individuals and daily-wage earners */
export const BUDGET_TEMPLATES = {
  'daily-wage': {
    groceries: 45, rent: 20, health: 15, utilities: 10, other: 10,
  },
  vendor: {
    shopping: 40, groceries: 30, transport: 10, health: 10, other: 10,
  },
  'factory-worker': {
    groceries: 35, rent: 25, education: 15, health: 15, other: 10,
  },
  'domestic-help': {
    groceries: 40, rent: 25, health: 15, education: 10, other: 10,
  },
  // Legacy aliases for backward compatibility
  hostel: {
    groceries: 45, rent: 20, health: 15, utilities: 10, other: 10,
  },
  'day-scholar': {
    shopping: 40, groceries: 30, transport: 10, health: 10, other: 10,
  },
  pg: {
    groceries: 35, rent: 25, education: 15, health: 15, other: 10,
  },
};
