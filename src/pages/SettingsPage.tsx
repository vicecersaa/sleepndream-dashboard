import { Palette, Check, Sun, Moon, Lock, Eye, EyeOff } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';
import { api } from '../lib/api';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  if (newPassword !== confirmPassword) {
    setError('Password baru tidak cocok');
    return;
  }

  if (newPassword.length < 6) {
    setError('Password baru minimal 6 karakter');
    return;
  }

  setLoading(true);
  try {
    await api.changePassword(oldPassword, newPassword);
    setSuccess('Password berhasil diubah');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (err: any) {
    setError(err.message || 'Gagal mengubah password');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Theme */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-brand-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tema</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Pilih mode tampilan dashboard</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`relative rounded-xl border-2 p-5 text-left transition-all ${theme === 'light' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Sun className="h-5 w-5" />
              </div>
              {theme === 'light' && <Check className="h-5 w-5 text-brand-600" />}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mode Terang</p>
            <p className="text-xs text-gray-400 mt-0.5">Tampilan terang dan jernih</p>
          </button>

          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`relative rounded-xl border-2 p-5 text-left transition-all ${theme === 'dark' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <Moon className="h-5 w-5" />
              </div>
              {theme === 'dark' && <Check className="h-5 w-5 text-brand-600" />}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mode Gelap</p>
            <p className="text-xs text-gray-400 mt-0.5">Tampilan gelap dan elegan</p>
          </button>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-5 w-5 text-brand-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ganti Password</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Perbarui password akun admin Anda</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Masukkan password lama"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Masukkan password baru"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </form>
      </Card>
    </div>
  );
}
