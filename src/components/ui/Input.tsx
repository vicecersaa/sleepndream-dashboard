import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({ label, error, hint, icon, className = '', ...props }: InputProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      )}
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
  className={cn(
    'w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
    'px-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all',
    '[color-scheme:light] dark:[color-scheme:dark]',
    icon && 'pl-10',
    error && 'border-red-500',
  )}
  {...props}
/>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, children, className = '', ...props }: SelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      )}
      <div className="relative w-full">
        <select
          className={cn(
            'w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
            'pl-3 pr-9 text-sm text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all',
            'cursor-pointer appearance-none',
            error && 'border-red-500',
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      )}
      <textarea
        className={cn(
          'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
          'px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-y',
          error && 'border-red-500',
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
