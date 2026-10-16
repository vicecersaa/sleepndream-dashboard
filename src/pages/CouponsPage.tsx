import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight, Ticket, Search, Percent, Tag, Megaphone } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Coupon } from '../lib/types';
import { formatDate } from '../lib/utils';

interface FormState {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: string;
  isPopup: boolean;
  label: string;
  minimumPurchase: string;
  maximumDiscount: string;
  usageLimit: string;
  usagePerUser: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  isPopup: false,
  label: '',
  minimumPurchase: '',
  maximumDiscount: '',
  usageLimit: '',
  usagePerUser: '1',
  startDate: '',
  endDate: '',
  isActive: true,
};

const PER_PAGE = 10;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function toDateInputValue(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function isExpired(endDate: string) {
  return new Date(endDate).getTime() < Date.now();
}

export function CouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCoupons({
        page,
        limit: PER_PAGE,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });
      setCoupons(result.items);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat kupon');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  // Kupon lain yang saat ini jadi popup (selain yang sedang diedit)
  const currentPopupCoupon = coupons.find(
    (c) => c.isPopup && c.isActive && c._id !== editing?._id
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: String(coupon.value),
      isPopup: coupon.isPopup ?? false,
      label: coupon.label || '',
      minimumPurchase: String(coupon.minimumPurchase ?? 0),
      maximumDiscount: String(coupon.maximumDiscount ?? 0),
      usageLimit: String(coupon.usageLimit ?? 0),
      usagePerUser: String(coupon.usagePerUser ?? 1),
      startDate: toDateInputValue(coupon.startDate),
      endDate: toDateInputValue(coupon.endDate),
      isActive: coupon.isActive,
    });
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.code.trim()) {
      toast('Kode kupon wajib diisi', 'warning');
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast('Periode kupon wajib diisi', 'warning');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('Tanggal berakhir tidak boleh sebelum tanggal mulai', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        type: form.type,
        value: Number(form.value) || 0,
        isPopup: form.isPopup,
        label: form.label.trim(),
        minimumPurchase: Number(form.minimumPurchase) || 0,
        maximumDiscount: Number(form.maximumDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        usagePerUser: Number(form.usagePerUser) || 0,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      };

      if (editing) {
        const updated = await api.updateCoupon(editing._id, payload);
        setCoupons((prev) =>
          prev.map((c) => {
            if (c._id === updated._id) return updated;
            if (updated.isPopup && c.isPopup) return { ...c, isPopup: false };
            return c;
          })
        );
        toast('Kupon berhasil diperbarui', 'success');
      } else {
        const created = await api.createCoupon(payload);
        if (created?.isPopup) {
          setCoupons((prev) =>
            prev.map((c) => (c.isPopup ? { ...c, isPopup: false } : c))
          );
        }
        toast('Kupon berhasil ditambahkan', 'success');
        loadCoupons();
      }
      closeForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan kupon', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, editing, toast, closeForm, loadCoupons]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCoupon(deleteTarget._id);
      setCoupons((prev) =>
        prev.map((c) => (c._id === deleteTarget._id ? { ...c, isActive: false } : c))
      );
      toast('Kupon berhasil dinonaktifkan', 'success');
      setDeleteTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menonaktifkan kupon', 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, toast]);

  return (
    <div className="space-y-4">
      {/* Filter + Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="sm:w-44"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Kupon
        </Button>
      </div>

      {loading ? (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 skeleton bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat kupon"
            description={error}
            action={<Button onClick={loadCoupons} variant="outline" size="sm">Coba lagi</Button>}
          />
        </Card>
      ) : coupons.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ticket className="h-7 w-7" />}
            title={statusFilter !== 'all' || search ? 'Tidak ada kupon ditemukan' : 'Belum ada kupon'}
            description={statusFilter !== 'all' || search ? 'Coba ubah filter atau kata kunci pencarian.' : 'Mulai dengan menambahkan kupon pertama Anda.'}
            action={statusFilter === 'all' && !search && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Kupon</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Kupon</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Nilai</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Min. Pembelian</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Pemakaian</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Periode</th>
                    <th className="text-left font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Status</th>
                    <th className="text-right font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon.endDate);
                    return (
                      <tr key={coupon._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shrink-0">
                              {coupon.type === 'percentage' ? <Percent className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 tracking-wide">{coupon.code}</p>
                                {coupon.isPopup && coupon.isActive && (
                                  <Badge color="blue" dot>Popup</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
                                {coupon.description || 'Tanpa deskripsi'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {coupon.type === 'percentage' ? (
                            <div>
                              <p className="font-medium">{coupon.value}%</p>
                              {coupon.maximumDiscount > 0 && (
                                <p className="text-xs text-gray-400">maks {formatCurrency(coupon.maximumDiscount)}</p>
                              )}
                            </div>
                          ) : (
                            <p className="font-medium">{formatCurrency(coupon.value)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {coupon.minimumPurchase > 0 ? formatCurrency(coupon.minimumPurchase) : (
                            <span className="text-gray-400 italic">Tanpa minimum</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <p>{coupon.usedCount} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}</p>
                          <p className="text-xs text-gray-400">{coupon.usagePerUser}x per pengguna</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <p className="text-xs">{formatDate(coupon.startDate)}</p>
                          <p className="text-xs text-gray-400">s/d {formatDate(coupon.endDate)}</p>
                        </td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <Badge color="gray" dot>Kadaluarsa</Badge>
                          ) : (
                            <Badge color={coupon.isActive ? 'green' : 'gray'} dot>
                              {coupon.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => setDeleteTarget(coupon)}
                              disabled={!coupon.isActive}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {page} dari {totalPages} &middot; {totalItems} kupon
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

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit Kupon' : 'Tambah Kupon'}
        subtitle={editing ? 'Perbarui informasi kupon' : 'Buat kupon diskon baru'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Kupon'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kode Kupon"
              placeholder="Mis. HEMAT10"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              hint="Otomatis huruf besar"
            />
            <Select
              label="Tipe Diskon"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
            >
              <option value="percentage">Persentase (%)</option>
              <option value="fixed">Nominal Tetap (Rp)</option>
            </Select>
          </div>

          <Input
            label="Deskripsi"
            placeholder="Deskripsi singkat kupon (opsional)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              inputMode="numeric"
              label={form.type === 'percentage' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'}
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value.replace(/\D/g, '') }))}
            />
            <Input
              type="text"
              inputMode="numeric"
              label="Maks. Potongan (Rp)"
              hint={form.type === 'fixed' ? 'Tidak berlaku untuk tipe nominal' : '0 = tanpa batas'}
              value={form.maximumDiscount}
              onChange={(e) => setForm((prev) => ({ ...prev, maximumDiscount: e.target.value.replace(/\D/g, '') }))}
              disabled={form.type === 'fixed'}
            />
          </div>

          <Input
            type="text"
            inputMode="numeric"
            label="Minimum Pembelian (Rp)"
            hint="0 = tanpa minimum"
            value={form.minimumPurchase}
            onChange={(e) => setForm((prev) => ({ ...prev, minimumPurchase: e.target.value.replace(/\D/g, '') }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              inputMode="numeric"
              label="Kuota Total Penggunaan"
              hint="0 = tanpa batas"
              value={form.usageLimit}
              onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value.replace(/\D/g, '') }))}
            />
            <Input
              type="text"
              inputMode="numeric"
              label="Batas per Pengguna"
              value={form.usagePerUser}
              onChange={(e) => setForm((prev) => ({ ...prev, usagePerUser: e.target.value.replace(/\D/g, '') }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Tanggal Mulai"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
            />
            <Input
              type="date"
              label="Tanggal Berakhir"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          {/* ── Status & Popup — satu card dengan divider ── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

            {/* Toggle: Kupon Aktif */}
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={[
                'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                form.isActive
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className={[
                  'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                  form.isActive
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                ].join(' ')}>
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <p className={[
                    'text-sm font-medium',
                    form.isActive ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300',
                  ].join(' ')}>
                    Kupon aktif
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {form.isActive ? 'Kupon dapat digunakan oleh pelanggan' : 'Kupon tidak dapat digunakan'}
                  </p>
                </div>
              </div>
              {/* Toggle pill */}
              <div className={[
                'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
                form.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
              ].join(' ')}>
                <span className={[
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                  form.isActive ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')} />
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Toggle: Popup Promo */}
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isPopup: !prev.isPopup }))}
              className={[
                'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                form.isPopup
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/40',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className={[
                  'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                  form.isPopup
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                ].join(' ')}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className={[
                    'text-sm font-medium',
                    form.isPopup ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300',
                  ].join(' ')}>
                    Tampilkan sebagai popup promo
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Muncul otomatis di homepage untuk pengunjung
                  </p>
                </div>
              </div>
              {/* Toggle pill */}
              <div className={[
                'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
                form.isPopup ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600',
              ].join(' ')}>
                <span className={[
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                  form.isPopup ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')} />
              </div>
            </button>

            {/* Warning: ada popup aktif lain */}
            {form.isPopup && currentPopupCoupon && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/40">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Kupon <span className="font-semibold">{currentPopupCoupon.code}</span> sedang aktif sebagai popup.
                  Menyimpan akan otomatis menonaktifkan popup tersebut.
                </p>
              </div>
            )}

            {/* Label promo — hanya tampil saat isPopup aktif */}
            {form.isPopup && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                <Input
                  label="Label Promo (opsional)"
                  placeholder="Mis. Untuk semua produk pilihan"
                  hint="Teks pendukung yang muncul di bawah diskon pada popup"
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Nonaktifkan Kupon"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Memproses...' : 'Nonaktifkan'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Yakin ingin menonaktifkan kupon <span className="font-semibold">{deleteTarget?.code}</span>?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kupon tidak akan terhapus permanen, hanya dinonaktifkan sehingga tidak bisa dipakai lagi oleh pelanggan.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
