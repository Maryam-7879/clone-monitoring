import React from 'react';
import { Phone, PhoneOff, PhoneIncoming, CheckCircle } from 'lucide-react';
import type { ExtensionStatus } from '../../types/dashboard';

interface ExtensionStatusGridProps {
  extensions: ExtensionStatus[];
}

const ExtensionStatusGrid: React.FC<ExtensionStatusGridProps> = ({ extensions }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'busy':
        return {
          icon: Phone,
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'مشغول',
        };
      case 'ringing':
        return {
          icon: PhoneIncoming,
          color: 'bg-yellow-500 animate-pulse',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'در حال زنگ',
        };
      case 'idle':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'آزاد',
        };
      default:
        return {
          icon: PhoneOff,
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'آفلاین',
        };
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">وضعیت داخلی‌ها</h3>
        <span className="text-sm text-slate-500 persian-numbers">{extensions.length} داخلی</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {extensions.map((ext) => {
          const statusInfo = getStatusInfo(ext.status);
          const StatusIcon = statusInfo.icon;
          const successRate = ext.todayStats.total > 0
            ? Math.round((ext.todayStats.answered / ext.todayStats.total) * 100)
            : 0;

          return (
            <div
              key={ext.extension}
              className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 p-4 rounded-xl hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`w-8 h-8 ${statusInfo.color} rounded-lg flex items-center justify-center text-white shadow-md`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={`text-xs ${statusInfo.textColor} font-medium`}>
                      {statusInfo.label}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 persian-numbers">
                  {ext.extension}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">کل تماس‌ها:</span>
                  <span className="font-semibold text-slate-800 persian-numbers">
                    {ext.todayStats.total}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">پاسخ داده:</span>
                  <span className="font-semibold text-green-600 persian-numbers">
                    {ext.todayStats.answered}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">درصد موفقیت:</span>
                  <span className="font-semibold text-blue-600 persian-numbers">
                    {successRate}%
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="persian-numbers">بی‌پاسخ: {ext.todayStats.missed}</span>
                  <span className="persian-numbers">لغو: {ext.todayStats.cancelled}</span>
                </div>
              </div>

              {ext.status === 'busy' && (
                <div className="mt-3 flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-3 bg-red-500 rounded-full animate-sound-wave" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-3 bg-red-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-3 bg-red-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExtensionStatusGrid;
