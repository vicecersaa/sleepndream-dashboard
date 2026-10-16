import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search, AlertTriangle, Package, Plus, History,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Product, InventoryHistory } from '../lib/types';
import { formatNumber, formatDateTime } from '../lib/utils';

const LOW_STOCK_THRESHOLD = 10;
const HISTORY_LIMIT = 12;

type ChangeType = 'restock' | 'adjustment' | 'return';

const changeTypeColors: Record<ChangeType, 'green' | 'blue' | 'amber'> = {
  restock: 'green', adjustment: 'blue', return: 'amber',
};
const changeTypeLabels: Record<ChangeType, string> = {
  restock: 'Restok', adjustment: 'Penyesuaian', return: 'Retur',
};

function getStockStatus(stock: number): { label: string; color: 'green' | 'amber' | 'red' } {
  if (stock <= 0) return { label: 'Stok Habis', color: 'red' };
  if (stock <= LOW_STOCK_THRESHOLD) return { label: 'Stok Menipis', color: 'amber' };
  return { label: 'Tersedia', color: 'green' };
}

function getProductTotalStock(p: Product): number {
  if (p.variants.length > 0) {
    return p.variants.reduce((sum, v) => sum + (v.sizes.length > 0 ? v.sizes.reduce((s, sz) => s + sz.stock, 0) : (v.stock ?? 0)), 0);
  }
  return p.stock ?? 0;
}

export function InventoryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [changeType, setChangeType] = useState<ChangeType>('restock');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const data = await api.getProducts();
    setProducts(data.items);
    setLoading(false);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const data = await api.getInventoryHistory();
    setHistory(data);
    setHistoryLoading(false);
  }, []);

  useEffect(() => { loadProducts(); loadHistory(); }, [loadProducts, loadHistory]);

  const lowStockCount = useMemo(() => products.filter((p) => getProductTotalStock(p) <= LOW_STOCK_THRESHOLD).length, [products]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (search) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (stockFilter === 'low') r = r.filter((p) => { const s = getProductTotalStock(p); return s > 0 && s <= LOW_STOCK_THRESHOLD; });
    else if (stockFilter === 'out') r = r.filter((p) => getProductTotalStock(p) <= 0);
    return r;
  }, [products, search, stockFilter]);

  const openRestock = (product: Product) => {
    setRestockProduct(product);
    setChangeType('restock');
    setQuantity('');
    setNote('');
    setRestockOpen(true);
  };

  const handleRestock = async () => {
    if (!restockProduct) return;
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty === 0) { toast('Masukkan jumlah yang valid', 'error'); return; }
    setSubmitting(true);
    try {
      await api.restockProduct(restockProduct._id, changeType, qty, note.trim());
      toast(`${changeTypeLabels[changeType]} berhasil dicatat untuk ${restockProduct.name}`, 'success');
      setRestockOpen(false);
      loadProducts();
      loadHistory();
    } catch {
      toast('Gagal memperbarui stok', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Low Stock Banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{lowStockCount} produk perlu restok</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Stok menipis (≤{LOW_STOCK_THRESHOLD} unit). Segera lakukan restok.</p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 bg-white dark:bg-transparent" onClick={() => setStockFilter('low')}>Lihat</Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
        <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')} className="sm:w-auto">
          <option value="all">Semua Stok</option>
          <option value="low">Stok Menipis</option>
          <option value="out">Stok Habis</option>
        </Select>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader title="Manajemen Stok" subtitle={`${filtered.length} produk`} />
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="Tidak ada produk" description="Coba sesuaikan pencarian atau filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Produk</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Stok Saat Ini</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const stock = getProductTotalStock(product);
                  const status = getStockStatus(stock);
                  const image = product.images?.[0];
                  return (
                    <tr key={product._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {image ? <img src={image} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400"><Package className="h-5 w-5" /></div>}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">{formatNumber(stock)}</td>
                      <td className="px-4 py-3"><Badge color={status.color} dot>{status.label}</Badge></td>
                      <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => openRestock(product)}><Plus className="h-3.5 w-3.5" /> Restok</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inventory History */}
      <Card>
        <CardHeader title="Riwayat Inventory" subtitle={`${HISTORY_LIMIT} perubahan terbaru`} action={<History className="h-4 w-4 text-gray-400" />} />
        {historyLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4"><div className="skeleton h-8 w-8 rounded-lg" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-1/3" /><div className="skeleton h-3 w-1/2" /></div><div className="skeleton h-3 w-20" /></div>))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon={<History className="h-8 w-8" />} title="Belum ada riwayat" description="Perubahan stok akan muncul di sini." />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {history.map((entry) => {
              const positive = entry.quantity_change > 0;
              const Icon = positive ? TrendingUp : TrendingDown;
              return (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${positive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.product?.name || 'Tidak diketahui'}</span>
                      <Badge color={changeTypeColors[entry.change_type as ChangeType] || 'gray'}>{changeTypeLabels[entry.change_type as ChangeType] || entry.change_type}</Badge>
                    </div>
                    {entry.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{entry.note}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(entry.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{positive ? '+' : ''}{entry.quantity_change}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Stok: {formatNumber(entry.new_stock)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Restock Modal */}
      <Modal open={restockOpen} onClose={() => setRestockOpen(false)} title="Perbarui Stok" subtitle={restockProduct?.name} size="md"
        footer={<><Button variant="outline" onClick={() => setRestockOpen(false)} disabled={submitting}>Batal</Button><Button onClick={handleRestock} disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button></>}
      >
        {restockProduct && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
              <div><p className="text-xs text-gray-500 dark:text-gray-400">Stok Saat Ini</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatNumber(getProductTotalStock(restockProduct))}</p></div>
              <Badge color={getStockStatus(getProductTotalStock(restockProduct)).color} dot>{getStockStatus(getProductTotalStock(restockProduct)).label}</Badge>
            </div>
            <Select label="Jenis Perubahan" value={changeType} onChange={(e) => setChangeType(e.target.value as ChangeType)}>
              <option value="restock">Restok</option>
              <option value="adjustment">Penyesuaian</option>
              <option value="return">Retur</option>
            </Select>
            <Input label="Jumlah" type="number" placeholder="Masukkan jumlah" value={quantity} onChange={(e) => setQuantity(e.target.value)} hint={changeType === 'adjustment' ? 'Gunakan angka negatif untuk mengurangi.' : 'Jumlah yang ditambahkan ke stok.'} />
            <Input label="Catatan (opsional)" placeholder="cth. Diterima dari supplier" value={note} onChange={(e) => setNote(e.target.value)} />
            {quantity && !Number.isNaN(parseInt(quantity, 10)) && parseInt(quantity, 10) !== 0 && (
              <div className="rounded-lg border border-brand-100 dark:border-brand-900/40 bg-brand-50/50 dark:bg-brand-900/10 px-4 py-3">
                <p className="text-xs text-brand-700 dark:text-brand-300">Stok baru akan menjadi <span className="font-semibold">{formatNumber(getProductTotalStock(restockProduct) + (changeType === 'adjustment' ? parseInt(quantity, 10) : Math.abs(parseInt(quantity, 10))))}</span> unit</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
