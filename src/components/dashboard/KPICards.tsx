import React from 'react';
import { Phone, TrendingUp, Clock, Star, Users, Target, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import type { DashboardKPIs } from '../../types/dashboard';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const primaryCards = [
    {
      title: 'تماس‌های امروز',
      value: kpis.totalCalls.today,
      subtitle: 'نسبت به دیروز',
      change: kpis.totalCalls.percentChange,
      icon: Phone,
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-white bg-opacity-20',
    },
    {
      title: 'تماس‌های هفته',
      value: kpis.totalCalls.thisWeek,
      subtitle: 'کل تماس‌ها',
      change: 8,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-white bg-opacity-20',
    },
    {
      title: 'میانگین مدت امروز',
      value: kpis.averageDuration,
      subtitle: 'دقیقه:ثانیه',
      change: -5,
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-white bg-opacity-20',
      isTime: true,
    },
    {
      title: 'رضایت امروز',
      value: `${(kpis.satisfactionTodayRate ?? kpis.satisfactionRate) || 0}%`,
      subtitle: 'از نظرسنجی‌ها',
      change: 3,
      icon: Star,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-white bg-opacity-20',
    },
  ];

  const secondaryCards = [
    {
      title: 'پاسخ داده شده امروز',
      value: kpis.callStatus.answered,
      percent: kpis.totalCalls.today > 0 ? Math.round((kpis.callStatus.answered / kpis.totalCalls.today) * 100) : 0,
      icon: Phone,
      color: 'green',
      bgGradient: 'bg-green-50',
      iconBg: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'بی‌پاسخ امروز',
      value: kpis.callStatus.missed,
      percent: kpis.totalCalls.today > 0 ? Math.round((kpis.callStatus.missed / kpis.totalCalls.today) * 100) : 0,
      icon: Phone,
      color: 'yellow',
      bgGradient: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: 'لغوشده امروز',
      value: kpis.callStatus.cancelled,
      percent: kpis.totalCalls.today > 0 ? Math.round((kpis.callStatus.cancelled / kpis.totalCalls.today) * 100) : 0,
      icon: Phone,
      color: 'red',
      bgGradient: 'bg-red-50',
      iconBg: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'تماس‌های فعال الان',
      value: kpis.activeCalls,
      percent: 100,
      icon: Zap,
      color: 'purple',
      bgGradient: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-600',
      isActive: true,
    },
  ];

  return (
    <>
      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {primaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`bg-gradient-to-br ${card.gradient} p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.iconBg} p-3 rounded-xl shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90 mb-1">{card.title}</div>
                  <div className={`text-3xl font-bold persian-numbers ${card.isTime ? 'font-mono' : ''}`}>
                    {card.value}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 px-3 py-1.5 rounded-full">
                  {card.change >= 0 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold persian-numbers">
                    {card.change >= 0 ? '+' : ''}{card.change}%
                  </span>
                </div>
                <div className="text-sm opacity-90">{card.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.bgGradient} p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className={`${card.iconBg} p-3 rounded-xl shadow-md`}>
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 mb-1">{card.title}</div>
                  <div className={`text-3xl font-bold ${card.textColor} persian-numbers`}>
                    {card.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default KPICards;
