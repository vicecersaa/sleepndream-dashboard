import { Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobile: () => void;
}

export function Topbar({ title, subtitle, onOpenMobile }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center px-4 lg:px-6 gap-4">
      <button onClick={onOpenMobile} className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">{subtitle}</p>}
      </div>




    </header>
  );
}
