import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PhoneOutgoing, Terminal } from 'lucide-react';
import OutboundSurveyList from './OutboundSurveyList';
import OutboundSurveyForm from './OutboundSurveyForm';
import Modal from '../../common/Modal';
import toast from 'react-hot-toast';
import { getOutboundSurveys,
  saveOutboundSurvey,
  editOutboundSurvey,
  deleteOutboundSurvey as deleteOutboundSurveyAPI, applyOutboundDialplan } from '../../../services/api.survey';

export interface OutboundSurvey {
  id: string;
  name: string;
  commandCode: string;
  questions: OutboundQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface OutboundQuestion {
  id: string;
  title: string;
  rangeMin: number;
  rangeMax: number;
  order: number;
  audioFile?: File | null;
  audioUrl?: string;
}

const OutboundSurveyManagement: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [surveys, setSurveys] = useState<OutboundSurvey[]>([]);
  const [editingSurvey, setEditingSurvey] = useState<OutboundSurvey | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialplanModal, setDialplanModal] = useState<{
    open: boolean;
    logs: string[];
  }>({ open: false, logs: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getOutboundSurveys();
      if (res.success && res.data) {
        setSurveys(Array.isArray(res.data) ? res.data : []);
      } else {
        setSurveys([]);
        if (res.error) {
          toast.error(res.error);
        }
      }
    } catch (error) {
      console.error('Error fetching outbound surveys:', error);
      toast.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const getUsedCommandCodes = (excludeId?: string): string[] => {
    return surveys
      .filter(s => s.id !== excludeId)
      .map(s => s.commandCode);
  };

  const handleCreateNew = () => {
    if (!canManage) { toast.error('شما دسترسی ساخت/ویرایش نظرسنجی خروجی را ندارید'); return; }

    setEditingSurvey(null);
    setIsCreating(true);
  };

  const handleEdit = (survey: OutboundSurvey) => {
    if (!canManage) { toast.error('شما دسترسی ویرایش نظرسنجی خروجی را ندارید'); return; }

    setEditingSurvey(survey);
    setIsCreating(true);
  };

  const handleSave = async(data: any) => {
    if (!canManage) { toast.error('شما دسترسی ذخیره نظرسنجی خروجی را ندارید'); return; }
    try {
      let result;
      if (editingSurvey && editingSurvey.id) {
        const formData = new FormData();
        formData.append('id', editingSurvey.id);
        formData.append('call_id', data.name || '');
        formData.append('campaign_id', data.commandCode || '');
        formData.append('phone', '');
        formData.append('agent_id', '');
        formData.append('answers_json', JSON.stringify(data.questions || []));
        formData.append('meta_json', JSON.stringify({ name: data.name, commandCode: data.commandCode }));

        if (data.voiceFile) {
          formData.append('voice', data.voiceFile);
        }

        result = await editOutboundSurvey(formData);
      } else {
        result = await saveOutboundSurvey({
          name: data.name,
          accessCode: data.commandCode,
          questions: data.questions || [],
          meta: { name: data.name, commandCode: data.commandCode },
          file: data.voiceFile || null
        });
      }

      if (result.success) {
        const message = result.data?.message || (editingSurvey ? 'نظرسنجی با موفقیت ویرایش شد' : 'نظرسنجی با موفقیت ایجاد شد');
        toast.success(message);
        await fetchData();
        setIsCreating(false);
        setEditingSurvey(null);
      } else {
        toast.error(result.error || 'خطا در ذخیره نظرسنجی');
      }
    } catch (error) {
      console.error('Error saving outbound survey:', error);
      toast.error('خطا در ذخیره نظرسنجی');
    }
  };

  const handleDelete = async(id: string) => {
    if (!canManage) { toast.error('شما دسترسی حذف نظرسنجی خروجی را ندارید'); return; }
    try {
      const result = await deleteOutboundSurveyAPI(id);
      if (result.success) {
        toast.success('نظرسنجی با موفقیت حذف شد');
        await fetchData();
      } else {
        toast.error(result.error || 'خطا در حذف نظرسنجی');
      }
    } catch (error) {
      console.error('Error deleting outbound survey:', error);
      toast.error('خطا در حذف نظرسنجی');
    }
  };

  const handleApplyDialplan = async(row: any) => {
    if (!canManage) { toast.error('شما دسترسی اعمال دیال‌پلن را ندارید'); return; }
  try {
    setDialplanModal({ open: true, logs: ["[INFO] در حال ارسال درخواست به سرور..."] });
    const raw = await applyOutboundDialplan({
      surveyName: String(row?.name ?? row?.call_id ?? ""),
      commandCode: String(row?.commandCode ?? row?.command_code ?? "")
    });
    const lines = String(raw ?? "").split(/\r?\n/).filter(Boolean);
    setDialplanModal({ open: true, logs: lines });
  } catch (e: any) {
    setDialplanModal({ open: true, logs: ["[ERROR] " + (e?.message || String(e))] });
  }
};

  const handleCancel = () => {
    setIsCreating(false);
    setEditingSurvey(null);
  };

  if (loading && !isCreating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <OutboundSurveyForm canManage={canManage}
        
        survey={editingSurvey}
        usedCommandCodes={getUsedCommandCodes(editingSurvey?.id)}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <>
      <OutboundSurveyList canManage={canManage}
        
        surveys={surveys}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApplyDialplan={handleApplyDialplan}
        onCreateNew={handleCreateNew}
      />

      <Modal
        isOpen={dialplanModal.open}
        onClose={() => setDialplanModal({ open: false, logs: [] })}
        title="لاگ اعمال تغییرات روی دایال‌پلن"
        size="lg"
        footer={
          <button
            onClick={() => setDialplanModal({ open: false, logs: [] })}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            بستن
          </button>
        }
      >
        <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {dialplanModal.logs.map((log, index) => {
            const isSuccess = log.includes('[SUCCESS]');
            const isError = log.includes('[ERROR]');
            const isInfo = log.includes('[INFO]');

            return (
              <div
                key={index}
                className={`py-1 ${
                  isSuccess
                    ? 'text-green-400'
                    : isError
                    ? 'text-red-400'
                    : isInfo
                    ? 'text-blue-400'
                    : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
};

export default OutboundSurveyManagement;
