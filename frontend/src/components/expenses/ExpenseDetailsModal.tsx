import React, { useState } from 'react';
import { X, FileText, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import { Expense } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { expenseService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSuccess: () => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  isOpen,
  onClose,
  expense,
  onSuccess,
  onEdit,
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !expense) return null;

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this expense?')) return;

    setIsLoading(true);
    setError('');
    try {
      await expenseService.approve(expense.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this expense?')) return;

    setIsLoading(true);
    setError('');
    try {
      await expenseService.reject(expense.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) return;

    setIsLoading(true);
    setError('');
    try {
      await expenseService.delete(expense.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete expense');
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = expense.status === 'PENDING';
  const canApprove = expense.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'MANAGER');
  const canDelete = user?.role === 'ADMIN';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expense Details</CardTitle>
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
              <h3 className="text-2xl font-bold">{formatCurrency(expense.amount)}</h3>
              <p className="text-sm text-muted-foreground font-mono">{expense.expenseNumber}</p>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                expense.status === 'PAID'
                  ? 'bg-success/10 text-success'
                  : expense.status === 'PENDING'
                  ? 'bg-warning/10 text-warning'
                  : expense.status === 'APPROVED'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {expense.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{expense.category.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expense Date</p>
              <p className="font-medium">{formatDate(expense.expenseDate)}</p>
            </div>
            {expense.vendor && (
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{expense.vendor}</p>
              </div>
            )}
            {expense.invoiceNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{expense.invoiceNumber}</p>
              </div>
            )}
            {expense.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(expense.dueDate)}</p>
              </div>
            )}
            {expense.paidDate && (
              <div>
                <p className="text-sm text-muted-foreground">Paid Date</p>
                <p className="font-medium">{formatDate(expense.paidDate)}</p>
              </div>
            )}
            {expense.location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{expense.location.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">
                {expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm bg-muted p-3 rounded-md">{expense.description}</p>
          </div>

          {/* Receipt */}
          {expense.receiptUrl && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Receipt</p>
              <a
                href={expense.receiptUrl.startsWith('http') ? expense.receiptUrl : `http://localhost:5000${expense.receiptUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                View Receipt
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDate(expense.createdAt)}</p>
            <p>Last Updated: {formatDate(expense.updatedAt)}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(expense);
                  onClose();
                }}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
