import React, { useState } from 'react';
import { X, XCircle, RotateCcw, CreditCard, User, Calendar } from 'lucide-react';
import { Sale } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { saleService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess: () => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  isOpen,
  onClose,
  sale,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !sale) return null;

  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this sale? This will restore inventory.')) return;

    setIsLoading(true);
    setError('');
    try {
      await saleService.void(sale.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to void sale');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to refund this sale? This will restore inventory and adjust customer points.')) return;

    setIsLoading(true);
    setError('');
    try {
      await saleService.refund(sale.id, {});
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to refund sale');
    } finally {
      setIsLoading(false);
    }
  };

  const canVoid = sale.status === 'COMPLETED' && (user?.role === 'ADMIN' || user?.role === 'MANAGER');
  const canRefund = sale.status === 'COMPLETED' && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sale Details</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{formatCurrency(sale.total)}</h3>
              <p className="text-sm text-muted-foreground font-mono">{sale.saleNumber}</p>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                sale.status === 'COMPLETED'
                  ? 'bg-success/10 text-success'
                  : sale.status === 'PENDING'
                  ? 'bg-warning/10 text-warning'
                  : sale.status === 'HOLD'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {sale.status}
            </span>
          </div>

          {/* Sale Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sale Date</p>
                <p className="font-medium text-sm">{formatDate(sale.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="font-medium text-sm">{sale.paymentMethod.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Employee</p>
                <p className="font-medium text-sm">
                  {sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'N/A'}
                </p>
              </div>
            </div>
            {sale.customer && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium text-sm">
                    {sale.customer.firstName} {sale.customer.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sale Items */}
          <div>
            <h4 className="font-medium mb-3">Items</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Product</th>
                    <th className="text-center p-2">Qty</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Discount</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                      </td>
                      <td className="text-center p-2">{item.quantity}</td>
                      <td className="text-right p-2 font-mono">{formatCurrency(item.price)}</td>
                      <td className="text-right p-2 font-mono text-destructive">
                        {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                      </td>
                      <td className="text-right p-2 font-mono font-medium">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sale Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-mono text-destructive">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">{formatCurrency(sale.tax)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-mono">{formatCurrency(sale.amountPaid)}</span>
              </div>
              {sale.changeDue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Change Due</span>
                  <span className="font-mono">{formatCurrency(sale.changeDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {sale.completedAt && (
            <div className="pt-4 border-t text-xs text-muted-foreground">
              <p>Completed: {formatDate(sale.completedAt)}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            {canVoid && (
              <Button
                variant="destructive"
                onClick={handleVoid}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Void Sale
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                onClick={handleRefund}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refund Sale
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
