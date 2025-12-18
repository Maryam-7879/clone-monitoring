import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Survey, Queue, ApplyDialplanResult } from '../../../types/surveyManagement';
import SurveyList from './SurveyList';
import SurveyForm from './SurveyForm';
import Modal from '../../common/Modal';
import { Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSurveyManagementList,
  fetchQueuesList,
  createOrUpdateSurvey,
  deleteSurvey as deleteSurveyAPI,
  orchestrateSurvey, applyOutboundDialplan } from '../../../services/api.survey';

const SurveyManagement: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
      const [surveysRes, queuesRes] = await Promise.all([
        fetchSurveyManagementList(),
        fetchQueuesList()
      ]);

      if (surveysRes.success && surveysRes.items) {
        setSurveys(surveysRes.items as Survey[]);
      } else {
        setSurveys([]);
        if (surveysRes.error) {
          toast.error(surveysRes.error);
        }
      }

      if (queuesRes.success && queuesRes.items) {
        setQueues(queuesRes.items as Queue[]);
      } else {
        setQueues([]);
        if (queuesRes.error) {
          toast.error(queuesRes.error);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!canManage) { toast.error('شما دسترسی ساخت/ویرایش نظرسنجی را ندارید'); return; }

    setEditingSurvey(null);
    setIsCreating(true);
  };

  const handleEdit = (survey: Survey) => {
    if (!canManage) { toast.error('شما دسترسی ویرایش نظرسنجی را ندارید'); return; }

    setEditingSurvey(survey);
    setIsCreating(true);
  };

  const handleSave = async (data: any) => {
    if (!canManage) { toast.error('شما دسترسی ذخیره نظرسنجی را ندارید'); return; }

    try {
      const questionsToSend = data.questions.map((q: any, index: number) => ({
        order: index + 1,
        title: q.title.trim(),
        audio_key: q.audioKey || ''
      }));

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('queue', data.queue);
      if (data.customDestination) {
        formData.append('customDestination', data.customDestination);
      }
      formData.append('questions_json', JSON.stringify(questionsToSend));

      // Attach menu audio like outbound_save: pick the first question with a file
      try {
        const qWithFile = (data.questions || []).find((q:any) => q && q.audioFile instanceof File);
        if (qWithFile && qWithFile.audioFile) {
          // Use field name 'menu' to match server's accepted keys (menu/file/voice/audio)
          formData.append('menu', qWithFile.audioFile);
        }
      } catch (e) {
        console.warn('Audio attach skipped:', e);
      }

      const result = await createOrUpdateSurvey(formData);

      if (result.success) {
        toast.success(editingSurvey ? 'نظرسنجی با موفقیت ویرایش شد' : 'نظرسنجی با موفقیت ایجاد شد');
        await fetchData();
        setIsCreating(false);
        setEditingSurvey(null);
      } else {
        toast.error(result.error || 'خطا در ذخیره نظرسنجی');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      toast.error('خطا در ذخیره نظرسنجی');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) { toast.error('شما دسترسی حذف نظرسنجی را ندارید'); return; }

    try {
      const result = await deleteSurveyAPI(id);
      if (result.success) {
        toast.success('نظرسنجی با موفقیت حذف شد');
        await fetchData();
      } else {
        toast.error(result.error || 'خطا در حذف نظرسنجی');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('خطا در حذف نظرسنجی');
    }
  };

  const handleToggleActive = (id: string) => {
    setSurveys(surveys.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleApplyDialplan = async (survey: Survey) => {
    if (!canManage) { toast.error('شما دسترسی اعمال دیال‌پلن را ندارید'); return; }

    try {
      const questionsToSend = survey.questions.map((q, index) => ({
        order: index + 1,
        title: q.title.trim(),
        audio_key: q.audioKey || ''
      }));

      if (!questionsToSend || questionsToSend.length === 0) {
        toast.error('سؤالات نظرسنجی معتبر نیست');
        return;
      }

      const result = await orchestrateSurvey({
        name: survey.name,
        queue: survey.queue,
        questions: questionsToSend
      });

      if (result.ok) {
        const logs: string[] = [];
        logs.push('[INFO] شروع اعمال تغییرات روی دایال‌پلن...');
        logs.push(`[INFO] نظرسنجی: ${survey.name}`);
        logs.push(`[INFO] صف: ${survey.queue}`);

        if (result.log?.apply_dialplan) {
          result.log.apply_dialplan.forEach(log => logs.push(`[APPLY] ${log}`));
        }
        if (result.log?.queue_apply) {
          result.log.queue_apply.forEach(log => logs.push(`[QUEUE] ${log}`));
        }

        if (result.dialplan_ctx) {
          logs.push(`[INFO] Context: ${result.dialplan_ctx}`);
        }
        if (result.dest) {
          logs.push(`[INFO] Destination: ${result.dest}`);
        }

        logs.push('[SUCCESS] عملیات با موفقیت کامل شد');
        setDialplanModal({ open: true, logs });
      } else {
        toast.error(result.error || 'خطا در اعمال روی دایال‌پلن');
      }
    } catch (error) {
      console.error('Error applying dialplan:', error);
      toast.error('خطا در اعمال روی دایال‌پلن');
    }
  };

  const handleApplyDialplanFromForm = async (survey: Survey) => {
    await handleApplyDialplan(survey);
  };

  const handleFetchQueues = async () => {
    const res = await fetchQueuesList();
    if (res?.success && Array.isArray(res.items)) {
      setQueues(res.items as Queue[]);
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
      <SurveyForm canManage={canManage}
        
        survey={editingSurvey}
        queues={queues}
        onSave={handleSave}
        onCancel={handleCancel}
        onApplyDialplan={handleApplyDialplanFromForm}
        onFetchQueues={handleFetchQueues}
      />
    );
  }

  return (
    <>
      <SurveyList canManage={canManage}
        
        surveys={surveys}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
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

const handleApplyDialplan = async (row: any) => {
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

export default SurveyManagement;
