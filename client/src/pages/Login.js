import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import privacyAuth from '../services/privacyAuth';
import { applyTheme, getStoredTheme } from '../styles/theme';

const Join = () => {
  const [form, setForm] = useState({ username: '', roomId: 'THE RED ROOM', passcode: '', adminKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(getStoredTheme());
    if (privacyAuth.isAuthenticated()) navigate('/chat');
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        username: form.username,
        roomId: form.roomId,
        passcode: form.passcode
      };

      // Add admin key if username is admin
      if (form.username === 'sukuna1405') {
        payload.adminKey = form.adminKey;
      }

      const res = await authAPI.join(payload);
      privacyAuth.storeSession(res.data.user, res.data.token);
      privacyAuth.setupAutoLogout();
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const randomName = () => setForm(f => ({ ...f, username: privacyAuth.generateAnonymousUsername() }));

  const isAdminLogin = form.username === 'sukuna1405';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'var(--color-surface)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', border: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: isAdminLogin ? 'linear-gradient(135deg, #ff6b6b, #ee5a6f)' : 'var(--gradient-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>
            {isAdminLogin ? '👑' : '💬'}
          </div>
          <h1 className="gradient-text" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
            {isAdminLogin ? 'Admin Access' : 'Join the Chat'}
          </h1>
          <p style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>
            {isAdminLogin ? 'Enter your special key to access admin panel' : 'No account needed — session lasts 1.5 hours'}
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 10, marginBottom: 18, fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="username"
                placeholder="Pick a name"
                value={form.username}
                onChange={handleChange}
                required
                maxLength={30}
                className="input"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={randomName}
                disabled={isAdminLogin}
                className="btn-ghost"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, fontSize: 14, opacity: isAdminLogin ? 0.5 : 1 }}
              >
                🎲
              </button>
            </div>
          </div>

          {isAdminLogin && (
            <div style={{ marginBottom: 14, textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>
                Special Key 🔑
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAdminKey ? 'text' : 'password'}
                  name="adminKey"
                  placeholder="Enter special key"
                  value={form.adminKey}
                  onChange={handleChange}
                  required
                  className="input"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey(!showAdminKey)}
                  className="btn-ghost"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, fontSize: 14 }}
                >
                  {showAdminKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {!isAdminLogin && (
            <>
              <div style={{ marginBottom: 14, textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Room</label>
                <input
                  type="text"
                  name="roomId"
                  placeholder="Room name (e.g. THE RED ROOM)"
                  value={form.roomId}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div style={{ marginBottom: 20, textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>
                  Room Passcode <span style={{ color: 'var(--color-textMuted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="password"
                  name="passcode"
                  placeholder="Leave blank if public"
                  value={form.passcode}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </>
          )}

          {isAdminLogin && (
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Room</label>
              <input
                type="text"
                name="roomId"
                placeholder="Room name (e.g. general)"
                value={form.roomId}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15 }}>
            {loading ? (
              <>
                <div className="spinner" />
                {isAdminLogin ? 'Verifying…' : 'Joining…'}
              </>
            ) : isAdminLogin ? (
              '👑 Enter as Admin'
            ) : (
              '🚀 Enter Room'
            )}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Join;
