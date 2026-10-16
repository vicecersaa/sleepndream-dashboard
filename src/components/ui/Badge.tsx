import { ReactNode } from 'react';

type BadgeColor = 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'purple';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  dot?: boolean;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const dotColors: Record<BadgeColor, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-brand-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
};

export function Badge({ children, color = 'gray', dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  );
}
