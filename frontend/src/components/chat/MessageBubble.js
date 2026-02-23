import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiOrigin } from '../../api/http';

/** Formats a message timestamp to HH:MM. */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Formats seconds to M:SS */
const fmtDuration = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

/** Returns a status icon based on message delivery status. */
const StatusIcon = ({ status }) => {
  if (status === 'read')      return <span className="status-icon read">✓✓</span>;
  if (status === 'delivered') return <span className="status-icon delivered">✓✓</span>;
  return <span className="status-icon sent">✓</span>;
};

/* ─── SVG Icons ─────────────────────────────────────────────────── */
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
    <path d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2z"/>
  </svg>
);

/* ─── Waveform bars (decorative, animated while playing) ─────────── */
const BARS = 28;
const BAR_HEIGHTS = Array.from({ length: BARS }, (_, i) => {
  // pseudo-random heights that look like a voice waveform
  const seed = (i * 7 + 3) % 17;
  return 20 + seed * 4;
});

function WaveformBars({ pct, playing, isOwn }) {
  const filled = Math.round((pct / 100) * BARS);
  return (
    <div className="iap-waveform">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={`iap-bar${i < filled ? ' filled' : ''}${playing && i >= filled ? ' anim' : ''}`}
          style={{
            height: h + '%',
            animationDelay: `${(i % 6) * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Telegram-style Audio Player ───────────────────────────────── */
function InlineAudioPlayer({ src, isOwn }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime   = () => setProgress(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration   || 0);
    const onEnded  = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended',          onEnded);
    return () => {
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended',          onEnded);
    };
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) { audio.pause(); setPlaying(false); }
      else         { await audio.play(); setPlaying(true); }
    } catch (_) {}
  };

  /* Click on progress bar to seek */
  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setProgress(audio.currentTime);
  }, [duration]);

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
  const timeLeft = duration > 0 ? fmtDuration(duration - progress) : fmtDuration(duration);

  return (
    <div className={`tg-audio ${isOwn ? 'own' : 'other'}`}>
      {/* Play / Pause button */}
      <button className="tg-audio-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      {/* Waveform + scrubber */}
      <div className="tg-audio-body">
        <div className="tg-audio-waveform-wrap" onClick={handleSeek} style={{ cursor: 'pointer' }}>
          <WaveformBars pct={pct} playing={playing} isOwn={isOwn} />
        </div>
        <div className="tg-audio-footer">
          <span className="tg-audio-mic"><MicIcon /></span>
          <span className="tg-audio-time">{playing ? timeLeft : fmtDuration(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

/* ─── Telegram-style Video Player ───────────────────────────────── */
function InlineVideoPlayer({ src, isOwn }) {
  const videoRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered]   = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration || 0);
    const onTime   = () => setProgress(v.currentTime || 0);
    const onEnded  = () => { setPlaying(false); setProgress(0); };
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate',     onTime);
    v.addEventListener('ended',          onEnded);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate',     onTime);
      v.removeEventListener('ended',          onEnded);
    };
  }, [src]);

  const toggle = async (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    try {
      if (playing) { v.pause(); setPlaying(false); }
      else         { await v.play(); setPlaying(true); }
    } catch (_) {}
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const remaining = duration > 0 ? fmtDuration(duration - progress) : fmtDuration(duration);

  return (
    <div
      className={`tg-video ${isOwn ? 'own' : 'other'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="tg-video-el"
        playsInline
        preload="metadata"
      />

      {/* Overlay: play button + gradient */}
      <div className={`tg-video-overlay${playing && !hovered ? ' hidden' : ''}`} onClick={toggle}>
        <div className="tg-video-play-btn">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </div>
      </div>

      {/* Duration badge */}
      <div className="tg-video-badge">
        {playing ? remaining : fmtDuration(duration)}
      </div>

      {/* Bottom progress bar */}
      <div className="tg-video-progress-wrap">
        <div className="tg-video-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Processing placeholder ────────────────────────────────────── */
function ProcessingBubble({ label }) {
  return (
    <div className="msg-processing">
      <div className="msg-processing-spinner" />
      <span>{label}</span>
    </div>
  );
}

/* ─── Main MessageBubble ─────────────────────────────────────────── */
export default function MessageBubble({ message, isOwn, showTail = true }) {
  const { content, type, status, createdAt, multimediaUrl } = message;

  const resolveUrl = (u) => {
    if (!u) return null;
    return u.startsWith('/') ? apiOrigin + u : u;
  };

  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <>
            {multimediaUrl
              ? <img src={resolveUrl(multimediaUrl)} alt="shared" className="msg-media msg-image" />
              : <ProcessingBubble label={message.multimediaStatus === 'processing' ? 'Enviando imagen…' : 'Imagen'} />
            }
            {content && <div className="msg-text">{content}</div>}
          </>
        );

      case 'video':
        return (
          <>
            {multimediaUrl
              ? <InlineVideoPlayer src={resolveUrl(multimediaUrl)} isOwn={isOwn} />
              : <ProcessingBubble label={message.multimediaStatus === 'processing' ? 'Procesando video…' : 'Video'} />
            }
            {content && <div className="msg-text" style={{ marginTop: 6 }}>{content}</div>}
          </>
        );

      case 'audio':
        return (
          <>
            {multimediaUrl
              ? <InlineAudioPlayer src={resolveUrl(multimediaUrl)} isOwn={isOwn} />
              : <ProcessingBubble label={message.multimediaStatus === 'processing' ? 'Procesando audio…' : 'Audio'} />
            }
            {content && <div className="msg-text" style={{ marginTop: 4 }}>{content}</div>}
          </>
        );

      default:
        return <div className="msg-text">{content}</div>;
    }
  };

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'} ${showTail ? 'tail' : ''}`}>
      <div className={`message-bubble ${isOwn ? 'own' : 'other'} type-${type || 'text'}`}>
        {renderContent()}

        <div className="message-meta">
          <span className="message-time">{formatTime(createdAt)}</span>
          {isOwn && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  );
}