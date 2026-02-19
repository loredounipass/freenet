import React, { useState, useRef, useEffect } from 'react';
import { apiOrigin } from '../../api/http';


/**
 * Formats a message timestamp to HH:MM.
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Returns a status icon based on message delivery status.
 */
const StatusIcon = ({ status }) => {
  if (status === 'read') return <span className="status-icon read">✓✓</span>;
  if (status === 'delivered') return <span className="status-icon delivered">✓✓</span>;
  return <span className="status-icon sent">✓</span>;
};

/**
 * InlineAudioPlayer - small WhatsApp-like audio player
 * Props: { src, isOwn }
 */
function InlineAudioPlayer({ src, isOwn }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch (_) {
      // autoplay errors can be ignored
    }
  };

  const pct = duration > 0 ? Math.min(100, Math.round((progress / duration) * 100)) : 0;

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className={`inline-audio-player ${isOwn ? 'own' : 'other'}`}>
      <button className="iap-playbtn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '►'}</button>
      <div className="iap-track">
        <div className="iap-progress" style={{ width: `${pct}%` }} />
      </div>
      <div className="iap-time">{fmt(progress)} / {fmt(duration)}</div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

/**
 * MessageBubble - Renders a single chat message bubble.
 *
 * Props:
 *  - message: { _id, content, type, sender, receiver, status, createdAt, multimediaUrl }
 *  - isOwn: boolean - whether the current user sent this message
 *  - showTail: boolean - whether to show the bubble tail (first message in a group)
 */
export default function MessageBubble({ message, isOwn, showTail = true }) {
  const { content, type, status, createdAt, multimediaUrl } = message;

  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <div>
            {multimediaUrl ? (
              <img src={multimediaUrl.startsWith('/') ? (apiOrigin + multimediaUrl) : multimediaUrl} alt="shared" className="msg-media msg-image" />
            ) : (
              // show placeholder while processing or when no url yet
              <div className="msg-media-placeholder">{message.multimediaStatus === 'processing' ? 'Enviando...' : 'Imagen'}</div>
            )}
            {content && (
              <div className="msg-text" style={{ color: isOwn ? '#fff' : '#333' }}>{content}</div>
            )}
          </div>
        );

      case 'video':
        return (
          <div>
            {multimediaUrl ? (
              <video src={multimediaUrl.startsWith('/') ? (apiOrigin + multimediaUrl) : multimediaUrl} controls className="msg-media msg-video" />
            ) : (
              <div className="msg-media-placeholder">{message.multimediaStatus === 'processing' ? 'Procesando video...' : 'Video'}</div>
            )}
            {content && (
              <div className="msg-text" style={{ color: isOwn ? '#fff' : '#333' }}>{content}</div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div>
            {multimediaUrl ? (
              <InlineAudioPlayer src={multimediaUrl.startsWith('/') ? (apiOrigin + multimediaUrl) : multimediaUrl} isOwn={isOwn} />
            ) : (
              <div className="msg-media-placeholder">{message.multimediaStatus === 'processing' ? 'Procesando audio...' : 'Audio'}</div>
            )}
            {content && (
              <div className="msg-text" style={{ color: isOwn ? '#fff' : '#333' }}>{content}</div>
            )}
          </div>
        );

      default:
        return <div className="msg-text" style={{ color: isOwn ? '#fff' : '#333' }}>{content}</div>;
    }
  };

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'} ${showTail ? 'tail' : ''}`}>
      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        {renderContent()}

        <div className="message-meta">
          <span className="message-time">{formatTime(createdAt)}</span>
          {isOwn && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  );
}