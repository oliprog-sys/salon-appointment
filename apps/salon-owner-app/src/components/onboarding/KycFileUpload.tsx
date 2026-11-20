'use client';

import { useState, useRef } from 'react';

interface KycFileUploadProps {
  label: string;
  description?: string;
  required?: boolean;
  value?: string;
  onChange: (url: string, fileMeta?: { name: string; size: number }) => void;
  acceptedFormats?: string;
  darkMode?: boolean;
}

export default function KycFileUpload({
  label,
  description,
  required = false,
  value,
  onChange,
  acceptedFormats = '.pdf,.jpg,.jpeg,.png',
  darkMode = false,
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
        <label className={`block text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {description && (
          <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {description}
          </span>
        )}
      </div>

      {errorMessage && (
        <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
          darkMode
            ? 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {value ? (
        <div className={`p-3.5 rounded-xl flex items-center justify-between gap-3 border ${
          darkMode
            ? 'bg-slate-900/90 border-emerald-500/50 text-slate-100 shadow-inner'
            : 'bg-slate-50 border-emerald-300 text-slate-900'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {isPdf ? (
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-500/30">
                PDF
              </div>
            ) : isImage ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 relative bg-slate-800">
                <img src={value} alt="KYC Document Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
                DOC
              </div>
            )}
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {fileName || (value.split('/').pop() || 'Verified Document')}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded">
                  ✓ Uploaded
                </span>
                {fileSize && <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{fileSize}</span>}
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline"
                >
                  View Preview ↗
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className={`px-2.5 py-1 text-xs rounded-lg transition font-medium shrink-0 border ${
              darkMode
                ? 'text-rose-300 hover:bg-rose-950/50 border-rose-800/60'
                : 'text-rose-600 hover:bg-rose-50 border-rose-200'
            }`}
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
              ? darkMode
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-emerald-400 bg-emerald-50/50'
              : darkMode
              ? 'border-slate-700 hover:border-emerald-400/80 bg-slate-900/60 hover:bg-slate-800/60'
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
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className={`text-xs font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Uploading and validating document...</p>
              <p className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Storing secure copy on server</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-200 text-slate-600'
              }`}>
                📁
              </div>
              <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Click to browse or drag & drop document
              </p>
              <p className={`text-[11px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Accepted: PDF, PNG, JPG (Maximum 10 MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
