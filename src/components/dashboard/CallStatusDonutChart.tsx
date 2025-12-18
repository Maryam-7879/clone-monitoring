import React from 'react';
import { Phone, PhoneMissed, PhoneOff, TrendingUp } from 'lucide-react';

interface CallStatusDonutChartProps {
  answered: number;
  missed: number;
  cancelled: number;
}

const CallStatusDonutChart: React.FC<CallStatusDonutChartProps> = ({ answered, missed, cancelled }) => {
  const total = answered + missed + cancelled;

  if (total === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-3xl shadow-xl border border-slate-200/50">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">وضعیت تماس‌ها</h3>
        <div className="text-center py-12">
          <p className="text-slate-500">داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  const answeredPercent = Math.round((answered / total) * 100);
  const missedPercent = Math.round((missed / total) * 100);
  const cancelledPercent = Math.round((cancelled / total) * 100);

  const stats = [
    { label: 'پاسخ داده شده', value: answered, percent: answeredPercent, icon: Phone, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'بی‌پاسخ', value: missed, percent: missedPercent, icon: PhoneMissed, color: 'amber', gradient: 'from-amber-500 to-amber-600' },
    { label: 'لغوشده', value: cancelled, percent: cancelledPercent, icon: PhoneOff, color: 'rose', gradient: 'from-rose-500 to-rose-600' },
  ];

  const maxValue = Math.max(answered, missed, cancelled);

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-3xl shadow-xl border border-slate-200/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">وضعیت تماس‌ها</h3>
          <p className="text-sm text-slate-500">تحلیل عملکرد و نتایج تماس‌ها</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">مجموع</span>
          </div>
          <div className="text-3xl font-bold persian-numbers">{total}</div>
        </div>
      </div>

      <div className="relative bg-white rounded-2xl p-6 shadow-inner border border-slate-100">
        <div className="space-y-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const barWidth = maxValue > 0 ? (stat.value / maxValue) * 100 : 0;

            return (
              <div key={stat.label} className="group" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">{stat.label}</div>
                      <div className="text-xs text-slate-500">{stat.percent > 50 ? 'عالی' : stat.percent > 25 ? 'متوسط' : 'کم'}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-3xl font-bold text-slate-800 persian-numbers">{stat.value}</div>
                    <div className={`text-sm font-semibold text-${stat.color}-600 persian-numbers`}>{stat.percent}%</div>
                  </div>
                </div>

                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`absolute top-0 right-0 h-full bg-gradient-to-l ${stat.gradient} rounded-full transition-all duration-1000 ease-out shadow-md`}
                    style={{ width: `${barWidth}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-2xl border border-emerald-200 text-center">
          <div className="text-3xl font-bold text-emerald-700 persian-numbers mb-1">{answeredPercent}%</div>
          <div className="text-xs text-emerald-600 font-medium">نرخ پاسخگویی</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 text-center">
          <div className="text-3xl font-bold text-blue-700 persian-numbers mb-1">{Math.round(((answered + cancelled) / total) * 100)}%</div>
          <div className="text-xs text-blue-600 font-medium">نرخ دسترسی</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="text-3xl font-bold text-slate-700 persian-numbers mb-1">{total}</div>
          <div className="text-xs text-slate-600 font-medium">کل تماس‌ها</div>
        </div>
      </div>
    </div>
  );
};

export default CallStatusDonutChart;
