import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card ${hover ? 'transition-all duration-200 hover:shadow-elevated hover:border-gray-300 dark:hover:border-gray-700' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap sm:shrink-0">{action}</div>}
    </div>
  );
}
