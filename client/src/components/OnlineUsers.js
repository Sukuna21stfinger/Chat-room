
const OnlineUsers = ({ users = [] }) => {
  const getAvatarUrl = (username) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=27ae60,e74c3c,3498db,f39c12,9b59b6,06b6d4`;

  return (
    <aside style={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <strong>Online ({users.length})</strong>
        <div style={{ fontSize: 12, color: '#666' }}>Active users in this room</div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>No other users online right now</div>
        ) : (
          users.map((u) => {
            const username = typeof u === 'string' ? u : u.username || u.name || 'Unknown';
            const key = (u && (u._id || u.id)) || username;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <img src={getAvatarUrl(username)} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{username}</div>
                  <div style={{ fontSize: 12, color: '#2aa44f' }}>Active now</div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <footer style={{ padding: 12, borderTop: '1px solid #eee', fontSize: 12, color: '#666' }}>
        🔒 Privacy First — only usernames are visible
      </footer>
    </aside>
  );
};

export default OnlineUsers;