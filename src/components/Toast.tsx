import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

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
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const config = {
    success: {
      icon: <CheckCircle size={22} />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-800 dark:text-emerald-200',
      subtitleColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
    },
    error: {
      icon: <XCircle size={22} />,
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      border: 'border-rose-200 dark:border-rose-800',
      iconColor: 'text-rose-500',
      titleColor: 'text-rose-800 dark:text-rose-200',
      subtitleColor: 'text-rose-600 dark:text-rose-400',
      progressColor: 'bg-rose-500',
      glow: 'shadow-rose-500/20',
    },
    warning: {
      icon: <AlertTriangle size={22} />,
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-800 dark:text-amber-200',
      subtitleColor: 'text-amber-600 dark:text-amber-400',
      progressColor: 'bg-amber-500',
      glow: 'shadow-amber-500/20',
    },
    info: {
      icon: <Info size={22} />,
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800 dark:text-blue-200',
      subtitleColor: 'text-blue-600 dark:text-blue-400',
      progressColor: 'bg-blue-500',
      glow: 'shadow-blue-500/20',
    },
  };

  const c = config[type];

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] max-w-sm w-full pointer-events-auto transition-all ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-[120%] opacity-0 scale-95'
      }`}
      style={{ transitionDuration: isExiting ? '400ms' : '500ms' }}
    >
      <div
        className={`${c.bg} ${c.border} border rounded-2xl shadow-xl ${c.glow} overflow-hidden backdrop-blur-sm`}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Icon with pulse animation */}
          <div className={`${c.iconColor} mt-0.5 shrink-0 animate-bounce`} style={{ animationDuration: '1s', animationIterationCount: '2' }}>
            {c.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${c.titleColor}`}>{message}</p>
            {subtitle && (
              <p className={`text-xs mt-0.5 ${c.subtitleColor}`}>{subtitle}</p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${c.iconColor} hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Animated progress bar */}
        <div className="h-1 w-full bg-black/5 dark:bg-white/5">
          <div
            className={`h-full ${c.progressColor} rounded-r-full`}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
