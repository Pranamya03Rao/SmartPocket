import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  GraduationCap,
  Shield,
  User,
  BookOpen,
  Briefcase,
  IndianRupee,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t, isKn } = useLanguage();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/transactions', label: t('nav.transactions'), icon: Receipt },
    { to: '/budgets', label: t('nav.budgets'), icon: PieChart },
    { to: '/goals', label: t('nav.goals'), icon: Target },
    { to: '/learn', label: t('nav.learn'), icon: GraduationCap },
    { to: '/guide', label: t('nav.guide'), icon: BookOpen },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white pt-16 transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}

            {user?.role === 'admin' && (
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('nav.admin')}
                </p>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `mt-1.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Shield className="h-5 w-5 text-purple-500" />
                  {t('nav.admin')}
                </NavLink>
              </div>
            )}
          </nav>

          {/* Worker Status Card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50/50 p-4 border border-indigo-100 dark:from-slate-800/80 dark:to-slate-850 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                {isKn ? 'ಕಾರ್ಮಿಕರ ವಿವರ' : 'Worker Profile'}
              </p>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {user?.profile?.occupation || user?.profile?.course || (isKn ? 'ದಿನಗೂಲಿ / ಕಾರ್ಮಿಕ' : 'Working Individual')}
            </p>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-indigo-100/80 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">{isKn ? 'ಆದಾಯ' : 'Income'}:</span>
              <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                ₹{user?.profile?.monthlyAllowance?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
