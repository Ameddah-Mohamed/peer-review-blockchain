import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/common/AppLayout';
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
          <Routes>
            <Route path="/" element={<RootRedirector />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Shell with Sidebar Layout */}
            <Route element={<AppLayout />}>
              <Route
                path="/author"
                element={
                  <ProtectedRoute allowedRoles={['author', 'admin']}>
                    <AuthorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviewer"
                element={
                  <ProtectedRoute allowedRoles={['reviewer', 'admin']}>
                    <ReviewerDashboard />
                  </ProtectedRoute>
                }
              />
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
              <Route path="/verify" element={<VerifyPaperPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
