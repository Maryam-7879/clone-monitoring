import React from 'react';
import { Star, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';

export type SatisfactionTrend = 'up' | 'down' | 'stable';

export type ScoreDistributionRow = { score: 1 | 2 | 3 | 4 | 5; count: number };

interface SatisfactionGaugeProps {
  /** درصد رضایت ماه جاری (۰..۱۰۰) */
  rate: number;
  /** تعداد نظرسنجی‌های ماه جاری */
  totalSurveys: number;
  /** امتیاز میانگین (۰..۵) */
  avgScore: number;
  /** روند نسبت به ماه قبل (درصد تغییر) */
  trendPercent: number;
  /** جهت روند */
  trend: SatisfactionTrend;
  /** توزیع امتیازهای ۱ تا ۵ */
  distribution: ScoreDistributionRow[];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const SatisfactionGauge: React.FC<SatisfactionGaugeProps> = ({
  rate,
  totalSurveys,
  avgScore,
  trendPercent,
  trend,
  distribution,
}) => {
  const safeRate = clamp(Number.isFinite(rate) ? rate : 0, 0, 100);
  const safeAvg = clamp(Number.isFinite(avgScore) ? avgScore : 0, 0, 5);

  const circumference = 2 * Math.PI * 70;
  const strokeDasharray = `${(safeRate / 100) * circumference} ${circumference}`;

  const getColor = () => {
    if (safeRate >= 80) return { color: '#10b981', label: 'عالی', gradient: 'from-green-500 to-green-600' };
    if (safeRate >= 60) return { color: '#3b82f6', label: 'خوب', gradient: 'from-blue-500 to-blue-600' };
    if (safeRate >= 40) return { color: '#f59e0b', label: 'متوسط', gradient: 'from-yellow-500 to-yellow-600' };
    return { color: '#ef4444', label: 'ضعیف', gradient: 'from-red-500 to-red-600' };
  };

  const status = getColor();

  const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of distribution || []) {
    const s = Number(r.score);
    if (s >= 1 && s <= 5) distMap[s] = Number(r.count) || 0;
  }
  const maxCount = Math.max(...Object.values(distMap), 1);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendText = trend === 'up' ? 'صعودی' : trend === 'down' ? 'نزولی' : 'ثابت';
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">رضایت‌مندی مشتریان</h3>
        <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-500">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
          <span>این ماه</span>
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="transform -rotate-90" width="180" height="180">
            <circle cx="90" cy="90" r="70" stroke="#f1f5f9" strokeWidth="14" fill="none" />
            <circle
              cx="90"
              cy="90"
              r="70"
              stroke={status.color}
              strokeWidth="14"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.1))' }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className={`text-4xl font-bold bg-gradient-to-br ${status.gradient} bg-clip-text text-transparent persian-numbers`}
              >
                {Math.round(safeRate)}%
              </div>
              <div className="text-sm text-slate-600 mt-1">رضایت کلی</div>
              <div
                className="text-xs font-semibold mt-1 px-3 py-1 rounded-full inline-block"
                style={{ backgroundColor: status.color + '20', color: status.color }}
              >
                {status.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gradient-to-l from-green-50 to-white rounded-xl border border-green-100">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-slate-700">امتیاز میانگین</span>
          </div>
          <span className="text-sm font-bold text-slate-800 persian-numbers">
            {safeAvg.toFixed(1)} از ۵
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gradient-to-l from-blue-50 to-white rounded-xl border border-blue-100">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-slate-700">تعداد نظرسنجی</span>
          </div>
          <span className="text-sm font-bold text-slate-800 persian-numbers">{totalSurveys}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gradient-to-l from-purple-50 to-white rounded-xl border border-purple-100">
          <div className="flex items-center space-x-2 space-x-reverse">
            <TrendIcon className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-slate-700">روند</span>
          </div>
          <span className={`text-sm font-semibold ${trendColor} flex items-center space-x-1 space-x-reverse`}>
            <span>{trendText}</span>
            <span className="persian-numbers">
              {trendPercent > 0 ? '+' : ''}
              {trendPercent.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-5 gap-2">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = distMap[score] || 0;
            const height = (count / maxCount) * 100;
            const barClass =
              score >= 4
                ? 'from-green-400 to-green-500'
                : score === 3
                ? 'from-yellow-400 to-yellow-500'
                : 'from-red-400 to-red-500';

            return (
              <div key={score} className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  <div
                    className={`w-full bg-gradient-to-t ${barClass} rounded-t transition-all duration-700 ease-out hover:opacity-80 cursor-pointer`}
                    style={{ height: `${height}%` }}
                    title={`${count} نظر`}
                  />
                </div>
                <div className="flex items-center justify-center mb-1">
                  <Star className={`h-3 w-3 ${score >= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                </div>
                <div className="text-xs font-semibold text-slate-600 persian-numbers">{score}</div>
                <div className="text-[10px] text-slate-400 persian-numbers">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SatisfactionGauge;
