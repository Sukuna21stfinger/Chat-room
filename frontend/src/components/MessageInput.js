import { useCallback, useEffect, useRef, useState } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useSocket } from '../context/SocketContext';

const GIPHY_KEY = 'nZOjgVPx6lG9yeuNedBusMHtHO1C7Ub2';
const GIPHY_LIMIT = 24;

const GifPicker = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setResults([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    setLoading(true);

    const fetchGifs = async () => {
      try {
        const endpoint = debouncedQ
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(debouncedQ)}&limit=${GIPHY_LIMIT}&offset=0&rating=pg-13&lang=en`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${GIPHY_LIMIT}&offset=0&rating=pg-13`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`Giphy ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const gifs = (json.data || []).map(item => ({
          id: item.id,
          url: item.images?.fixed_width?.url || item.images?.original?.url,
          preview: item.images?.fixed_width_still?.url
        })).filter(g => g.url);
        setResults(gifs);
        setOffset(GIPHY_LIMIT);
        setHasMore((json.pagination?.total_count || 0) > GIPHY_LIMIT);
      } catch (err) {
        if (!cancelled) setError('Could not load GIFs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGifs();
    return () => { cancelled = true; };
  }, [debouncedQ]);

  const handleScroll = async () => {
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
      setLoadingMore(true);
      try {
        const endpoint = debouncedQ
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(debouncedQ)}&limit=${GIPHY_LIMIT}&offset=${offset}&rating=pg-13&lang=en`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${GIPHY_LIMIT}&offset=${offset}&rating=pg-13`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const more = (json.data || []).map(item => ({
          id: item.id,
          url: item.images?.fixed_width?.url || item.images?.original?.url,
          preview: item.images?.fixed_width_still?.url
        })).filter(g => g.url);
        setResults(prev => {
          const ids = new Set(prev.map(g => g.id));
          return [...prev, ...more.filter(g => !ids.has(g.id))];
        });
        setOffset(prev => prev + GIPHY_LIMIT);
        setHasMore((json.pagination?.total_count || 0) > offset + GIPHY_LIMIT);
      } catch (_) {
        setHasMore(false);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  return (
    <div style={{ width: 'min(360px, 92vw)', padding: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
      <input
        autoFocus
        placeholder="Search GIPHY…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box' }}
      />
      {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginBottom: 6 }}>{error}</div>}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, maxHeight: 300, overflowY: 'auto' }}
      >
        {loading && Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ width: '100%', height: 80, borderRadius: 6, background: 'var(--color-surfaceHover)', animation: 'pulse 1.2s infinite' }} />
        ))}
        {!loading && results.length === 0 && (
          <div style={{ gridColumn: '1/-1', color: 'var(--color-textMuted)', fontSize: 12, padding: 8 }}>No GIFs found</div>
        )}
        {results.map(g => (
          <img key={g.id} src={g.url} alt="gif" loading="lazy" onClick={() => onSelect(g.url)}
            style={{ width: '100%', height: 80, objectFit: 'cover', cursor: 'pointer', borderRadius: 6, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.target.style.opacity = 0.75}
            onMouseLeave={e => e.target.style.opacity = 1}
          />
        ))}
        {loadingMore && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-textMuted)', fontSize: 12, padding: 6 }}>Loading more…</div>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--color-textMuted)', marginTop: 4, opacity: 0.6 }}>Powered by GIPHY</div>
    </div>
  );
};

const MessageInput = ({ onSendMessage, currentRoom }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const socket = useSocket();
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!isTyping) return;
    const t = setTimeout(() => {
      socket.emit('stop_typing', { room: currentRoom, username: currentUser.username });
      setIsTyping(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [isTyping, currentRoom, socket, currentUser.username]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      socket.emit('typing', { room: currentRoom, username: currentUser.username });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { room: currentRoom, username: currentUser.username });
    }, 1200);
  }, [isTyping, currentRoom, socket, currentUser.username]);

  const handleSubmit = useCallback((e) => {
    e && e.preventDefault();
    if (!message.trim()) return;
    onSendMessage && onSendMessage({ message: message.trim(), user: currentUser.username || 'guest', room: currentRoom, timestamp: Date.now(), type: 'text' });
    setMessage('');
    setShowEmoji(false);
    setShowGifs(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      setIsTyping(false);
      socket.emit('stop_typing', { room: currentRoom, username: currentUser.username });
    }
  }, [message, isTyping, onSendMessage, currentRoom, socket, currentUser.username]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }, [handleSubmit]);

  const handleGifSelect = useCallback((url) => {
    onSendMessage && onSendMessage({ type: 'gif', attachment: url, user: currentUser.username || 'guest', room: currentRoom, timestamp: Date.now() });
    setShowGifs(false);
  }, [onSendMessage, currentRoom, currentUser.username]);

  const handleEmojiSelect = useCallback((emoji) => {
    setMessage(prev => prev + emoji.native);
    setShowEmoji(false);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  }, []);

  return (
    <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
          <button type="button" onClick={() => { setShowEmoji(v => !v); setShowGifs(false); }} title="Emoji"
            style={{ background: showEmoji ? 'var(--color-surfaceHover)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 18, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>😊</button>
          <button type="button" onClick={() => { setShowGifs(v => !v); setShowEmoji(false); }} title="GIF"
            style={{ background: showGifs ? 'var(--color-surfaceHover)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>GIF</button>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            style={{ resize: 'none', minHeight: 44, maxHeight: 120, width: '100%', padding: '10px 70px 10px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 14, lineHeight: 1.5, outline: 'none', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />

          {showEmoji && (
            <div style={{ position: 'absolute', left: 0, bottom: 52, zIndex: 60 }}>
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="auto"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            </div>
          )}

          {showGifs && (
            <div style={{ position: 'absolute', left: 0, bottom: 52, zIndex: 60 }}>
              <GifPicker onSelect={handleGifSelect} />
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: 'var(--color-textMuted)', pointerEvents: 'none' }}>
            {message.length}/1000
          </div>
        </div>

        <button type="submit" disabled={!message.trim()}
          style={{ padding: '0 16px', height: 44, borderRadius: 12, background: message.trim() ? 'var(--gradient-primary)' : 'var(--color-surfaceHover)', color: message.trim() ? 'white' : 'var(--color-textMuted)', border: 'none', cursor: message.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14, transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Send ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
