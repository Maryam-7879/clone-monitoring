// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { login as apiLogin, me as apiMe, logout as apiLogout } from '../services/api.auth';

// این تایپ‌ها را از پروژه‌ی خودتان نگه دارید.
// اگر فایل ../types/auth دارید، می‌توانید از همان import کنید.
// اینجا برای خودکفا بودن دوباره تعریف می‌کنیم:
export type UserRole = 'admin' | 'manager' | 'supervisor' | 'agent';
export type User = {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  scopes: { extensions: string[]; queues: string[] };
  createdAt: string;
};
export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
};
export type LoginCredentials = { username: string; password: string };

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasAccess: (extension?: string, queue?: string) => boolean;
}

axios.defaults.withCredentials = true; // لازم برای کوکی سشن

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // لاگین واقعی به بک‌اند (بدون تغییر UI)
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // ۱) ارسال به بک‌اند برای ایجاد سشن
      const meLogin = await apiLogin(credentials.username, credentials.password);
      if (!meLogin) throw new Error('ورود نامعتبر');

      // ۲) خواندن پروفایل از سرور (اختیاری اما بهتر)
      const meUser = await apiMe();
      if (!meUser) throw new Error('پروفایل یافت نشد');

      const finalUser: User = {
        id: String(meUser.id),
        username: meUser.username,
        role: (meUser.role as UserRole) || 'agent',
        isActive: (meUser.enabled ?? 0) === 1,
        scopes: { extensions: meUser?.extension ? [String(meUser.extension)] : [], queues: [] },
        createdAt: meUser.created_at || new Date().toISOString(),
      };

      // اگر قبلاً از localStorage استفاده می‌کردید، حفظ می‌کنیم
      localStorage.setItem('user', JSON.stringify(finalUser));

      setAuthState({
        user: finalUser,
        isAuthenticated: true,
        loading: false,
      });

      return true;
    } catch (err: any) {
      const msg = err?.message || 'ورود ناموفق بود';
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    // بک‌اند سشن را می‌بندد؛ ما state را پاک می‌کنیم
    apiLogout().catch(() => {});
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    toast.success('خروج موفقیت‌آمیز');
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  const hasAccess = (extension?: string, queue?: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.role === 'admin' || authState.user.role === 'manager' || authState.user.role === 'supervisor') return true;

    const { scopes } = authState.user;

    if (extension && scopes.extensions.length > 0) {
      if (!scopes.extensions.includes(extension)) return false;
    }

    if (queue && scopes.queues.length > 0) {
      if (!scopes.queues.includes(queue)) return false;
    }

    return true;
  };

  // Boot: سعی کن سشن سمت سرور را بررسی کنی؛ اگر نبود، از کش محلی
  useEffect(() => {
    const boot = async () => {
      try {
        const meUser = await apiMe();
        if (meUser) {
          const finalUser: User = {
            id: String(meUser.id),
            username: meUser.username,
            role: (meUser.role as UserRole) || 'agent',
            isActive: (meUser.enabled ?? 0) === 1,
            scopes: { extensions: meUser?.extension ? [String(meUser.extension)] : [], queues: [] },
            createdAt: meUser.created_at || new Date().toISOString(),
          };
          setAuthState({ user: finalUser, isAuthenticated: true, loading: false });
          return;
        }
      } catch {
        // ignore
      }

      // fallback به localStorage اگر لازم دارید
      const cached = localStorage.getItem('user');
      if (cached) {
        setAuthState({
          user: JSON.parse(cached),
          isAuthenticated: true,
          loading: false,
        });
      } else {
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    };

    boot();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasRole,
    hasAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
