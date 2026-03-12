import React from 'react';

const OnlineUsers = ({ users }) => {
  const getAvatarUrl = (username) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=27ae60,e74c3c,3498db,f39c12,9b59b6,06b6d4`;
  };

  return (
    <div style={{ 
      width: '280px', 
      backgroundColor: 'var(--color-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        padding: 'var(--spacing-5)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--gradient-surface)'
      }}>
        <h3 style={{ 
          margin: 0,
          color: 'var(--color-text)',
          fontSize: 'var(--font-size-lg)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)'
        }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            backgroundColor: 'var(--color-online)', 
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></span>
          Online ({users.length})
        </h3>
        <p style={{
          margin: 'var(--spacing-1) 0 0 0',
          color: 'var(--color-textSecondary)',
          fontSize: 'var(--font-size-xs)'
        }}>
          Active users in this room
        </p>
      </div>
      
      {/* Users List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: 'var(--spacing-3)'
      }}>
        {users.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--color-textMuted)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: 'var(--spacing-2)',
              opacity: 0.5
            }}>
              👥
            </div>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.4'
            }}>
              No other users online right now
            </p>
          </div>
        ) : (
          users.map((user, index) => (
            <div 
              key={index}
              className="modern-card animate-fade-in"
              style={{ 
                padding: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                transition: 'all var(--transition-normal)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={getAvatarUrl(user)}
                  alt={user}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid var(--color-border)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--color-online)',
                  borderRadius: '50%',
                  border: '2px solid var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)'
                }}></div>
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '500',
                  color: 'var(--color-text)',
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--spacing-1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user}
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-online)',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-1)'
                }}>
                  <span>🟢</span>
                  Active now
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Privacy Info */}
      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surfaceHover)'
      }}>
        <div style={{
          padding: 'var(--spacing-3)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-textSecondary)',
            lineHeight: '1.4'
          }}>
            <div style={{ marginBottom: 'var(--spacing-1)' }}>
              🔒 <strong>Privacy First</strong>
            </div>
            <div>
              Only usernames are visible. Your messages remain private and encrypted.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers;