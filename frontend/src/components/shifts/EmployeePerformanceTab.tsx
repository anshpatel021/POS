import React, { useState, useEffect } from 'react';
import { shiftService } from '@/services/api';
import { EmployeePerformanceData } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { DatePresetsSelect } from '@/components/common/DatePresetsSelect';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

export const EmployeePerformanceTab: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<EmployeePerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadPerformanceData();
  }, [dateRange]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      const response = await shiftService.getEmployeePerformance(dateRange);
      setPerformanceData(response.data.data);
    } catch (error) {
      console.error('Failed to load employee performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading performance data...</p>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-12 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No performance data available</h3>
        <p className="text-muted-foreground">Try adjusting the date range</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range */}
      <Card>
        <CardContent className="p-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Date Range</span>
            </div>
            <DatePresetsSelect
              onSelect={(start, end) =>
                setDateRange({ startDate: start, endDate: end })
              }
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-auto text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-auto text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Employees</p>
            </div>
            <p className="text-2xl font-bold">{performanceData.summary?.totalEmployees || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </div>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(performanceData.summary?.totalSales || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <p className="text-2xl font-bold">{performanceData.summary?.totalTransactions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
            <p className="text-2xl font-bold">
              {(performanceData.summary?.totalHoursWorked || 0).toFixed(1)}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Metrics</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="text-right">Avg Order</TableHead>
              <TableHead className="text-right">Hours Worked</TableHead>
              <TableHead className="text-right">Sales/Hour</TableHead>
              <TableHead className="text-right">Cash Accuracy</TableHead>
              <TableHead className="text-right">Shifts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceData.performance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No employee performance data found
                </TableCell>
              </TableRow>
            ) : (
              performanceData.performance.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-1 rounded bg-muted">
                      {emp.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-success">
                    {formatCurrency(emp.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">{emp.totalTransactions}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(emp.averageOrderValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {emp.totalHoursWorked.toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(emp.salesPerHour)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        emp.cashAccuracy >= 99
                          ? 'text-success'
                          : emp.cashAccuracy >= 95
                          ? 'text-warning'
                          : 'text-destructive'
                      }`}
                    >
                      {emp.cashAccuracy.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{emp.shiftCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Additional Insights */}
      {performanceData.performance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers by Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.performance
                  .sort((a, b) => b.totalSales - a.totalSales)
                  .slice(0, 5)
                  .map((emp, index) => (
                    <div key={emp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.totalTransactions} transactions
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-success">{formatCurrency(emp.totalSales)}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers by Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.performance
                  .filter((emp) => emp.totalHoursWorked > 0)
                  .sort((a, b) => b.salesPerHour - a.salesPerHour)
                  .slice(0, 5)
                  .map((emp, index) => (
                    <div key={emp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center font-bold text-success">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.totalHoursWorked.toFixed(1)}h worked
                          </p>
                        </div>
                      </div>
                      <p className="font-bold">{formatCurrency(emp.salesPerHour)}/h</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
