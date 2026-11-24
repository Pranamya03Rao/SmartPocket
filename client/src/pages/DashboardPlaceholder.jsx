import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export function DashboardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <LayoutDashboard className="h-12 w-12 text-indigo-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        TODO: Implement interactive charts (Recharts category split, 6-month trends), month-over-month insight cards, moving average forecast, and financial health score widget using <code className="text-indigo-600 dark:text-indigo-400">/api/analytics</code>.
      </p>
    </div>
  );
}
