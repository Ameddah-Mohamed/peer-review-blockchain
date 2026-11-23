import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AuthorDashboard } from './pages/author/AuthorDashboard';
import { ReviewerDashboard } from './pages/reviewer/ReviewerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { VerifyPaperPage } from './pages/verify/VerifyPaperPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Root redirector based on authenticated user's role
const RootRedirector: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'author') return <Navigate to="/author" replace />;
  if (user.role === 'reviewer') return <Navigate to="/reviewer" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  return <Navigate to="/verify" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<RootRedirector />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Author Portal */}
                <Route
                  path="/author"
                  element={
                    <ProtectedRoute allowedRoles={['author', 'admin']}>
                      <AuthorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Reviewer Committee Portal */}
                <Route
                  path="/reviewer"
                  element={
                    <ProtectedRoute allowedRoles={['reviewer', 'admin']}>
                      <ReviewerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Governance Portal */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/submissions"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSubmissionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAuditPage />
                    </ProtectedRoute>
                  }
                />

                {/* Public Verification */}
                <Route path="/verify" element={<VerifyPaperPage />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">AcademicLedger</span>
                  <span>•</span>
                  <span>Blockchain Peer-Review & Integrity Tracking System</span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  SHA-256 Fingerprints • Smart Contract Non-Repudiation • Double-Blind
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
