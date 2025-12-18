import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  ListChecks,
  Users,
  User,
  LogOut,
  ChevronLeft,
  PhoneOutgoing
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, logout, hasRole } = useAuth();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'داشبورد',
      icon: LayoutDashboard,
      roles: ['admin', 'supervisor', 'agent'] as const
    },
    {
      path: '/reports/calls',
      label: 'گزارش تماس‌ها',
      icon: PhoneOutgoing,
      roles: ['admin', 'supervisor', 'agent'] as const
    },
    {
      path: '/reports/survey',
      label: 'گزارش نظرسنجی',
      icon: BarChart3,
      roles: ['admin', 'supervisor', 'agent'] as const
    },
    {
      path: '/survey-management',
      label: 'مدیریت نظرسنجی',
      icon: ListChecks,
      roles: ['admin', 'supervisor', 'agent'] as const
    },
    {
      path: '/outbound-survey',
      label: 'نظرسنجی خروجی',
      icon: PhoneOutgoing,
      roles: ['admin', 'supervisor', 'agent'] as const
    },
    {
      path: '/users',
      label: 'کاربران',
      icon: Users,
      roles: ['admin', 'supervisor', 'agent'] as const
    },
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.roles));

  return (
    <div
      className={`fixed top-0 right-0 h-screen bg-white border-l border-slate-200 shadow-xl transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-slate-800">سامانه مانیتورینگ تماس</h1>
                <p className="text-sm text-slate-500">شبکه سازان تدبیر پارس</p>
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft
                className={`h-5 w-5 text-slate-600 transition-transform ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-l from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-l from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            <User className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">پروفایل</span>}
          </NavLink>

          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">خروج</span>}
          </button>

          {!isCollapsed && user && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium text-slate-800">{user.username}</div>
              <div className="text-xs text-slate-500">
                {user.role === 'admin' ? 'مدیر سیستم' : user.role === 'supervisor' ? 'سرپرست' : 'کارشناس'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
