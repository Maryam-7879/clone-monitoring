import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { WeeklyDayStats } from '../../types/dashboard';

type Props = { weekData: WeeklyDayStats[] };

const toFaDigits = (val: string | number) =>
  String(val).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const DAY_FA: Record<string, string> = {
  Sat: 'شنبه',
  Sun: 'یکشنبه',
  Mon: 'دوشنبه',
  Tue: 'سه‌شنبه',
  Wed: 'چهارشنبه',
  Thu: 'پنجشنبه',
  Fri: 'جمعه',
};

// شنبه → جمعه (چپ به راست)
const ORDER: Array<keyof typeof DAY_FA> = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function dayNameFromDate(dateStr?: string): keyof typeof DAY_FA | null {
  if (!dateStr) return null;
  const dt = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return null;
  const idx = dt.getUTCDay(); // 0=Sun..6=Sat
  const map: Array<keyof typeof DAY_FA> = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[idx] ?? null;
}

function niceMax(maxVal: number) {
  const m = Math.max(10, maxVal);
  const pow = Math.pow(10, Math.floor(Math.log10(m)));
  const n = Math.ceil(m / pow) * pow;
  return Math.ceil(n * 1.2);
}

const WeeklyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-xl px-4 py-3">
      <div className="text-sm font-bold text-slate-800 mb-2">روز: {label}</div>
      <div className="text-xs text-slate-600 space-y-1">
        <div className="flex justify-between gap-10">
          <span>کل تماس</span>
          <span className="font-semibold text-slate-800">{toFaDigits(p.total)}</span>
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

const WeeklyCallStatusChart: React.FC<Props> = ({ weekData }) => {
  const { data, peakDayKey, yMax } = useMemo(() => {
    const map = new Map<keyof typeof DAY_FA, WeeklyDayStats>();

    for (const d of weekData || []) {
      const key1 = (d as any).dayName as keyof typeof DAY_FA | undefined;
      const key2 = dayNameFromDate((d as any).day);
      const key = key1 && DAY_FA[key1] ? key1 : key2;
      if (key && DAY_FA[key]) map.set(key, d);
    }

    const rows = ORDER.map((key) => {
      const d = map.get(key);
      const answered = d?.answered ?? 0;
      const missed = d?.missed ?? 0;

      // 👈 مهم: total رو فقط از API می‌گیریم؛ اگر نبود، از answered+missed می‌سازیم
      const total = (d?.total ?? (answered + missed)) as number;

      return {
        dayKey: key,
        day: DAY_FA[key],
        total,
        answered,
        missed,
      };
    });

    let peak = rows[0];
    for (const r of rows) if (r.total > peak.total) peak = r;

    const maxVal = Math.max(...rows.map((r) => Math.max(r.answered, r.missed, r.total)));
    return { data: rows, peakDayKey: peak.dayKey, yMax: niceMax(maxVal) };
  }, [weekData]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6" dir="rtl">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="text-right">
          <h3 className="text-lg font-bold text-slate-800">وضعیت تماس هفتگی</h3>
        </div>

        {/* روز پیک */}
        <div className="text-left">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs text-slate-500">روز پیک:</span>
            <span className="text-sm font-bold text-slate-800">
              {data.find((d) => d.dayKey === peakDayKey)?.day}
            </span>
            <span className="text-sm font-bold text-violet-700">
              {toFaDigits(data.find((d) => d.dayKey === peakDayKey)?.total ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* محور X چپ→راست */}
      <div className="h-[320px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 16, left: 8, bottom: 30 }}
            barCategoryGap={18}
            barGap={8}
          >
            <defs>
              {/* آبی */}
              <linearGradient id="ansBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.9} />
              </linearGradient>

              {/* قرمز */}
              <linearGradient id="misRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fca5a5" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9} />
              </linearGradient>

              {/* پیک برای آبی */}
              <linearGradient id="peakBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.98} />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.92} />
              </linearGradient>

              {/* پیک برای قرمز */}
              <linearGradient id="peakRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.98} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.88} />
              </linearGradient>

              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.10" />
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" interval={0} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              domain={[0, yMax]}
              tickFormatter={(v) => toFaDigits(v)}
            />

            <Tooltip content={<WeeklyTooltip />} />

            {/* پاسخ‌داده (آبی) */}
            <Bar dataKey="answered" barSize={26} radius={[14, 14, 10, 10]} filter="url(#softShadow)">
              {data.map((entry, idx) => (
                <Cell
                  key={`ans-${idx}`}
                  fill={entry.dayKey === peakDayKey ? 'url(#peakBlue)' : 'url(#ansBlue)'}
                />
              ))}
            </Bar>

            {/* بی‌پاسخ (قرمز) */}
            <Bar dataKey="missed" barSize={26} radius={[14, 14, 10, 10]} filter="url(#softShadow)">
              {data.map((entry, idx) => (
                <Cell
                  key={`mis-${idx}`}
                  fill={entry.dayKey === peakDayKey ? 'url(#peakRed)' : 'url(#misRed)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend تمیز */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: '#2563eb' }} />
          <span>پاسخ داده</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: '#dc2626' }} />
          <span>بی‌پاسخ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded" style={{ background: '#6d28d9' }} />
          <span>روز پیک</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCallStatusChart;
