import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { HourlyStats } from '../../types/dashboard';

type Props = { stats: HourlyStats[]; peakHour?: string | null };

const toFaDigits = (val: string | number) =>
  String(val).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

function niceMax(maxVal: number) {
  const m = Math.max(10, maxVal);
  const pow = Math.pow(10, Math.floor(Math.log10(m)));
  const n = Math.ceil(m / pow) * pow;
  return Math.ceil(n * 1.2);
}

const HourlyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-xl px-4 py-3">
      <div className="text-sm font-bold text-slate-800 mb-2">ساعت {label}</div>
      <div className="text-xs text-slate-600 space-y-1">
        <div className="flex justify-between gap-10">
          <span>کل تماس</span>
          <span className="font-semibold text-slate-800">{toFaDigits(p.calls)}</span>
        </div>
        <div className="flex justify-between gap-10">
          <span>پاسخ داده</span>
          <span className="font-semibold text-slate-800">{toFaDigits(p.answered)}</span>
        </div>
        <div className="flex justify-between gap-10">
          <span>بی‌پاسخ</span>
          <span className="font-semibold text-slate-800">{toFaDigits(p.missed)}</span>
        </div>
      </div>
    </div>
  );
};

const HourlyStatsChart: React.FC<Props> = ({ stats, peakHour }) => {
  const { data, yMax } = useMemo(() => {
    const map = new Map<string, HourlyStats>();
    for (const s of stats || []) map.set((s as any).hour, s);

    const hours = Array.from({ length: 15 }, (_, i) => (i + 7).toString().padStart(2, '0')); // 07..21

    const rows = hours.map((h) => {
      const s = map.get(h);
      const calls = (s as any)?.calls ?? 0;
      const answered = (s as any)?.answered ?? 0;
      const missed = (s as any)?.missed ?? 0;

      return {
        hour: toFaDigits(h),
        calls,
        answered,
        missed,
      };
    });

    const maxCalls = Math.max(...rows.map((r) => r.calls));
    return { data: rows, yMax: niceMax(maxCalls) };
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6" dir="rtl">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="text-right">
          <h3 className="text-lg font-bold text-slate-800">تحلیل تماس در طول روز</h3>
        </div>

        {/* ساعت پیک */}
        <div className="text-left">
          {peakHour && peakHour !== '00' ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">ساعت پیک:</span>
              <span className="text-sm font-bold text-slate-800">{peakHour}:00</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="h-[320px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 30 }}>
            <defs>
              <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" interval={0} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              domain={[0, yMax]}
              tickFormatter={(v) => toFaDigits(v)}
            />

            <Tooltip content={<HourlyTooltip />} />

            <Area
              type="monotone"
              dataKey="calls"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#areaBlue)"
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyStatsChart;
