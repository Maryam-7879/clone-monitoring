// src/services/api.auth.ts
import axios from 'axios';

axios.defaults.withCredentials = true; // کوکی سشن PHP لازم است

const AUTH_API = '/survay/api/auth_api.php';

export type Me = {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'agent' | 'manager';
  extension?: string | null;
  enabled: number;
  created_at?: string;
  updated_at?: string;
} | null;

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

export async function login(username: string, password: string): Promise<Me> {
  const res = await axios.post<ApiEnvelope<Me>>(
    `${AUTH_API}?action=login`,
    { username, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'ورود ناموفق بود');
  }
  return (res.data.data ?? null) as Me;
}

export async function logout(): Promise<void> {
  // بک‌اند شما logout را با GET هم قبول می‌کند
  const res = await axios.get<ApiEnvelope<boolean>>(`${AUTH_API}?action=logout`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'خروج ناموفق بود');
  }
}

export async function me(): Promise<Me> {
  const res = await axios.get<ApiEnvelope<Me>>(`${AUTH_API}?action=me`);
  if (!res.data?.success) {
    // وقتی لاگین نیستیم ممکنه بک‌اند success=true, data=null بده
    // یا خطا بده. در هر دو حالت، null برمی‌گردونیم.
    return null;
  }
  return (res.data.data ?? null) as Me;
}


export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const body = new FormData();
  body.append('action','change_password');
  body.append('old_password', oldPassword);
  body.append('new_password', newPassword);
  const res = await axios.post<ApiEnvelope<{changed:boolean;requires_login:boolean}>>(AUTH_API, body, { withCredentials: true });
  if (!res.data?.success) {
    throw new Error((res.data as any)?.error || 'خطا در تغییر رمز');
  }
}

