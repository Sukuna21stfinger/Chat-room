import React, { useState, useEffect } from 'react';
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
    // Apply stored theme
    applyTheme(getStoredTheme());
    
    // Check if already authenticated
    if (privacyAuth.isAuthenticated()) {
      navigate('/chat');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(formData);
      
      // Store session securely
      privacyAuth.storeSession(response.data.user);
      
      // Setup auto-logout
      privacyAuth.setupAutoLogout();
      
      navigate('/chat');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const generateGuestLogin = () => {
    const guestUsername = privacyAuth.generateAnonymousUsername();
    setFormData({
      email: `${guestUsername.toLowerCase()}@guest.local`,
      password: 'guest123'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--gradient-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-5)'
    }}>
      <div className="modern-card animate-fade-in" style={{ 
        maxWidth: '420px', 
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-2xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-4)',
            fontSize: 'var(--font-size-2xl)'
          }}>
            💬
          </div>
          <h1 className="gradient-text" style={{ 
            fontSize: 'var(--font-size-3xl)',
            fontWeight: '700',
            marginBottom: 'var(--spacing-2)'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            color: 'var(--color-textSecondary)',
            fontSize: 'var(--font-size-base)'
          }}>
            Sign in to continue your secure conversations
          </p>
        </div>

        {error && (
          <div className="animate-slide-up" style={{ 
            color: 'var(--color-error)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-5)',
            fontSize: 'var(--font-size-sm)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            🔒 {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ marginBottom: 'var(--spacing-4)', textAlign: 'left' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500'
            }}>
              Email Address
            </label>
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
          
          <div style={{ marginBottom: 'var(--spacing-6)', textAlign: 'left' }}>
            <label style={{ 
              display: 'block',
              marginBottom: 'var(--spacing-2)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
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
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: 'var(--spacing-4) var(--spacing-6)',
              fontSize: 'var(--font-size-base)',
              marginBottom: 'var(--spacing-4)'
            }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              <>
                🔐 Sign In Securely
              </>
            )}
          </button>
        </form>
        
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-3)',
          marginBottom: 'var(--spacing-5)'
        }}>
          <button
            type="button"
            onClick={generateGuestLogin}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}
          >
            🎭 Quick Guest
          </button>
        </div>
        
        <div style={{
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-surfaceHover)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--spacing-5)'
        }}>
          <p style={{ 
            color: 'var(--color-textSecondary)',
            fontSize: 'var(--font-size-xs)',
            lineHeight: '1.4'
          }}>
            🔒 Your messages are encrypted locally. We prioritize your privacy and security.
          </p>
        </div>
        
        <p style={{ 
          color: 'var(--color-textSecondary)',
          fontSize: 'var(--font-size-sm)'
        }}>
          Don't have an account?{' '}
          <Link 
            to="/register"
            style={{
              color: 'var(--color-primary)',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;