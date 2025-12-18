import React, { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import type {
  ActiveCall,
  ExtensionStatus,
  DashboardKPIs,
  HourlyStats,
  ExtensionPerformance,
  WeeklyDayStats,
} from '../../types/dashboard';

import LiveCallMonitor from '../dashboard/LiveCallMonitor';
import ExtensionStatusGrid from '../dashboard/ExtensionStatusGrid';
import KPICards from '../dashboard/KPICards';
import HourlyStatsChart from '../dashboard/HourlyStatsChart';
import WeeklyCallStatusChart from '../dashboard/WeeklyCallStatusChart';
import ExtensionPerformanceList from '../dashboard/ExtensionPerformanceList';
import SatisfactionGauge from '../dashboard/SatisfactionGauge';
import type { SatisfactionStats } from '../../types/dashboard';

type MonthlySatisfaction = {
  monthRate: number;
  avgScore: number;
  trendPercent: number;
  trend: 'up' | 'down' | 'stable';
  distribution: { score: 1 | 2 | 3 | 4 | 5; count: number }[];
  totalSurveys: number;
};

const Dashboard: React.FC = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [extensionStatuses, setExtensionStatuses] = useState<ExtensionStatus[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyDayStats[]>([]);
  const [extensionPerformance, setExtensionPerformance] = useState<ExtensionPerformance[]>([]);
  const [monthlySatisfaction, setMonthlySatisfaction] = useState<MonthlySatisfaction>({
    monthRate: 0,
    avgScore: 0,
    trendPercent: 0,
    trend: 'stable',
    distribution: [
      { score: 1, count: 0 },
      { score: 2, count: 0 },
      { score: 3, count: 0 },
      { score: 4, count: 0 },
      { score: 5, count: 0 },
    ],
    totalSurveys: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);

      const toISO = (d: Date) => {
        // yyyy-MM-dd
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const now = new Date();
      const currFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      const currTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevTo = new Date(now.getFullYear(), now.getMonth(), 0);

      const [calls, extensions, dashboardKPIs, hourly, weekly, performance, satisfaction] = await Promise.all([
        dashboardService.getActiveCalls(),
        dashboardService.getExtensionStatuses(),
        dashboardService.getDashboardKPIs(),
        dashboardService.getHourlyStats(),
        dashboardService.getWeeklyCallStats(),
        dashboardService.getExtensionPerformance(),
        dashboardService.getSatisfaction().catch(
          () =>
            ({
              today: { satisfactionRate: 0, totalSurveys: 0, totalAnswers: 0, responseRate: 0, avgScore: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
              month: { satisfactionRate: 0, totalSurveys: 0, totalAnswers: 0, responseRate: 0, avgScore: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
              previousMonth: { satisfactionRate: 0, totalSurveys: 0, totalAnswers: 0, responseRate: 0, avgScore: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
              trendPercent: 0,
            } as SatisfactionStats)
        ),
      ]);

      setActiveCalls(calls);
      setExtensionStatuses(
        extensions.map((ext) => ({
          ...ext,
          todayStats: ext.todayStats || {
            total: 0,
            answered: 0,
            missed: 0,
            cancelled: 0,
          },
        }))
      );
      // رضایت امروز/ماه از اکشن satisfaction بک‌اند
      const todaySat = satisfaction?.today?.satisfactionRate;
      const monthSat = satisfaction?.month?.satisfactionRate;
      setKpis({
        ...dashboardKPIs,
        satisfactionTodayRate: Number.isFinite(todaySat as any) ? Number(todaySat) : dashboardKPIs.satisfactionTodayRate,
        satisfactionMonthRate: Number.isFinite(monthSat as any) ? Number(monthSat) : dashboardKPIs.satisfactionMonthRate,
        // برای سازگاری، satisfactionRate را روی ماه هم ست می‌کنیم تا Gauge/کارت‌ها عدد درست بگیرند
        satisfactionRate: Number.isFinite(monthSat as any) ? Number(monthSat) : dashboardKPIs.satisfactionRate,
        totalSurveys: satisfaction?.month?.totalSurveys ?? dashboardKPIs.totalSurveys,
      });
      setHourlyStats(hourly);
      setWeeklyStats(weekly);
      setExtensionPerformance(performance);

      // --- رضایت‌مندی ماهانه (از API satisfaction) ---
      const distC = satisfaction?.month?.dist || ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as any);
      const distRows = ([1, 2, 3, 4, 5] as const).map((s) => ({
        score: s,
        count: Number((distC as any)[s] ?? (distC as any)[String(s)] ?? 0),
      }));
      const trendPercent = Number(satisfaction?.trendPercent ?? 0);
      const trend: 'up' | 'down' | 'stable' = trendPercent > 0.01 ? 'up' : trendPercent < -0.01 ? 'down' : 'stable';

      setMonthlySatisfaction({
        monthRate: Number(satisfaction?.month?.satisfactionRate ?? 0),
        avgScore: Number(satisfaction?.month?.avgScore ?? 0),
        trendPercent: Number.isFinite(trendPercent) ? trendPercent : 0,
        trend,
        distribution: distRows as any,
        totalSurveys: Number(satisfaction?.month?.totalSurveys ?? 0),
      });

      setLastUpdated(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();

    dashboardService.subscribeToRealtimeUpdates({
      onCallUpdate: () => {
        dashboardService.getActiveCalls().then(setActiveCalls);
      },
      onExtensionUpdate: () => {
        dashboardService.getExtensionStatuses().then(setExtensionStatuses);
      },
      onStatsUpdate: () => {
        loadDashboardData(true);
      },
    });

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 1000);

    return () => {
      clearInterval(interval);
      dashboardService.unsubscribeFromRealtimeUpdates();
    };
  }, [loadDashboardData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !kpis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4 animate-pulse">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <p className="text-slate-600 font-medium">در حال بارگذاری داشبورد...</p>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">خطا در بارگذاری داشبورد</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              داشبورد مانیتورینگ تماس
            </h1>
            <p className="text-slate-600 flex items-center space-x-2 space-x-reverse">
              <span>آخرین بروزرسانی:</span>
              <span className="persian-numbers font-medium">{formatTime(lastUpdated)}</span>
            </p>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 space-x-reverse bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-slate-700 font-medium">بروزرسانی</span>
            </button>

            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="text-right mr-4 hidden lg:block">
                <div className="text-sm font-semibold text-slate-700">
                  سامانه مانیتورینگ تماس
                </div>
                <div className="text-xs text-slate-500">شبکه سازان تدبیر پارس</div>
              </div>
              <div className={`flex items-center space-x-2 space-x-reverse ${isConnected ? 'bg-green-50' : 'bg-red-50'} px-4 py-2 rounded-xl border ${isConnected ? 'border-green-200' : 'border-red-200'}`}>
                <div className={`w-2.5 h-2.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className={`${isConnected ? 'text-green-700' : 'text-red-700'} text-sm font-medium`}>
                  {isConnected ? 'متصل' : 'قطع شده'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Live Calls and Extension Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LiveCallMonitor calls={activeCalls} />
          <ExtensionStatusGrid extensions={extensionStatuses} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HourlyStatsChart stats={hourlyStats} peakHour={kpis?.peakHour ?? null} />
          <WeeklyCallStatusChart weekData={weeklyStats} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExtensionPerformanceList extensions={extensionPerformance} />
          <SatisfactionGauge
            rate={monthlySatisfaction.monthRate}
            totalSurveys={monthlySatisfaction.totalSurveys}
            avgScore={monthlySatisfaction.avgScore}
            trendPercent={monthlySatisfaction.trendPercent}
            trend={monthlySatisfaction.trend}
            distribution={monthlySatisfaction.distribution}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            © ۱۴۰۳ شبکه سازان تدبیر پارس | نسخه ۲.۰.۰
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
