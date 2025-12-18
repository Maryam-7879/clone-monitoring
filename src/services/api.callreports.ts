import axios from 'axios';

const CALL_REPORTS_BASE = '/survay/api';

export type CallReportStatus = 'answered' | 'missed' | 'cancelled' | 'other';

export type CallReport = {
  id: string;
  date: string;
  time: string;
  callerNumber: string;
  extension: string;
  duration: number;
  status: CallReportStatus;
  hasRecording: boolean;
  recordingUrl?: string | null;
  downloadUrl?: string | null;
};

export type CallReportStats = {
  total: number;
  answered: number;
  missed: number;
  cancelled: number;
  withRecording: number;
};

export type CallReportFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  extension?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type APIWrap<T = any> = { success: boolean; data?: T; error?: string };

function ok<T>(data: T): APIWrap<T> {
  return { success: true, data };
}

function err(message: string): APIWrap<never> {
  return { success: false, error: message };
}

export async function getCallReports(filters: CallReportFilters): Promise<
  APIWrap<{
    calls: CallReport[];
    stats: CallReportStats;
    total: number;
  }>
> {
  try {
    const res = await axios.get(`${CALL_REPORTS_BASE}/call_reports.php`, {
      params: {
        search: filters.search || '',
        date_from: filters.dateFrom || '',
        date_to: filters.dateTo || '',
        extension: filters.extension === 'all' ? '' : filters.extension,
        status: filters.status === 'all' ? '' : filters.status,
        page: filters.page || 1,
        limit: filters.limit || 25,
      },
      withCredentials: false,
    });

    const raw = res?.data || {};

    if (raw.status === 'error') {
      return err(raw.message || 'خطا در دریافت گزارش تماس‌ها');
    }

    const calls = Array.isArray(raw.calls) ? raw.calls : [];
    const statsRaw = raw.stats || {};

    const mapped: CallReport[] = calls.map((c: any) => ({
      id: String(c.id ?? c.uniqueid ?? `${c.callerNumber || c.src}-${c.date || ''}-${c.time || ''}`),
      date: c.date || (c.calldate ? String(c.calldate).split(' ')[0] : '') || '',
      time: c.time || (c.calldate ? String(c.calldate).split(' ')[1] : '') || '',
      callerNumber: c.callerNumber || c.phoneNumber || c.src || '',
      extension: c.extension || c.dst || '',
      duration: Number(c.duration ?? c.billsec ?? 0),
      status: (c.status || '').toLowerCase() as CallReportStatus || 'other',
      hasRecording: Boolean(c.hasRecording ?? (c.recordingUrl || c.recordingfile)),
      recordingUrl: c.recordingUrl || null,
      downloadUrl: c.downloadUrl || null,
    }));

    const stats: CallReportStats = {
      total: Number(statsRaw.total ?? raw.total ?? mapped.length ?? 0),
      answered: Number(statsRaw.answered ?? 0),
      missed: Number(statsRaw.missed ?? 0),
      cancelled: Number(statsRaw.cancelled ?? 0),
      withRecording: Number(statsRaw.withRecording ?? 0),
    };

    const total = Number(raw.total ?? stats.total ?? mapped.length ?? 0);

    return ok({ calls: mapped, stats, total });
  } catch (e: any) {
    return err(e?.message || 'خطا در ارتباط با سرور');
  }
}

export async function buildExportUrl(
  filters: CallReportFilters,
  format: 'excel' | 'pdf'
): Promise<APIWrap<{ url: string }>> {
  try {
    const params = new URLSearchParams();

    params.set('format', format);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    if (filters.extension && filters.extension !== 'all') params.set('extension', filters.extension);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);

    const url = `${CALL_REPORTS_BASE}/call_reports_export.php?${params.toString()}`;
    return ok({ url });
  } catch (e: any) {
    return err('خطا در ساخت آدرس خروجی گرفتن');
  }
}
