import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const sampleGifs = [
  { url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif' },
  { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { url: 'https://media.giphy.com/media/26gssIytJvy1b1THO/giphy.gif' },
  { url: 'https://media.giphy.com/media/xT0GqssRweIhlz209i/giphy.gif' },
  { url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif' },
  { url: 'https://media.giphy.com/media/3oEduSbSGpGaRX2Vri/giphy.gif' },
  { url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif' }
];

const GifPicker = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cachedRef = useRef([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const key = process.env.REACT_APP_GIPHY_KEY || 'dc6zaTOxFJmzC';
    const keywords = ['trending','funny','meme','reaction','cat','dog','happy','love','wow','party','celebrate','dance','hello','food','sports','gaming','anime','music','sad','angry','cute','coffee','fail','win','birthday'];

    const fetchMany = async () => {
      try {
        const seen = new Set();
        const out = [];
        for (let k = 0; k < keywords.length && out.length < 1200 && !cancelled; k++) {
          try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(keywords[k])}&limit=50&rating=pg-13`);
            if (!res.ok) continue;
            const json = await res.json();
            (json.data || []).forEach(item => {
              const u = item.images?.fixed_width?.url || item.images?.original?.url;
              if (u && !seen.has(u)) { seen.add(u); out.push({ url: u }); }
            });
            if (!cancelled && out.length > 0) {
              cachedRef.current = out.slice();
              setResults(prev => prev.length >= 30 ? prev : cachedRef.current.slice(0, 30));
            }
          } catch (_) {}
        }
        if (!cancelled) {
          cachedRef.current = out.slice(0, 1200);
          setResults(prev => prev.length ? prev : cachedRef.current.slice(0, 30));
        }
      } catch (_) {}
    };
    fetchMany();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = debouncedQ.toLowerCase();
    const key = process.env.REACT_APP_GIPHY_KEY || 'dc6zaTOxFJmzC';

    const doSearch = async () => {
      setLoading(true); setError(null);
      try {
        if (!q) {
          setResults(cachedRef.current.length ? cachedRef.current.slice(0, 30) : sampleGifs);
          return;
        }
        const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=30&rating=pg-13`);
        if (!res.ok) throw new Error(`Giphy ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const gifs = (json.data || []).map(item => ({ url: item.images?.fixed_width?.url || item.images?.original?.url })).filter(Boolean);
        setResults(gifs.length ? gifs : cachedRef.current.slice(0, 30));
      } catch (err) {
        if (!cancelled) { setError(err.message); setResults(cachedRef.current.slice(0, 30)); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doSearch();
    return () => { cancelled = true; };
  }, [debouncedQ]);

  return (
    <div style={{ width: 'min(340px, 90vw)', padding: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
      <input placeholder="Search GIFs…" value={query} onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 13 }} />
      {loading && <div style={{ color: 'var(--color-textMuted)', fontSize: 12, marginBottom: 6 }}>Searching…</div>}
      {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginBottom: 6 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
        {(!results || results.length === 0) && <div style={{ gridColumn: '1/-1', color: 'var(--color-textMuted)', fontSize: 12, padding: 8 }}>No GIFs found</div>}
        {results.map((g, idx) => (
          <img key={g.url + idx} src={g.url} alt="gif" onClick={() => onSelect(g.url)}
            style={{ width: '100%', height: 80, objectFit: 'cover', cursor: 'pointer', borderRadius: 6, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.target.style.opacity = 0.8}
            onMouseLeave={e => e.target.style.opacity = 1}
          />
        ))}
      </div>
    </div>
  );
};

const baseEmojis = [
  { ch: '😀', tags: ['smile'] }, { ch: '😂', tags: ['laugh'] }, { ch: '😊', tags: ['blush'] }, { ch: '😍', tags: ['love'] },
  { ch: '😎', tags: ['cool'] }, { ch: '😢', tags: ['cry'] }, { ch: '😡', tags: ['angry'] }, { ch: '🤯', tags: ['mindblown'] },
  { ch: '🥳', tags: ['party'] }, { ch: '😴', tags: ['sleep'] }, { ch: '🤔', tags: ['think'] }, { ch: '🙏', tags: ['pray'] },
  { ch: '👍', tags: ['like'] }, { ch: '👎', tags: ['dislike'] }, { ch: '👏', tags: ['clap'] }, { ch: '💪', tags: ['strong'] },
  { ch: '🔥', tags: ['fire'] }, { ch: '✨', tags: ['sparkle'] }, { ch: '🎉', tags: ['party'] }, { ch: '💯', tags: ['100'] },
  { ch: '❤️', tags: ['heart'] }, { ch: '💙', tags: ['heart'] }, { ch: '💚', tags: ['heart'] }, { ch: '💛', tags: ['heart'] },
  { ch: '🍕', tags: ['food'] }, { ch: '🍔', tags: ['food'] }, { ch: '☕', tags: ['coffee'] }, { ch: '🎵', tags: ['music'] },
  { ch: '🎮', tags: ['game'] }, { ch: '🏆', tags: ['trophy'] }, { ch: '✅', tags: ['check'] }, { ch: '❌', tags: ['cross'] }
];

const MessageInput = ({ onSendMessage, currentRoom }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState('');
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

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      socket.emit('typing', { room: currentRoom, username: currentUser.username });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) { setIsTyping(false); socket.emit('stop_typing', { room: currentRoom, username: currentUser.username }); }
    }, 1200);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!message.trim()) return;
    onSendMessage && onSendMessage({ message: message.trim(), user: currentUser.username || 'guest', room: currentRoom, timestamp: Date.now(), type: 'text' });
    setMessage(''); setShowEmoji(false); setShowGifs(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) { setIsTyping(false); socket.emit('stop_typing', { room: currentRoom, username: currentUser.username }); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };

  const handleGifSelect = (url) => {
    onSendMessage && onSendMessage({ type: 'gif', attachment: url, user: currentUser.username || 'guest', room: currentRoom, timestamp: Date.now() });
    setShowGifs(false);
  };

  const emojiQ = emojiQuery.trim().toLowerCase();
  const emojiResults = baseEmojis.filter(it => !emojiQ || it.tags.join(' ').includes(emojiQ) || it.ch.includes(emojiQ));

  return (
    <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
          <button type="button" onClick={() => { setShowEmoji(v => !v); setShowGifs(false); }} title="Emoji"
            style={{ background: showEmoji ? 'var(--color-surfaceHover)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 18, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>😊</button>
          <button type="button" onClick={() => { setShowGifs(v => !v); setShowEmoji(false); }} title="GIF"
            style={{ background: showGifs ? 'var(--color-surfaceHover)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>GIF</button>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <textarea ref={inputRef} value={message} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder="Type a message…" rows={1}
            style={{ resize: 'none', minHeight: 44, maxHeight: 120, width: '100%', padding: '10px 70px 10px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 14, lineHeight: 1.5, outline: 'none', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />

          {showEmoji && (
            <div style={{ position: 'absolute', left: 0, bottom: 52, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 10, zIndex: 60, width: 'min(300px, 90vw)', maxHeight: 280, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
              <input placeholder="Search emoji…" value={emojiQuery} onChange={e => setEmojiQuery(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 13 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
                {emojiResults.map((it, idx) => (
                  <button key={it.ch + idx} onClick={() => { setMessage(p => p + it.ch); setShowEmoji(false); setTimeout(() => inputRef.current?.focus(), 0); }}
                    style={{ fontSize: 20, padding: 5, background: 'transparent', border: 0, cursor: 'pointer', borderRadius: 6 }}
                    onMouseEnter={e => e.target.style.background = 'var(--color-surfaceHover)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >{it.ch}</button>
                ))}
              </div>
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
