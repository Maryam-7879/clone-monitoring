import React from 'react';
import { Settings } from 'lucide-react';
import UploadVoicePanel from '../components/UploadVoicePanel';
import ApplyDialplanPanel from '../components/ApplyDialplanPanel';
import QueueApplyPanel from '../components/QueueApplyPanel';
import OrchestrateFullPanel from '../components/OrchestrateFullPanel';
import OrchestrateOnePanel from '../components/OrchestrateOnePanel';

const SurveyAdminPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">مدیریت نظرسنجی‌های صوتی</h1>
          <p className="text-slate-600">مدیریت فایل‌های صوتی و تنظیمات نظرسنجی</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">آپلود فایل صوتی</h3>
          <UploadVoicePanel />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">اعمال Dialplan</h3>
          <ApplyDialplanPanel />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">تنظیم صف</h3>
          <QueueApplyPanel />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Orchestrate Full</h3>
          <OrchestrateFullPanel />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Orchestrate One</h3>
          <OrchestrateOnePanel />
        </div>
      </div>
    </div>
  );
};

export default SurveyAdminPage;
