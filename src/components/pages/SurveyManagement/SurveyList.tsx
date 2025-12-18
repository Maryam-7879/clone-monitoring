import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Power, PowerOff, Play, AlertCircle } from 'lucide-react';
import { Survey } from '../../../types/surveyManagement';
import Modal from '../../common/Modal';
import toast from 'react-hot-toast';

interface SurveyListProps {
  surveys: Survey[];
  canManage: boolean;
  onEdit: (survey: Survey) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onApplyDialplan: (survey: Survey) => void;
  onCreateNew: () => void;
}

const SurveyList: React.FC<SurveyListProps> = ({
  surveys,
  canManage,
  onEdit,
  onDelete,
  onToggleActive,
  onApplyDialplan,
  onCreateNew
}) => {
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; surveyId: string | null }>({
    open: false,
    surveyId: null
  });

  const handleDelete = () => {
    if (deleteModal.surveyId) {
      onDelete(deleteModal.surveyId);
      setDeleteModal({ open: false, surveyId: null });
      toast.success('نظرسنجی با موفقیت حذف شد');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">مدیریت نظرسنجی‌ها</h2>
          <p className="text-slate-600">ایجاد و مدیریت نظرسنجی‌های تلفنی</p>
        </div>

        {canManage && (
          <button
            onClick={onCreateNew}
            className="btn-primary"
          >
          <Plus className="h-5 w-5" />
          <span>ایجاد نظرسنجی جدید</span>
          </button>
        )}
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            هیچ نظرسنجی‌ای یافت نشد
          </h3>
          <p className="text-slate-600 mb-6">
            برای شروع، اولین نظرسنجی خود را ایجاد کنید
          </p>
          {canManage ? (
            <button onClick={onCreateNew} className="btn-primary">
              <Plus className="h-5 w-5" />
              <span>ایجاد نظرسنجی</span>
            </button>
          ) : (
            <div className="text-sm text-slate-500">حالت فقط مشاهده</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-xl shadow-lg p-6 hover-lift"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{survey.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        survey.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {survey.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <span className="text-sm text-slate-500">صف:</span>
                      <span className="mr-2 text-sm font-medium text-slate-800">
                        {survey.queue}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">تعداد سؤالات:</span>
                      <span className="mr-2 text-sm font-medium text-slate-800">
                        {survey.questions.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">تاریخ ایجاد:</span>
                      <span className="mr-2 text-sm font-medium text-slate-800">
                        {formatDate(survey.createdAt)}
                      </span>
                    </div>
                  </div>

                  {survey.customDestination && (
                    <div className="mt-3">
                      <span className="text-sm text-slate-500">مقصد سفارشی:</span>
                      <span className="mr-2 text-sm font-medium text-slate-800">
                        {survey.customDestination}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => canManage && onEdit(survey)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>ویرایش</span>
                </button>

                <button
                  onClick={() => canManage && onToggleActive(survey.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    survey.isActive
                      ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {survey.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4" />
                      <span>غیرفعال</span>
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4" />
                      <span>فعال</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => canManage && onApplyDialplan(survey)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>اعمال روی دایال‌پلن</span>
                </button>

                <button
                  onClick={() => setDeleteModal({ open: true, surveyId: survey.id })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, surveyId: null })}
        title="تأیید حذف"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteModal({ open: false, surveyId: null })}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              لغو
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              حذف
            </button>
          </div>
        }
      >
        <p className="text-slate-700">
          آیا از حذف این نظرسنجی مطمئن هستید؟ این عملیات قابل بازگشت نیست.
        </p>
      </Modal>
    </div>
  );
};

export default SurveyList;
