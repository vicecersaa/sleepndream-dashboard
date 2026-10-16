import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCog, Plus, Search, ShieldCheck, Mail, X } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import type { Admin } from '../lib/types';
import { timeAgo } from '../lib/utils';

export function AdminsPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdmins();
      setAdmins(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return admins;
    return admins.filter(
      (a) => a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [admins, search]);

  const openForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setFullName('');
    setEmail('');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!fullName.trim() || !email.trim()) {
      toast('Nama lengkap dan email wajib diisi', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('Format email tidak valid', 'warning');
      return;
    }
    setSaving(true);
    try {
      const created = await api.createAdmin({ full_name: fullName.trim(), email: email.trim() });
      setAdmins((prev) => [created, ...prev]);
      toast('Admin baru berhasil ditambahkan', 'success');
      closeForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal menambahkan admin', 'error');
    } finally {
      setSaving(false);
    }
  }, [fullName, email, toast, closeForm]);

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Input
          placeholder="Cari nama / email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="sm:w-64"
        />
        <Button onClick={openForm}>
          <Plus className="h-4 w-4" />
          Tambah Admin
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Daftar Admin"
          subtitle={`${filtered.length} admin`}
        />

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <EmptyState
            icon={<X className="h-7 w-7" />}
            title="Gagal memuat admin"
            description={error}
            action={<Button onClick={loadAdmins} variant="outline" size="sm">Coba lagi</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UserCog className="h-7 w-7" />}
            title={search ? 'Tidak ada admin ditemukan' : 'Belum ada admin'}
            description={search ? 'Coba kata kunci lain.' : 'Tambahkan admin untuk mengelola dashboard.'}
            action={!search && <Button onClick={openForm}><Plus className="h-4 w-4" /> Tambah Admin</Button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-3">Nama Lengkap</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Login Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{a.full_name}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 truncate max-w-[240px]">{a.email}</td>
                      <td className="px-5 py-3">
                        <Badge color="blue">Admin</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color="green" dot>Aktif</Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {a.last_login ? timeAgo(a.last_login) : 'Belum pernah'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((a) => (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{a.full_name}</p>
                    <Badge color="green" dot>Aktif</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">{a.email}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge color="blue">Admin</Badge>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {a.last_login ? `Login ${timeAgo(a.last_login)}` : 'Belum pernah login'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Add Admin Modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title="Tambah Admin"
        subtitle="Admin baru akan memiliki role Admin dan status Aktif"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Menambahkan...' : 'Tambah Admin'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-xs text-brand-700 dark:text-brand-300">
              Admin baru akan otomatis diberi role <span className="font-semibold">Admin</span> dan status <span className="font-semibold">Aktif</span>.
            </p>
          </div>
          <Input
            label="Nama Lengkap"
            placeholder="mis. Budi Santoso"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="admin@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
          />
        </div>
      </Modal>
    </div>
  );
}
