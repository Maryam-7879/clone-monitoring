import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  Save,
  X,
  Plus,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { OutboundSurvey, OutboundQuestion } from './index';
import FileUpload from '../../common/FileUpload';
import AudioPlayer from '../../common/AudioPlayer';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface OutboundSurveyFormProps {
  canManage: boolean;
  survey?: OutboundSurvey | null;
  usedCommandCodes: string[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const AVAILABLE_COMMAND_CODES = [
  '7788', '7789', '7790', '7791', '7792', '7793', '7794', '7795', '7796', '7797', '7798', '7799'
];

const OutboundSurveyForm: React.FC<OutboundSurveyFormProps> = ({
  survey,
  canManage,
  usedCommandCodes,
  onSave,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [commandCode, setCommandCode] = useState('');
  const [questions, setQuestions] = useState<OutboundQuestion[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (survey) {
      setName(survey.name);
      setCommandCode(survey.commandCode);
      setQuestions(survey.questions);
    } else {
      addQuestion();
    }
  }, [survey]);

  const availableCommandCodes = AVAILABLE_COMMAND_CODES.filter(
    code => !usedCommandCodes.includes(code)
  );

  const addQuestion = () => {
    const newQuestion: OutboundQuestion = {
      id: uuidv4(),
      title: '',
      rangeMin: 1,
      rangeMax: 5,
      audioFile: null,
      order: questions.length
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error('حداقل یک سؤال باید وجود داشته باشد');
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof OutboundQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items.map((q, i) => ({ ...q, order: i })));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'نام نظرسنجی الزامی است';
    }

    if (!commandCode) {
      newErrors.commandCode = 'انتخاب کد دستوری الزامی است';
    }

    questions.forEach((q, index) => {
      if (!q.title.trim()) {
        newErrors[`question_${q.id}_title`] = `عنوان سؤال ${index + 1} الزامی است`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }

    setLoading(true);
    try {
      const voiceFile = questions.find(q => q.audioFile)?.audioFile || null;

      const data = {
        name,
        commandCode,
        questions: questions.map(({ audioFile, ...rest }) => rest),
        voiceFile
      };

      await onSave(data);
      toast.success(survey ? 'نظرسنجی با موفقیت ویرایش شد' : 'نظرسنجی با موفقیت ایجاد شد');
    } catch (error) {
      toast.error('خطا در ذخیره نظرسنجی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {!canManage && (<div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">حالت فقط مشاهده: امکان ذخیره/حذف/ویرایش غیرفعال است.</div>)}
      <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {survey ? 'ویرایش نظرسنجی خروجی' : 'ایجاد نظرسنجی خروجی جدید'}
          </h2>
          <p className="text-slate-600">تنظیمات و سؤالات نظرسنجی خروجی را وارد کنید</p>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="h-6 w-6 text-slate-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              نام نظرسنجی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: نظرسنجی خروجی فروش"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={loading}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              کد دستوری <span className="text-red-500">*</span>
            </label>
            <select
              value={commandCode}
              onChange={(e) => setCommandCode(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.commandCode ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={loading || (survey && !!survey.commandCode)}
            >
              <option value="">یک کد دستوری انتخاب کنید</option>
              {survey && survey.commandCode && (
                <option value={survey.commandCode}>{survey.commandCode}</option>
              )}
              {availableCommandCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            {errors.commandCode && <p className="text-red-500 text-sm mt-1">{errors.commandCode}</p>}
            <p className="text-xs text-slate-500 mt-1">
              کدهای استفاده شده قابل انتخاب نیستند. با حذف نظرسنجی، کد آن دوباره قابل استفاده می‌شود.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800">سؤالات نظرسنجی</h3>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {questions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-slate-50 rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-3 p-1 cursor-move hover:bg-slate-200 rounded"
                          >
                            <GripVertical className="h-5 w-5 text-slate-400" />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-slate-700">
                                سؤال {index + 1}
                              </span>
                              <div className="flex items-center gap-1 mr-auto">
                                <button
                                  type="button"
                                  onClick={() => moveQuestion(question.id, 'up')}
                                  disabled={index === 0 || loading}
                                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                >
                                  <ChevronUp className="h-4 w-4 text-slate-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveQuestion(question.id, 'down')}
                                  disabled={index === questions.length - 1 || loading}
                                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                >
                                  <ChevronDown className="h-4 w-4 text-slate-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(question.id)}
                                  disabled={loading}
                                  className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                عنوان سؤال <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={question.title}
                                onChange={(e) => updateQuestion(question.id, 'title', e.target.value)}
                                placeholder="مثال: از کیفیت خدمات ما چقدر راضی بودید؟"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                  errors[`question_${question.id}_title`]
                                    ? 'border-red-500'
                                    : 'border-slate-300'
                                }`}
                                disabled={loading}
                              />
                              {errors[`question_${question.id}_title`] && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors[`question_${question.id}_title`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                بازه انتخاب (فقط ۱ تا ۵)
                              </label>
                              <div className="flex items-center gap-4">
                                <span className="text-slate-600">از ۱ تا ۵</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                مشتری می‌تواند عددی بین ۱ تا ۵ را با کیبورد تلفن وارد کند
                              </p>
                            </div>

                            <FileUpload
                              accept=".wav,.gsm,.ulaw"
                              currentFile={question.audioFile}
                              currentFileUrl={question.audioUrl}
                              onChange={(file) => updateQuestion(question.id, 'audioFile', file)}
                              label="آپلود فایل صوتی (اختیاری)"
                              disabled={loading}
                            />

                            {question.audioUrl && (
                              <AudioPlayer src={question.audioUrl} label="پیش‌نمایش صدا" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? 'در حال ذخیره...' : 'ذخیره'}</span>
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50"
        >
          لغو
        </button>
      </div>
    </div>
  );
};

export default OutboundSurveyForm;
