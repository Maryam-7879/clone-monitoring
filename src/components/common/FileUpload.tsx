import React, { useRef } from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  accept: string;
  onChange: (file: File | null) => void;
  currentFile?: File | null;
  currentFileUrl?: string;
  label: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  onChange,
  currentFile,
  currentFileUrl,
  label,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const fileName = currentFile?.name || (currentFileUrl ? 'فایل موجود' : '');

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          <span>انتخاب فایل</span>
        </button>

        {fileName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg flex-1">
            <FileIcon className="h-4 w-4 text-slate-600" />
            <span className="text-sm text-slate-700 flex-1 truncate">{fileName}</span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileUpload;
