export const themes = {
  light: {
    colors: { primary:'#667eea', primaryHover:'#5a6fd8', secondary:'#764ba2', background:'#ffffff', surface:'#f8fafc', surfaceHover:'#f1f5f9', text:'#1e293b', textSecondary:'#64748b', textMuted:'#94a3b8', border:'#e2e8f0', borderHover:'#cbd5e1', success:'#10b981', warning:'#f59e0b', error:'#ef4444', online:'#22c55e', offline:'#6b7280', shadow:'rgba(0,0,0,0.1)', shadowHover:'rgba(0,0,0,0.15)' },
    gradients: { primary:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', surface:'linear-gradient(135deg,#f8fafc 0%,#ffffff 100%)', message:'linear-gradient(135deg,#667eea 0%,#5a6fd8 100%)' }
  },
  dark: {
    colors: { primary:'#818cf8', primaryHover:'#6366f1', secondary:'#a855f7', background:'#0f172a', surface:'#1e293b', surfaceHover:'#334155', text:'#f1f5f9', textSecondary:'#cbd5e1', textMuted:'#94a3b8', border:'#334155', borderHover:'#475569', success:'#22c55e', warning:'#fbbf24', error:'#f87171', online:'#34d399', offline:'#9ca3af', shadow:'rgba(0,0,0,0.3)', shadowHover:'rgba(0,0,0,0.4)' },
    gradients: { primary:'linear-gradient(135deg,#818cf8 0%,#a855f7 100%)', surface:'linear-gradient(135deg,#1e293b 0%,#334155 100%)', message:'linear-gradient(135deg,#818cf8 0%,#6366f1 100%)' }
  },
  midnight: {
    colors: { primary:'#06b6d4', primaryHover:'#0891b2', secondary:'#8b5cf6', background:'#020617', surface:'#0f172a', surfaceHover:'#1e293b', text:'#f8fafc', textSecondary:'#e2e8f0', textMuted:'#94a3b8', border:'#1e293b', borderHover:'#334155', success:'#10b981', warning:'#f59e0b', error:'#ef4444', online:'#06d6a0', offline:'#6b7280', shadow:'rgba(0,0,0,0.5)', shadowHover:'rgba(0,0,0,0.6)' },
    gradients: { primary:'linear-gradient(135deg,#06b6d4 0%,#8b5cf6 100%)', surface:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', message:'linear-gradient(135deg,#06b6d4 0%,#0891b2 100%)' }
  }
};

export const applyTheme = (name = 'light') => {
  const t = themes[name] || themes.light;
  const root = document.documentElement;
  Object.entries(t.colors).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v));
  Object.entries(t.gradients).forEach(([k, v]) => root.style.setProperty(`--gradient-${k}`, v));
  localStorage.setItem('chatTheme', name);
};

export const getStoredTheme = () => localStorage.getItem('chatTheme') || 'light';
