import { isDemo } from '../lib/demo';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './LoginPage.css';

const isApiConfigured = isDemo || Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email dan kata sandi harus diisi');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Gagal masuk');
    } else {
      toast('Berhasil masuk! Selamat datang kembali.', 'success');
    }
  };

  return (
    <main className="sleepndream-login">
      <header className="login-masthead">
        <span className="login-wordmark">Sleep n Dream</span>
        <span className="login-workspace">ADMIN WORKSPACE</span>
      </header>

      <section className="login-center" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-emblem" aria-hidden="true">D<span /></div>
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1 id="login-title">Selamat datang kembali.</h1>
          <p className="login-description">Semua kebutuhan bisnis Sleep n Dream,<br />dalam satu tempat.</p>

          {isDemo && <p className="login-status">Demo untuk presentasi. Data contoh, tidak terhubung ke transaksi asli.</p>}
          <form onSubmit={handleSubmit} className="login-form">
            {error && <p role="alert" className="login-error"><AlertCircle size={16} />{error}</p>}
            <div className="login-field">
              <label htmlFor="login-email">Alamat email</label>
              <div className="login-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.com" autoComplete="username" />
              </div>
            </div>
            <div className="login-field">
              <label htmlFor="login-password">Kata sandi</label>
              <div className="login-input-wrap">
                <Lock size={18} aria-hidden="true" />
                <input id="login-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" autoComplete="current-password" />
                <button className="login-reveal" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="login-submit" type="submit" disabled={loading || !isApiConfigured}>
              {loading ? 'Sedang masuk...' : 'Masuk ke dashboard'}<ArrowRight size={18} aria-hidden="true" />
            </button>
            {!isApiConfigured && <p role="status" className="login-status"><span />Login tersedia setelah layanan Sleep n Dream terhubung.</p>}
          </form>
          <div className="login-card-footer"><Lock size={13} aria-hidden="true" /> Akses khusus tim Sleep n Dream</div>
        </div>
        <p className="login-help">Butuh akses akun? Hubungi administrator Anda.</p>
      </section>
      <footer className="login-page-footer"><span>&copy; {new Date().getFullYear()} Sleep n Dream</span><span>Comfort in every detail.</span></footer>
    </main>
  );
}
