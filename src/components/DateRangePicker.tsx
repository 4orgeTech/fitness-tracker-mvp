import { type DateRange, type DateRangeMode } from '@/types/app';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateRangeLabel, getDateRange, shiftDateRange } from '@/lib/dateRange';
import { useState } from 'react';

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ range, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const modes: { value: DateRangeMode; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-green-200 bg-white overflow-hidden">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(getDateRange(m.value, range.start))}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              range.mode === m.value
                ? 'bg-green-800 text-white'
                : 'text-gray-600 hover:bg-green-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(shiftDateRange(range, -1))}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 min-w-[140px] justify-center">
          <Calendar size={14} className="text-green-600" />
          {formatDateRangeLabel(range)}
        </div>
        <button
          onClick={() => onChange(shiftDateRange(range, 1))}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-800 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <button
        onClick={() => {
          onChange(getDateRange(range.mode, new Date()));
          setShowCustom(false);
        }}
        className="px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors"
      >
        Today
      </button>
    </div>
  );
}
