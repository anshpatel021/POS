import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Customers } from './pages/Customers';
import { Shifts } from './pages/Shifts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Suppliers } from './pages/Suppliers';
import { Analytics } from './pages/Analytics';
import { Financial } from './pages/Financial';
import { Layaway } from './pages/Layaway';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StoreManagement } from './pages/admin/StoreManagement';
import { UserManagement } from './pages/admin/UserManagement';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';

/**
 * Protected Route Component
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Smart Redirect Component - redirects based on user role
 */
const SmartRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect SUPER_ADMIN to admin panel, others to dashboard
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

/**
 * Role-Based Route Component
 */
const RoleRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[]
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-destructive mb-4">403</h1>
          <p className="text-xl text-muted-foreground mb-4">Access Denied</p>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Main App Component
 */
function App() {
  const { loadUser, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // Load user once on mount
  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme on mount and when it changes
  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <SmartRedirect /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Layout>
                  <Inventory />
                </Layout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <Layout>
                <Shifts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Layout>
                  <Reports />
                </Layout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Layout>
                  <Settings />
                </Layout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Layout>
                  <Suppliers />
                </Layout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Layout>
                  <Analytics />
                </Layout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Layout>
                  <Financial />
                </Layout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/layaway"
          element={
            <ProtectedRoute>
              <Layout>
                <Layaway />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin routes - Super Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <StoreManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect root based on user role */}
        <Route path="/" element={<SmartRedirect />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
                <p className="text-xl text-muted-foreground">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
