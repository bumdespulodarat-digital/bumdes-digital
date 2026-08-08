import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
  subtitle?: string;
}

export default function Toast({ message, type, onClose, duration = 4000, subtitle }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: <CheckCircle2 size={22} strokeWidth={2.5} />,
      accent: 'bg-emerald-500',
      iconColor: 'text-emerald-500',
      ring: 'ring-emerald-500/20',
    },
    error: {
      icon: <XCircle size={22} strokeWidth={2.5} />,
      accent: 'bg-rose-500',
      iconColor: 'text-rose-500',
      ring: 'ring-rose-500/20',
    },
    warning: {
      icon: <AlertCircle size={22} strokeWidth={2.5} />,
      accent: 'bg-amber-500',
      iconColor: 'text-amber-500',
      ring: 'ring-amber-500/20',
    },
    info: {
      icon: <Info size={22} strokeWidth={2.5} />,
      accent: 'bg-blue-500',
      iconColor: 'text-blue-500',
      ring: 'ring-blue-500/20',
    },
  };

  const c = config[type];

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[1px] sm:hidden transition-opacity duration-300 ${
          isVisible && !isExiting ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      <div
        className={`
          fixed z-[9999] pointer-events-auto
          /* Mobile: bottom center, full width */
          bottom-4 left-4 right-4
          /* Tablet+: bottom right, fixed width */
          sm:left-auto sm:right-6 sm:bottom-6 sm:w-[400px]
          /* Animation */
          transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible && !isExiting
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 opacity-0 scale-[0.97]'
          }
        `}
      >
        <div className={`
          relative overflow-hidden
          bg-white dark:bg-slate-900
          border border-slate-200/80 dark:border-slate-700/80
          rounded-2xl
          shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]
          ring-1 ${c.ring}
        `}>
          {/* Left accent bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent} rounded-l-2xl`} />

          <div className="flex items-start gap-3 p-4 pl-5">
            {/* Icon with soft bg circle */}
            <div className={`shrink-0 mt-0.5 ${c.iconColor}`}>
              {c.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                {message}
              </p>
              {subtitle && (
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-3.5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full ${c.accent} rounded-r-full`}
              style={{
                animation: `toast-progress ${duration}ms linear forwards`,
                transformOrigin: 'left',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </>
  );
}

// ============================================================
// Confirm Dialog - Modal konfirmasi pengganti window.confirm()
// ============================================================
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmText = 'Ya, Hapus', cancelText = 'Batal', type = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 200);
  };

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(onConfirm, 200);
  };

  const btnColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/30',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/30',
  };

  const iconColors = {
    danger: 'text-rose-500 bg-rose-100 dark:bg-rose-900/40',
    warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/40',
    info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  };

  const icons = {
    danger: <XCircle size={24} strokeWidth={2} />,
    warning: <AlertCircle size={24} strokeWidth={2} />,
    info: <Info size={24} strokeWidth={2} />,
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className={`
        relative w-full max-w-sm
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-700
        rounded-2xl shadow-2xl
        transform transition-all duration-200
        ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}
      `}>
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${iconColors[type]} flex items-center justify-center mx-auto mb-4`}>
            {icons[type]}
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all focus:ring-4 ${btnColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
