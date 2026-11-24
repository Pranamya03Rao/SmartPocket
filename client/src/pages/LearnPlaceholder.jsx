import React from 'react';
import { BookOpen } from 'lucide-react';

export function LearnPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <BookOpen className="h-12 w-12 text-indigo-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Literacy & Modules</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        TODO: Build gamified interactive micro-lessons covering student banking, UPI safety, credit score fundamentals, compounding interest, and mutual funds vs fixed deposits.
      </p>
    </div>
  );
}
