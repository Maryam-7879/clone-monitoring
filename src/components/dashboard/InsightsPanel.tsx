import React from 'react';
import { AlertTriangle, Info, CheckCircle, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import type { InsightItem } from '../../types/dashboard';

interface InsightsPanelProps {
  insights: InsightItem[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'bg-red-500',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'bg-yellow-500',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-700',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'bg-green-500',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-700',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'bg-blue-500',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-700',
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'لحظاتی پیش';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    return 'امروز';
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">تحلیل‌های هوشمند</h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-slate-500">AI Insights</span>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-slate-600 font-medium mb-2">همه چیز عالی است!</p>
          <p className="text-sm text-slate-500">هیچ مشکل یا هشداری وجود ندارد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">تحلیل‌های هوشمند</h3>
          <p className="text-sm text-slate-500 mt-1">تحلیل خودکار عملکرد سیستم</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg shadow-md">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs text-slate-500 font-medium">AI</span>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          const style = getInsightStyle(insight.type);

          return (
            <div
              key={insight.id}
              className={`${style.bg} ${style.border} border-2 p-4 rounded-xl hover:shadow-md transition-all duration-300 animate-slide-in-right`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className={`${style.icon} p-2.5 rounded-xl flex-shrink-0 shadow-md`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${style.text}`}>{insight.title}</h4>
                    {insight.metric !== undefined && (
                      <span className={`${style.badge} px-2 py-1 rounded-full text-xs font-bold persian-numbers`}>
                        {insight.metric}
                        {insight.type === 'warning' || insight.type === 'success' ? '%' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-2 leading-relaxed">{insight.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatTimestamp(insight.timestamp)}</span>
                    {(insight.type === 'critical' || insight.type === 'warning') && (
                      <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        مشاهده جزئیات ←
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              <span className="text-slate-600">بحرانی</span>
            </div>
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-600">هشدار</span>
            </div>
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">موفقیت</span>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 space-x-reverse">
            <span>گزارش کامل</span>
            <TrendingUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
