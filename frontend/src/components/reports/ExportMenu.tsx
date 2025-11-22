import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExportCSV,
  onExportPDF,
  disabled = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      if (format === 'csv') {
        await onExportCSV();
      } else {
        await onExportPDF();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Exporting...' : 'Export'}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {showMenu && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
