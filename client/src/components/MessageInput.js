import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

// Small fallback GIF catalog used when Giphy fails
const sampleGifs = [
  { url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif', tags: ['dance', 'party', 'fun'] },
  { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', tags: ['cool', 'thumbs', 'sunglasses'] },
  { url: 'https://media.giphy.com/media/26gssIytJvy1b1THO/giphy.gif', tags: ['meme', 'laugh', 'funny'] },
  { url: 'https://media.giphy.com/media/xT0GqssRweIhlz209i/giphy.gif', tags: ['wow', 'surprise', 'reaction'] },
  { url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif', tags: ['clap', 'applause'] },
  { url: 'https://media.giphy.com/media/3oEduSbSGpGaRX2Vri/giphy.gif', tags: ['dance', 'celebrate'] },
  { url: 'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif', tags: ['no', 'dismiss'] },
  { url: 'https://media.giphy.com/media/l2JehQ2GitHGdVG9y/giphy.gif', tags: ['yes', 'agree', 'thumbs'] },
  { url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', tags: ['hello', 'wave'] },
  { url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', tags: ['sleep','tired'] }
];

const GifPicker = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // locally cached large GIF library (deduplicated)
  const cachedRef = useRef([]);

  // debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // populate a large cache (1000+) in background by running multiple Giphy searches
  useEffect(() => {
    let cancelled = false;
    const key = process.env.REACT_APP_GIPHY_KEY || 'dc6zaTOxFJmzC';
    const keywords = ['trending','funny','meme','reaction','cat','dog','happy','love','wow','party','celebrate','dance','clap','hello','food','movie','tv','sports','gaming','anime','cartoon','nature','travel','work','school','music','sad','angry','wow','surprise','cute','sleep','coffee','tea','fail','win','cheers','birthday','gift','kiss','hug','romance','wow','cool','thumbs'];

    const fetchMany = async () => {
      try {
        const seen = new Set();
        const out = [];

        // try a few keyword passes until we have 1000 unique
        for (let k = 0; k < keywords.length && out.length < 1200 && !cancelled; k++) {
          const q = keywords[k];
          const url = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=50&rating=pg-13&lang=en`;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const json = await res.json();
            (json.data || []).forEach(item => {
              const url = item.images?.fixed_width?.url || item.images?.original?.url;
              if (url && !seen.has(url)) {
                seen.add(url);
                out.push({ url });
              }
            });
            // progressively update cache so UI sees more gifs while fetches continue
            if (!cancelled && out.length > 0) {
              cachedRef.current = Array.from(seen).map(u => ({ url: u }));
              setResults(prev => (prev && prev.length >= 30 ? prev : cachedRef.current.slice(0, 30)));
            }
          } catch (e) {
            // ignore single query errors
          }
        }

        // if not enough, add fallback sampleGifs variations (unique by appending index)
        let i = 0;
        while (out.length < 1200 && i < 200 && !cancelled) {
          for (const s of sampleGifs) {
            const url = `${s.url}`;
            if (!seen.has(url)) {
              seen.add(url);
              out.push({ url });
              if (out.length >= 1200) break;
            }
          }
          i++;
        }

        if (!cancelled) {
          cachedRef.current = out.slice(0, 1200);
          // initial results default to cached set
          setResults(prev => (prev && prev.length ? prev : cachedRef.current.slice(0, 30)));
        }
      } catch (e) {
        // ignore
      }
    };

    fetchMany();
    return () => { cancelled = true; };
  }, []);

  // perform live search (debounced). If query empty use cached results.
  useEffect(() => {
    let cancelled = false;
    const q = (debouncedQ || '').toLowerCase();
    const key = process.env.REACT_APP_GIPHY_KEY || 'dc6zaTOxFJmzC';

    const doSearch = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!q) {
          // show cached set or try trending for immediate results
          if (cachedRef.current && cachedRef.current.length) {
            setResults(cachedRef.current.slice(0, 30));
            return;
          }
          // trending fallback
          const trendingUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(key)}&limit=30&rating=pg-13`;
          const tRes = await fetch(trendingUrl);
          if (tRes.ok) {
            const tJson = await tRes.json();
            const tGifs = (tJson.data || []).map(item => ({ url: item.images?.fixed_width?.url || item.images?.original?.url }));
            if (tGifs.length) {
              setResults(tGifs.filter(Boolean));
              return;
            }
          }
          setResults([]);
          return;
        }
        const limit = 30;
        const url = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13&lang=en`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Giphy error ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const gifs = (json.data || []).map(item => ({ url: item.images?.fixed_width?.url || item.images?.original?.url }));
        if (!gifs.length) {
          // fallback to local filtered cached
          const local = cachedRef.current.filter(g => g.url.includes(q));
          setResults(local.slice(0, 30));
        } else {
          setResults(gifs.filter(Boolean));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'GIF search failed');
          setResults(cachedRef.current.slice(0, 30));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doSearch();
    return () => { cancelled = true; };
  }, [debouncedQ]);

  return (
    <div style={{ width: 'min(340px, 90vw)', padding: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
      <input
        placeholder="Search GIFs…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 13 }}
      />
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

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      socket.emit('typing', { room: currentRoom, username: currentUser.username });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('stop_typing', { room: currentRoom, username: currentUser.username });
      }
    }, 1200);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!message.trim()) return;
    const payload = { message: message.trim(), user: currentUser.username || 'guest', room: currentRoom, timestamp: Date.now(), type: 'text' };
    // send via parent handler to avoid double-emitting (parent saves and emits)
    onSendMessage && onSendMessage(payload);
    setMessage('');
    setShowEmoji(false);
    setShowGifs(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      setIsTyping(false);
      socket.emit('stop_typing', { room: currentRoom, username: currentUser.username });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    // keep focus
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  };

  const handleGifSelect = (url) => {
    const payload = { type: 'gif', attachment: url, user: currentUser.username || 'guest', room: currentRoom, timestamp: Date.now() };
    // delegate to parent so only one emit occurs
    onSendMessage && onSendMessage(payload);
    setShowGifs(false);
  };

  // --- Base emoji set (approx 90 unique) ---
  const baseEmojis = [
    { ch: '😀', tags: ['grin','smile','happy'] },{ ch: '😃', tags: ['smile','happy'] },{ ch: '😄', tags: ['smile'] },{ ch: '😁', tags: ['grin'] },
    { ch: '😆', tags: ['laugh'] },{ ch: '😅', tags: ['sweat','relief'] },{ ch: '😂', tags: ['lol','laugh'] },{ ch: '🤣', tags: ['rofl'] },
    { ch: '😊', tags: ['blush','smile'] },{ ch: '😇', tags: ['angel'] },{ ch: '🙂', tags: ['nice'] },{ ch: '🙃', tags: ['upside'] },
    { ch: '😉', tags: ['wink'] },{ ch: '😍', tags: ['love'] },{ ch: '😘', tags: ['kiss'] },{ ch: '😗', tags: ['kiss'] },
    { ch: '😙', tags: ['kiss'] },{ ch: '😚', tags: ['kiss'] },{ ch: '😋', tags: ['yum'] },{ ch: '😛', tags: ['tongue'] },
    { ch: '😜', tags: ['tongue','wink'] },{ ch: '🤪', tags: ['silly'] },{ ch: '🤩', tags: ['starstruck'] },{ ch: '🥳', tags: ['party'] },
    { ch: '😎', tags: ['cool'] },{ ch: '🤠', tags: ['cowboy'] },{ ch: '😏', tags: ['smirk'] },{ ch: '😒', tags: ['unamused'] },
    { ch: '😞', tags: ['sad'] },{ ch: '😔', tags: ['pensive'] },{ ch: '😢', tags: ['cry'] },{ ch: '😭', tags: ['sob'] },
    { ch: '😤', tags: ['triumph'] },{ ch: '😡', tags: ['angry'] },{ ch: '🤬', tags: ['swear'] },{ ch: '🤯', tags: ['mindblown'] },
    { ch: '😳', tags: ['flushed'] },{ ch: '🥺', tags: ['pleading'] },{ ch: '😬', tags: ['grimace'] },{ ch: '🙌', tags: ['praise'] },
    { ch: '👍', tags: ['thumbs','like'] },{ ch: '👎', tags: ['dislike'] },{ ch: '👏', tags: ['clap'] },{ ch: '💪', tags: ['strong'] },
    { ch: '🙏', tags: ['pray','please'] },{ ch: '🔥', tags: ['fire','lit'] },{ ch: '✨', tags: ['sparkles'] },{ ch: '🎉', tags: ['party'] },
    { ch: '🎊', tags: ['celebrate'] },{ ch: '💥', tags: ['boom'] },{ ch: '❤️', tags: ['heart','love'] },{ ch: '🧡', tags: ['heart'] },
    { ch: '💛', tags: ['heart'] },{ ch: '💚', tags: ['heart'] },{ ch: '💙', tags: ['heart'] },{ ch: '💜', tags: ['heart'] },
    { ch: '🤍', tags: ['heart'] },{ ch: '🤎', tags: ['heart'] },{ ch: '🖤', tags: ['heart'] },{ ch: '💖', tags: ['sparkling'] },
    { ch: '🌟', tags: ['star'] },{ ch: '⭐', tags: ['star'] },{ ch: '☀️', tags: ['sun'] },{ ch: '🌤️', tags: ['sun'] },
    { ch: '🌧️', tags: ['rain'] },{ ch: '☔', tags: ['umbrella'] },{ ch: '⛄', tags: ['snow'] },{ ch: '🍕', tags: ['food'] },
    { ch: '🍔', tags: ['food'] },{ ch: '🍟', tags: ['food'] },{ ch: '🍩', tags: ['food'] },{ ch: '🍪', tags: ['food'] },
    { ch: '🍺', tags: ['drink'] },{ ch: '☕', tags: ['drink'] },{ ch: '🎵', tags: ['music'] },{ ch: '🎸', tags: ['music'] },
    { ch: '🎮', tags: ['game'] },{ ch: '🏆', tags: ['trophy'] },{ ch: '⚽', tags: ['sports'] },{ ch: '🏀', tags: ['sports'] },
    { ch: '🚗', tags: ['car'] },{ ch: '✈️', tags: ['plane'] },{ ch: '🛳️', tags: ['ship'] },{ ch: '📱', tags: ['phone'] },
    { ch: '💻', tags: ['computer'] },{ ch: '🔒', tags: ['lock','secure'] },{ ch: '🔑', tags: ['key'] },{ ch: '📦', tags: ['box'] },
    { ch: '📢', tags: ['announce'] },{ ch: '💬', tags: ['chat'] },{ ch: '🖼️', tags: ['image'] },{ ch: '📷', tags: ['photo'] },
    { ch: '🎥', tags: ['video'] },{ ch: '🔔', tags: ['notify'] },{ ch: '⏰', tags: ['alarm'] },{ ch: '💡', tags: ['idea'] },
    { ch: '🔍', tags: ['search'] },{ ch: '📚', tags: ['books'] },{ ch: '📝', tags: ['note'] },{ ch: '📎', tags: ['attach'] },
    { ch: '🤝', tags: ['handshake'] },{ ch: '💯', tags: ['100'] },{ ch: '✅', tags: ['check'] },{ ch: '❌', tags: ['cross'] }
  ];

  // build a large unique emoji catalog (1200+) using Unicode emoji ranges
  const generateEmojiCatalog = (target = 1200) => {
    const ranges = [
      [0x1F300, 0x1F5FF], // Misc Symbols and Pictographs
      [0x1F600, 0x1F64F], // Emoticons
      [0x1F680, 0x1F6FF], // Transport and Map
      [0x1F700, 0x1F77F], // Alchemical Symbols (some emoji-like)
      [0x2600, 0x26FF],   // Misc symbols
      [0x2700, 0x27BF],   // Dingbats
      [0x1F900, 0x1F9FF]  // Supplemental Symbols and Pictographs
    ];

    const seen = new Set();
    // include baseEmojis first with their tags
    for (const e of baseEmojis) seen.add(e.ch);

    for (const [start, end] of ranges) {
      for (let cp = start; cp <= end && seen.size < target; cp++) {
        try {
          const ch = String.fromCodePoint(cp);
          // keep only characters recognized as Emoji (Unicode property)
          if (!/\p{Emoji}/u.test(ch)) continue;
          seen.add(ch);
        } catch (err) {
          // ignore invalid codepoints
        }
      }
      if (seen.size >= target) break;
    }

    // return as objects; preserve tags for baseEmojis, leave others with empty tags
    const baseTagMap = new Map(baseEmojis.map(b => [b.ch, b.tags]));
    return Array.from(seen).map(ch => ({ ch, tags: baseTagMap.get(ch) || [] }));
  };

  const emojiCatalog = generateEmojiCatalog(1200);

  const [emojiQuery, setEmojiQuery] = useState('');
  const emojiQueryNormalized = (emojiQuery || '').trim().toLowerCase();
  const emojiResults = emojiCatalog.filter(item => {
    if (!emojiQueryNormalized) return true;
    if ((item.ch || '').includes(emojiQueryNormalized)) return true;
    return (item.tags || []).join(' ').includes(emojiQueryNormalized);
  });

  const handleEmojiClick = (ch) => {
    addEmoji(ch);
    setShowEmoji(false);
  };

  return (
    <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {/* Emoji + GIF buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
          <button
            type="button"
            onClick={() => { setShowEmoji(v => !v); setShowGifs(false); }}
            title="Emoji"
            style={{
              background: showEmoji ? 'var(--color-surfaceHover)' : 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
          >😊</button>
          <button
            type="button"
            onClick={() => { setShowGifs(v => !v); setShowEmoji(false); }}
            title="GIF"
            style={{
              background: showGifs ? 'var(--color-surfaceHover)' : 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-primary)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
          >GIF</button>
        </div>

        {/* Input area */}
        <div style={{ position: 'relative', flex: 1 }}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            style={{
              resize: 'none',
              minHeight: 44,
              maxHeight: 120,
              width: '100%',
              padding: '10px 70px 10px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surfaceHover)',
              color: 'var(--color-text)',
              fontSize: 14,
              lineHeight: 1.5,
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />

          {/* Emoji picker */}
          {showEmoji && (
            <div style={{ position: 'absolute', left: 0, bottom: 52, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 10, zIndex: 60, width: 'min(340px, 90vw)', maxHeight: 320, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
              <input
                placeholder="Search emoji…"
                value={emojiQuery}
                onChange={e => setEmojiQuery(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surfaceHover)', color: 'var(--color-text)', fontSize: 13 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
                {emojiResults.slice(0, 320).map((it, idx) => (
                  <button key={it.ch + idx} onClick={() => handleEmojiClick(it.ch)}
                    style={{ fontSize: 20, padding: 5, background: 'transparent', border: 0, cursor: 'pointer', borderRadius: 6, transition: 'background 0.1s' }}
                    onMouseEnter={e => e.target.style.background = 'var(--color-surfaceHover)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                    aria-label={it.tags.join(',')}>{it.ch}</button>
                ))}
              </div>
            </div>
          )}

          {/* GIF picker */}
          {showGifs && (
            <div style={{ position: 'absolute', left: 0, bottom: 52, zIndex: 60 }}>
              <GifPicker onSelect={handleGifSelect} />
            </div>
          )}

          {/* char count */}
          <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: 'var(--color-textMuted)', pointerEvents: 'none' }}>
            {message.length}/1000
          </div>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim()}
          style={{
            padding: '0 16px',
            height: 44,
            borderRadius: 12,
            background: message.trim() ? 'var(--gradient-primary)' : 'var(--color-surfaceHover)',
            color: message.trim() ? 'white' : 'var(--color-textMuted)',
            border: 'none',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: 14,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          Send ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
