import React from 'react';
import { PieChart } from 'lucide-react';

export function BudgetsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <PieChart className="h-12 w-12 text-indigo-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        TODO: Implement student budget builder with template pickers (Hostel, Day Scholar, PG), 50/30/20 breakdown cards, and visual progress bars showing budget vs actual spending via <code className="text-indigo-600 dark:text-indigo-400">/api/budgets</code>.
      </p>
    </div>
  );
}
