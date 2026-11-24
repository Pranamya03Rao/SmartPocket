import React from 'react';
import { Target } from 'lucide-react';

export function GoalsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <Target className="h-12 w-12 text-indigo-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        TODO: Implement student savings goals cards with milestone badge visualizers (25%, 50%, 75%, 100%), required weekly/monthly savings calculator, and one-click savings deposit modal using <code className="text-indigo-600 dark:text-indigo-400">/api/goals</code>.
      </p>
    </div>
  );
}
