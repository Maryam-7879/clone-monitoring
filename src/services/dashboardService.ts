import axios from 'axios';
import type {
  ActiveCall,
  ExtensionStatus,
  DashboardKPIs,
  HourlyStats,
  InsightItem,
  ExtensionPerformance,
  WeeklyDayStats,
  SatisfactionStats
} from '../types/dashboard';

const DASHBOARD_API_BASE = '/survay/api/dashboard_api.php';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // --- Helper عمومی برای صدا زدن PHP API ---
  private async callApi<T>(action: string): Promise<T> {
    const formData = new FormData();
    formData.append('action', action);

    const response = await axios.post<ApiResponse<T>>(
      DASHBOARD_API_BASE,
      formData,
      {
        withCredentials: true,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Dashboard API error');
    }

    return response.data.data;
  }

  // --- ۱. KPIs اصلی داشبورد ---
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const data = await this.callApi<{
        totalCalls: {
          today: number;
          thisWeek: number;
          thisMonth: number;
          percentChange: number;
        };
        callStatus: {
          answered: number;
          missed: number;
          cancelled: number;
        };
        activeCalls: number;
        averageDuration: string;
        // برای سازگاری: ممکن است فقط satisfactionRate قدیمی وجود داشته باشد
        satisfactionRate: number;
        satisfaction_today?: number;
        satisfaction_month?: number;
        totalSurveys: number;
        peakHour: string | null;
        responseRate: number;
      }>('kpis');

      return {
        totalCalls: {
          today: data.totalCalls.today,
          thisWeek: data.totalCalls.thisWeek,
          thisMonth: data.totalCalls.thisMonth,
          percentChange: data.totalCalls.percentChange,
        },
        callStatus: {
          answered: data.callStatus.answered,
          missed: data.callStatus.missed,
          cancelled: data.callStatus.cancelled,
        },
        activeCalls: data.activeCalls,
        averageDuration: data.averageDuration || '00:00',
        satisfactionRate: data.satisfactionRate || 0,
        // اگر بک‌اند این دو مقدار را بدهد، در UI دقیق‌تر استفاده می‌کنیم
        satisfactionTodayRate: (data as any).satisfaction_today != null ? Number((data as any).satisfaction_today) : undefined,
        satisfactionMonthRate: (data as any).satisfaction_month != null ? Number((data as any).satisfaction_month) : undefined,
        totalSurveys: data.totalSurveys || 0,
        peakHour: data.peakHour || '00',
        responseRate: data.responseRate || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      // مقدار امن تا UI کرش نکند
      return {
        totalCalls: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          percentChange: 0,
        },
        callStatus: {
          answered: 0,
          missed: 0,
          cancelled: 0,
        },
        activeCalls: 0,
        averageDuration: '00:00',
        satisfactionRate: 0,
        totalSurveys: 0,
        peakHour: '00',
        responseRate: 0,
      };
    }
  }

  // --- ۱.۵. رضایت‌مندی (امروز/ماه/ماه قبل) ---
  async getSatisfaction(): Promise<SatisfactionStats> {
    try {
      const data = await this.callApi<SatisfactionStats>('satisfaction');

      // sanitize numbers (PHP ممکن است string بدهد)
      const toNum = (v: any) => (v == null || v === '' ? 0 : Number(v));
      const fixBucket = (b: any) => {
        const dist = b?.dist || {};
        return {
          satisfactionRate: toNum(b?.satisfactionRate),
          totalSurveys: toNum(b?.totalSurveys),
          totalAnswers: toNum(b?.totalAnswers),
          responseRate: toNum(b?.responseRate),
          avgScore: toNum(b?.avgScore),
          dist: {
            1: toNum(dist?.[1] ?? dist?.['1']),
            2: toNum(dist?.[2] ?? dist?.['2']),
            3: toNum(dist?.[3] ?? dist?.['3']),
            4: toNum(dist?.[4] ?? dist?.['4']),
            5: toNum(dist?.[5] ?? dist?.['5']),
          },
        };
      };

      return {
        today: fixBucket((data as any).today),
        month: fixBucket((data as any).month),
        previousMonth: fixBucket((data as any).previousMonth),
        trendPercent: toNum((data as any).trendPercent),
      };
    } catch (error) {
      console.error('Error fetching satisfaction stats:', error);
      return {
        today: { satisfactionRate: 0, totalSurveys: 0, totalAnswers: 0, responseRate: 0, avgScore: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        month: { satisfactionRate: 0, totalSurveys: 0, totalAnswers: 0, responseRate: 0, avgScore: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        previousMonth: { satisfactionRate: 0, totalSurveys: 0, totalAnswers: 0, responseRate: 0, avgScore: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        trendPercent: 0,
      };
    }
  }

  // --- ۲. نمودار ساعتی امروز ---
  async getHourlyStats(): Promise<HourlyStats[]> {
    try {
      const data = await this.callApi<
        { hour: string; calls: number; answered: number; missed: number; trend: 'up' | 'down' | 'stable' }[]
      >('hourly_stats');

      return data.map((item) => ({
        hour: item.hour,
        calls: item.calls,
        answered: item.answered,
        missed: item.missed,
        trend: item.trend,
      }));
    } catch (error) {
      console.error('Error fetching hourly stats:', error);
      return [];
    }
  }

  // --- ۳. آمار روزانه هفتگی ---
  async getWeeklyCallStats(): Promise<WeeklyDayStats[]> {
    try {
      const data = await this.callApi<
        { day: string; dayName: string; answered: number; missed: number; total: number }[]
      >('weekly_stats');

      return data.map((item) => ({
        day: item.day,
        dayName: item.dayName, // در صورت نیاز می‌تونی در UI فارسی‌اش کنی
        answered: item.answered,
        missed: item.missed,
        total: item.total,
      }));
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return [];
    }
  }

  // --- ۴. عملکرد داخلی‌ها ---
  async getExtensionPerformance(): Promise<ExtensionPerformance[]> {
    try {
      const data = await this.callApi<
        {
          extension: string;
          name: string | null;
          totalCalls: number;
          answered: number;
          missed: number;
          cancelled: number;
          successRate: number;
          avgDuration: string;
          satisfactionScore: number;
        }[]
      >('extension_performance');

      return data.map((perf) => ({
        extension: perf.extension,
        name: perf.name || `داخلی ${perf.extension}`,
        totalCalls: perf.totalCalls,
        answered: perf.answered,
        missed: perf.missed,
        cancelled: perf.cancelled,
        successRate: Math.round(perf.successRate),
        avgDuration: perf.avgDuration || '00:00',
        satisfactionScore: perf.satisfactionScore || 0,
      }));
    } catch (error) {
      console.error('Error fetching extension performance:', error);
      return [];
    }
  }

  // --- ۵. تماس‌های فعال (از AMI) ---
  async getActiveCalls(): Promise<ActiveCall[]> {
    try {
      const data = await this.callApi<
        {
          id: string;
          phoneNumber: string;
          extension: string;
          status: string;
          startTime: string;
          duration: number;
          startTimestamp?: number;
          
          callerName?: string | null;
        }[]
      >('active_calls');

      return data.map((call) => ({
        id: call.id,
        phoneNumber: call.phoneNumber,
        extension: call.extension,
        status: (call.status as ActiveCall['status']) || 'active',
        startTime: call.startTime,
        startTimestamp: (call as any).startTimestamp ?? undefined,
        duration: call.duration,
        callerName: call.callerName || undefined,
      }));
    } catch (error) {
      console.error('Error fetching active calls:', error);
      return [];
    }
  }

  // --- ۶. وضعیت داخلی‌ها ---
  async getExtensionStatuses(): Promise<ExtensionStatus[]> {
    try {
      const data = await this.callApi<
        {
          extension: string;
          status: string;
          currentCall: null | {
            id: string;
            phoneNumber: string;
            extension: string;
            status: string;
            startTime: string;
            duration: number;
            callerName?: string | null;
          };
          totalCalls?: number;
          answered?: number;
          missed?: number;
          successRate?: number;
          todayTotal?: number;
          todayAnswered?: number;
          todayMissed?: number;
        }[]
      >('extension_statuses');

      return data.map((ext) => ({
        extension: ext.extension,
        status: (ext.status as ExtensionStatus['status']) || 'idle',
        currentCall: ext.currentCall
          ? {
              id: ext.currentCall.id,
              phoneNumber: ext.currentCall.phoneNumber,
              extension: ext.currentCall.extension,
              status: (ext.currentCall.status as ActiveCall['status']) || 'active',
              startTime: ext.currentCall.startTime,
              duration: ext.currentCall.duration,
              callerName: ext.currentCall.callerName || undefined,
            }
          : undefined,

        todayStats: {
          total: (ext.todayTotal ?? ext.totalCalls ?? 0) as number,
          answered: (ext.todayAnswered ?? ext.answered ?? 0) as number,
          missed: (ext.todayMissed ?? ext.missed ?? 0) as number,
          cancelled: 0,
        },
      }));
    } catch (error) {
      console.error('Error fetching extension statuses:', error);
      return [];
    }
  }

  // --- ۷. اینسایت‌ها ---
  async getInsights(): Promise<InsightItem[]> {
    try {
      const data = await this.callApi<
        { id: string; type: string; title: string; message: string; timestamp: string; metric: number | null }[]
      >('insights');

      return data.map((ins) => ({
        id: ins.id,
        type: ins.type as InsightItem['type'],
        title: ins.title,
        message: ins.message,
        timestamp: ins.timestamp,
        metric: ins.metric ?? undefined,
      }));
    } catch (error) {
      console.error('Error fetching insights:', error);
      return [];
    }
  }

  // --- ۸. Realtime: فعلاً غیرفعال (Supabase حذف شد) ---
  subscribeToRealtimeUpdates() {
    // برای سازگاری با کامپوننت‌هایی که این متد را صدا می‌زنند
    return null;
  }

  unsubscribeFromRealtimeUpdates() {
    // عملاً کاری انجام نمی‌دهیم
  }
}

export const dashboardService = DashboardService.getInstance();
