import React from 'react';
import DatePicker, { DayValue } from 'react-modern-calendar-datepicker';
import { Calendar } from 'lucide-react';
import 'react-modern-calendar-datepicker/lib/DatePicker.css';

interface PersianDatePickerProps {
  value: DayValue;
  onChange: (value: DayValue) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  label,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <DatePicker
          value={value}
          onChange={onChange}
          locale="fa"
          shouldHighlightWeekends
          calendarClassName="custom-calendar"
          inputClassName="w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white"
          inputPlaceholder={placeholder}
          disabled={disabled}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default PersianDatePicker;
