import { useCallback, useEffect, useState } from 'react';
import { Plus, Image as ImageIcon, Pencil, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight, Link as LinkIcon, ArrowUpDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { FileUpload } from '../components/ui/FileUpload';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Banner } from '../lib/types';
import { formatDate } from '../lib/utils';

interface FormState {
  link: string;
  sortOrder: number;
  isActive: boolean;
  imageFile: File | null;
}

const emptyForm: FormState = {
  link: '',
  sortOrder: 0,
  isActive: true,
  imageFile: null,
};

const PER_PAGE = 9;

export function BannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getBanners({
        page,
        limit: PER_PAGE,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      });
      setBanners(result.items);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat banner');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((banner: Banner) => {
    setEditing(banner);
    setForm({
      link: banner.link || '',
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive,
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
    if (!editing && !form.imageFile) {
      toast('Gambar banner wajib diunggah', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        link: form.link.trim(),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        ...(form.imageFile ? { image: form.imageFile } : {}),
      };

      if (editing) {
        const updated = await api.updateBanner(editing._id, payload);
        setBanners((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
        toast('Banner berhasil diperbarui', 'success');
      } else {
        await api.createBanner(payload as any);
        toast('Banner berhasil ditambahkan', 'success');
        loadBanners();
      }
      closeForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menyimpan banner', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, editing, toast, closeForm, loadBanners]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteBanner(deleteTarget._id);
      setBanners((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setTotalItems((prev) => prev - 1);
      toast('Banner berhasil dihapus', 'success');
      setDeleteTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menghapus banner', 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, toast]);

  return (
    <div className="space-y-4">
      {/* Filter + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="sm:w-44"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </Select>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Banner
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
            title="Gagal memuat banner"
            description={error}
            action={<Button onClick={loadBanners} variant="outline" size="sm">Coba lagi</Button>}
          />
        </Card>
      ) : banners.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ImageIcon className="h-7 w-7" />}
            title={statusFilter !== 'all' ? 'Tidak ada banner ditemukan' : 'Belum ada banner'}
            description={statusFilter !== 'all' ? 'Coba filter lain.' : 'Mulai dengan menambahkan banner pertama Anda.'}
            action={statusFilter === 'all' && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Banner</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <Card key={banner._id} hover className="overflow-hidden flex flex-col">
                {/* Image (16:9) */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                  <img src={banner.image} alt="Banner" className="h-full w-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <Badge color={banner.isActive ? 'green' : 'gray'} dot className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                      {banner.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge color="gray" className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                      <ArrowUpDown className="h-3 w-3" />
                      Urutan {banner.sortOrder}
                    </Badge>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    {banner.link ? (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="truncate hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
                        {banner.link}
                      </a>
                    ) : (
                      <span className="truncate italic text-gray-400 dark:text-gray-500">Tanpa link</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Dibuat {formatDate(banner.createdAt)}
                  </p>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(banner)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteTarget(banner)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Halaman {page} dari {totalPages} &middot; {totalItems} banner
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
        title={editing ? 'Edit Banner' : 'Tambah Banner'}
        subtitle={editing ? 'Perbarui informasi banner' : 'Buat banner promosi baru'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Banner'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FileUpload
            type="image"
            label={editing ? 'Gambar Banner (upload untuk mengganti)' : 'Gambar Banner'}
            multiple={false}
            files={form.imageFile ? [form.imageFile] : []}
            onFilesChange={(files) => setForm((prev) => ({ ...prev, imageFile: files[0] ?? null }))}
            existing={editing?.image ? [editing.image] : []}
          />
          <Input
            label="Link Tujuan"
            placeholder="https://... (opsional)"
            value={form.link}
            onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
            hint="Kosongkan jika banner tidak perlu diklik ke halaman tertentu"
          />
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
                Banner aktif
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Banner"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Menghapus...' : 'Hapus'}
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
              Yakin ingin menghapus banner ini?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tindakan ini <span className="font-semibold">tidak dapat dibatalkan</span> — banner akan terhapus permanen (bukan dinonaktifkan).
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
