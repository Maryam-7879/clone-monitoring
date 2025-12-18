import { formatJalaliDate, formatJalaliTime, getCurrentJalaliDate } from '../utils/dateUtils';

export interface CallRecord {
  id: string;
  date: string;
  time: string;
  callerNumber: string;
  extension: string;
  duration: string;
  status: 'answered' | 'missed' | 'cancelled';
  hasRecording: boolean;
  recordingUrl?: string;
}

export interface SurveyRecord {
  id: string;
  callerNumber: string;
  extension: string;
  rating: number;
  date: string;
  comment?: string;
}

interface DashboardStats {
  totalCalls: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  callStatus: {
    answered: number;
    missed: number;
    cancelled: number;
  };
  averageDuration: string;
  satisfactionRate: number;
  peakHours: {
    hour: string;
    calls: number;
  }[];
}

// Generate mock data with Jalali dates
const generateMockCalls = (): CallRecord[] => {
  const calls: CallRecord[] = [];
  const today = getCurrentJalaliDate();
  const phoneNumbers = [
    '۰۹۱۲۳۴۵۶۷۸۹',
    '۰۹۱۸۷۶۵۴۳۲۱', 
    '۰۹۱۱۱۲۳۴۵۶۷',
    '۰۹۱۹۸۷۶۵۴۳۲',
    '۰۹۳۳۱۲۳۴۵۶۷',
    '۰۹۱۵۵۵۱۲۳۴۵',
    '۰۹۱۷۷۷۸۸۸۹۹',
    '۰۹۱۰۰۰۱۱۱۲۲'
  ];
  
  const extensions = ['۱۰۱', '۱۰۲', '۱۰۳', '۱۰۴', '۱۰۵'];
  const statuses: CallRecord['status'][] = ['answered', 'missed', 'cancelled'];
  
  for (let i = 0; i < 50; i++) {
    const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const duration = status === 'answered' 
      ? `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
      : '۰:۰۰';
    
    calls.push({
      id: (i + 1).toString(),
      date: today,
      time,
      callerNumber: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
      extension: extensions[Math.floor(Math.random() * extensions.length)],
      duration,
      status,
      hasRecording: status === 'answered' && Math.random() > 0.3,
      recordingUrl: status === 'answered' ? `/recordings/call_${i + 1}.mp3` : undefined
    });
  }
  
  return calls.sort((a, b) => b.time.localeCompare(a.time));
};

// Generate mock surveys
const generateMockSurveys = (): SurveyRecord[] => {
  const surveys: SurveyRecord[] = [];
  const today = getCurrentJalaliDate();
  const phoneNumbers = [
    '۰۹۱۲۳۴۵۶۷۸۹',
    '۰۹۱۸۷۶۵۴۳۲۱', 
    '۰۹۱۱۱۲۳۴۵۶۷',
    '۰۹۱۹۸۷۶۵۴۳۲',
    '۰۹۳۳۱۲۳۴۵۶۷'
  ];
  
  const extensions = ['۱۰۱', '۱۰۲', '۱۰۳', '۱۰۴', '۱۰۵'];
  const comments = [
    'خدمات عالی بود',
    'پاسخگویی سریع و مؤثر',
    'نیاز به بهبود دارد',
    'کیفیت صدا مناسب نبود',
    'راضی هستم از خدمات'
  ];
  
  for (let i = 0; i < 25; i++) {
    const rating = Math.floor(Math.random() * 5) + 1;
    
    surveys.push({
      id: (i + 1).toString(),
      callerNumber: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
      extension: extensions[Math.floor(Math.random() * extensions.length)],
      rating,
      date: today,
      comment: rating <= 3 ? comments[Math.floor(Math.random() * comments.length)] : undefined
    });
  }
  
  return surveys;
};

export const mockCalls: CallRecord[] = generateMockCalls();
export const mockSurveys: SurveyRecord[] = generateMockSurveys();

export const mockStats: DashboardStats = {
  totalCalls: {
    today: mockCalls.length,
    thisWeek: mockCalls.length * 7,
    thisMonth: mockCalls.length * 30
  },
  callStatus: {
    answered: mockCalls.filter(call => call.status === 'answered').length,
    missed: mockCalls.filter(call => call.status === 'missed').length,
    cancelled: mockCalls.filter(call => call.status === 'cancelled').length
  },
  averageDuration: '۴:۳۲',
  satisfactionRate: Math.round((mockSurveys.filter(s => s.rating >= 4).length / mockSurveys.length) * 100),
  peakHours: [
    { hour: '۰۹:۰۰', calls: 12 },
    { hour: '۱۰:۰۰', calls: 18 },
    { hour: '۱۱:۰۰', calls: 15 },
    { hour: '۱۴:۰۰', calls: 22 },
    { hour: '۱۵:۰۰', calls: 19 },
    { hour: '۱۶:۰۰', calls: 16 }
  ]
};