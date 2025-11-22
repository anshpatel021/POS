import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Truck,
  TrendingUp,
  DollarSign,
  CreditCard,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import { OfflineIndicator } from './common/OfflineIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Layaway', href: '/layaway', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Shifts', href: '/shifts', icon: Clock, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Financial', href: '/financial', icon: DollarSign, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Admin Panel', href: '/admin', icon: Shield, roles: ['SUPER_ADMIN'] },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter navigation based on user role
  const allowedNavigation = navigation.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">POS System</h1>
          <OfflineIndicator variant="badge" showDetails />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNavigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
