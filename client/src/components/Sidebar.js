import { useState } from 'react';
import { roomAPI } from '../services/api';
import secureStorage from '../services/secureStorage';

const Sidebar = ({ rooms, currentRoom, onRoomSelect, currentUser, unreadCounts, onThemeToggle, currentTheme, onLogout }) => {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showStats, setShowStats] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await roomAPI.createRoom({
        name: newRoomName,
        createdBy: currentUser.username
      });
      setNewRoomName('');
      setShowCreateRoom(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to create room');
    }
  };

  const getAvatarUrl = (username) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=667eea`;
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'midnight': return '🌌';
      default: return '🎨';
    }
  };

  const messageStats = secureStorage.getMessageStats();

  return (
    <div style={{ 
      width: '300px', 
      backgroundColor: 'var(--color-surface)', 
      borderRight: '1px solid var(--color-border)',
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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-4)'
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: '700',
            color: 'var(--color-text)'
          }}>
            💬 ChatApp
          </h2>
          <button 
            onClick={onThemeToggle}
            className="btn-ghost"
            style={{ 
              padding: 'var(--spacing-2)',
              fontSize: 'var(--font-size-lg)'
            }}
            title={`Switch to ${currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'midnight' : 'light'} theme`}
          >
            {getThemeIcon()}
          </button>
        </div>
        
        <button 
          onClick={() => setShowCreateRoom(!showCreateRoom)}
          className="btn btn-primary"
          style={{ 
            width: '100%',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          ➕ Create Room
        </button>
      </div>

      {/* Create Room Form */}
      {showCreateRoom && (
        <div className="animate-slide-up" style={{ 
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-surfaceHover)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <form onSubmit={handleCreateRoom}>
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              required
              className="input"
              style={{ 
                marginBottom: 'var(--spacing-3)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: 'var(--font-size-xs)' }}>
                Create
              </button>
              <button 
                type="button"
                onClick={() => setShowCreateRoom(false)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 'var(--font-size-xs)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: 'var(--spacing-3)'
      }}>
        <div style={{ marginBottom: 'var(--spacing-2)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--color-textSecondary)',
            margin: '0 0 var(--spacing-3) var(--spacing-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Rooms
          </h3>
        </div>
        
        {/* General Room */}
        <div
          onClick={() => onRoomSelect('general')}
          className="modern-card"
          style={{
            padding: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-2)',
            cursor: 'pointer',
            backgroundColor: currentRoom === 'general' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: currentRoom === 'general' ? 'white' : 'var(--color-text)',
            border: currentRoom === 'general' ? 'none' : '1px solid var(--color-border)',
            transition: 'all var(--transition-normal)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <span style={{ fontSize: 'var(--font-size-base)' }}>🏠</span>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>general</span>
          </div>
          {unreadCounts?.general > 0 && (
            <span style={{
              backgroundColor: currentRoom === 'general' ? 'rgba(255,255,255,0.2)' : 'var(--color-error)',
              color: currentRoom === 'general' ? 'white' : 'white',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--spacing-1) var(--spacing-2)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'bold',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {unreadCounts.general}
            </span>
          )}
        </div>
        
        {/* Custom Rooms */}
        {rooms.map(room => (
          <div
            key={room._id}
            className="modern-card"
            style={{
              padding: 'var(--spacing-3)',
              marginBottom: 'var(--spacing-2)',
              cursor: 'pointer',
              backgroundColor: currentRoom === room.name ? 'var(--color-primary)' : 'var(--color-surface)',
              color: currentRoom === room.name ? 'white' : 'var(--color-text)',
              border: currentRoom === room.name ? 'none' : '1px solid var(--color-border)',
              transition: 'all var(--transition-normal)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1 }} onClick={() => onRoomSelect(room.name)}>
              <span style={{ fontSize: 'var(--font-size-base)' }}>💬</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>{room.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCounts?.[room.name] > 0 && (
                <span style={{
                  backgroundColor: currentRoom === room.name ? 'rgba(255,255,255,0.2)' : 'var(--color-error)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {unreadCounts[room.name]}
                </span>
              )}

              <button
                title="Room options"
                onClick={async (e) => {
                  e.stopPropagation();
                  const ok = window.confirm(`Delete room '${room.name}'? This will remove all messages.`);
                  if (!ok) return;
                  try {
                      await roomAPI.deleteRoom(room._id || room.name);
                      window.location.reload();
                    } catch (err) {
                      console.error('Failed to delete room', err);
                      const serverMessage = err?.response?.data?.message || err.message || 'Failed to delete room';
                      alert(serverMessage);
                    }
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6 }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Stats */}
      <div style={{ 
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surfaceHover)'
      }}>
        <button
          onClick={() => setShowStats(!showStats)}
          className="btn-ghost"
          style={{
            width: '100%',
            padding: 'var(--spacing-2)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-textSecondary)',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>🔒 Privacy Stats</span>
          <span>{showStats ? '▼' : '▶'}</span>
        </button>
        
        {showStats && (
          <div className="animate-slide-up" style={{
            marginTop: 'var(--spacing-2)',
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-textSecondary)'
          }}>
            <div style={{ marginBottom: 'var(--spacing-1)' }}>📨 Encrypted Messages: {messageStats.totalMessages}</div>
            <div style={{ marginBottom: 'var(--spacing-1)' }}>🏠 Rooms Visited: {messageStats.roomsCount}</div>
            <div style={{ marginBottom: 'var(--spacing-1)' }}>💾 Storage: {messageStats.storageLocation}</div>
            <div style={{ marginBottom: 'var(--spacing-1)' }}>📊 Size: {messageStats.storageSize}</div>
            <div style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--color-textMuted)',
              wordBreak: 'break-all',
              marginTop: 'var(--spacing-2)',
              padding: 'var(--spacing-2)',
              backgroundColor: 'var(--color-surfaceHover)',
              borderRadius: 'var(--radius-sm)'
            }}>
              📁 {messageStats.chatDirectory}
            </div>
            {secureStorage.isFileStorageAvailable() && (
              <button
                onClick={() => {
                  if (window.require) {
                    const { shell } = window.require('electron');
                    shell.openPath(messageStats.chatDirectory);
                  }
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: 'var(--spacing-2)',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--spacing-1) var(--spacing-2)'
                }}
              >
                📂 Open Folder
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div style={{ 
        padding: 'var(--spacing-4)',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--gradient-surface)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-3)',
          marginBottom: 'var(--spacing-4)'
        }}>
          <img 
            src={getAvatarUrl(currentUser?.username)}
            alt={currentUser?.username}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid var(--color-primary)'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)'
            }}>
              {currentUser?.username}
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: 'var(--color-online)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)'
            }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                backgroundColor: 'var(--color-online)', 
                borderRadius: '50%' 
              }}></span>
              Online & Secure
            </div>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ 
            width: '100%',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-error)'
          }}
        >
          🚪 Secure Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;