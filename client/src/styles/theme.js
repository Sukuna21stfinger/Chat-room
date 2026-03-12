export const themes = {
  light: {
    name: 'Light',
    colors: {
      primary: '#667eea',
      primaryHover: '#5a6fd8',
      secondary: '#764ba2',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceHover: '#f1f5f9',
      text: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      borderHover: '#cbd5e1',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      online: '#22c55e',
      offline: '#6b7280',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowHover: 'rgba(0, 0, 0, 0.15)'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      surface: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      message: 'linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#818cf8',
      primaryHover: '#6366f1',
      secondary: '#a855f7',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      borderHover: '#475569',
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#f87171',
      online: '#34d399',
      offline: '#9ca3af',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowHover: 'rgba(0, 0, 0, 0.4)'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #818cf8 0%, #a855f7 100%)',
      surface: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      message: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'
    }
  },
  midnight: {
    name: 'Midnight',
    colors: {
      primary: '#06b6d4',
      primaryHover: '#0891b2',
      secondary: '#8b5cf6',
      background: '#020617',
      surface: '#0f172a',
      surfaceHover: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#e2e8f0',
      textMuted: '#94a3b8',
      border: '#1e293b',
      borderHover: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      online: '#06d6a0',
      offline: '#6b7280',
      shadow: 'rgba(0, 0, 0, 0.5)',
      shadowHover: 'rgba(0, 0, 0, 0.6)'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
      surface: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      message: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  }
};

export const getTheme = (themeName = 'light') => {
  return themes[themeName] || themes.light;
};

export const applyTheme = (themeName) => {
  const theme = getTheme(themeName);
  const root = document.documentElement;
  
  // Apply CSS custom properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  Object.entries(theme.gradients).forEach(([key, value]) => {
    root.style.setProperty(`--gradient-${key}`, value);
  });
  
  // Store theme preference
  localStorage.setItem('chatTheme', themeName);
};

export const getStoredTheme = () => {
  return localStorage.getItem('chatTheme') || 'light';
};

// Modern component styles
export const componentStyles = {
  button: {
    base: {
      padding: '12px 24px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    primary: {
      background: 'var(--gradient-primary)',
      color: 'white',
      boxShadow: '0 4px 12px var(--color-shadow)'
    },
    secondary: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      border: '2px solid var(--color-border)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-textSecondary)',
      border: 'none'
    }
  },
  input: {
    base: {
      padding: '12px 16px',
      borderRadius: '12px',
      border: '2px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    focus: {
      borderColor: 'var(--color-primary)',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
  },
  card: {
    base: {
      backgroundColor: 'var(--color-surface)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 12px var(--color-shadow)',
      border: '1px solid var(--color-border)'
    },
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px var(--color-shadowHover)'
    }
  },
  message: {
    sent: {
      background: 'var(--gradient-message)',
      color: 'white',
      borderRadius: '18px 18px 4px 18px',
      marginLeft: 'auto'
    },
    received: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      borderRadius: '18px 18px 18px 4px',
      marginRight: 'auto'
    }
  }
};