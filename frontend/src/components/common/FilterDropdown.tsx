import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  onClose,
  children,
  title = 'Filters',
}) => {
  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (isOpen) {
      // Only lock scroll on mobile
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop: Dropdown Overlay (hidden on mobile) */}
      <div className="hidden md:block">
        {/* Backdrop */}
        <div className="fixed inset-0 z-40" onClick={onClose} />

        {/* Dropdown */}
        <div className="absolute right-0 mt-2 w-72 bg-background border border-border rounded-md shadow-lg z-50 animate-fadeIn">
          <div className="p-3">{children}</div>
        </div>
      </div>

      {/* Mobile: Full-Screen Modal (hidden on desktop) */}
      <div className="md:hidden fixed inset-0 z-50 flex items-start justify-center pt-4 px-2">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-50 w-full max-w-lg bg-background rounded-lg shadow-lg animate-fadeIn max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3">{children}</div>
        </div>
      </div>
    </>
  );
};
