import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../api/client.js';
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Bell,
  Menu,
  Check,
  CheckCheck,
  X,
  Wifi,
  WifiOff,
  Languages,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket, isConnected } = useSocket();
  const { language, setLanguage, toggleLanguage, t, isKn } = useLanguage();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silently ignore notification fetch errors
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Real-time WebSocket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isKn ? 'ಈಗಷ್ಟೇ' : 'just now';
    if (mins < 60) return isKn ? `${mins} ನಿಮಿಷ ಹಿಂದೆ` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isKn ? `${hrs} ಗಂಟೆ ಹಿಂದೆ` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isKn ? `${days} ದಿನ ಹಿಂದೆ` : `${days}d ago`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-extrabold text-xl shadow-sm">
            ₹
          </span>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {isKn ? 'ಸ್ಮಾರ್ಟ್ ಪಾಕೆಟ್' : 'Smart Pocket'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline -mt-0.5">
              {isKn ? 'ಕಾರ್ಮಿಕರ ಆಯ-ವ್ಯಯ ಲೆಕ್ಕ' : 'Worker Budget & Ledger'}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Language Switcher - Prominent and Accessible */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              isKn
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            title="ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ"
          >
            <span>ಕನ್ನಡ</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg transition-all ${
              !isKn
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            title="Switch to English"
          >
            <span>ENG</span>
          </button>
        </div>

        {/* User Guide Shortcut */}
        <Link
          to="/guide"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          title={isKn ? 'ಬಳಕೆ ಹೇಗೆ? (ಕೈಪಿಡಿ)' : 'How to Use This Application'}
        >
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{isKn ? 'ಬಳಕೆ ಹೇಗೆ?' : 'Guide'}</span>
        </Link>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Bell */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isKn ? 'ಸೂಚನೆಗಳು' : 'Notifications'}
                    {unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                        {unreadCount} {isKn ? 'ಓದಿಲ್ಲ' : 'unread'}
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      title={isKn ? 'ಎಲ್ಲ ಓದಿದ ಎಂದು ಗುರುತಿಸಿ' : 'Mark all as read'}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {isKn ? 'ಎಲ್ಲ ಓದಿದೆ' : 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                      <Bell className="h-8 w-8 mb-2 opacity-40" />
                      {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಸೂಚನೆ ಬಂದಿಲ್ಲ' : 'No notifications yet'}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-b-0 transition dark:border-slate-800/50 ${
                          n.read
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-indigo-50/50 dark:bg-indigo-950/20'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${n.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 font-medium dark:text-white'}`}>
                            {n.message}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n._id)}
                            className="mt-1 shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-800 sm:gap-4 sm:pl-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-200"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold dark:bg-indigo-900/50 dark:text-indigo-300">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline">{user.name}</span>
            </Link>

            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30"
              title={isKn ? 'ಹೊರಹೋಗಿ' : 'Logout'}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
