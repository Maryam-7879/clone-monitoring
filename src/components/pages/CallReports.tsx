import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Phone,
  Download,
  Filter,
  Search,
  FileText,
  Volume2,
  Play,
  RotateCcw,
  PhoneIncoming,
  PhoneOutgoing,
  ArrowRight,
  Calendar,
} from 'lucide-react';

import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import moment from 'moment-jalaali';

type CallStatus = 'answered' | 'missed' | 'cancelled' | 'failed' | 'other';
type CallDirection = 'incoming' | 'outgoing';

type CallRecord = {
  id: string;
  date: string;
  time: string;
  source: string;       // مبدا برای نمایش
  destination: string;  // مقصد برای نمایش
  duration: number;
  status: CallStatus;
  direction: CallDirection;
  hasRecording: boolean;
  recordingUrl?: string | null;
  downloadUrl?: string | null;
};

type ApiCallRecord = {
  id: string;
  date: string;
  time: string;
  callerNumber?: string;
  extension?: string;
  sourceNumber?: string;
  destinationNumber?: string;
  duration?: number;
  status?: CallStatus;
  direction?: string; // "incoming" | "outgoing"
  hasRecording?: boolean;
  recordingUrl?: string | null;
  downloadUrl?: string | null;
};

type StatsType = {
  total: number;
  answered: number;
  missed: number;
  cancelled: number;
  withRecording: number;
  incoming: number;
  outgoing: number;
};

type ApiResponse = {
  status: 'success' | 'error';
  message?: string;
  calls?: ApiCallRecord[];
  stats?: StatsType;
  total?: number;
};

type Filters = {
  from: string;
  to: string;
  timeFrom: string;
  timeTo: string;
  extension: string;
  status: 'all' | CallStatus;
  direction: 'all' | CallDirection;
};

// فقط برای تست، عملاً در حالت useTestData=false استفاده نمی‌شه
const TEST_DATA: CallRecord[] = [
  {
    id: '1',
    date: '1404/09/02',
    time: '07:05:36',
    source: '09127108380',
    destination: '101',
    duration: 21,
    status: 'answered',
    direction: 'incoming',
    hasRecording: true,
    recordingUrl: '#',
  },
  {
    id: '2',
    date: '1404/09/02',
    time: '07:02:28',
    source: '09127108380',
    destination: '101',
    duration: 13,
    status: 'answered',
    direction: 'incoming',
    hasRecording: true,
    recordingUrl: '#',
  },
  {
    id: '3',
    date: '1404/09/02',
    time: '06:50:44',
    source: '101',
    destination: '989127108380',
    duration: 24,
    status: 'answered',
    direction: 'outgoing',
    hasRecording: true,
    recordingUrl: '#',
  },
  {
    id: '4',
    date: '1404/09/02',
    time: '06:47:18',
    source: '101',
    destination: '989127108380',
    duration: 10,
    status: 'answered',
    direction: 'outgoing',
    hasRecording: true,
    recordingUrl: '#',
  },
];

const CallReports: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';
  const userExtension = (user as any)?.extension || (user as any)?.scopes?.extensions?.[0] || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const useTestData = false;

  const [filters, setFilters] = useState<Filters>({
    from: '',
    to: '',
    timeFrom: '',
    timeTo: '',
    extension: '',
    status: 'all',
    direction: 'all',
  });

  // اگر کاربر «کارشناس» باشد، فقط به گزارش داخلی خودش دسترسی دارد
  useEffect(() => {
    if (isAgent && userExtension) {
      setFilters(prev => ({ ...prev, extension: userExtension }));
    }
  }, [isAgent, userExtension]);

  const [fromDate, setFromDate] = useState<any>(null);
  const [toDate, setToDate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<StatsType>({
    total: 0,
    answered: 0,
    missed: 0,
    cancelled: 0,
    withRecording: 0,
    incoming: 0,
    outgoing: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

  // ---- کنترل پخش صدا ----
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const [audioState, setAudioState] = useState<
    Record<string, { current: number; duration: number }>
  >({});

  const updateAudioState = (id: string, current: number, duration: number) => {
    setAudioState((prev) => ({
      ...prev,
      [id]: {
        current,
        duration: duration && isFinite(duration) ? duration : prev[id]?.duration ?? 0,
      },
    }));
  };

  const handlePlay = (id: string) => {
    const audio = audioRefs.current[id];
    if (!audio) return;

    if (audio.paused) {
      // بقیه صداها را متوقف کن
      Object.entries(audioRefs.current).forEach(([otherId, otherAudio]) => {
        if (otherId !== id && otherAudio) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });
      audio.play();
    } else {
      audio.pause();
    }
  };

  const formatSeconds = (secs: number): string => {
    if (!secs || !isFinite(secs)) return '0:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatJalaliDate = (gregDate: string): string => {
    if (!gregDate) return '';
    try {
      const [datePart] = gregDate.split(' ');
      return moment(datePart, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
    } catch {
      return gregDate;
    }
  };

  const buildQueryString = () => {
    const params = new URLSearchParams();

    params.append('page', String(currentPage));
    params.append('limit', String(itemsPerPage));

    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    if (isAgent && userExtension) {
      params.append('extension', userExtension);
    } else if (filters.extension.trim()) {
      params.append('extension', filters.extension.trim());
    }
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.direction !== 'all') params.append('direction', filters.direction);

    if (filters.from) params.append('date_from', filters.from);
    if (filters.to) params.append('date_to', filters.to);
    if (filters.timeFrom) params.append('time_from', filters.timeFrom);
    if (filters.timeTo) params.append('time_to', filters.timeTo);

    return params.toString();
  };

  const filterTestData = (data: CallRecord[]): CallRecord[] => {
    return data.filter((call) => {
      if (searchTerm.trim()) {
        const search = searchTerm.trim();
        if (!call.source.includes(search) && !call.destination.includes(search)) {
          return false;
        }
      }

      if (filters.extension.trim()) {
        const ext = filters.extension.trim();
        if (!call.source.includes(ext) && !call.destination.includes(ext)) {
          return false;
        }
      }

      if (filters.status !== 'all' && call.status !== filters.status) {
        return false;
      }

      if (filters.direction !== 'all' && call.direction !== filters.direction) {
        return false;
      }

      if (filters.timeFrom) {
        if (call.time < filters.timeFrom) {
          return false;
        }
      }

      if (filters.timeTo) {
        if (call.time > filters.timeTo) {
          return false;
        }
      }

      return true;
    });
  };

  const calculateStats = (data: CallRecord[]): StatsType => {
    return {
      total: data.length,
      answered: data.filter((c) => c.status === 'answered').length,
      missed: data.filter((c) => c.status === 'missed').length,
      cancelled: data.filter((c) => c.status === 'cancelled').length,
      withRecording: data.filter((c) => c.hasRecording).length,
      incoming: data.filter((c) => c.direction === 'incoming').length,
      outgoing: data.filter((c) => c.direction === 'outgoing').length,
    };
  };

  useEffect(() => {
    const fetchCalls = async () => {
      if (useTestData) {
        setLoading(true);
        setTimeout(() => {
          const filtered = filterTestData(TEST_DATA);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginated = filtered.slice(startIndex, endIndex);

          setCalls(paginated);
          const s = calculateStats(filtered);
          setStats(s);
          setTotalItems(filtered.length);
          setLoading(false);
        }, 300);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const qs = buildQueryString();
        const res = await fetch(
          `/survay/api/call_reports.php${qs ? `?${qs}` : ''}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: ApiResponse = await res.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'خطا در دریافت اطلاعات از سرور');
        }

        const rawList = data.calls || [];

        const adaptedList: CallRecord[] = rawList.map((item) => {
          const source =
            item.sourceNumber ||
            item.callerNumber ||
            '';
          const destination =
            item.destinationNumber ||
            item.extension ||
            '';
          const direction: CallDirection =
            item.direction === 'outgoing' ? 'outgoing' : 'incoming';

          const recordingUrl = item.recordingUrl || undefined;
          const downloadUrl = item.downloadUrl || undefined;
          const hasRec = !!item.hasRecording && (!!recordingUrl || !!downloadUrl);

          return {
            id: item.id,
            date: item.date,
            time: item.time,
            source,
            destination,
            duration: item.duration ?? 0,
            status: (item.status as CallStatus) || 'other',
            direction,
            hasRecording: hasRec,
            recordingUrl,
            downloadUrl,
          };
        });

        setCalls(adaptedList);

        const localStats = calculateStats(adaptedList);

        setStats({
          total: data.stats?.total ?? data.total ?? localStats.total,
          answered: data.stats?.answered ?? localStats.answered,
          missed: data.stats?.missed ?? localStats.missed,
          cancelled: data.stats?.cancelled ?? localStats.cancelled,
          withRecording: data.stats?.withRecording ?? localStats.withRecording,
          incoming: data.stats?.incoming ?? localStats.incoming,
          outgoing: data.stats?.outgoing ?? localStats.outgoing,
        });

        setTotalItems(data.total ?? data.stats?.total ?? localStats.total);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'خطا در ارتباط با سرور');
        setCalls([]);
        setStats({
          total: 0,
          answered: 0,
          missed: 0,
          cancelled: 0,
          withRecording: 0,
          incoming: 0,
          outgoing: 0,
        });
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [searchTerm, filters, currentPage, itemsPerPage, useTestData]);

  const handleExport = (format: 'pdf' | 'excel') => {
    const qs = buildQueryString();
    const url = `/survay/api/call_reports_export.php?format=${format}${
      qs ? `&${qs}` : ''
    }`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => handleExport('pdf');
  const handleExportExcel = () => handleExport('excel');

  const clearFilters = () => {
    setFilters({
      from: '',
      to: '',
      timeFrom: '',
      timeTo: '',
      extension: '',
      status: 'all',
      direction: 'all',
    });
    setFromDate(null);
    setToDate(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: CallStatus) => {
    if (status === 'answered') {
      return <span className="text-xs text-green-600 font-medium">پاسخ داده شده</span>;
    }
    if (status === 'missed') {
      return <span className="text-xs text-red-600 font-medium">بی‌پاسخ</span>;
    }
    if (status === 'cancelled') {
      return <span className="text-xs text-yellow-600 font-medium">لغو شده</span>;
    }
    if (status === 'failed') {
      return <span className="text-xs text-red-600 font-medium">ناموفق</span>;
    }
    return <span className="text-xs text-slate-600 font-medium">{status}</span>;
  };

  if (error) {
    return <ErrorMessage message={error} onRetry={() => setError(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* هدر و دکمه‌ها */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Phone className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">گزارش تماس‌ها</h1>
            <p className="text-sm text-slate-500">مشاهده و فیلتر تماس‌ها همراه با وضعیت و ضبط مکالمه</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>فیلترها</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || totalItems === 0}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            <span>خروجی PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || totalItems === 0}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={() => setCurrentPage(1)}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>بازخوانی</span>
          </button>
        </div>
      </div>

      {/* کارت‌های آمار بالا؛ از stats می‌خوانند */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">کل تماس‌ها</p>
              <p className="text-2xl font-bold text-slate-800 persian-numbers">{stats.total}</p>
            </div>
            <Phone className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">پاسخ داده شده</p>
              <p className="text-2xl font-bold text-green-600 persian-numbers">{stats.answered}</p>
            </div>
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">بی‌پاسخ</p>
              <p className="text-2xl font-bold text-yellow-600 persian-numbers">{stats.missed}</p>
            </div>
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">دارای ضبط</p>
              <p className="text-2xl font-bold text-orange-600 persian-numbers">{stats.withRecording}</p>
            </div>
            <Volume2 className="h-6 w-6 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">تماس ورودی</p>
              <p className="text-2xl font-bold text-cyan-600 persian-numbers">{stats.incoming}</p>
            </div>
            <PhoneIncoming className="h-6 w-6 text-cyan-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">تماس خروجی</p>
              <p className="text-2xl font-bold text-purple-600 persian-numbers">{stats.outgoing}</p>
            </div>
            <PhoneOutgoing className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* فیلترها */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                از تاریخ (شمسی)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <DatePicker
                  value={fromDate}
                  onChange={(value: any) => {
                    setFromDate(value);
                    if (value && (value as any).toDate) {
                      const d: Date = (value as any).toDate();
                      const iso = d.toISOString().slice(0, 10);
                      setFilters((prev) => ({ ...prev, from: iso }));
                    } else {
                      setFilters((prev) => ({ ...prev, from: '' }));
                    }
                    setCurrentPage(1);
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  calendarPosition="bottom-right"
                  inputClass="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                تا تاریخ (شمسی)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <DatePicker
                  value={toDate}
                  onChange={(value: any) => {
                    setToDate(value);
                    if (value && (value as any).toDate) {
                      const d: Date = (value as any).toDate();
                      const iso = d.toISOString().slice(0, 10);
                      setFilters((prev) => ({ ...prev, to: iso }));
                    } else {
                      setFilters((prev) => ({ ...prev, to: '' }));
                    }
                    setCurrentPage(1);
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  calendarPosition="bottom-right"
                  inputClass="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                از ساعت (قبل از ظهر / بعد از ظهر - ق ظ / ب ظ)
              </label>
              <input
                type="time"
                value={filters.timeFrom}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, timeFrom: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                تا ساعت (قبل از ظهر / بعد از ظهر - ق ظ / ب ظ)
              </label>
              <input
                type="time"
                value={filters.timeTo}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, timeTo: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                داخلی
              </label>
              <input
                type="text"
                value={filters.extension}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!isAgent) setFilters((prev) => ({ ...prev, extension: val }));
                  setCurrentPage(1);
                }}
                placeholder="مثال: 101"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                
                disabled={isAgent}
              />
            </div>
              {isAgent && userExtension && (
                <p className="text-xs text-slate-500 mt-1">فقط گزارش‌های داخلی خودتان ({userExtension}) نمایش داده می‌شود.</p>
              )}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                وضعیت تماس
              </label>
              <select
                value={filters.status}
                onChange={(e) => {
                  const val = e.target.value as Filters['status'];
                  setFilters((prev) => ({ ...prev, status: val }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="answered">پاسخ داده شده</option>
                <option value="missed">بی‌پاسخ</option>
                <option value="cancelled">لغو شده</option>
                <option value="failed">ناموفق</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                نوع تماس
              </label>
              <select
                value={filters.direction}
                onChange={(e) => {
                  const val = e.target.value as Filters['direction'];
                  setFilters((prev) => ({ ...prev, direction: val }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">همه</option>
                <option value="incoming">ورودی</option>
                <option value="outgoing">خروجی</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              جستجو
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="جستجو در شماره مبدا یا مقصد..."
                className="w-full pr-10 pl-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      )}

      {/* جدول تماس‌ها */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">لیست تماس‌ها</h3>
        </div>

        {loading ? (
          <LoadingSpinner className="py-12" text="در حال بارگذاری..." />
        ) : calls.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            هیچ تماسی یافت نشد
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">تاریخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">ساعت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">مبدا</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600"></th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">مقصد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">مدت (ثانیه)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">نوع</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600">ضبط مکالمه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calls.map((call) => {
                    const s = audioState[call.id];
                    const cur = s?.current ?? 0;
                    const dur =
                      s?.duration && isFinite(s.duration) && s.duration > 0
                        ? s.duration
                        : call.duration || 0;
                    const percent = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;

                    return (
                      <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-800 persian-numbers whitespace-nowrap">
                          {formatJalaliDate(call.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 persian-numbers whitespace-nowrap">
                          {call.time}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 persian-numbers font-medium whitespace-nowrap">
                          {call.source || '-'}
                        </td>
                        <td className="px-2 py-4 text-center">
                          <ArrowRight className="h-4 w-4 text-slate-400 mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 persian-numbers font-medium whitespace-nowrap">
                          {call.destination || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 persian-numbers whitespace-nowrap">
                          {call.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {call.direction === 'incoming' ? (
                            <span className="inline-flex items-center space-x-1 space-x-reverse text-xs text-cyan-600 font-medium">
                              <PhoneIncoming className="h-3 w-3" />
                              <span>ورودی</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 space-x-reverse text-xs text-purple-600 font-medium">
                              <PhoneOutgoing className="h-3 w-3" />
                              <span>خروجی</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(call.status)}
                        </td>
                        <td className="px-6 py-4">
                          {call.hasRecording && (call.recordingUrl || call.downloadUrl) ? (
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <audio
                                ref={(el) => {
                                  audioRefs.current[call.id] = el;
                                }}
                                src={call.recordingUrl || call.downloadUrl || undefined}
                                onLoadedMetadata={(e) =>
                                  updateAudioState(
                                    call.id,
                                    0,
                                    e.currentTarget.duration
                                  )
                                }
                                onTimeUpdate={(e) =>
                                  updateAudioState(
                                    call.id,
                                    e.currentTarget.currentTime,
                                    e.currentTarget.duration
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={() => handlePlay(call.id)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                              >
                                <Play className="h-4 w-4 text-blue-600" />
                              </button>
                              <button
                                type="button"
                                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                              >
                                <Volume2 className="h-4 w-4 text-slate-600" />
                              </button>
                              <a
                                href={call.downloadUrl || call.recordingUrl || undefined}
                                download
                                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                              >
                                <Download className="h-4 w-4 text-slate-600" />
                              </a>
                              <div className="flex-1 min-w-[100px]">
                                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 mt-1 persian-numbers">
                                  <span>{formatSeconds(cur)}</span>
                                  <span>{formatSeconds(dur)}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">بدون ضبط</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify بین">
                <div className="text-sm text-slate-600">
                  صفحه {currentPage} از {totalPages}
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CallReports;
