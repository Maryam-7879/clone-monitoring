export type CallStatus = 'answered' | 'missed' | 'cancelled' | 'active' | 'ringing' | 'on-hold';

export interface ActiveCall {
  id: string;
  phoneNumber: string;
  extension: string;
  status: CallStatus;
  startTime: string;
  startTimestamp?: number;
  duration: number;
  callerName?: string;
}

export interface ExtensionStatus {
  extension: string;
  status: 'idle' | 'busy' | 'ringing' | 'offline';
  currentCall?: ActiveCall;
  todayStats: {
    total: number;
    answered: number;
    missed: number;
    cancelled: number;
  };
}

export interface DashboardKPIs {
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
  /**
   * درصد رضایت (۰ تا ۱۰۰)
   * NOTE: برای سازگاری با نسخه‌های قبلی، اگر فیلدهای تفکیک‌شده امروز/ماه وجود نداشتند،
   * همین مقدار استفاده می‌شود.
   */
  satisfactionRate: number;

  /** درصد رضایت امروز (۰ تا ۱۰۰) */
  satisfactionTodayRate?: number;
  /** درصد رضایت ماه جاری (۰ تا ۱۰۰) */
  satisfactionMonthRate?: number;

  totalSurveys: number;
  peakHour: string;
  responseRate: number; // نرخ پاسخ‌دهی نظرسنجی
}

export interface HourlyStats {
  hour: string;       // '00'..'23'
  calls: number;
  answered: number;
  missed: number;
  trend: 'up' | 'down' | 'stable';
}

export interface InsightItem {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  metric?: number;
}

export interface ExtensionPerformance {
  extension: string;
  name?: string;
  totalCalls: number;
  answered: number;
  missed: number;
  cancelled: number;
  successRate: number;
  avgDuration: string;
  satisfactionScore: number;
}

export interface WeeklyDayStats {
  day: string;      // '2025-11-29'
  dayName: string;  // 'شنبه'، 'یکشنبه' و ...
  answered: number;
  missed: number;
  total: number;
}

// -----------------------------
// Satisfaction (Survey) Stats
// -----------------------------

export type SatisfactionDist = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export interface SatisfactionBucket {
  satisfactionRate: number; // 0..100
  totalSurveys: number;
  totalAnswers: number;
  responseRate: number;
  avgScore: number; // 0..5
  dist: SatisfactionDist;
}

export interface SatisfactionStats {
  today: SatisfactionBucket;
  month: SatisfactionBucket;
  previousMonth: SatisfactionBucket;
  trendPercent: number;
}
