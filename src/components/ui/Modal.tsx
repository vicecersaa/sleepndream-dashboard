import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={[
          `relative w-full ${sizeClasses[size]} max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-elevated transition-all duration-200`,
          open ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95",
        ].join(" ")}
      >
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 ml-3"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
