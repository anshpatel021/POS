import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterSection } from '@/components/common/FilterSection';
import { DatePresetsSelect } from '@/components/common/DatePresetsSelect';

interface SalesFiltersProps {
  filters: {
    paymentMethod: string[];
    status: string[];
    employeeId: string[];
    customerId: string;
    startDate: string;
    endDate: string;
    minAmount: string;
    maxAmount: string;
    showCharts: boolean;
  };
  onFilterChange: (filters: any) => void;
  onClear: () => void;
  employees?: Array<{ id: string; firstName: string; lastName: string }>;
  onShowChartsChange?: (value: boolean) => void;
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'GIFT_CARD', 'STORE_CREDIT', 'OTHER'];
const SALE_STATUSES = ['COMPLETED', 'PENDING', 'REFUNDED', 'VOIDED', 'HOLD'];

export const SalesFilters: React.FC<SalesFiltersProps> = ({
  filters,
  onFilterChange,
  onClear,
  employees = [],
}) => {
  const handlePaymentMethodToggle = (method: string) => {
    const newMethods = filters.paymentMethod.includes(method)
      ? filters.paymentMethod.filter((m) => m !== method)
      : [...filters.paymentMethod, method];
    onFilterChange({ ...filters, paymentMethod: newMethods });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFilterChange({ ...filters, status: newStatuses });
  };

  const handleEmployeeToggle = (employeeId: string) => {
    const newEmployees = filters.employeeId.includes(employeeId)
      ? filters.employeeId.filter((id) => id !== employeeId)
      : [...filters.employeeId, employeeId];
    onFilterChange({ ...filters, employeeId: newEmployees });
  };

  const hasActiveFilters =
    filters.paymentMethod.length > 0 ||
    filters.status.length > 0 ||
    filters.employeeId.length > 0 ||
    filters.customerId ||
    filters.minAmount ||
    filters.maxAmount;

  const getDateSummary = () => {
    if (!filters.startDate && !filters.endDate) return '';
    if (filters.startDate === filters.endDate) return filters.startDate;
    return `${filters.startDate || '...'} to ${filters.endDate || '...'}`;
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="font-medium text-sm">Filters</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="h-3 w-3 mr-1" />
            <span className="text-xs">Clear All</span>
          </Button>
        )}
      </div>

      {/* Single Column Filter Layout with Vertical Scroll */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {/* Date Range Section */}
        <FilterSection
          title="Date Range"
          summary={getDateSummary()}
          defaultOpen={false}
        >
          <div className="space-y-1.5">
            <label className="block text-xs text-muted-foreground">Quick Select</label>
            <DatePresetsSelect
              onSelect={(start, end) =>
                onFilterChange({ ...filters, startDate: start, endDate: end })
              }
            />
            <div className="space-y-1.5 pt-1">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  onFilterChange({ ...filters, startDate: e.target.value })
                }
                placeholder="Start date"
                className="text-xs"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  onFilterChange({ ...filters, endDate: e.target.value })
                }
                placeholder="End date"
                className="text-xs"
              />
            </div>
          </div>
        </FilterSection>

        {/* Amount Range Section */}
        <FilterSection
          title="Amount Range"
          summary={
            filters.minAmount || filters.maxAmount
              ? `$${filters.minAmount || '0'} - $${filters.maxAmount || '∞'}`
              : ''
          }
          defaultOpen={false}
        >
          <div className="space-y-1.5">
            <Input
              type="number"
              step="0.01"
              value={filters.minAmount}
              onChange={(e) =>
                onFilterChange({ ...filters, minAmount: e.target.value })
              }
              placeholder="Min amount"
              className="text-xs"
            />
            <Input
              type="number"
              step="0.01"
              value={filters.maxAmount}
              onChange={(e) =>
                onFilterChange({ ...filters, maxAmount: e.target.value })
              }
              placeholder="Max amount"
              className="text-xs"
            />
          </div>
        </FilterSection>

        {/* Customer ID Section */}
        <FilterSection
          title="Customer ID"
          summary={filters.customerId}
          defaultOpen={false}
        >
          <Input
            type="text"
            value={filters.customerId}
            onChange={(e) =>
              onFilterChange({ ...filters, customerId: e.target.value })
            }
            placeholder="Enter customer ID"
            className="text-xs"
          />
        </FilterSection>

        {/* Status Section */}
        <FilterSection
          title="Status"
          summary={
            filters.status.length > 0 ? `${filters.status.length} selected` : ''
          }
          defaultOpen={false}
        >
          <div className="space-y-1">
            {SALE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`w-full px-2 py-1 text-xs rounded border transition-colors text-left ${
                  filters.status.includes(status)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Payment Method Section */}
        <FilterSection
          title="Payment Method"
          summary={
            filters.paymentMethod.length > 0
              ? `${filters.paymentMethod.length} selected`
              : ''
          }
          defaultOpen={false}
        >
          <div className="space-y-1">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => handlePaymentMethodToggle(method)}
                className={`w-full px-2 py-1 text-xs rounded border transition-colors text-left ${
                  filters.paymentMethod.includes(method)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-accent'
                }`}
              >
                {method.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Employees Section */}
        {employees.length > 0 && (
          <FilterSection
            title="Employees"
            summary={
              filters.employeeId.length > 0
                ? `${filters.employeeId.length} selected`
                : ''
            }
            defaultOpen={false}
          >
            <div className="space-y-1">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => handleEmployeeToggle(employee.id)}
                  className={`w-full px-2 py-1 text-xs rounded border transition-colors text-left ${
                    filters.employeeId.includes(employee.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  {employee.firstName} {employee.lastName}
                </button>
              ))}
            </div>
          </FilterSection>
        )}
      </div>
    </div>
  );
};
