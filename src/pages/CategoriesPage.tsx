import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, FolderTree, Pencil, X, Calendar, AlertTriangle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Category } from '../lib/types';
import { formatDate } from '../lib/utils';

interface FormState {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  imageFile: File | null;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
  imageFile: null,
};

const PER_PAGE = 9;

export function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<Category | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCategories({
        page,
        limit: PER_PAGE,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });
      setCategories(result.items);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive,
      imageFile: null,

    });
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast('Nama kategori wajib diisi', 'warning');
      return;
    }
    if (!editing && !form.imageFile) {
      toast('Gambar kategori wajib diunggah', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        ...(form.imageFile ? { image: form.imageFile } : {}),
      };

      if (editing) {
        const updated = await api.updateCategory(editing._id, payload);
        setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        toast('Kategori berhasil diperbarui', 'success');
      } else {
        await api.createCategory(payload as any);
        toast('Kategori berhasil ditambahkan', 'success');
        loadCategories();
      }
      closeForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan kategori', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, editing, toast, closeForm, loadCategories]);

  const confirmDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const updated = await api.deleteCategory(deactivateTarget._id);
      setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      toast('Kategori berhasil dinonaktifkan', 'success');
      setDeactivateTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menonaktifkan kategori', 'error');
    } finally {
      setDeactivating(false);
    }
  }, [deactivateTarget, toast]);

  const handleRestore = useCallback(async (cat: Category) => {
    setRestoringId(cat._id);
    try {
      const updated = await api.restoreCategory(cat._id);
      setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      toast('Kategori berhasil diaktifkan kembali', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal mengaktifkan kategori', 'error');
    } finally {
      setRestoringId(null);
    }
  }, [toast]);

  return (
    <div className="space-y-4">
      {/* Search + Filter + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:flex-1">
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="sm:flex-1 sm:max-w-md"
          />
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
          Tambah Kategori
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="aspect-video skeleton bg-gray-100 dark:bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-32 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 skeleton bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat kategori"
            description={error}
            action={<Button onClick={loadCategories} variant="outline" size="sm">Coba lagi</Button>}
          />
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderTree className="h-7 w-7" />}
            title={search || statusFilter !== 'all' ? 'Tidak ada kategori ditemukan' : 'Belum ada kategori'}
            description={search || statusFilter !== 'all' ? 'Coba kata kunci atau filter lain.' : 'Mulai dengan menambahkan kategori pertama Anda.'}
            action={!search && statusFilter === 'all' && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Kategori</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat._id} hover className="overflow-hidden flex flex-col">
                {/* Image / placeholder (16:9) */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 h-48">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
                      <FolderTree className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge color={cat.isActive ? 'green' : 'gray'} dot className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                      {cat.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{cat.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">/{cat.slug}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(cat.createdAt)}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {cat.isActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeactivateTarget(cat)}
                      >
                        Nonaktifkan
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => handleRestore(cat)}
                        disabled={restoringId === cat._id}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {restoringId === cat._id ? 'Memproses...' : 'Aktifkan'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {page} dari {totalPages} &middot; {totalItems} kategori
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
        title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
        subtitle={editing ? 'Perbarui informasi kategori' : 'Buat kategori produk baru'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FileUpload
            type="image"
            label={editing ? 'Gambar Kategori (upload untuk mengganti)' : 'Gambar Kategori'}
            multiple={false}
            files={form.imageFile ? [form.imageFile] : []}
            onFilesChange={(files) => setForm((prev) => ({ ...prev, imageFile: files[0] ?? null }))}
            existing={editing?.image ? [editing.image] : []}
          />
          <Input
            label="Nama Kategori"
            placeholder="mis. Elektronik"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deskripsi</label>
            <textarea
              placeholder="Deskripsi singkat tentang kategori ini..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Urutan Tampil"
              hint="Angka lebih kecil tampil lebih dulu"
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
            />
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
                />
                Kategori aktif
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Nonaktifkan Kategori"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivateTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={confirmDeactivate} disabled={deactivating}>
              {deactivating ? 'Memproses...' : 'Nonaktifkan'}
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
              Nonaktifkan kategori <span className="font-semibold">{deactivateTarget?.name}</span>?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kategori tidak akan tampil di toko, namun dapat diaktifkan kembali kapan saja dari daftar ini.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
