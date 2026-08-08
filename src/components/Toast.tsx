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
      icon: <CheckCircle2 size={24} className="text-emerald-500" strokeWidth={2.5} />,
      bg: 'bg-white/80 dark:bg-slate-900/80',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      accent: 'bg-emerald-500',
      title: 'text-slate-800 dark:text-slate-100',
      desc: 'text-slate-500 dark:text-slate-400',
      shadow: 'shadow-[0_8px_30px_rgb(16,185,129,0.12)] dark:shadow-[0_8px_30px_rgb(16,185,129,0.08)]',
    },
    error: {
      icon: <XCircle size={24} className="text-rose-500" strokeWidth={2.5} />,
      bg: 'bg-white/80 dark:bg-slate-900/80',
      border: 'border-rose-100 dark:border-rose-900/50',
      accent: 'bg-rose-500',
      title: 'text-slate-800 dark:text-slate-100',
      desc: 'text-slate-500 dark:text-slate-400',
      shadow: 'shadow-[0_8px_30px_rgb(244,63,94,0.12)] dark:shadow-[0_8px_30px_rgb(244,63,94,0.08)]',
    },
    warning: {
      icon: <AlertCircle size={24} className="text-amber-500" strokeWidth={2.5} />,
      bg: 'bg-white/80 dark:bg-slate-900/80',
      border: 'border-amber-100 dark:border-amber-900/50',
      accent: 'bg-amber-500',
      title: 'text-slate-800 dark:text-slate-100',
      desc: 'text-slate-500 dark:text-slate-400',
      shadow: 'shadow-[0_8px_30px_rgb(245,158,11,0.12)] dark:shadow-[0_8px_30px_rgb(245,158,11,0.08)]',
    },
    info: {
      icon: <Info size={24} className="text-blue-500" strokeWidth={2.5} />,
      bg: 'bg-white/80 dark:bg-slate-900/80',
      border: 'border-blue-100 dark:border-blue-900/50',
      accent: 'bg-blue-500',
      title: 'text-slate-800 dark:text-slate-100',
      desc: 'text-slate-500 dark:text-slate-400',
      shadow: 'shadow-[0_8px_30px_rgb(59,130,246,0.12)] dark:shadow-[0_8px_30px_rgb(59,130,246,0.08)]',
    },
  };

  const c = config[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-[calc(100vw-3rem)] sm:w-[380px] pointer-events-auto transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible && !isExiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-12 opacity-0 scale-95'
      }`}
    >
      <div className={`relative overflow-hidden ${c.bg} backdrop-blur-xl border ${c.border} rounded-2xl ${c.shadow} p-4 pr-12 flex items-start gap-4`}>
        {/* Left Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />
        
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          {c.icon}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[24px]">
          <h4 className={`text-[15px] font-semibold leading-snug ${c.title}`}>
            {message}
          </h4>
          {subtitle && (
            <p className={`text-[13px] leading-relaxed mt-1 ${c.desc}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-transparent rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-100/50 dark:bg-slate-800/50">
          <div
            className={`h-full ${c.accent}`}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
              transformOrigin: 'left'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
