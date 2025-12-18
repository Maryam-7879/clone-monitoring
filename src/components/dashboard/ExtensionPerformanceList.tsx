import React from 'react';
import { Users, TrendingUp, Award, Target } from 'lucide-react';
import type { ExtensionPerformance } from '../../types/dashboard';

interface ExtensionPerformanceListProps {
  extensions: ExtensionPerformance[];
}

const ExtensionPerformanceList: React.FC<ExtensionPerformanceListProps> = ({ extensions }) => {
  const topPerformers = [...extensions]
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-blue-600 bg-blue-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return { text: 'عالی', color: 'bg-green-500' };
    if (rate >= 75) return { text: 'خوب', color: 'bg-blue-500' };
    if (rate >= 60) return { text: 'متوسط', color: 'bg-yellow-500' };
    return { text: 'ضعیف', color: 'bg-red-500' };
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">عملکرد داخلی‌ها</h3>
        <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
          <Users className="h-4 w-4" />
          <span>هفته جاری</span>
        </div>
      </div>

      <div className="space-y-4">
        {topPerformers.map((ext, index) => {
          const badge = getPerformanceBadge(ext.successRate);

          return (
            <div
              key={ext.extension}
              className="p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all duration-300 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold persian-numbers shadow-md">
                      {ext.extension}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Award className="h-5 w-5 text-yellow-500 fill-yellow-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">داخلی {ext.extension}</div>
                    <div className="text-sm text-slate-500 persian-numbers">{ext.totalCalls} تماس این هفته</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                      {badge.text}
                    </span>
                    <span className="text-2xl font-bold text-slate-800 persian-numbers">{ext.successRate}%</span>
                  </div>
                  <div className="text-xs text-slate-500">نرخ موفقیت</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-center">
                  <div className="text-lg font-bold persian-numbers">{ext.answered}</div>
                  <div className="text-xs">پاسخ</div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-center">
                  <div className="text-lg font-bold persian-numbers">{ext.missed}</div>
                  <div className="text-xs">بی‌پاسخ</div>
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-center">
                  <div className="text-lg font-bold persian-numbers">{ext.cancelled}</div>
                  <div className="text-xs">لغو</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 space-x-reverse text-slate-600">
                  <Target className="h-4 w-4" />
                  <span>میانگین مدت:</span>
                  <span className="font-semibold persian-numbers">{ext.avgDuration}</span>
                </div>
                {ext.satisfactionScore > 0 && (
                  <div className="flex items-center space-x-1 space-x-reverse text-amber-600">
                    <span className="text-amber-500">★</span>
                    <span className="font-semibold persian-numbers">{ext.satisfactionScore.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-purple-400 to-purple-600"
                    style={{ width: `${ext.successRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {extensions.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            مشاهده همه ({extensions.length} داخلی) ←
          </button>
        </div>
      )}
    </div>
  );
};

export default ExtensionPerformanceList;
