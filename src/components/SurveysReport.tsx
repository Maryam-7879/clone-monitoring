import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageSquare,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Filter,
  Download,
  Clock,
  Phone,
  User,
  Calendar,
  Search,
  RefreshCw,
} from 'lucide-react';
import { fetchSurveyResults } from '../services/api.survey';
import {
  SurveyResult,
  SurveyFilters,
  SurveyStats,
  AgentPerformance,
} from '../types/survey';
import {
  calculateSurveyStats,
  calculateAgentPerformance,
  formatTalkTime,
  formatDate,
  formatTime,
} from '../adapters/surveyAdapter';

// خروجی اکسل
import * as XLSX from 'xlsx';

// خروجی PDF: گرفتن اسکرین‌شات از جدول (سازگار با فارسی)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// پخش‌کننده صوت
import AudioPlayer from './common/AudioPlayer';

// تقویم شمسی
// @ts-ignore
import DatePicker from 'react-multi-date-picker';
// @ts-ignore
import persian from 'react-date-object/calendars/persian';
// @ts-ignore
import persian_fa from 'react-date-object/locales/persian_fa';

const emptyStats: SurveyStats = {
  totalSurveys: 0,
  averageScore: 0,
  satisfactionRate: 0,
  dissatisfactionRate: 0,
  averageTalkTime: 0,
  scoreDistribution: {},
};

const SurveysReport: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';
  const userExtension = (user as any)?.extension || (user as any)?.scopes?.extensions?.[0] || '';
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [stats, setStats] = useState<SurveyStats>(emptyStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState<SurveyFilters>({
    page: 1,
    pageSize: 25,
    from: undefined,
    to: undefined,
    queue: '',
    agent: '',
    caller: '',
    minScore: undefined,
    maxScore: undefined,
  });

  useEffect(() => {
    if (isAgent && userExtension) {
      // فیلتر داخلی کارشناس را در state نگه می‌داریم
      // و برای اینکه از همان ابتدا/بعد از لود شدن کاربر اعمال شود، یک بار دیتا را هم با همین فیلتر رفرش می‌کنیم
      const merged = (prev: SurveyFilters) => ({ ...prev, extension: userExtension } as any);
      setFilters(merged);
      // اگر user بعداً لود شود، loadData اولیه بدون فیلتر اجرا شده؛ اینجا یک بار مجدد با فیلتر داخلی می‌گیریم
      loadData({ ...(filters as any), extension: userExtension, page: 1 } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgent, userExtension]);

  const [showFilters, setShowFilters] = useState(false);

  // تاریخ‌های انتخابی شمسی برای UI
  const [fromDate, setFromDate] = useState<any>(null);
  const [toDate, setToDate] = useState<any>(null);

  // رفرنس به بخش جدول برای گرفتن اسکرین‌شات
  const tableRef = useRef<HTMLDivElement | null>(null);

  const handleExportExcel = () => {
    if (!results || results.length === 0) return;

    const rows = results.map((r, idx) => ({
      ردیف: idx + 1,
      تاریخ: formatDate(r.callDate),
      ساعت: formatTime(r.startedAt || r.callDate),
      'شماره تماس': r.callerNumber,
      صف: r.queue,
      کارشناس: r.agent,
      امتیاز: r.score ?? '',
      'مدت مکالمه': formatTalkTime(r.talkTime),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Surveys');

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    XLSX.writeFile(workbook, `Survey_Report_${ts}.xlsx`);
  };

  // خروجی PDF: اسکرین‌شات از جدول با html2canvas + jsPDF
  const handleExportPDF = async () => {
    if (!results || results.length === 0 || !tableRef.current) return;

    const element = tableRef.current;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL('image/png');

      // PDF A4 افقی
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // عنوان گزارش
      pdf.setFontSize(12);
      pdf.text('گزارش نظرسنجی مشتریان', pageWidth - 10, 8, { align: 'right' });

      const imgWidth = pageWidth - 20; // حاشیه چپ/راست
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const availableHeight = pageHeight - 15 - 10; // از ۱۵ به بعد + حاشیه پایین
      let finalImgWidth = imgWidth;
      let finalImgHeight = imgHeight;

      if (finalImgHeight > availableHeight) {
        const ratio = availableHeight / finalImgHeight;
        finalImgWidth *= ratio;
        finalImgHeight *= ratio;
      }

      const posX = (pageWidth - finalImgWidth) / 2;
      const posY = 15;

      pdf.addImage(imgData, 'PNG', posX, posY, finalImgWidth, finalImgHeight);
      pdf.save(`Survey_Report_${ts}.pdf`);
    } catch (err) {
      console.error('خطا در ساخت PDF:', err);
      alert('خطا در ساخت PDF. لطفاً کنسول مرورگر را بررسی کنید.');
    }
  };

  const agentPerformance: AgentPerformance[] = useMemo(
    () => calculateAgentPerformance(results),
    [results]
  );

  const loadData = async (newFilters: SurveyFilters = filters) => {
    // برای نقش کارشناس: همیشه فیلتر داخلی خودش اعمال شود (حتی در اولین لود یا پاک کردن فیلترها)
    const effectiveFilters: SurveyFilters = { ...(newFilters as any) };
    if (isAgent && userExtension) {
      // در خروجی survey، فیلتر بر اساس agent (داخلی پاسخگو) اعمال می‌شود
      (effectiveFilters as any).agent = userExtension;
      // اگر extension هم ست شده باشد ممکن است رکوردها را صفر کند، پس پاک می‌کنیم
      delete (effectiveFilters as any).extension;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchSurveyResults(effectiveFilters);

      if (response.success && response.data) {
        setResults(response.data.items);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
        setPageSize(response.data.pageSize);

        const serverStats = (response.data as any).stats as
          | SurveyStats
          | undefined;

        if (serverStats) {
          setStats({
            ...serverStats,
            totalSurveys: response.data.total ?? serverStats.totalSurveys,
          });
        } else {
          setStats(calculateSurveyStats(response.data.items || []));
        }
      } else {
        setError(response.error || 'خطا در دریافت اطلاعات');
        setResults([]);
        setTotalItems(0);
        setTotalPages(1);
        setStats(emptyStats);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
      setResults([]);
      setTotalItems(0);
      setTotalPages(1);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key: keyof SurveyFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    loadData(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters: SurveyFilters = { page: 1, pageSize };
    // اگر کارشناس است، بعد از پاک کردن فیلترها هم باید داخلی خودش باقی بماند
    if (isAgent && userExtension) {
      (clearedFilters as any).extension = userExtension;
    }
    setFilters(clearedFilters);
    setFromDate(null);
    setToDate(null);
    loadData(clearedFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadData(newFilters);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score === 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score === 5) return 'bg-green-100 text-green-800';
    if (score === 4) return 'bg-blue-100 text-blue-800';
    if (score === 3) return 'bg-yellow-100 text-yellow-800';
    if (score === 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < score ? 'text-yellow-400 fill-current' : 'text-slate-300'
        }`}
      />
    ));
  };

  const hasResults = results.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* عنوان صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            گزارش نظرسنجی مشتریان
          </h2>
          <p className="text-slate-600">تحلیل رضایت‌مندی و بازخورد مشتریان</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => loadData(filters)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            <span>بروزرسانی</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>فیلترها</span>
          </button>
        </div>
      </div>

      {/* نمایش خطا */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* آمار کلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                کل نظرسنجی‌ها
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                {stats.totalSurveys}
              </p>
            </div>
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                میانگین امتیاز
              </p>
              <p
                className={`text-2xl sm:text-3xl font-bold ${getScoreColor(
                  stats.averageScore
                )}`}
              >
                {stats.averageScore.toFixed(1)}
              </p>
              <div className="flex items-center mt-2">
                {renderStars(Math.round(stats.averageScore))}
              </div>
            </div>
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                رضایت (۴و۵)
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {Math.round(stats.satisfactionRate)}%
              </p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="h-4 w-4 ml-1" />
                <span>راضی</span>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-r-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                نارضایتی (۱و۲)
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">
                {Math.round(stats.dissatisfactionRate)}%
              </p>
              <div className="flex items-center text-red-600 text-sm mt-1">
                <TrendingDown className="h-4 w-4 ml-1" />
                <span>ناراضی</span>
              </div>
            </div>
            <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                میانگین مکالمه
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                {formatTalkTime(Math.round(stats.averageTalkTime))}
              </p>
              <div className="flex items-center text-purple-600 text-sm mt-1">
                <Clock className="h-4 w-4 ml-1" />
                <span>دقیقه:ثانیه</span>
              </div>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* فیلترها */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            فیلترهای جستجو
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* از تاریخ (شمسی) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    if (value && value.toDate) {
                      const d: Date = value.toDate();
                      const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
                      handleFilterChange('from', iso || undefined);
                    } else {
                      handleFilterChange('from', undefined);
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  calendarPosition="bottom-right"
                  inputClass="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* تا تاریخ (شمسی) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    if (value && value.toDate) {
                      const d: Date = value.toDate();
                      const iso = d.toISOString().slice(0, 10);
                      handleFilterChange('to', iso || undefined);
                    } else {
                      handleFilterChange('to', undefined);
                    }
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  calendarPosition="bottom-right"
                  inputClass="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* صف */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                صف
              </label>
              <input
                type="text"
                value={filters.queue || ''}
                onChange={(e) => handleFilterChange('queue', e.target.value)}
                placeholder="مثال: 805"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* کارشناس */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                کارشناس
              </label>
              <input
                type="text"
                value={filters.agent || ''}
                onChange={(e) => handleFilterChange('agent', e.target.value)}
                placeholder="نام کارشناس"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* شماره تماس */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                شماره تماس
              </label>
              <input
                type="text"
                value={filters.caller || ''}
                onChange={(e) => handleFilterChange('caller', e.target.value)}
                placeholder="مثال: 09121234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* حداقل امتیاز */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                حداقل امتیاز
              </label>
              <select
                value={filters.minScore || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'minScore',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">همه</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            {/* حداکثر امتیاز */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                حداکثر امتیاز
              </label>
              <select
                value={filters.maxScore || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'maxScore',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">همه</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse mt-4">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              اعمال فیلتر
            </button>
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse text-sm"
            >
              <Search className="h-4 w-4" />
              <span>پاک کردن</span>
            </button>
          </div>
        </div>
      )}

      {/* نمودار توزیع امتیازات */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">
          توزیع امتیازات نظرسنجی
        </h3>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = stats.scoreDistribution[score] || 0;
            const percentage =
              stats.totalSurveys > 0
                ? (count / stats.totalSurveys) * 100
                : 0;

            return (
              <div
                key={score}
                className="flex items-center space-x-4 space-x-reverse"
              >
                <div className="flex items-center space-x-3 space-x-reverse w-32">
                  <span className="text-sm font-medium text-slate-700 w-4">
                    {score}
                  </span>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {renderStars(score)}
                  </div>
                </div>
                <div className="flex-1 bg-slate-200 rounded-full h-4 relative overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      score === 5
                        ? 'bg-gradient-to-l from-green-400 to-green-500'
                        : score === 4
                        ? 'bg-gradient-to-l from-blue-400 to-blue-500'
                        : score === 3
                        ? 'bg-gradient-to-l from-yellow-400 to-yellow-500'
                        : score === 2
                        ? 'bg-gradient-to-l from-orange-400 to-orange-500'
                        : 'bg-gradient-to-l from-red-400 to-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-20 text-left">
                  <span className="text-sm font-semibold text-slate-800">
                    {count}
                  </span>
                  <span className="text-xs text-slate-500">
                    {' '}
                    ({Math.round(percentage)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* عملکرد کارشناسان */}
      {agentPerformance.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">
            عملکرد کارشناسان
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentPerformance.slice(0, 6).map((agent, index) => (
              <div
                key={`${agent.agent}-${agent.extension}`}
                className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                        index < 2
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : index < 4
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : 'bg-gradient-to-r from-slate-500 to-slate-600'
                      }`}
                    >
                      {/* بدون عدد داخلی */}
                    </div>
                    <span className="text-lg font-semibold text-slate-800">
                      کارشناس {agent.agent}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {renderStars(Math.round(agent.averageScore))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      تعداد نظرسنجی:
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {agent.totalSurveys}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      میانگین امتیاز:
                    </span>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        agent.averageScore
                      )}`}
                    >
                      {agent.averageScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      درصد رضایت:
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {Math.round(agent.satisfactionRate)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      میانگین مکالمه:
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      {formatTalkTime(Math.round(agent.averageTalkTime))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* جدول نتایج */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-800">
              نتایج نظرسنجی ({totalItems} مورد)
            </h3>
            <div className="text-sm text-slate-500">
              صفحه {currentPage} از {totalPages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">در حال بارگذاری...</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              هیچ نتیجه‌ای یافت نشد
            </h3>
            <p className="text-slate-500">
              برای فیلترهای انتخاب شده نتیجه‌ای موجود نیست.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 px-6 pt-4">
              <h3 className="text-base font-semibold text-slate-800">
                نتایج نظرسنجی
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center px-3 py-1.5 border border-emerald-500 text-emerald-600 text-sm rounded-lg hover:bg-emerald-50 transition-colors"
                  disabled={loading || results.length === 0}
                >
                  <Download className="h-4 w-4 ml-1" />
                  خروجی اکسل
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="inline-flex items-center px-3 py-1.5 border border-rose-500 text-rose-600 text-sm rounded-lg hover:bg-rose-50 transition-colors"
                  disabled={loading || results.length === 0}
                >
                  <Download className="h-4 w-4 ml-1" />
                  خروجی PDF
                </button>
              </div>
            </div>

            <div
              ref={tableRef}
              className="overflow-x-auto bg-white rounded-xl shadow-sm"
            >
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ساعت
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      شماره تماس
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      صف
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      کارشناس
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      امتیاز
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ستاره‌ها
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      مدت مکالمه
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ضبط تماس
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {results.map((result) => (
                    <tr
                      key={result.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-slate-400 ml-2" />
                          {formatDate(result.callDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-slate-400 ml-2" />
                          {formatTime(result.startedAt || result.callDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-slate-400 ml-2" />
                          {result.callerNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {result.queue}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-slate-400 ml-2" />
                          {result.agent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeColor(
                            result.score
                          )}`}
                        >
                          {result.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          {renderStars(result.score)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                        {formatTalkTime(result.talkTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {result.recordingUrl ? (
                          <div className="flex items-center justify-center gap-2">
                            <AudioPlayer src={result.recordingUrl} />
                            {result.downloadUrl && (
                              <a
                                href={result.downloadUrl}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center p-1 rounded-md hover:bg-slate-100"
                                title="دانلود ضبط تماس"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            بدون ضبط
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* صفحه‌بندی */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    قبلی
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="mr-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    بعدی
                  </button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <p className="text-sm text-slate-700">
                      نمایش{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{' '}
                      تا{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalItems)}
                      </span>{' '}
                      از{' '}
                      <span className="font-medium">{totalItems}</span> مورد
                    </p>
                  </div>

                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        قبلی
                      </button>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        بعدی
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SurveysReport;
