import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'خطا در بارگذاری داده‌ها',
  message = 'در دریافت اطلاعات از سرور مشکلی پیش آمد.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex flex-col space-y-2 ${className}`}
      role="alert"
    >
      <div className="flex items-center space-x-2 space-x-reverse">
        <AlertCircle className="h-5 w-5" />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <p className="text-xs sm:text-sm text-red-600 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center mt-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm transition-colors"
        >
          <RefreshCw className="h-4 w-4 ml-1" />
          تلاش مجدد
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
