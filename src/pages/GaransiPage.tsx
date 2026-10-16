import { useCallback, useState, useEffect, useMemo } from 'react';
import { Search, ShieldCheck, Pencil, AlertCircle, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Warranty, WarrantyStatus } from '../lib/types';
import { formatDate } from '../lib/utils';

interface FormState {
  phone: string;
  customerName: string;
  address: string;
  productName: string;
  variant: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: WarrantyStatus;
  notes: string;
}

const emptyForm = (): FormState => ({
  phone: '',
  customerName: '',
  address: '',
  productName: '',
  variant: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  warrantyStart: new Date().toISOString().slice(0, 10),
  warrantyEnd: '',
  status: 'active',
  notes: '',
});

function toDateInputValue(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function statusColor(status: WarrantyStatus): 'green' | 'gray' | 'blue' | 'red' {
  switch (status) {
    case 'active': return 'green';
    case 'claimed': return 'blue';
    case 'void': return 'red';
    default: return 'gray';
  }
}

function statusLabel(status: WarrantyStatus) {
  switch (status) {
    case 'active': return 'Aktif';
    case 'expired': return 'Kadaluarsa';
    case 'claimed': return 'Sudah Diklaim';
    case 'void': return 'Dibatalkan';
  }
}

function WarrantyRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
      <div className="h-10 w-10 shrink-0 rounded-lg skeleton bg-gray-100 dark:bg-gray-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-40 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-3 w-56 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
      <div className="hidden h-8 w-24 shrink-0 skeleton bg-gray-100 dark:bg-gray-800 rounded sm:block" />
    </div>
  );
}

function WarrantyRow({ item, onEdit }: { item: Warranty; onEdit: (item: Warranty) => void }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
        <ShieldCheck className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.productName}</p>
          <Badge color={statusColor(item.status)} dot>{statusLabel(item.status)}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
          {item.customerName || '-'} &middot; {item.phone}
          {item.variant ? ` \u00b7 ${item.variant}` : ''}
        </p>
        <p className="mt-1 text-xs text-gray-400 truncate">{item.address || '-'}</p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end sm:shrink-0">
        <div className="text-left sm:text-right">
          <p className="text-xs text-gray-400">Masa Garansi</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {formatDate(item.warrantyStart)} &ndash; {formatDate(item.warrantyEnd)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    </div>
  );
}

export function GaransiPage() {
  const { toast } = useToast();
  const [phoneInput, setPhoneInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all');
  const [loadingList, setLoadingList] = useState(false);
  const [warranties, setWarranties] = useState<Warranty[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('edit');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const loadWarranties = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await api.getAllWarranty({ page: 1, limit: 100 });
      setWarranties(res.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal mengambil data garansi', 'error');
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);

  // Filter di sini murni client-side: menyaring nomor HP spesifik dan/atau
  // status dari data yang sudah dimuat, tidak perlu request baru ke server.
  const filtered = useMemo(() => {
    const q = phoneInput.trim();
    return warranties.filter((w) => {
      const matchesPhone = !q || w.phone.includes(q);
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchesPhone && matchesStatus;
    });
  }, [warranties, phoneInput, statusFilter]);

  const openCreate = useCallback(() => {
    setFormMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: Warranty) => {
    setFormMode('edit');
    setEditingId(item._id);
    setForm({
      phone: item.phone,
      customerName: item.customerName,
      address: item.address,
      productName: item.productName,
      variant: item.variant || '',
      purchaseDate: toDateInputValue(item.purchaseDate),
      warrantyStart: toDateInputValue(item.warrantyStart),
      warrantyEnd: toDateInputValue(item.warrantyEnd),
      status: item.status,
      notes: item.notes || '',
    });
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setForm(null);
    setEditingId(null);
  }, []);

  const validateForm = useCallback((f: FormState, requirePhone: boolean) => {
    if (requirePhone && !f.phone.trim()) {
      toast('Nomor HP wajib diisi', 'warning');
      return false;
    }
    if (!f.customerName.trim() || !f.productName.trim()) {
      toast('Nama pelanggan dan nama produk wajib diisi', 'warning');
      return false;
    }
    if (!f.warrantyStart || !f.warrantyEnd) {
      toast('Periode garansi wajib diisi', 'warning');
      return false;
    }
    return true;
  }, [toast]);

  const handleSave = useCallback(async () => {
    if (!form) return;

    if (formMode === 'create') {
      if (!validateForm(form, true)) return;
      setSaving(true);
      try {
        await api.createWarranty({
          phone: form.phone.trim(),
          customerName: form.customerName.trim(),
          address: form.address.trim(),
          productName: form.productName.trim(),
          variant: form.variant.trim(),
          purchaseDate: form.purchaseDate,
          warrantyStart: form.warrantyStart,
          warrantyEnd: form.warrantyEnd,
          status: form.status,
          notes: form.notes.trim(),
        });
        toast('Garansi baru berhasil ditambahkan', 'success');
        closeForm();
        await loadWarranties();
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Gagal menambahkan garansi', 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!editingId) return;
    if (!validateForm(form, false)) return;

    setSaving(true);
    try {
      await api.updateWarranty(editingId, {
        customerName: form.customerName.trim(),
        address: form.address.trim(),
        productName: form.productName.trim(),
        variant: form.variant.trim(),
        purchaseDate: form.purchaseDate,
        warrantyStart: form.warrantyStart,
        warrantyEnd: form.warrantyEnd,
        status: form.status,
        notes: form.notes.trim(),
      });
      toast('Data garansi berhasil diperbarui', 'success');
      closeForm();
      await loadWarranties();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan data garansi', 'error');
    } finally {
      setSaving(false);
    }
  }, [formMode, editingId, form, toast, closeForm, validateForm, loadWarranties]);

  return (
    <div className="space-y-4">
      {/* Search + Filter + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:flex-1">
          <Input
            placeholder="Cari nomor HP..."
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="sm:flex-1 sm:max-w-md"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WarrantyStatus | 'all')}
            className="sm:w-44"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="expired">Kadaluarsa</option>
            <option value="claimed">Sudah Diklaim</option>
            <option value="void">Dibatalkan</option>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Garansi Baru
        </Button>
      </div>

      {/* List */}
      {loadingList ? (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <WarrantyRowSkeleton />
            <WarrantyRowSkeleton />
            <WarrantyRowSkeleton />
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<AlertCircle className="h-7 w-7" />}
            title={phoneInput.trim() ? 'Data garansi tidak ditemukan' : 'Belum ada data garansi'}
            description={
              phoneInput.trim()
                ? `Tidak ada data garansi terdaftar untuk nomor "${phoneInput.trim()}".`
                : 'Belum ada garansi yang terdaftar. Tambahkan garansi baru untuk pembelian yang masuk lewat WA.'
            }
          />

        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((item) => (
              <WarrantyRow key={item._id} item={item} onEdit={openEdit} />
            ))}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {form && (
        <Modal
          open={formOpen}
          onClose={closeForm}
          title={formMode === 'create' ? 'Tambah Garansi Baru' : 'Edit Data Garansi'}
          subtitle={
            formMode === 'create'
              ? 'Input data pembelian & garansi untuk pelanggan baru'
              : `Perbarui informasi garansi untuk ${form.phone}`
          }
          footer={
            <>
              <Button variant="secondary" onClick={closeForm}>Batal</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : formMode === 'create' ? 'Simpan Garansi' : 'Simpan Perubahan'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Pelanggan"
                value={form.customerName}
                onChange={(e) => setForm((f) => f && { ...f, customerName: e.target.value })}
              />
              {formMode === 'create' ? (
                <Input
                  label="Nomor HP"
                  placeholder="Mis. 081234567890"
                  value={form.phone}
                  onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })}
                />
              ) : (
                <Input
                  label="Nomor HP"
                  value={form.phone}
                  disabled
                  hint="Nomor HP tidak dapat diubah"
                />
              )}
            </div>

            <Input
              label="Alamat"
              value={form.address}
              onChange={(e) => setForm((f) => f && { ...f, address: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Produk"
                value={form.productName}
                onChange={(e) => setForm((f) => f && { ...f, productName: e.target.value })}
              />
              <Input
                label="Varian"
                placeholder="Opsional"
                value={form.variant}
                onChange={(e) => setForm((f) => f && { ...f, variant: e.target.value })}
              />
            </div>

            <Input
              type="date"
              label="Tanggal Pembelian"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => f && { ...f, purchaseDate: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Garansi Mulai"
                value={form.warrantyStart}
                onChange={(e) => setForm((f) => f && { ...f, warrantyStart: e.target.value })}
              />
              <Input
                type="date"
                label="Garansi Berakhir"
                value={form.warrantyEnd}
                onChange={(e) => setForm((f) => f && { ...f, warrantyEnd: e.target.value })}
              />
            </div>

            <Select
              label="Status Garansi"
              value={form.status}
              onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as WarrantyStatus })}
            >
              <option value="active">Aktif</option>
              <option value="expired">Kadaluarsa</option>
              <option value="claimed">Sudah Diklaim</option>
              <option value="void">Dibatalkan</option>
            </Select>

            <Input
              label="Catatan Admin"
              placeholder="Catatan internal (opsional)"
              value={form.notes}
              onChange={(e) => setForm((f) => f && { ...f, notes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
