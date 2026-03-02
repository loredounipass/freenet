import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiOrigin } from '../../api/http';

/* ── helpers ── */
function formatCount(n) {
    if (!n || n === 0) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function resolveUrl(u) {
    if (!u) return null;
    try {
        if (/^https?:\/\//i.test(u)) return u;
        if (u.startsWith('/')) return `${apiOrigin}${u}`;
        return u;
    } catch (_) { return u; }
}

function isVideoPost(p) {
    const url = p?.multimediaUrl || '';
    return p?.type === 'video' || /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url);
}

/* ── Fullscreen Video Player (TikTok style) ── */
function FullscreenVideoPlayer({ videos, startIndex, onClose }) {
    const [activeIndex, setActiveIndex] = useState(startIndex);
    const scrollRef = useRef(null);
    const cardRefs = useRef([]);

    // Scroll to active index
    useEffect(() => {
        const el = cardRefs.current[activeIndex];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [activeIndex]);

    // Intersection observer
    useEffect(() => {
        const options = { root: scrollRef.current, threshold: 0.6 };
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const idx = cardRefs.current.indexOf(entry.target);
                    if (idx !== -1) setActiveIndex(idx);
                }
            });
        }, options);

        cardRefs.current.forEach((el) => { if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, [videos]);

    // Keyboard nav
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, videos.length - 1));
            if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [videos.length, onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="pvg-fullscreen-overlay">
            {/* Close button */}
            <button className="pvg-close-btn" onClick={onClose} title="Cerrar">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Video scroll */}
            <div className="pvg-scroll" ref={scrollRef}>
                {videos.map((video, idx) => (
                    <div
                        key={video._id}
                        className="pvg-card-wrapper"
                        ref={(el) => { cardRefs.current[idx] = el; }}
                    >
                        <FullscreenVideoCard
                            post={video}
                            isActive={idx === activeIndex}
                        />
                    </div>
                ))}
            </div>

            {/* Nav arrows */}
            {videos.length > 1 && (
                <div className="pvg-nav-arrows">
                    <button
                        className="pvg-arrow-btn"
                        disabled={activeIndex === 0}
                        onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
                        aria-label="Video anterior"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </button>
                    <button
                        className="pvg-arrow-btn"
                        disabled={activeIndex === videos.length - 1}
                        onClick={() => setActiveIndex((i) => Math.min(i + 1, videos.length - 1))}
                        aria-label="Siguiente video"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Counter */}
            <div className="pvg-counter">
                {activeIndex + 1} / {videos.length}
            </div>
        </div>
    );
}

/* ── Single Fullscreen Video Card ── */
function FullscreenVideoCard({ post, isActive }) {
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const controlsTimerRef = useRef(null);

    // Auto play/pause based on visibility
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (isActive) {
            video.play().catch(() => {});
            setPlaying(true);
        } else {
            video.pause();
            setPlaying(false);
        }
    }, [isActive]);

    const hideControlsSoon = useCallback(() => {
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    }, []);

    useEffect(() => {
        if (isActive && playing) hideControlsSoon();
        return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
    }, [isActive, playing, hideControlsSoon]);

    const handleVideoClick = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        setShowControls(true);
        if (video.paused) {
            video.play().catch(() => {});
            setPlaying(true);
        } else {
            video.pause();
            setPlaying(false);
        }
        hideControlsSoon();
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        setProgress((video.currentTime / video.duration) * 100);
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video || !video.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        video.currentTime = pct * video.duration;
        setProgress(pct * 100);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
    };

    if (!post) return null;
    const mediaUrl = resolveUrl(post.multimediaUrl) || resolveUrl(post.thumbnailUrl);
    if (!mediaUrl) return null;

    const displayName = (post.authorFirstName || post.authorLastName)
        ? `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim()
        : 'Usuario';

    return (
        <div
            className="pvg-fs-card"
            onClick={handleVideoClick}
            onMouseMove={() => { setShowControls(true); hideControlsSoon(); }}
        >
            <video
                ref={videoRef}
                className="pvg-fs-video"
                src={mediaUrl}
                poster={resolveUrl(post.thumbnailUrl)}
                muted={muted}
                loop
                playsInline
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
            />

            {/* Gradient overlays */}
            <div className="pvg-overlay-top" />
            <div className="pvg-overlay-bottom" />

            {/* Play/pause indicator */}
            <div className={`pvg-play-indicator ${showControls ? 'pvg-controls-visible' : ''}`}>
                {!playing && (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.85">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </div>

            {/* Progress bar */}
            <div
                className={`pvg-progress-wrap ${showControls ? 'pvg-controls-visible' : ''}`}
                onClick={handleSeek}
            >
                <div className="pvg-progress-track">
                    <div className="pvg-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Top controls */}
            <div className={`pvg-top-controls ${showControls ? 'pvg-controls-visible' : ''}`}>
                {duration > 0 && (
                    <span className="pvg-duration">
                        {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                    </span>
                )}
                <button className="pvg-mute-btn" onClick={toggleMute} title={muted ? 'Activar sonido' : 'Silenciar'}>
                    {muted ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Bottom info */}
            <div className="pvg-info" onClick={(e) => e.stopPropagation()}>
                <div className="pvg-author-row">
                    <span className="pvg-author-name">{displayName}</span>
                    <span className="pvg-time">{timeAgo(post.createdAt)}</span>
                </div>
                {post.description && <p className="pvg-description">{post.description}</p>}
                <div className="pvg-stats-row">
                    {post.likesCount > 0 && (
                        <span className="pvg-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--fn-teal)">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            {formatCount(post.likesCount)}
                        </span>
                    )}
                    {post.views > 0 && (
                        <span className="pvg-stat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fn-muted)" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                            {formatCount(post.views)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Main ProfileVideoGrid ── */
export default function ProfileVideoGrid({ posts = [], loading = false }) {
    const [selectedIndex, setSelectedIndex] = useState(null);

    const videoPosts = (posts || []).filter(isVideoPost);

    if (loading) {
        return (
            <div className="pvg-loading">
                <div className="pvg-loading-spinner" />
                <span>Cargando videos...</span>
            </div>
        );
    }

    if (videoPosts.length === 0) {
        return (
            <div className="pvg-empty">
                <div className="pvg-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--fn-muted)" strokeWidth="1.5">
                        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                </div>
                <p className="pvg-empty-text">No hay videos publicados.</p>
            </div>
        );
    }

    return (
        <>
            <div className="pvg-grid">
                {videoPosts.map((post, idx) => (
                    <VideoThumb
                        key={post._id}
                        post={post}
                        onClick={() => setSelectedIndex(idx)}
                    />
                ))}
            </div>

            {selectedIndex !== null && (
                <FullscreenVideoPlayer
                    videos={videoPosts}
                    startIndex={selectedIndex}
                    onClose={() => setSelectedIndex(null)}
                />
            )}
        </>
    );
}

/* ── Single Video Thumbnail (TikTok grid card) ── */
function VideoThumb({ post, onClick }) {
    const videoRef = useRef(null);
    const [hovered, setHovered] = useState(false);

    const mediaUrl = resolveUrl(post.multimediaUrl) || resolveUrl(post.thumbnailUrl);

    const handleMouseEnter = () => {
        setHovered(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
        }
    };

    const handleMouseLeave = () => {
        setHovered(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <div
            className="pvg-thumb"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                className="pvg-thumb-video"
                src={mediaUrl}
                poster={resolveUrl(post.thumbnailUrl)}
                muted
                playsInline
                preload="metadata"
                loop
            />

            {/* Play icon overlay */}
            <div className={`pvg-thumb-overlay ${hovered ? 'pvg-thumb-overlay-hover' : ''}`}>
                {!hovered && (
                    <svg className="pvg-thumb-play" width="32" height="32" viewBox="0 0 24 24" fill="white" opacity="0.9">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </div>

            {/* Bottom stats */}
            <div className="pvg-thumb-stats">
                {post.views > 0 && (
                    <span className="pvg-thumb-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        {formatCount(post.views)}
                    </span>
                )}
                {post.likesCount > 0 && (
                    <span className="pvg-thumb-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {formatCount(post.likesCount)}
                    </span>
                )}
            </div>

            {/* Duration badge */}
            {post.duration && (
                <span className="pvg-thumb-duration">
                    {Math.floor(post.duration / 60)}:{String(Math.floor(post.duration % 60)).padStart(2, '0')}
                </span>
            )}
        </div>
    );
}
