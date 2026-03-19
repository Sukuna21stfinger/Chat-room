const OnlineUsers = ({ users = [], isMobile }) => {
  const avatar = (u) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u)}&backgroundColor=667eea,764ba2,06b6d4,10b981`;

  return (
    <aside style={{
      width: isMobile ? '100%' : 220,
      display: 'flex', flexDirection: 'column',
      height: isMobile ? '100%' : '100%',
      backgroundColor: 'var(--color-surface)',
      borderLeft: isMobile ? 'none' : '1px solid var(--color-border)',
      flexShrink: 0,
      paddingBottom: isMobile ? 'var(--bottom-nav-height)' : 0
    }}>
      <header style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Online · {users.length}</div>
        <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 2 }}>Active in this room</div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-textMuted)', padding: '24px 8px', fontSize: 13 }}>No other users online</div>
        ) : (
          users.map((u) => {
            const username = typeof u === 'string' ? u : u.username || u.name || 'Unknown';
            const key = (u && (u._id || u.id)) || username;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', borderRadius: 10, transition: 'background 0.15s', cursor: 'default', minHeight: 44 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surfaceHover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={avatar(username)} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--color-border)' }} />
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: 'var(--color-online)', borderRadius: '50%', border: '2px solid var(--color-surface)' }} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-online)' }}>Active now</div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <footer style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-textMuted)' }}>
        🔒 Only usernames visible
      </footer>
    </aside>
  );
};

export default OnlineUsers;
