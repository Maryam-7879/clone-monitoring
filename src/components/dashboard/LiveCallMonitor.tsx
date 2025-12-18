import React, { useEffect, useState } from 'react';
import { Phone, Clock, User, PhoneIncoming, PhoneMissed } from 'lucide-react';
import type { ActiveCall } from '../../types/dashboard';

interface LiveCallMonitorProps {
  calls: ActiveCall[];
}

const LiveCallMonitor: React.FC<LiveCallMonitorProps> = ({ calls }) => {
  const [callDurations, setCallDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const newDurations: Record<string, number> = {};
      calls.forEach(call => {
        const now = new Date();
        const startMs = (call.startTimestamp ? call.startTimestamp * 1000 : new Date(call.startTime).getTime());
        newDurations[call.id] = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
      });
      setCallDurations(newDurations);
    }, 1000);

    return () => clearInterval(interval);
  }, [calls]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'ringing':
        return 'bg-yellow-500 animate-pulse';
      case 'on-hold':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'در حال مکالمه';
      case 'ringing':
        return 'در حال زنگ خوردن';
      case 'on-hold':
        return 'در انتظار';
      default:
        return 'نامشخص';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Phone className="h-4 w-4" />;
      case 'ringing':
        return <PhoneIncoming className="h-4 w-4" />;
      case 'on-hold':
        return <Clock className="h-4 w-4" />;
      default:
        return <PhoneMissed className="h-4 w-4" />;
    }
  };

  if (calls.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">تماس‌های فعال</h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-500">بدون تماس فعال</span>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <Phone className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500">در حال حاضر تماس فعالی وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">تماس‌های فعال</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-600 persian-numbers">{calls.length} تماس زنده</span>
        </div>
      </div>

      <div className="space-y-4">
        {calls.map((call) => (
          <div
            key={call.id}
            className="bg-gradient-to-l from-slate-50 to-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`w-10 h-10 ${getStatusColor(call.status)} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  {getStatusIcon(call.status)}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 persian-numbers">{call.phoneNumber}</div>
                  <div className="text-sm text-slate-500">{call.callerName || 'تماس ورودی'}</div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-800 persian-numbers font-mono">
                  {formatDuration(callDurations[call.id] || call.duration)}
                </div>
                <div className="text-xs text-slate-500">مدت مکالمه</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium persian-numbers">
                  داخلی {call.extension}
                </div>
                <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                  {getStatusText(call.status)}
                </div>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse text-slate-400">
                <Clock className="h-3 w-3" />
                <span className="text-xs persian-numbers">
                  {new Date(call.startTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {call.status === 'active' && (
              <div className="mt-3">
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <div className="w-1 h-3 bg-green-500 rounded-full animate-sound-wave" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1 h-3 bg-green-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-green-500 rounded-full animate-sound-wave" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveCallMonitor;
