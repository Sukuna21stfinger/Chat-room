import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import privacyAuth from '../services/privacyAuth';
import { applyTheme, getStoredTheme } from '../styles/theme';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(getStoredTheme());
    if (privacyAuth.isAuthenticated()) navigate('/chat');
  }, [navigate]);

  const calcStrength = (p) => [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') setStrength(calcStrength(value));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authAPI.register(formData);
      privacyAuth.storeSession(res.data.user, res.data.token);
      privacyAuth.setupAutoLogout();
      navigate('/chat');
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const strengthColor = strength <= 1 ? 'var(--color-error)' : strength <= 3 ? 'var(--color-warning)' : 'var(--color-success)';
  const strengthText  = strength <= 1 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'var(--color-surface)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', border: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: 'var(--gradient-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>🚀</div>
          <h1 className="gradient-text" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>Join the chat in seconds</p>
        </div>

        {error && <div style={{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 10, marginBottom: 18, fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input type="text" name="username" placeholder="Choose a username" value={formData.username} onChange={handleChange} required className="input" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setFormData({ ...formData, username: privacyAuth.generateAnonymousUsername() })} className="btn-ghost" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, fontSize: 14 }}>🎲</button>
            </div>
          </div>

          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Email</label>
            <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="input" />
          </div>

          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required className="input" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn-ghost" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, fontSize: 14 }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-textMuted)' }}>Password strength</span>
                  <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthText}</span>
                </div>
                <div style={{ height: 4, backgroundColor: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${(strength / 5) * 100}%`, height: '100%', backgroundColor: strengthColor, transition: 'all 0.2s' }} />
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15, marginBottom: 10 }}>
            {loading ? <><div className="spinner" />Creating account…</> : '✨ Create Account'}
          </button>
        </form>

        <p style={{ color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
