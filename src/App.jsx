import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import Login    from './pages/Login';
import Register from './pages/Register';

import AdminDashboard    from './pages/AdminDashboard';
import StudentDashboard  from './pages/StudentDashboard';
import Catalog           from './pages/Catalog';
import Borrowers         from './pages/Borrowers';
import MyBooks           from './pages/MyBooks';
import StudentTransactions from './pages/StudentTransactions';
import AdminTransactions   from './pages/AdminTransactions';
import BookDetails         from './pages/BookDetails';
import Analytics           from './pages/Analytics';

// ── Protected route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/main/dashboard" replace />;
  }

  return children;
}

// ── Main app layout (authenticated) ──────────────────────────────────────────
function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="app-layout-root-container">
      <Sidebar role={user.role} />

      <div className="main-content-window-frame">
        <header className="view-app-header">
          <div className="header-meta-branding">
            <Sparkles size={15} className="sparkle-icon-accent" />
            <span>Intelligent Library Management</span>
          </div>
          <div className="header-profile-badge">
            <div className={`avatar-circle-initials ${user.role === 'admin' ? 'bg-admin-accent' : ''}`}>
              <span>
                {user.name
                  ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  : user.role === 'admin' ? 'AD' : 'ST'}
              </span>
            </div>
            <div className="profile-text-labels">
              <p className="profile-username">{user.name}</p>
              <p className="profile-role-tag capitalize-fallback">{user.role}</p>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/main/dashboard" replace />} />

          <Route
            path="/main/dashboard"
            element={user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
          />

          <Route path="/main/catalog"         element={<Catalog />} />
          <Route path="/main/catalog/:bookId" element={<BookDetails />} />
          <Route path="/book/:bookId"         element={<BookDetails />} />

          <Route
            path="/main/borrowers"
            element={
              <ProtectedRoute requiredRole="admin">
                <Borrowers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/main/my-books"
            element={
              <ProtectedRoute requiredRole="student">
                <MyBooks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/main/transactions"
            element={user.role === 'admin' ? <AdminTransactions /> : <StudentTransactions />}
          />

          <Route
            path="/main/analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/main/dashboard" replace />} />
        </Routes>
      </div>

      {/* Floating chat widget — available on all authenticated pages */}
      <ChatWidget />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/main/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/main/dashboard" replace /> : <Register />}
      />
      <Route
        path="/*"
        element={
          user ? <AppLayout /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
