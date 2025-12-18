import React from 'react';
import { Plus, Edit, Trash2, PhoneOutgoing, Play } from 'lucide-react';
import { OutboundSurvey } from './index';
import toast from 'react-hot-toast';

interface OutboundSurveyListProps {
  canManage: boolean;
  surveys: OutboundSurvey[];
  onEdit: (survey: OutboundSurvey) => void;
  onDelete: (id: string) => void;
  onApplyDialplan: (survey: OutboundSurvey) => void;
  onCreateNew: () => void;
}

const OutboundSurveyList: React.FC<OutboundSurveyListProps> = ({
  surveys,
  canManage,
  onEdit,
  onDelete,
  onApplyDialplan,
  onCreateNew
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">نظرسنجی خروجی</h2>
          <p className="text-slate-600">مدیریت نظرسنجی‌های خروجی با کد دستوری</p>
        </div>

        {canManage ? (
          <button
            onClick={onCreateNew}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            <span>نظرسنجی جدید</span>
          </button>
        ) : (
          <div className="text-sm text-slate-500">حالت فقط مشاهده</div>
        )}
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <PhoneOutgoing className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            هیچ نظرسنجی خروجی وجود ندارد
          </h3>
          <p className="text-slate-600 mb-6">
            برای شروع، یک نظرسنجی خروجی جدید ایجاد کنید
          </p>
          {canManage ? (
            <button
              onClick={onCreateNew}
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              <span>ایجاد اولین نظرسنجی</span>
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <span className="text-sm text-slate-500">کد دستوری:</span>
                      <span className="mr-2 text-sm font-mono font-bold text-blue-600">
                        {survey.commandCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-slate-500">تعداد سؤالات:</span>
                      <span className="mr-2 text-sm font-medium text-slate-800">
                        {survey.questions.length}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-slate-500">آخرین بروزرسانی:</span>
                      <span className="mr-2 text-sm font-medium text-slate-800">
                        {new Date(survey.updatedAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => canManage && onEdit(survey)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>ویرایش</span>
                </button>

                <button
                  onClick={() => onApplyDialplan(survey)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>اعمال روی دایال‌پلن</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('آیا از حذف این نظرسنجی اطمینان دارید؟')) {
                      onDelete(survey.id);
                      toast.success('نظرسنجی با موفقیت حذف شد');
                    }
                  }}
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
    </div>
  );
};

export default OutboundSurveyList;
