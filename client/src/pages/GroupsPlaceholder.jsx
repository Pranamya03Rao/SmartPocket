import React from 'react';
import { Users } from 'lucide-react';

export function GroupsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
      <Users className="h-12 w-12 text-indigo-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Group Expenses & Split</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        TODO: Build student group expense sharing, roommate bill splitting (Hostel/PG rent & groceries), and debt settlement calculations.
      </p>
    </div>
  );
}
