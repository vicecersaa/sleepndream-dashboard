import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, ShoppingCart, Package, Users, Clock, AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { AreaChart, DonutChart } from '../components/charts/Charts';
import { api } from '../lib/api';
import type { DashboardData } from '../lib/api';
import { formatCurrency, formatNumber, timeAgo } from '../lib/utils';
import { LowStockAlert } from './LowStockAlert';
import type { PageKey } from '../components/layout/Sidebar';


const statusBadgeColors: Record<string, 'amber' | 'blue' | 'green' | 'red'> = {
  pending: 'amber', processing: 'blue', completed: 'green', cancelled: 'red',
};
const statusLabels: Record<string, string> = {
  pending: 'Pending', processing: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan',
};
const statusColors: Record<string, string> = {
  pending: '#f59e0b', processing: '#3b82f6', completed: '#10b981', cancelled: '#ef4444',
};

interface DashboardPageProps {
  onNavigate?: (page: PageKey) => void;
  onViewProduct?: (id: string) => void;  // TAMBAH INI
}


export function DashboardPage({ onViewProduct }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><CardSkeleton /></div>
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSkeleton rows={5} cols={4} />
          <TableSkeleton rows={5} cols={3} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  const { summary } = data;

  const cards = [
    { label: 'Pendapatan Hari Ini', value: formatCurrency(summary.todayRevenue), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Pesanan Hari Ini', value: formatNumber(summary.todayOrders), icon: ShoppingCart, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
    { label: 'Total Pesanan', value: formatNumber(summary.totalOrders), icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Produk', value: formatNumber(summary.totalProducts), icon: Package, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Total Pelanggan', value: formatNumber(summary.totalCustomers), icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Pesanan Pending', value: formatNumber(summary.pendingOrders), icon: Clock, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Stok Menipis', value: formatNumber(summary.lowStock), icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  ];

  const revenueChart = data.salesChart.map((item) => ({
    label: new Date(`${item.date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' }),
    value: item.revenue,
  }));

  const orderStatusCounts = data.orderStatus.map((item) => ({
    label: statusLabels[item.status] ?? item.status,
    value: item.count,
    color: statusColors[item.status] ?? '#9ca3af',
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} hover className="p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </Card>
          );
        })}
      </div>

       <LowStockAlert
  defaultThreshold={10}
  onViewProduct={onViewProduct}
/>

      {/* Sales Chart + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Grafik Penjualan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-4">Pendapatan 7 hari terakhir (pesanan paid)</p>
          <AreaChart data={revenueChart} formatValue={(v) => `Rp${formatNumber(Math.round(v / 1000))}k`} />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Status Pesanan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribusi status pesanan</p>
          {orderStatusCounts.some((s) => s.value > 0) ? (
            <DonutChart data={orderStatusCounts} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada data</p>
          )}
        </Card>
      </div>

      {/* Recent Orders + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pesanan Terbaru</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">5 pesanan terakhir</p>
            </div>
            <Badge color="blue">{data.recentOrders.length} baru</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Pesanan</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Pembayaran</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.orderNumber}
                      <div className="text-xs text-gray-400 font-normal">{timeAgo(order.createdAt)}</div>
                    </td>
                    <td className="px-5 py-3"><Badge color={statusBadgeColors[order.status] ?? 'blue'} dot>{order.status}</Badge></td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{order.paymentStatus}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Produk Terlaris</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top 5 produk</p>
            </div>
            <Badge color="green">Trending</Badge>
          </div>
          <div className="p-5 space-y-3">
            {data.bestSellingProducts.map((product, idx) => (
              <div key={product._id ?? `${product.name}-${idx}`} className="flex items-center gap-3 group">
                <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-6">{idx + 1}</span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400"><Package className="h-5 w-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{formatNumber(product.sold)} terjual</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
            {data.bestSellingProducts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada penjualan</p>
            )}
          </div>
        </Card>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
