'use client';

import { useState, useRef } from 'react';

interface KycFileUploadProps {
  label: string;
  description?: string;
  required?: boolean;
  value?: string;
  onChange: (url: string, fileMeta?: { name: string; size: number }) => void;
  acceptedFormats?: string;
}

export default function KycFileUpload({
  label,
  description,
  required = false,
  value,
  onChange,
  acceptedFormats = '.pdf,.jpg,.jpeg,.png',
}: KycFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  const handleFile = async (file: File) => {
    setErrorMessage('');

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please compress or select a smaller file.');
      return;
    }

    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMessage('Only PDF, JPG, and PNG files are accepted for KYC verification.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:4000/uploads/kyc', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload document to server.');
      }

      const data = await res.json();
      const serverUrl = data.url.startsWith('http')
        ? data.url
        : `http://localhost:4000${data.url}`;

      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      onChange(serverUrl, { name: file.name, size: file.size });
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while uploading. Please ensure server is running.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
    setFileName('');
    setFileSize('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = value?.toLowerCase().endsWith('.pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = value && !isPdf;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {description && <span className="text-[11px] text-slate-500">{description}</span>}
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {value ? (
        <div className="p-3.5 bg-slate-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isPdf ? (
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-200">
                PDF
              </div>
            ) : isImage ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 shrink-0 relative bg-slate-200">
                <img src={value} alt="KYC Document Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                DOC
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {fileName || (value.split('/').pop() || 'Verified Document')}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                  ✓ Uploaded
                </span>
                {fileSize && <span className="text-[10px] text-slate-400 font-mono">{fileSize}</span>}
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                >
                  View Preview ↗
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition font-medium shrink-0"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
            isUploading
              ? 'border-emerald-400 bg-emerald-50/50'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-1">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-emerald-800">Uploading and validating document...</p>
              <p className="text-[10px] text-slate-400 font-mono">Storing secure copy on server</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold">
                📁
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag & drop document
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Accepted: PDF, PNG, JPG (Maximum 10 MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
