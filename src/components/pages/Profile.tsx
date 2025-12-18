import React, { useState } from 'react';
import { User as UserIcon, Lock, Shield, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { changePassword } from '../../services/api.auth';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('رمز عبور جدید و تکرار آن یکسان نیستند');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      toast.success('رمز با موفقیت تغییر کرد. لطفاً دوباره وارد شوید.');
      setTimeout(() => nav('/login'), 900);
    } catch (err: any) {
      toast.error(err?.message || 'تغییر رمز ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  // کمک برای نمایش نقش — اگر پروژه‌ت تابع خودش را دارد، از همان استفاده کن
  const getRoleLabel = (role?: string) => {
    if (!role) return '—';
    const map: Record<string, string> = {
      admin: 'مدیر',
      user: 'کاربر',
    };
    return map[role] ?? role;
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>برای مشاهده پروفایل وارد شوید.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">پروفایل کاربری</h2>
          <p className="text-slate-600">مشاهده و ویرایش اطلاعات حساب کاربری</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* کارت اطلاعات کلی */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-l from-blue-500 to-blue-600 rounded-full mb-4">
                <UserIcon className="h-12 w-12 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {user.username}
              </h3>
              <p className="text-slate-600 mb-4">{getRoleLabel((user as any).role)}</p>

              <div className="space-y-3 text-right">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">وضعیت:</span>
                  <span className="text-sm font-medium text-green-600">فعال</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">تاریخ عضویت:</span>
                  <span className="text-sm font-medium text-slate-800">
                    {/* اگر فیلد createdAt داری جایگزین کن */}
                    {(user as any).createdAt
                      ? new Date((user as any).createdAt).toLocaleDateString('fa-IR')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* فرم‌ها */}
          <div className="lg:col-span-2 space-y-6">
            {/* اطلاعات دسترسی */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-800">اطلاعات دسترسی</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    نام کاربری
                  </label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    نقش
                  </label>
                  <input
                    type="text"
                    value={getRoleLabel((user as any).role)}
                    disabled
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* تغییر رمز عبور */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-800">تغییر رمز عبور</h3>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    رمز عبور فعلی
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      رمز عبور جدید
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      تکرار رمز عبور جدید
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
