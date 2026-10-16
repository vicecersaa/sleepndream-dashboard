import { useCallback, useEffect, useState } from 'react';
import { Search, Eye, ShoppingCart, Package, MapPin, Truck, X, ChevronLeft, ChevronRight, Save, Link, MessageCircle } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Order, OrderStatus, PaymentStatus, ShippingStatus } from '../lib/types';
import { formatCurrency, formatDate, formatDateTime, getInitials } from '../lib/utils';

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '');

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
const ORDER_STATUS_COLOR: Record<OrderStatus, 'amber' | 'blue' | 'green' | 'red'> = {
  pending: 'amber',
  processing: 'blue',
  completed: 'green',
  cancelled: 'red',
};
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Lunas',
  pending: 'Pending',
  failed: 'Gagal',
};
const PAYMENT_STATUS_COLOR: Record<PaymentStatus, 'green' | 'amber' | 'red'> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
};
const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  unfulfilled: 'Belum Dikirim',
  shipped: 'Dikirim',
  delivered: 'Tiba',
};
const PER_PAGE = 8;

export function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [ongkirFilter, setOngkirFilter] = useState<'all' | 'pending_ongkir'>('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Order | null>(null);
  const [detailStatus, setDetailStatus] = useState<OrderStatus>('pending');
  const [detailPaymentStatus, setDetailPaymentStatus] = useState<PaymentStatus>('pending');
  const [detailShippingStatus, setDetailShippingStatus] = useState<ShippingStatus>('unfulfilled');
  const [saving, setSaving] = useState(false);

  const [ongkirCost, setOngkirCost] = useState('');
  const [isCOD, setIsCOD] = useState(false);
  const [savingOngkir, setSavingOngkir] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getOrders({
        page,
        limit: PER_PAGE,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        shippingCostStatus: ongkirFilter === 'all' ? undefined : ongkirFilter,
      });
      setOrders(result.items);
      setTotalItems(result.pagination.totalItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, ongkirFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, ongkirFilter]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));

  const openDetail = useCallback((order: Order) => {
    setSelected(order);
    setDetailStatus(order.status);
    setDetailPaymentStatus(order.paymentStatus);
    setDetailShippingStatus(order.shippingStatus);
    setOngkirCost(order.shippingCost ? String(order.shippingCost) : '');
    setIsCOD(order.isCOD || false);
    setGeneratedLink(
      order.checkoutToken
        && STOREFRONT_URL ? `${STOREFRONT_URL}/checkout?order_id=${order._id}&token=${order.checkoutToken}`
        : null
    );
  }, []);

  const closeDetail = useCallback(() => {
    setSelected(null);
    setGeneratedLink(null);
  }, []);

  const hasChanges = selected
    ? detailStatus !== selected.status ||
      detailPaymentStatus !== selected.paymentStatus ||
      detailShippingStatus !== selected.shippingStatus
    : false;

  const handleSave = useCallback(async () => {
    if (!selected || !hasChanges) return;
    setSaving(true);
    try {
      let updated = selected;
      if (detailStatus !== selected.status) {
        updated = await api.updateOrderStatus(selected._id, detailStatus);
      }
      if (detailPaymentStatus !== selected.paymentStatus) {
        updated = await api.updateOrderPaymentStatus(selected._id, detailPaymentStatus);
      }
      if (detailShippingStatus !== selected.shippingStatus) {
        updated = await api.updateOrderShippingStatus(selected._id, detailShippingStatus);
      }
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setSelected(updated);
      toast('Perubahan pesanan berhasil disimpan', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan perubahan', 'error');
    } finally {
      setSaving(false);
    }
  }, [selected, hasChanges, detailStatus, detailPaymentStatus, detailShippingStatus, toast]);

  const handleSaveOngkir = useCallback(async () => {
    if (!selected) return;
    setSavingOngkir(true);
    try {
      const updated = await api.setOngkir(selected._id, {
        isCOD,
        shippingCost: isCOD ? 0 : Number(ongkirCost),
      });
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setSelected(updated);
      toast('Ongkir berhasil disimpan', 'success');

      // Auto-generate link langsung setelah simpan ongkir
      setGeneratingLink(true);
      try {
        const result = await api.generateCheckoutLink(updated._id);
        setGeneratedLink(result.link);
        navigator.clipboard.writeText(result.link);
        toast('Link checkout otomatis dibuat & dicopy!', 'success');
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Gagal generate link', 'error');
      } finally {
        setGeneratingLink(false);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan ongkir', 'error');
    } finally {
      setSavingOngkir(false);
    }
  }, [selected, isCOD, ongkirCost, toast]);

  const displayLink = generatedLink ||
  (selected?.checkoutToken
    && STOREFRONT_URL ? `${STOREFRONT_URL}/checkout?order_id=${selected._id}&token=${selected.checkoutToken}`
    : null);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Input
          placeholder="Cari nomor pesanan / nama penerima..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:w-full"
        />
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
            className="sm:w-44"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Diproses</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </Select>
          <Select
            value={ongkirFilter}
            onChange={(e) => setOngkirFilter(e.target.value as 'all' | 'pending_ongkir')}
            className="sm:w-44"
          >
            <option value="all">Semua Ongkir</option>
            <option value="pending_ongkir">Pending Ongkir</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Daftar Pesanan"
          subtitle={`${totalItems} pesanan ditemukan`}
        />

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat pesanan"
            description={error}
            action={<Button onClick={loadOrders} variant="outline" size="sm">Coba lagi</Button>}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7" />}
            title="Belum ada pesanan"
            description={search || statusFilter !== 'all' ? 'Tidak ada pesanan yang sesuai dengan filter Anda.' : 'Pesanan pelanggan akan muncul di sini.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-3">Nomor Pesanan</th>
                    <th className="px-5 py-3">Penerima</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Status Pesanan</th>
                    <th className="px-5 py-3">Pembayaran</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          {o.orderNumber}
                          {o.shippingCostStatus === 'pending_ongkir' && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                              Pending Ongkir
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-semibold text-white shrink-0">
                            {getInitials(o.shippingAddress?.name || '?')}
                          </div>
                          <span className="text-gray-700 dark:text-gray-200 truncate max-w-[160px]">{o.shippingAddress?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                      <td className="px-5 py-3">
                        <Badge color={ORDER_STATUS_COLOR[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={PAYMENT_STATUS_COLOR[o.paymentStatus]} dot>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(o.total)}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => openDetail(o)}
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
              {orders.map((o) => (
                <button
                  key={o._id}
                  onClick={() => openDetail(o)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{o.orderNumber}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(o.total)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-[10px] font-semibold text-white shrink-0">
                      {getInitials(o.shippingAddress?.name || '?')}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{o.shippingAddress?.name || '-'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge color={ORDER_STATUS_COLOR[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    <Badge color={PAYMENT_STATUS_COLOR[o.paymentStatus]} dot>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</Badge>
                    {o.shippingCostStatus === 'pending_ongkir' && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                        Pending Ongkir
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(o.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
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
        title={selected ? `Detail ${selected.orderNumber}` : 'Detail Pesanan'}
        subtitle={selected ? formatDateTime(selected.createdAt) : undefined}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeDetail}>Tutup</Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-6">
            {/* Shipping info */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Informasi Pengiriman
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-sm font-semibold text-white shrink-0">
                  {getInitials(selected.shippingAddress?.name || '?')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{selected.shippingAddress?.name || '-'}</p>
                  {selected.shippingAddress?.phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selected.shippingAddress.phone}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {[
                  selected.shippingAddress?.address,
                  selected.shippingAddress?.city,
                  selected.shippingAddress?.province,
                  selected.shippingAddress?.postalCode,
                ].filter(Boolean).join(', ') || 'Alamat pengiriman belum tersedia'}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                <Truck className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Metode Pembayaran</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selected.paymentMethod || '-'}</p>
                </div>
              </div>
              {selected.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Catatan: {selected.notes}</p>
              )}
            </div>

            {/* Pending Ongkir Section */}
            {selected.shippingCostStatus === 'pending_ongkir' && (
              <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-4">
                <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" /> Konfirmasi Ongkir
                </h4>
                <p className="text-xs text-orange-500/80 dark:text-orange-400/70 mb-4 leading-relaxed">
                  Aktifkan <strong>COD</strong> jika pelanggan bayar langsung saat barang tiba, atau masukkan{' '}
                  <strong>nominal ongkir</strong> jika pelanggan perlu membayar ongkos kirim via transfer.
                  Setelah disimpan, link checkout akan otomatis dibuat.
                </p>

                {/* Toggle COD */}
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <div
                    onClick={() => setIsCOD(prev => !prev)}
                    className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${isCOD ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isCOD ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">COD (bayar di tempat)</span>
                </label>

                {/* Input ongkir */}
                {!isCOD && (
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nominal Ongkir (Rp)</label>
                    <input
                      type="number"
                      value={ongkirCost}
                      onChange={(e) => setOngkirCost(e.target.value)}
                      placeholder="Contoh: 200000"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSaveOngkir}
                  disabled={savingOngkir || generatingLink || (!isCOD && !ongkirCost)}
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                  {savingOngkir ? 'Menyimpan...' : generatingLink ? 'Membuat link...' : 'Simpan Ongkir'}
                </Button>
              </div>
            )}

            {/* Link Checkout Section — tampil setelah ongkir settled & link sudah ada */}
            {selected.shippingCostStatus === 'settled' && displayLink && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Link className="h-3.5 w-3.5" /> Link Checkout
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                  <span className="flex-1 truncate text-xs font-mono text-gray-500 dark:text-gray-400">
                    {displayLink}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(displayLink!);
                      toast('Link dicopy!', 'success');
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Order items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Item Pesanan
              </h4>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2.5">Produk</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Harga</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selected.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {item.name}
                          {(item.variant || item.size) && (
                            <span className="block text-xs text-gray-400">
                              {[item.variant, item.size].filter(Boolean).join(' / ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Ringkasan Pesanan</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(selected.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Diskon</span>
                  <span className="text-red-600 dark:text-red-400">- {formatCurrency(selected.discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Ongkir</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {selected.shippingCostStatus === 'pending_ongkir'
                      ? <span className="text-orange-500 text-xs">Belum dikonfirmasi</span>
                      : selected.isCOD
                      ? 'COD'
                      : formatCurrency(selected.shippingCost)}
                  </span>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selected.total)}</span>
                </div>
              </div>
            </div>

            {/* Status selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Status Pesanan" value={detailStatus} onChange={(e) => setDetailStatus(e.target.value as OrderStatus)}>
                <option value="pending">Pending</option>
                <option value="processing">Diproses</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </Select>
              <Select label="Status Pembayaran" value={detailPaymentStatus} onChange={(e) => setDetailPaymentStatus(e.target.value as PaymentStatus)}>
                <option value="paid">Lunas</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
              </Select>
              <Select label="Status Pengiriman" value={detailShippingStatus} onChange={(e) => setDetailShippingStatus(e.target.value as ShippingStatus)}>
                <option value="unfulfilled">{SHIPPING_STATUS_LABEL.unfulfilled}</option>
                <option value="shipped">{SHIPPING_STATUS_LABEL.shipped}</option>
                <option value="delivered">{SHIPPING_STATUS_LABEL.delivered}</option>
              </Select>
            </div>
            {!hasChanges && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">Tidak ada perubahan yang belum disimpan</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
