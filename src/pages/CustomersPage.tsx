import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Eye, Users, MapPin, Mail, Phone, ShoppingBag, Wallet, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Customer, Order } from '../lib/types';
import { formatCurrency, formatDate, getInitials } from '../lib/utils';

const PER_PAGE = 8;

export function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCustomers();
      setCustomers(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat pelanggan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [filtered, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openDetail = useCallback(async (customer: Customer) => {
    setSelected(customer);
    setOrders([]);
    setOrdersLoading(true);
    try {
      const data = await api.getCustomerOrders(customer.id);
      setOrders(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal memuat riwayat pesanan', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [toast]);

  const closeDetail = useCallback(() => setSelected(null), []);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Cari nama / email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:w-64"
        />
      </div>

      <Card>
        <CardHeader
          title="Daftar Pelanggan"
          subtitle={`${filtered.length} pelanggan ditemukan`}
        />

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : error ? (
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat pelanggan"
            description={error}
            action={<Button onClick={loadCustomers} variant="outline" size="sm">Coba lagi</Button>}
          />
        ) : paged.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="Belum ada pelanggan"
            description={search ? 'Tidak ada pelanggan yang sesuai dengan pencarian Anda.' : 'Data pelanggan akan muncul di sini.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-3">Nama</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Telepon</th>
                    <th className="px-5 py-3">Lokasi</th>
                    <th className="px-5 py-3 text-center">Total Pesanan</th>
                    <th className="px-5 py-3 text-right">Total Belanja</th>
                    <th className="px-5 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paged.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-semibold text-white shrink-0">
                            {getInitials(c.full_name || '?')}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{c.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{c.email}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{c.phone || '-'}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {[c.city, c.country].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-700 dark:text-gray-200">{c.total_orders}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(c.total_spending)}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => openDetail(c)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          aria-label="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {paged.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-semibold text-white shrink-0">
                      {getInitials(c.full_name || '?')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{c.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {c.total_orders} pesanan
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(c.total_spending)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Halaman {safePage} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={closeDetail}
        title={selected ? 'Detail Pelanggan' : 'Detail Pelanggan'}
        subtitle={selected ? `Bergabung sejak ${formatDate(selected.created_at)}` : undefined}
        size="lg"
        footer={<Button variant="secondary" onClick={closeDetail}>Tutup</Button>}
      >
        {selected && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-lg font-semibold text-white shrink-0">
                {getInitials(selected.full_name || '?')}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{selected.full_name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selected.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Pesanan</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selected.total_orders}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Belanja</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selected.total_spending)}</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Informasi Kontak</h4>
              <div className="flex items-start gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-200 break-all">{selected.email}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-200">{selected.phone || 'Tidak tersedia'}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-200">
                  {selected.address || 'Alamat tidak tersedia'}
                  {(selected.city || selected.country) && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {' '}— {[selected.city, selected.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Purchase history */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Riwayat Pembelian</h4>
              {ordersLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl skeleton bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                  <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada riwayat pembelian</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {orders.map((o) => (
                    <div key={o._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{o.orderNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(o.createdAt)} • {o.items.length} item</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(o.total)}</p>
                        <Badge
                          color={o.status === 'completed' ? 'green' : o.status === 'cancelled' ? 'red' : o.status === 'processing' ? 'blue' : 'amber'}
                          dot
                          className="mt-0.5"
                        >
                          {o.status === 'pending' ? 'Pending' : o.status === 'processing' ? 'Diproses' : o.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
