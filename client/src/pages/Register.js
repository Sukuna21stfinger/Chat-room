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
            🚀
          </div>
          <h1 className="gradient-text" style={{ 
            fontSize: 'var(--font-size-3xl)',
            fontWeight: '700',
            marginBottom: 'var(--spacing-2)'
          }}>
            Join the Chat
          </h1>
          <p style={{ 
            color: 'var(--color-textSecondary)',
            fontSize: 'var(--font-size-base)'
          }}>
            Create your secure account to get started
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
            ⚠️ {error}
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
              Username
            </label>
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
                Creating account...
              </>
            ) : (
              <>
                ✨ Create Secure Account
              </>
            )}
          </button>
        </form>
        
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
            🛡️ Your data is encrypted and secure. We never store your messages on our servers.
          </p>
        </div>
        
        <p style={{ 
          color: 'var(--color-textSecondary)',
          fontSize: 'var(--font-size-sm)'
        }}>
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