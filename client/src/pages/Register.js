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
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Apply stored theme
    applyTheme(getStoredTheme());
    
    // Check if already authenticated
    if (privacyAuth.isAuthenticated()) {
      navigate('/chat');
    }
  }, [navigate]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.register(formData);
      
      // Store session securely
      privacyAuth.storeSession(response.data.user, response.data.token);
      
      // Setup auto-logout
      privacyAuth.setupAutoLogout();
      
      navigate('/chat');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomUsername = () => {
    const username = privacyAuth.generateAnonymousUsername();
    setFormData({ ...formData, username });
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'var(--color-error)';
    if (passwordStrength <= 3) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--gradient-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%',
        background: 'var(--color-surface)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--gradient-primary)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 26
          }}>🚀</div>
          <h1 className="gradient-text" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>Join the chat in seconds</p>
        </div>

        {error && (
          <div style={{ 
            color: 'var(--color-error)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 18,
            fontSize: 13,
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="username"
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input"
                style={{ 
                  fontSize: 'var(--font-size-base)',
                  paddingRight: 'var(--spacing-12)'
                }}
              />
              <button
                type="button"
                onClick={generateRandomUsername}
                className="btn-ghost"
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 'var(--spacing-2)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                🎲
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              style={{ fontSize: 'var(--font-size-base)' }}
            />
          </div>
          
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)', fontSize: 13, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input"
                style={{ 
                  fontSize: 'var(--font-size-base)',
                  paddingRight: 'var(--spacing-12)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-ghost"
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 'var(--spacing-2)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {formData.password && (
              <div style={{ marginTop: 'var(--spacing-2)' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-1)'
                }}>
                  <span style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-textMuted)'
                  }}>
                    Password Strength
                  </span>
                  <span style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: getPasswordStrengthColor(),
                    fontWeight: '600'
                  }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength / 5) * 100}%`,
                    height: '100%',
                    backgroundColor: getPasswordStrengthColor(),
                    transition: 'all var(--transition-normal)'
                  }} />
                </div>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 15, marginBottom: 10 }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating account...
              </>
            ) : (
              <>
                ✨ Create Secure Account
              </>
            )}
          </button>
        </form>
        
        <p style={{ color: 'var(--color-textSecondary)', fontSize: 13, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link 
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;