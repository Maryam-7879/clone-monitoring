// src/services/api.survey.ts
import axios from 'axios';
import { SurveyResultsResponse, SurveyFilters } from '../types/survey';

/* =========================
   0) کلاینت و تنظیمات پایه
   ========================= */

// گزارش‌ها (روی /api سرو می‌شود)
const reportClient = axios.create({
  baseURL: '/survay/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// مسیر API واقعی داشبورد (PHP)
const DASHBOARD_API = '/survay/api/dashboard_api.php';

/* ابزار مشترک برای ساخت پارام‌ها از فیلترها */
function buildParamsFromFilters(filters: Partial<SurveyFilters> = {}): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.from)      params.append('from', filters.from);
  if (filters.to)        params.append('to', filters.to);
  if (filters.extension) params.append('extension', String(filters.extension));
  if (filters.queue)     params.append('queue', String(filters.queue));
  if (filters.agent)     params.append('agent', String(filters.agent));
  if (filters.caller)    params.append('caller', String(filters.caller));
  if (filters.minScore !== undefined) params.append('minScore', String(filters.minScore));
  if (filters.maxScore !== undefined) params.append('maxScore', String(filters.maxScore));
  if (filters.page)      params.append('page', String(filters.page));
  if (filters.pageSize)  params.append('pageSize', String(filters.pageSize));
  return params;
}

/*  هندل استاندارد پاسخ‌های PHP
    - اگر ساختار {success, data, error} باشد → فقط data برمی‌گردد
    - در غیر اینصورت همان data خام برگردانده می‌شود
*/
function unwrap<T = any>(res: any): T {
  if (res?.data?.success === true) return res.data.data as T;
  if (res?.data?.success === false) throw new Error(res.data.error || 'API error');
  return res.data as T;
}

/* =========================
   A) گزارش نظرسنجی‌ها
   ========================= */

export const fetchSurveyResults = async (
  filters: SurveyFilters = {}
): Promise<SurveyResultsResponse> => {
  try {
    const params = buildParamsFromFilters(filters);
    const res = await reportClient.get<SurveyResultsResponse>(`/survey-results.php?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.error('Error fetching survey results:', error);
    return {
      success: false,
      data: {
        items: [],
        page: 1,
        pageSize: Number(filters?.pageSize) || 25,
        total: 0,
        totalPages: 0,
      },
      error: 'خطا در دریافت اطلاعات از سرور',
    };
  }
};

/* =========================
   B) داشبورد (KPI و توزیع امتیاز)
   ========================= */

export type KPIData = {
  // آمار نظرسنجی
  total_surveys: number;
  total_responses: number;
  total_questions: number;
  avg_score: number | null;
  completion_rate: number | null;
  today_survey_responses: number;
  active_users: number | null;

  // آمار تماس‌ها
  today_calls: number;
  total_calls: number;          // مثلا تماس‌های این هفته
  answered_calls: number;
  missed_calls: number;
  cancelled_calls: number;
  with_recording: number;
  avg_call_duration: string | null;

  // رضایت (از survey-results تجمیع‌شده)
  satisfaction_today?: number | null;  // %
  satisfaction_month?: number | null;  // %
};

export type ScoreDistRow = { score: number; count: number };

export async function getKpis(filters?: Partial<SurveyFilters>): Promise<KPIData> {
  const params = buildParamsFromFilters(filters);
  params.append('action', 'kpis');
  const res = await axios.get(DASHBOARD_API, { params });
  const d = unwrap<any>(res) || {};

  // مپ امن با مقادیر پیش‌فرض
  const kpi: KPIData = {
    total_surveys: Number(d?.total_surveys ?? 0),
    total_responses: Number(d?.total_responses ?? 0),
    total_questions: Number(d?.total_questions ?? 0),
    avg_score: d?.avg_score != null ? Number(d.avg_score) : null,
    completion_rate: d?.completion_rate != null ? Number(d.completion_rate) : null,
    today_survey_responses: Number(d?.today_survey_responses ?? 0),
    active_users: d?.active_users != null ? Number(d.active_users) : null,

    today_calls: Number(d?.today_calls ?? 0),
    total_calls: Number(d?.total_calls ?? 0),
    answered_calls: Number(d?.answered_calls ?? 0),
    missed_calls: Number(d?.missed_calls ?? 0),
    cancelled_calls: Number(d?.cancelled_calls ?? 0),
    with_recording: Number(d?.with_recording ?? 0),
    avg_call_duration: d?.avg_call_duration ?? null,

    satisfaction_today: d?.satisfaction_today != null ? Number(d.satisfaction_today) : null,
    satisfaction_month: d?.satisfaction_month != null ? Number(d.satisfaction_month) : null,
  };

  return kpi;
}

export async function getScoreDist(filters?: Partial<SurveyFilters>): Promise<ScoreDistRow[]> {
  const params = buildParamsFromFilters(filters);
  params.append('action', 'score_dist');
  const res = await axios.get(DASHBOARD_API, { params });
  const rows = unwrap<any[]>(res) || [];
  return rows.map((r) => ({ score: Number(r.score), count: Number(r.count) }));
}

/* =========================
   C) Users API
   ========================= */

export type AppUser = {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'agent';
  extension?: string | null;
  enabled: number; // 0/1
  created_at?: string;
  updated_at?: string;
};

export type UsersListResponse = {
  items: AppUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const USERS_API = '/survay/api/users_api.php';

export async function usersList(opts?: { page?: number; pageSize?: number; q?: string }): Promise<UsersListResponse> {
  const params = new URLSearchParams();
  params.append('action', 'list');
  if (opts?.page) params.append('page', String(opts.page));
  if (opts?.pageSize) params.append('pageSize', String(opts.pageSize));
  if (opts?.q) params.append('q', opts.q);

  const res = await axios.get(USERS_API, { params });
  if (res.data?.success !== true) throw new Error(res.data?.error || 'users list failed');
  return res.data.data as UsersListResponse;
}

export async function userCreate(payload: {
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'agent';
  extension?: string;
  enabled?: number;
  password?: string;
}): Promise<{ id: number }> {
  const res = await axios.post(USERS_API + '?action=create', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.data?.success !== true) throw new Error(res.data?.error || 'user create failed');
  return res.data.data as { id: number };
}

export async function userUpdate(payload: {
  id: number;
  full_name?: string;
  role?: 'admin' | 'supervisor' | 'agent';
  extension?: string | null;
  enabled?: number;
}): Promise<{ updated: number }> {
  const res = await axios.post(USERS_API + '?action=update', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.data?.success !== true) throw new Error(res.data?.error || 'user update failed');
  return res.data.data as { updated: number };
}

export async function userToggle(id: number, enabled: boolean): Promise<{ updated: number }> {
  const res = await axios.post(
    USERS_API + '?action=toggle',
    { id, enabled: enabled ? 1 : 0 },
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.data?.success !== true) throw new Error(res.data?.error || 'user toggle failed');
  return res.data.data as { updated: number };
}

export async function userDelete(id: number): Promise<{ deleted: number }> {
  const res = await axios.post(
    USERS_API + '?action=delete',
    { id },
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.data?.success !== true) throw new Error(res.data?.error || 'user delete failed');
  return res.data.data as { deleted: number };
}

export async function userSetPassword(id: number, password: string): Promise<{ updated: number }> {
  const res = await axios.post(
    USERS_API + '?action=set_password',
    { id, password },
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.data?.success !== true) throw new Error(res.data?.error || 'set password failed');
  return res.data.data as { updated: number };
}

/* =========================
   D) Survey Management API (pre-apply)
   ========================= */

export type SurveyManagement = {
  id?: string;
  name: string;
  queue: string;
  customDestination?: string;
  isActive?: boolean;
  questions: Array<{
    id: string;
    title: string;
    rangeMin: number;
    rangeMax: number;
    order: number;
    audioFile?: File | null;
    audioUrl?: string;
    audioKey?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type SurveyListResponse = {
  success: boolean;
  items?: SurveyManagement[];
  error?: string;
};

export type QueueItem = {
  id: string;
  name: string;
  number: string;
};

export type QueueListResponse = {
  success: boolean;
  items?: QueueItem[];
  error?: string;
};

export type OrchestrateResult = {
  ok: boolean;
  dialplan_ctx?: string;
  dest?: string;
  reload_exit?: number;
  log?: {
    apply_dialplan?: string[];
    queue_apply?: string[];
  };
  error?: string;
};

const SURVEY_MANAGEMENT_BASE = '/survay/api';

export async function fetchSurveyManagementList(): Promise<SurveyListResponse> {
  try {
    const res = await axios.get(`${SURVEY_MANAGEMENT_BASE}/pre_apply_survay_list.php`);
    return res.data;
  } catch (error) {
    console.error('Error fetching survey list:', error);
    return { success: false, items: [], error: 'خطا در دریافت لیست نظرسنجی‌ها' };
  }
}

export async function fetchQueuesList(): Promise<QueueListResponse> {
  try {
    const res = await axios.get(`${SURVEY_MANAGEMENT_BASE}/queues_list.php`);
    return res.data;
  } catch (error) {
    console.error('Error fetching queues list:', error);
    return { success: false, items: [], error: 'خطا در دریافت لیست صف‌ها' };
  }
}

export async function createOrUpdateSurvey(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/pre_apply_survay_create.php`, formData);
    return res.data;
  } catch (error: any) {
    console.error('Error creating/updating survey:', error);
    return { success: false, error: 'network error' };
  }
}

export async function deleteSurvey(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await axios.get(`${SURVEY_MANAGEMENT_BASE}/pre_apply_survay_delete.php?id=${id}`);
    if (res.data?.success === true) {
      return { success: true };
    }
    return { success: false, error: res.data?.error || 'خطا در حذف نظرسنجی' };
  } catch (error: any) {
    console.error('Error deleting survey:', error);
    return { success: false, error: error?.response?.data?.error || 'خطا در حذف نظرسنجی' };
  }
}

export async function orchestrateSurvey(payload: {
  name: string;
  queue: string;
  questions: Array<{ order: number; title: string; audio_key: string }>;
}): Promise<OrchestrateResult> {
  try {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('queue', payload.queue);
    form.append('questions', JSON.stringify(payload.questions));
    const res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/survey_orchestrate_full.php`, form);
    return res.data;
  } catch (error: any) {
    console.error('Error orchestrating survey:', error);
    return { ok: false, error: 'network error' };
  }
}

/* =========================
   E) Outbound Survey API
   ========================= */

export type OutboundQuestion = {
  id: string;
  title: string;
  rangeMin: number;
  rangeMax: number;
  order: number;
};

export type OutboundSurveyUI = {
  id: string;
  name: string;
  commandCode: string;
  questions: OutboundQuestion[];
  createdAt: string;
  updatedAt: string;
  phone?: string;
  agentId?: string | null;
  voicePath?: string | null;
};

export type APIWrap<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type SaveOutboundPayload = {
  name: string;
  accessCode: string | number;
  questions: OutboundQuestion[];
  meta?: Record<string, any>;
  phone?: string;
  agentId?: string | null;
  file?: File | null;
};

export type EditOutboundPayload = SaveOutboundPayload & {
  id: string | number;
};

function safeParseArray<T = any>(val: any): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    const t = val.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

function safeParseObject<T = any>(val: any): T {
  if (val && typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    const t = val.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        return (parsed && typeof parsed === 'object' ? parsed : {}) as T;
      } catch {
        return {} as T;
      }
    }
  }
  return {} as T;
}

function mapRawToUI(r: any): OutboundSurveyUI {
  const questions = safeParseArray<OutboundQuestion>(r?.answers_json);
  const meta = safeParseObject<Record<string, any>>(r?.meta_json);
  return {
    id: String(r?.id ?? ''),
    name: String(r?.call_id ?? ''),
    commandCode: String(r?.campaign_id ?? meta?.commandCode ?? ''),
    questions,
    createdAt: String(r?.created_at ?? ''),
    updatedAt: String(r?.updated_at ?? '') || '',
    phone: typeof r?.phone === 'string' ? r.phone : '',
    agentId: r?.agent_id ?? null,
    voicePath: r?.voice_path ?? null,
  };
}

function ok<T>(data: T): APIWrap<T> {
  return { success: true, data };
}
function fail<T = unknown>(error = 'operation failed'): APIWrap<T> {
  return { success: false, error };
}

// لیست نظرسنجی‌های خروجی
export async function getOutboundSurveys(): Promise<APIWrap<OutboundSurveyUI[]>> {
  try {
    const res = await axios.get(`${SURVEY_MANAGEMENT_BASE}/outbound_get_survey.php`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const raw = res?.data;
    if (Array.isArray(raw)) {
      const data = raw.map(mapRawToUI);
      return ok(data);
    }
    if (raw?.status === 'error') {
      return fail(raw?.message || 'API error');
    }
    return ok([]);
  } catch (e: any) {
    console.error('getOutboundSurveys error:', e);
    return fail('network error');
  }
}

// ایجاد نظرسنجی خروجی
export async function saveOutboundSurvey(payload: SaveOutboundPayload): Promise<APIWrap<{ id: string }>> {
  try {
    const { name, accessCode, questions, meta = {}, phone = '', agentId = null, file } = payload;

    let res;
    if (file) {
      const fd = new FormData();
      fd.append('call_id', String(name));
      fd.append('campaign_id', String(accessCode));
      fd.append('phone', String(phone));
      if (agentId !== undefined && agentId !== null) fd.append('agent_id', String(agentId));
      fd.append('answers_json', JSON.stringify(questions));
      fd.append('meta_json', JSON.stringify({ ...meta, commandCode: String(accessCode) }));
      fd.append('voice', file);

      res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/outbound_save_survey.php`, fd);
    } else {
      const body = {
        call_id: String(name),
        campaign_id: String(accessCode),
        phone: String(phone),
        agent_id: agentId,
        answers_json: questions,
        meta_json: { ...meta, commandCode: String(accessCode) },
      };
      res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/outbound_save_survey.php`, body, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const d = res?.data;
    if (d?.status === 'success') {
      return ok<{ id: string }>({ id: String(d?.id ?? '') });
    }
    return fail(d?.message || 'save failed');
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'network error';
    console.error('saveOutboundSurvey error:', e);
    return fail(msg);
  }
}

// ویرایش نظرسنجی خروجی
export async function editOutboundSurvey(payload: EditOutboundPayload): Promise<APIWrap<true>> {
  try {
    const { id, name, accessCode, questions, meta = {}, phone = '', agentId = null, file } = payload;

    let res;
    if (file) {
      const fd = new FormData();
      fd.append('id', String(id));
      fd.append('call_id', String(name));
      fd.append('campaign_id', String(accessCode));
      fd.append('phone', String(phone));
      if (agentId !== undefined && agentId !== null) fd.append('agent_id', String(agentId));
      fd.append('answers_json', JSON.stringify(questions));
      fd.append('meta_json', JSON.stringify({ ...meta, commandCode: String(accessCode) }));

      res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/outbound_edit_survey.php`, fd);
    } else {
      const body = {
        id: String(id),
        call_id: String(name),
        campaign_id: String(accessCode),
        phone: String(phone),
        agent_id: agentId,
        answers_json: questions,
        meta_json: { ...meta, commandCode: String(accessCode) },
      };
      res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/outbound_edit_survey.php`, body, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const d = res?.data;
    if (d?.status === 'success') return ok(true);
    return fail(d?.message || 'edit failed');
  } catch (e: any) {
    console.error('editOutboundSurvey error:', e);
    const msg = e?.response?.data?.message || e?.message || 'network error';
    return fail(msg);
  }
}

// حذف نظرسنجی خروجی
export async function deleteOutboundSurvey(id: string | number): Promise<APIWrap<true>> {
  try {
    const res = await axios.get(`${SURVEY_MANAGEMENT_BASE}/outbound_delete_survey.php`, {
      params: { id: String(id) },
    });
    const d = res?.data;
    if (d?.status === 'success') return ok(true);
    return fail(d?.message || 'delete failed');
  } catch (e: any) {
    console.error('deleteOutboundSurvey error:', e);
    return fail('network error');
  }
}

// اعمال dialplan نظرسنجی خروجی (خروجی متنی برای نمایش log)
export async function applyOutboundDialplan(params: { surveyName: string; commandCode: string }): Promise<string> {
  const { surveyName, commandCode } = params;
  const form = new FormData();
  form.append('survey_name', surveyName);
  form.append('command_code', commandCode);
  const res = await axios.post(`${SURVEY_MANAGEMENT_BASE}/outbound_apply_dialplan.php`, form, {
    responseType: 'text',
    transformResponse: (r) => r as any,
    withCredentials: false,
  });
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
}
