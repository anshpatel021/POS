import React from 'react';
import { Button } from '../ui/Button';

interface DatePresetsProps {
  onSelect: (startDate: string, endDate: string) => void;
  className?: string;
}

export const DatePresets: React.FC<DatePresetsProps> = ({ onSelect, className = '' }) => {
  const getToday = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    return { start: dateStr, end: dateStr };
  };

  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    return { start: dateStr, end: dateStr };
  };

  const getLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const getLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const getThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const getLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const presets = [
    { label: 'Today', getValue: getToday },
    { label: 'Yesterday', getValue: getYesterday },
    { label: 'Last 7 Days', getValue: getLast7Days },
    { label: 'Last 30 Days', getValue: getLast30Days },
    { label: 'This Month', getValue: getThisMonth },
    { label: 'Last Month', getValue: getLastMonth },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const { start, end } = preset.getValue();
            onSelect(start, end);
          }}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
};
