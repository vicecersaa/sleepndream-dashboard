import {
  LayoutDashboard, Package, ShoppingCart, FolderTree,
  ShieldCheck,
  Settings, ShoppingBag, Moon, Sun, X, LogOut,
  Ticket,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export type PageKey =
  | 'dashboard' | 'products' | 'orders' | 'banners' | 'coupons' | 'categories' | 'garansi'
 | 'settings' | 'homepage';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'homepage', label: 'Konten Website', icon: LayoutDashboard },
  { key: 'products', label: 'Produk', icon: Package },
  { key: 'orders', label: 'Pesanan', icon: ShoppingCart },
  { key: 'coupons', label: 'Kupon', icon: Ticket },
  { key: 'categories', label: 'Kategori', icon: FolderTree },
  { key: 'garansi', label: 'Garansi', icon: ShieldCheck },
  { key: 'settings', label: 'Pengaturan', icon: Settings },
];

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Sleep n Dream</p>
              <p className="text-xs text-gray-400 leading-tight">Admin Panel</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.key); onCloseMobile(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] transition-colors ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="h-[18px] w-[18px] text-gray-400" /> : <Sun className="h-[18px] w-[18px] text-gray-400" />}
            {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          </button>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-semibold">
              {admin ? admin.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{admin?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">Admin</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Keluar"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
