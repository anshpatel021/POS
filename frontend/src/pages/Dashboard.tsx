import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { reportService } from '@/services/api';
import { DashboardMetrics } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await reportService.getDashboard();
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Today's Sales",
      value: formatCurrency(metrics?.todaySales || 0),
      subtitle: `${metrics?.todayTransactions || 0} transactions`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Week Sales',
      value: formatCurrency(metrics?.weekSales || 0),
      subtitle: 'Last 7 days',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Month Sales',
      value: formatCurrency(metrics?.monthSales || 0),
      subtitle: 'Last 30 days',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(metrics?.averageOrderValue || 0),
      subtitle: 'Per transaction',
      icon: DollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  const secondaryStats = [
    {
      title: 'Total Customers',
      value: metrics?.totalCustomers || 0,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Active Employees',
      value: metrics?.activeEmployees || 0,
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      title: 'Low Stock Items',
      value: metrics?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigate('/pos')} className="p-4 border border-border rounded-md hover:bg-accent transition-colors text-left">
              <ShoppingCart className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">New Sale</p>
              <p className="text-xs text-muted-foreground">Start checkout</p>
            </button>
            <button onClick={() => navigate('/inventory')} className="p-4 border border-border rounded-md hover:bg-accent transition-colors text-left">
              <Package className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">Add Product</p>
              <p className="text-xs text-muted-foreground">Manage inventory</p>
            </button>
            <button onClick={() => navigate('/customers')} className="p-4 border border-border rounded-md hover:bg-accent transition-colors text-left">
              <Users className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">New Customer</p>
              <p className="text-xs text-muted-foreground">Add to directory</p>
            </button>
            <button onClick={() => navigate('/reports')} className="p-4 border border-border rounded-md hover:bg-accent transition-colors text-left">
              <TrendingUp className="h-6 w-6 mb-2 text-primary" />
              <p className="font-medium">View Reports</p>
              <p className="text-xs text-muted-foreground">See analytics</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
