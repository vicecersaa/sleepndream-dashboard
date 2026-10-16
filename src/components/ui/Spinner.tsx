import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Spinner className="h-8 w-8 text-brand-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{label}</p>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export function ErrorState({ message, onRetry, children }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 mb-4">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{message}</p>
      {children}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
