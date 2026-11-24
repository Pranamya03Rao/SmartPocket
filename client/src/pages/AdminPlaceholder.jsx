
import React from 'react';
import { Shield } from 'lucide-react';

export function AdminPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-purple-300 bg-white p-12 text-center dark:border-purple-900/50 dark:bg-slate-900">
      <Shield className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Control Center</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        TODO: Build administrative metrics, user role management, system health oversight, audit logs, and global rate-limit configurations.
      </p>
    </div>
  );
}
