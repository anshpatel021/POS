import React from 'react';

interface DatePresetsSelectProps {
  onSelect: (startDate: string, endDate: string) => void;
  className?: string;
}

export const DatePresetsSelect: React.FC<DatePresetsSelectProps> = ({ onSelect, className = '' }) => {
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
    { value: 'custom', label: 'Custom Range', getValue: () => ({ start: '', end: '' }) },
    { value: 'today', label: 'Today', getValue: getToday },
    { value: 'yesterday', label: 'Yesterday', getValue: getYesterday },
    { value: 'last7', label: 'Last 7 Days', getValue: getLast7Days },
    { value: 'last30', label: 'Last 30 Days', getValue: getLast30Days },
    { value: 'thisMonth', label: 'This Month', getValue: getThisMonth },
    { value: 'lastMonth', label: 'Last Month', getValue: getLastMonth },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = presets.find((p) => p.value === e.target.value);
    if (selectedPreset && selectedPreset.value !== 'custom') {
      const { start, end } = selectedPreset.getValue();
      onSelect(start, end);
    }
  };

  return (
    <select
      onChange={handleChange}
      className={`w-full px-2 py-1 text-xs border border-border rounded bg-background hover:bg-accent transition-colors ${className}`}
      defaultValue="custom"
    >
      {presets.map((preset) => (
        <option key={preset.value} value={preset.value}>
          {preset.label}
        </option>
      ))}
    </select>
  );
};
