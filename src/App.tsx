import { isDemo } from './lib/demo';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import type { PageKey } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { BannersPage } from './pages/BannersPage';
import { CouponsPage } from './pages/CouponsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { GaransiPage } from './pages/GaransiPage';
import { WebsitePage } from './pages/WebsitePage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [highlightProductId, setHighlightProductId] = useState<string | undefined>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return (
        <DashboardPage
          onNavigate={(p) => setPage(p as PageKey)}
          onViewProduct={(id) => {
            console.log('onViewProduct called', id);
            setHighlightProductId(id);
            setPage('products');
          }}
        />
      );
      case 'homepage': return <WebsitePage />;
      case 'products': return <ProductsPage highlightId={highlightProductId} />;
      case 'orders': return <OrdersPage />;
      case 'banners': return <BannersPage />;
      case 'coupons': return <CouponsPage />;
      case 'categories': return <CategoriesPage />;
      case 'settings': return <SettingsPage />;
      case 'garansi': return <GaransiPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <Layout current={page} onNavigate={setPage}>
      {(isDemo || (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')) && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-stone-700">
          {isDemo ? 'Demo Sleep n Dream: data contoh. Simpan dan publikasi hanya simulasi di browser ini, tidak mengubah website live.' : 'Demo lokal Sleep n Dream: database terpisah dari website live.'}
        </div>
      )}
      {renderPage()}
    </Layout>
  );
}

function App() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'website') return <div className="min-h-screen bg-stone-50 p-5"><WebsitePage preview /></div>;
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
