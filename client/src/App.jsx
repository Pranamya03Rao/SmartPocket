import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { ProtectedRoute } from './components/routing/ProtectedRoute.jsx';
import { AdminRoute } from './components/routing/AdminRoute.jsx';

import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { VerifyEmail } from './pages/VerifyEmail.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';
import { ResetPassword } from './pages/ResetPassword.jsx';
import { Profile } from './pages/Profile.jsx';
import { Transactions } from './pages/Transactions.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Budgets } from './pages/Budgets.jsx';
import { Goals } from './pages/Goals.jsx';
import { Learn } from './pages/Learn.jsx';
import { LessonDetail } from './pages/LessonDetail.jsx';
import { QuizView } from './pages/QuizView.jsx';
import { Calculators } from './pages/Calculators.jsx';
import { ScamAwareness } from './pages/ScamAwareness.jsx';
import { Admin } from './pages/Admin.jsx';
import { UserGuide } from './pages/UserGuide.jsx';

const PageLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Routes>
                {/* Public Auth Routes & Help Guide */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/public-guide" element={<UserGuide />} />

                {/* Protected Worker Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/learn" element={<Learn />} />
                    <Route path="/learn/:lessonId" element={<LessonDetail />} />
                    <Route path="/learn/:lessonId/quiz" element={<QuizView />} />
                    <Route path="/calculators" element={<Calculators />} />
                    <Route path="/scam-awareness" element={<ScamAwareness />} />
                    <Route path="/guide" element={<UserGuide />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Admin Only Route */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<Admin />} />
                    </Route>
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
