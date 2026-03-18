import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import privacyAuth from '../services/privacyAuth';
import { applyTheme, getStoredTheme } from '../styles/theme';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(getStoredTheme());
    if (privacyAuth.isAuthenticated()) navigate('/chat');
  }, [navigate]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); if (error) setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authAPI.login(formData);
      privacyAuth.storeSession(res.data.user, res.data.token);
      privacyAuth.setupAutoLogout();
      navigate('/chat');
    } catch (err) { setError(err.response?.data?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true); setError('');
    try {
      const res = await authAPI.guest();
      privacyAuth.storeSession(res.data.user, res.data.token);
      privacyAuth.setupAutoLogout();
      navigate('/chat');
    } catch (err) { setError(err.response?.data?.message || 'Guest login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'var(--color-surface)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', border: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: 'var(--gradient-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>💬</div>
          <h1 className="gradient-text" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>Sign in to continue chatting</p>
        </div>

        {error && <div style={{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 10, marginBottom: 18, fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Email</label>
            <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="input" />
          </div>
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required className="input" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn-ghost" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, fontSize: 14 }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15, marginBottom: 10 }}>
            {loading ? <><div className="spinner" />Signing in…</> : '🔐 Sign In'}
          </button>
        </form>

        <button type="button" onClick={handleGuest} className="btn btn-secondary" style={{ width: '100%', fontSize: 13, marginBottom: 18 }}>
          🎭 Continue as Guest
        </button>

        <p style={{ color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
