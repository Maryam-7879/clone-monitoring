// src/components/pages/UserManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, UserX, RefreshCw, Search } from 'lucide-react';
import {
  usersList,
  userCreate,
  userUpdate,
  userToggle,
  userDelete,
  userSetPassword,
  type AppUser
} from '../../services/api.survey';

type FormState = {
  id?: number;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'agent';
  extension?: string;
  enabled: number;
};

const emptyForm: FormState = {
  username: '',
  full_name: '',
  role: 'agent',
  extension: '',
  enabled: 1
};

const Users: React.FC = () => {
  const [rows, setRows] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const totalPages = useMemo(() => (pageSize ? Math.ceil(total / pageSize) : 1), [total, pageSize]);

  const [q, setQ] = useState<string>('');

  const [form, setForm] = useState<FormState>(emptyForm);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<boolean>(false);

  // فقط برای ایجاد کاربر
  const [password, setPassword] = useState<string>('');

  // برای تغییر رمز در ویرایش
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForId, setPwdForId] = useState<number| null>(null);
  const [pwdNew, setPwdNew] = useState('');

  async function load(p = page, ps = pageSize, query = q) {
    setLoading(true);
    setError(null);
    try {
      const res = await usersList({ page: p, pageSize: ps, q: query });
      setRows(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || 'خطا در دریافت اطلاعات کاربران');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, pageSize, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch() {
    await load(1, pageSize, q);
    setPage(1);
  }

  function startCreate() {
    setMode('create');
    setForm(emptyForm);
    setPassword('');
  }

  function startEdit(u: AppUser) {
    setMode('edit');
    setForm({
      id: u.id,
      username: u.username, // نمایش فقط؛ در ویرایش ارسال نمی‌کنیم
      full_name: u.full_name,
      role: u.role,
      extension: u.extension || '',
      enabled: u.enabled
    });
    setPassword('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'create') {
        await userCreate({
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
          extension: form.extension?.trim() || undefined,
          enabled: form.enabled,
          password: password || undefined
        });
      } else {
        if (!form.id) throw new Error('شناسهٔ کاربر برای ویرایش وجود ندارد');
        await userUpdate({
          id: form.id,
          full_name: form.full_name.trim(),
          role: form.role,
          extension: (form.extension || '').trim() || null,
          enabled: form.enabled
        });
      }
      await load(page, pageSize, q);
      if (mode === 'create') {
        setForm(emptyForm);
        setPassword('');
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'عملیات ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(u: AppUser) {
    setBusy(true);
    try {
      await userToggle(u.id, !u.enabled);
      await load(page, pageSize, q);
    } catch (e: any) {
      setError(e?.message || 'تغییر وضعیت ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(u: AppUser) {
    if (!confirm(`کاربر «${u.full_name}» حذف شود؟`)) return;
    setBusy(true);
    try {
      await userDelete(u.id);
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      const newPage = Math.min(page, newTotalPages);
      setPage(newPage);
      await load(newPage, pageSize, q);
    } catch (e: any) {
      setError(e?.message || 'حذف ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  async function onChangePage(newPage: number) {
    setPage(newPage);
    await load(newPage, pageSize, q);
  }

  async function onChangePageSize(ps: number) {
    setPageSize(ps);
    setPage(1);
    await load(1, ps, q);
  }

  return (
    <div className="space-y-6 font-sans fa-fix">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مدیریت کاربران</h2>
          <p className="text-slate-600">تعریف/ویرایش کاربر و اتصال به داخلی</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => { startCreate(); }}
            disabled={busy}
          >
            <Plus className="w-4 h-4" />
            کاربر جدید
          </button>
          <button
            className="btn flex items-center gap-2"
            onClick={() => load(page, pageSize, q)}
            disabled={busy || loading}
            title="بارگذاری مجدد"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* جستجو */}
      <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو بر اساس نام کاربری / نام کامل / داخلی"
            className="w-full border rounded-lg p-2 pr-9"
          />
          <Search className="w-4 h-4 absolute right-2 top-2.5 text-slate-400" />
        </div>
        <button className="btn btn-secondary" onClick={onSearch} disabled={loading}>جستجو</button>
      </div>

      {/* فرم ایجاد/ویرایش */}
      <form onSubmit={onSubmit} className="bg-white p-4 rounded-xl shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-600 mb-1">وضعیت</label>
            <select
              value={form.enabled}
              onChange={(e) => setForm(f => ({ ...f, enabled: Number(e.target.value) }))}
              className="w-full border rounded-lg p-2"
            >
              <option value={1}>فعال</option>
              <option value={0}>غیرفعال</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">نام کامل</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm text-slate-600 mb-1">نقش</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value as FormState['role'] }))}
              className="w-full border rounded-lg p-2"
            >
              <option value="admin">مدیر</option>
              <option value="supervisor">سرپرست</option>
              <option value="agent">کارشناس</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm text-slate-600 mb-1">داخلی (اختیاری)</label>
            <input
              value={form.extension || ''}
              onChange={(e) => setForm(f => ({ ...f, extension: e.target.value }))}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* فیلد نام کاربری فقط در حالت ایجاد نمایش/فعال می‌شود */}
          <div className="md:col-span-5">
            <label className="block text-sm text-slate-600 mb-1">نام کاربری</label>
            <input
              value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full border rounded-lg p-2"
              disabled={mode === 'edit'}
              placeholder={mode === 'edit' ? 'در حالت ویرایش قابل تغییر نیست' : ''}
              required={mode === 'create'}
            />
          </div>

          {/* رمز عبور فقط برای ایجاد */}
          {mode === 'create' && (
            <div className="md:col-span-5">
              <label className="block text-sm text-slate-600 mb-1">رمز عبور (اختیاری)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="در صورت خالی بودن، بعداً می‌توانید تنظیم کنید"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {mode === 'create' ? 'ایجاد کاربر' : 'ذخیره تغییرات'}
          </button>
          {mode === 'edit' && (
            <button
              className="btn"
              type="button"
              onClick={() => { setMode('create'); setForm(emptyForm); setPassword(''); }}
              disabled={busy}
            >
              لغو و ایجاد جدید
            </button>
          )}
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </form>

      {/* جدول کاربران */}
      <div className="bg-white p-4 rounded-xl shadow">
        {loading ? (
          <div className="p-8 text-center text-slate-500">در حال بارگذاری...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">کاربری یافت نشد.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-right text-slate-500 border-b">
                  <th className="p-2">#</th>
                  <th className="p-2">نام کاربری</th>
                  <th className="p-2">نام کامل</th>
                  <th className="p-2">نقش</th>
                  <th className="p-2">داخلی</th>
                  <th className="p-2">وضعیت</th>
                  <th className="p-2">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, idx) => (
                  <tr key={u.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="p-2 font-mono">{u.username}</td>
                    <td className="p-2">{u.full_name}</td>
                    <td className="p-2">{u.role === 'admin' ? 'مدیر' : u.role === 'supervisor' ? 'سرپرست' : 'کارشناس'}</td>
                    <td className="p-2">{u.extension || '—'}</td>
                    <td className="p-2">
                      {u.enabled ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <UserCheck className="w-4 h-4" /> فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <UserX className="w-4 h-4" /> غیرفعال
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button className="btn btn-xs" onClick={() => startEdit(u)} title="ویرایش">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className={`btn btn-xs ${u.enabled ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => onToggle(u)}
                          title={u.enabled ? 'غیرفعال کن' : 'فعال کن'}
                          disabled={busy}
                        >
                          {u.enabled ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          className="btn btn-xs"
                          onClick={() => { setPwdForId(u.id); setPwdNew(''); setPwdModalOpen(true); }}
                          title="تغییر رمز"
                          disabled={busy}
                        >
                          تغییر رمز
                        </button>
                        <button className="btn btn-xs btn-danger" onClick={() => onDelete(u)} title="حذف" disabled={busy}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* صفحه‌بندی */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-sm">هر صفحه</span>
                <select
                  className="border rounded-lg p-1"
                  value={pageSize}
                  onChange={(e) => onChangePageSize(Number(e.target.value))}
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-slate-600 text-sm">رکورد</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-xs" disabled={page <= 1} onClick={() => onChangePage(page - 1)}>قبلی</button>
                <span className="text-sm text-slate-600">صفحه {page} از {totalPages || 1}</span>
                <button className="btn btn-xs" disabled={page >= (totalPages || 1)} onClick={() => onChangePage(page + 1)}>بعدی</button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* مودال تغییر رمز */}
      {pwdModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md shadow">
            <h3 className="text-lg font-semibold mb-3">تغییر رمز عبور</h3>
            <input
              type="password"
              value={pwdNew}
              onChange={(e)=>setPwdNew(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="رمز جدید"
            />
            <div className="mt-4 flex items-center gap-2 justify-end">
              <button className="btn" onClick={()=>setPwdModalOpen(false)}>انصراف</button>
              <button
                className="btn btn-primary"
                disabled={!pwdNew || busy}
                onClick={async ()=>{
                  if (!pwdForId) return;
                  setBusy(true);
                  setError(null);
                  try{
                    await userSetPassword(pwdForId, pwdNew);
                    setPwdModalOpen(false);
                  }catch(e:any){
                    setError(e?.response?.data?.error || e?.message || 'خطا در تنظیم رمز');
                  }finally{
                    setBusy(false);
                  }
                }}
              >ذخیره</button>
            </div>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
