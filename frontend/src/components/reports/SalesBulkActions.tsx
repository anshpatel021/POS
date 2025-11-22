import React, { useState } from 'react';
import { XCircle, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saleService } from '@/services/api';

interface SalesBulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export const SalesBulkActions: React.FC<SalesBulkActionsProps> = ({
  selectedIds,
  onClearSelection,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBulkVoid = async () => {
    if (!confirm(`Are you sure you want to void ${selectedIds.length} sale(s)? This will restore inventory.`)) return;

    setIsLoading(true);
    setError('');
    try {
      await saleService.bulkVoid(selectedIds);
      onSuccess();
      onClearSelection();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to void sales');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkRefund = async () => {
    if (!confirm(`Are you sure you want to refund ${selectedIds.length} sale(s)? This will restore inventory and adjust customer points.`)) return;

    setIsLoading(true);
    setError('');
    try {
      await saleService.bulkRefund(selectedIds);
      onSuccess();
      onClearSelection();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to refund sales');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-md p-4 mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedIds.length} sale{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkVoid}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Void Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkRefund}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Refund Selected
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-1" />
          Deselect All
        </Button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-destructive">{error}</div>
      )}
    </div>
  );
};
