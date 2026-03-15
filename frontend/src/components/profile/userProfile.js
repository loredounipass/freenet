import React, { useState, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProfile from '../../hooks/useProfile';
import { AuthContext } from '../../hooks/AuthContext';
import ProfileCover from './ProfileCover';
import ProfileAvatar from './ProfileAvatar';
import ProfileInfo from './ProfileInfo';
import ProfileContactInfo from './ProfileContactInfo';
import ProfileTabs from './ProfileTabs';
import ProfileSidebar from './ProfileSidebar';
import ProfileVideoGrid from './ProfileVideoGrid';
import { apiOrigin } from '../../api/http';

/**
 * Página principal de perfil de usuario. Diseño tipo Facebook: portada, avatar, nombre, acciones, pestañas y dos columnas (sidebar + publicaciones).
 * Si hay userId en la ruta (/profile/:userId), muestra el perfil público de ese usuario; si no, el del usuario autenticado.
 */

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

export default function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const {
        profile,
        loading,
        error,
        refetch,
        uploadProfilePhoto,
        uploadCoverPhoto,
        follow,
        unfollow,
        isOwnProfile,
        posts,
        postsLoading,
    } = useProfile({ userId: userId || undefined });

    const [activeTab, setActiveTab] = useState('all');
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const handleEditCover = useCallback(async (file) => {
        setUploadingCover(true);
        try {
            await uploadCoverPhoto(file);
            refetch();
        } catch (err) {
            console.error('Error subiendo portada:', err);
        } finally {
            setUploadingCover(false);
        }
    }, [uploadCoverPhoto, refetch]);

    const handleEditPhoto = useCallback(async (file) => {
        setUploadingAvatar(true);
        try {
            await uploadProfilePhoto(file);
            refetch();
        } catch (err) {
            console.error('Error subiendo foto de perfil:', err);
        } finally {
            setUploadingAvatar(false);
        }
    }, [uploadProfilePhoto, refetch]);

    const handleEditProfile = useCallback(() => {
        navigate('/settings');
    }, [navigate]);

    const handleEditDetails = useCallback(() => {
        navigate('/settings');
    }, [navigate]);

    // Navigate to chat with this user
    const handleMessage = useCallback(() => {
        if (userId) navigate(`/chat/${userId}`);
    }, [navigate, userId]);

    const handleFollow = useCallback(async () => {
        setFollowLoading(true);
        try {
            await follow();
        } catch (err) {
            console.error('Error al seguir:', err);
        } finally {
            setFollowLoading(false);
        }
    }, [follow]);

    const handleUnfollow = useCallback(async () => {
        setFollowLoading(true);
        try {
            await unfollow();
        } catch (err) {
            console.error('Error al dejar de seguir:', err);
        } finally {
            setFollowLoading(false);
        }
    }, [unfollow]);

    const photoPosts = (posts || []).filter((p) => !isVideoPost(p));

    if (loading) {
        return (
            <div className="profile-page flex items-center justify-center min-h-[50vh]" style={{ background: 'var(--fn-dark)' }}>
                <p className="text-lg" style={{ color: 'var(--fn-muted)' }}>Cargando perfil...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-page flex flex-col items-center justify-center min-h-[50vh] gap-4" style={{ background: 'var(--fn-dark)' }}>
                <p className="text-lg" style={{ color: 'var(--fn-text)' }}>
                    {error?.response?.status === 404 ? 'Perfil no encontrado.' : 'Error al cargar el perfil.'}
                </p>
                {isOwnProfile && (
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="profile-btn-primary"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Header: cover + avatar + info + actions */}
            <header className="profile-header">
                {/* Cover photo wrapper — adds side padding and rounds bottom corners */}
                <div className="profile-cover-wrapper">
                    <ProfileCover
                        coverPhotoUrl={profile?.coverPhotoUrl}
                        onEditCover={handleEditCover}
                        canEdit={isOwnProfile && !uploadingCover}
                    />
                </div>
                {/* Full-width background bar — content inside is max-width centered */}
                <div className="profile-header-content-bar">
                    <div className="profile-header-content">
                        <ProfileAvatar
                            profilePhotoUrl={profile?.profilePhotoUrl}
                            firstName={profile?.firstName || (isOwnProfile ? auth?.firstName : '') || ''}
                            lastName={profile?.lastName || (isOwnProfile ? auth?.lastName : '') || ''}
                            onEditPhoto={handleEditPhoto}
                            canEdit={isOwnProfile && !uploadingAvatar}
                        />
                        <ProfileInfo
                            firstName={profile?.firstName || (isOwnProfile ? auth?.firstName : '') || ''}
                            lastName={profile?.lastName || (isOwnProfile ? auth?.lastName : '') || ''}
                            followersCount={profile?.followersCount ?? 0}
                            followingCount={profile?.followingCount ?? 0}
                            likes={profile?.likes ?? 0}
                            bio={profile?.bio}
                            gender={profile?.gender}
                            relationshipStatus={profile?.relationshipStatus}
                            interests={profile?.interests || []}
                            links={profile?.links || []}
                            isOwnProfile={isOwnProfile}
                            isFollowing={profile?.isFollowing}
                            profileId={profile?.owner || userId}
                            onEditProfile={isOwnProfile ? handleEditProfile : undefined}
                            onFollow={!isOwnProfile ? handleFollow : undefined}
                            onUnfollow={!isOwnProfile ? handleUnfollow : undefined}
                            followLoading={followLoading}
                            onMessage={!isOwnProfile ? handleMessage : undefined}
                        />
                    </div>
                </div>
            </header>

            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* ── Información tab: sidebar + contact ── */}
            {activeTab === 'about' ? (
                <div className="profile-layout">
                    <ProfileSidebar
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                        onEditDetails={handleEditDetails}
                    />
                    <main className="profile-main">
                        <ProfileContactInfo
                            firstName={profile?.firstName || (isOwnProfile ? auth?.firstName : '') || ''}
                            lastName={profile?.lastName || (isOwnProfile ? auth?.lastName : '') || ''}
                            email={isOwnProfile ? auth?.email || profile?.email : profile?.email}
                            phone={profile?.phone || profile?.phoneNumber}
                            isOwnProfile={isOwnProfile}
                            onEditProfile={isOwnProfile ? handleEditProfile : undefined}
                        />
                    </main>
                </div>
            ) : (
                /* ── Media tabs (Todo / Videos / Fotos): full-width TikTok layout ── */
                <div className="pvg-full-video-page">
                    <div className="pvg-full-video-inner">
                        {postsLoading ? (
                            <div className="pvg-loading">
                                <div className="pvg-loading-spinner" />
                                <span>Cargando publicaciones...</span>
                            </div>
                        ) : (
                            <>
                                {/* ── TODO: grid mixto ordenado por fecha ── */}
                                {activeTab === 'all' && (() => {
                                    // Only show posts that have image or video (exclude text-only posts)
                                    const allSorted = [...(posts || [])]
                                        .filter((p) => p.multimediaUrl || p.thumbnailUrl)
                                        .sort(
                                            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                                        );
                                    if (allSorted.length === 0) {
                                        return (
                                            <div className="pvg-empty">
                                                <div className="pvg-empty-icon">
                                                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--fn-muted)" strokeWidth="1.2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                                    </svg>
                                                </div>
                                                <p className="pvg-empty-text">No hay publicaciones todavía.</p>
                                            </div>
                                        );
                                    }
                                    // Extract just the video items to pass their index into the fullscreen player
                                    const videoItems = allSorted.filter(isVideoPost);
                                    return (
                                        <MixedGrid
                                            items={allSorted}
                                            videoItems={videoItems}
                                            resolveUrl={resolveUrl}
                                        />
                                    );
                                })()}

                                {/* ── VIDEOS tab: TikTok grid ── */}
                                {activeTab === 'videos' && (
                                    <ProfileVideoGrid posts={posts} />
                                )}

                                {/* ── FOTOS tab ── */}
                                {activeTab === 'photos' && (() => {
                                    if (photoPosts.length === 0) {
                                        return (
                                            <div className="pvg-empty">
                                                <div className="pvg-empty-icon">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--fn-muted)" strokeWidth="1.5">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                                    </svg>
                                                </div>
                                                <p className="pvg-empty-text">No hay fotos publicadas.</p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="pvg-photos-grid">
                                            {[...photoPosts]
                                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                .map((p) => (
                                                    <div key={p._id} className="pvg-photo-thumb">
                                                        <img
                                                            src={resolveUrl(p.thumbnailUrl || p.multimediaUrl)}
                                                            alt={p.description || ''}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Mixed grid: videos + photos interleaved, sorted by date ── */
function MixedGrid({ items, videoItems, resolveUrl }) {
    const [selectedVideoIndex, setSelectedVideoIndex] = React.useState(null);

    return (
        <>
            <div className="pvg-grid">
                {items.map((post) => {
                    if (isVideoPost(post)) {
                        // Find this video's index within the video-only list (for fullscreen player)
                        const vidIdx = videoItems.findIndex((v) => v._id === post._id);
                        return (
                            <MixedVideoThumb
                                key={post._id}
                                post={post}
                                onClick={() => setSelectedVideoIndex(vidIdx)}
                                resolveUrl={resolveUrl}
                            />
                        );
                    }
                    return (
                        <div key={post._id} className="pvg-thumb" style={{ cursor: 'default' }}>
                            <img
                                src={resolveUrl(post.thumbnailUrl || post.multimediaUrl)}
                                alt={post.description || ''}
                                loading="lazy"
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {/* Photo indicator badge */}
                            <div className="pvg-thumb-overlay" style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.45) 0%,transparent 50%)' }} />
                            <div className="pvg-thumb-stats">
                                {post.likesCount > 0 && (
                                    <span className="pvg-thumb-stat">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        {fmtCount(post.likesCount)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Fullscreen player for videos clicked from the mixed grid */}
            {selectedVideoIndex !== null && (
                <FullscreenPlayerFromGrid
                    videos={videoItems}
                    startIndex={selectedVideoIndex}
                    onClose={() => setSelectedVideoIndex(null)}
                />
            )}
        </>
    );
}

/* ── Video thumb inside the mixed grid ── */
function MixedVideoThumb({ post, onClick, resolveUrl }) {
    const videoRef = React.useRef(null);
    const [hovered, setHovered] = React.useState(false);
    const mediaUrl = resolveUrl(post.multimediaUrl) || resolveUrl(post.thumbnailUrl);

    return (
        <div
            className="pvg-thumb"
            onClick={onClick}
            onMouseEnter={() => {
                setHovered(true);
                if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }
            }}
            onMouseLeave={() => {
                setHovered(false);
                if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
            }}
        >
            <video
                ref={videoRef}
                className="pvg-thumb-video"
                src={mediaUrl}
                poster={resolveUrl(post.thumbnailUrl)}
                muted playsInline preload="metadata" loop
            />
            <div className={`pvg-thumb-overlay ${hovered ? 'pvg-thumb-overlay-hover' : ''}`}>
                {!hovered && (
                    <svg className="pvg-thumb-play" width="28" height="28" viewBox="0 0 24 24" fill="white" opacity="0.9">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </div>
            <div className="pvg-thumb-stats">
                {post.views > 0 && (
                    <span className="pvg-thumb-stat">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                        {fmtCount(post.views)}
                    </span>
                )}
            </div>
            {post.duration && (
                <span className="pvg-thumb-duration">
                    {Math.floor(post.duration / 60)}:{String(Math.floor(post.duration % 60)).padStart(2, '0')}
                </span>
            )}
        </div>
    );
}

function fmtCount(n) {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

/* Thin wrapper: reuse the FullscreenVideoPlayer from ProfileVideoGrid via a small inline copy */
function FullscreenPlayerFromGrid({ videos, startIndex, onClose }) {
    // We delegate fully to ProfileVideoGrid by rendering it with a pre-selected index trick.
    // Simplest: just import and call the component directly from ProfileVideoGrid.
    // Since we can't easily re-export the internal component, we use ProfileVideoGrid in a
    // "videos-only" mode with a synthetic click. Instead, we inline a minimal player here.
    const [activeIndex, setActiveIndex] = React.useState(startIndex);
    const scrollRef = React.useRef(null);
    const cardRefs = React.useRef([]);

    React.useEffect(() => {
        const el = cardRefs.current[activeIndex];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [activeIndex]);

    React.useEffect(() => {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    const idx = cardRefs.current.indexOf(e.target);
                    if (idx !== -1) setActiveIndex(idx);
                }
            });
        }, { root: scrollRef.current, threshold: 0.6 });
        cardRefs.current.forEach((el) => { if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, [videos]);

    React.useEffect(() => {
        const h = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, videos.length - 1));
            if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [videos.length, onClose]);

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Re-use the ProfileVideoGrid by passing a single-item trick won't work cleanly.
    // We render this lightweight fullscreen player inline.
    return (
        <div className="pvg-fullscreen-overlay">
            <button className="pvg-close-btn" onClick={onClose} title="Cerrar">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
            <div className="pvg-counter">{activeIndex + 1} / {videos.length}</div>
            <div className="pvg-scroll" ref={scrollRef}>
                {videos.map((video, idx) => (
                    <div key={video._id} className="pvg-card-wrapper" ref={(el) => { cardRefs.current[idx] = el; }}>
                        <InlineVideoCard post={video} isActive={idx === activeIndex} />
                    </div>
                ))}
            </div>
            {videos.length > 1 && (
                <div className="pvg-nav-arrows">
                    <button className="pvg-arrow-btn" disabled={activeIndex === 0} onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                    </button>
                    <button className="pvg-arrow-btn" disabled={activeIndex === videos.length - 1} onClick={() => setActiveIndex((i) => Math.min(i + 1, videos.length - 1))}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

function InlineVideoCard({ post, isActive }) {
    const videoRef = React.useRef(null);
    const [playing, setPlaying] = React.useState(false);
    const [muted, setMuted] = React.useState(true);
    const [progress, setProgress] = React.useState(0);
    const [showControls, setShowControls] = React.useState(true);
    const timer = React.useRef(null);

    React.useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (isActive) { v.play().catch(() => {}); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
    }, [isActive]);

    const hide = React.useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setShowControls(false), 2500);
    }, []);

    const handleClick = (e) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        setShowControls(true);
        if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
        hide();
    };

    const apiOriginLocal = (() => { try { return new URL('http://localhost:4000/secure/api').origin; } catch (_) { return 'http://localhost:4000'; } })();
    const resolveUrl = (u) => {
        if (!u) return null;
        if (/^https?:\/\//i.test(u)) return u;
        if (u.startsWith('/')) return `${apiOriginLocal}${u}`;
        return u;
    };
    const src = resolveUrl(post.multimediaUrl) || resolveUrl(post.thumbnailUrl);

    return (
        <div className="pvg-fs-card" onClick={handleClick} onMouseMove={() => { setShowControls(true); hide(); }}>
            <video ref={videoRef} className="pvg-fs-video" src={src} poster={resolveUrl(post.thumbnailUrl)}
                muted={muted} loop playsInline preload="metadata"
                onTimeUpdate={() => { const v = videoRef.current; if (v?.duration) setProgress((v.currentTime / v.duration) * 100); }}
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            />
            <div className="pvg-overlay-top" /><div className="pvg-overlay-bottom" />
            <div className={`pvg-play-indicator ${showControls ? 'pvg-controls-visible' : ''}`}>
                {!playing && <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.85"><path d="M8 5v14l11-7z" /></svg>}
            </div>
            <div className={`pvg-progress-wrap ${showControls ? 'pvg-controls-visible' : ''}`}
                onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (!v?.duration) return; const r = e.currentTarget.getBoundingClientRect(); v.currentTime = ((e.clientX - r.left) / r.width) * v.duration; }}>
                <div className="pvg-progress-track"><div className="pvg-progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
            <div className={`pvg-top-controls ${showControls ? 'pvg-controls-visible' : ''}`}>
                <button className="pvg-mute-btn" onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }}>
                    {muted
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                    }
                </button>
            </div>
            <div className="pvg-info" onClick={(e) => e.stopPropagation()}>
                <div className="pvg-author-row">
                    <span className="pvg-author-name">{[post.authorFirstName, post.authorLastName].filter(Boolean).join(' ') || 'Usuario'}</span>
                </div>
                {post.description && <p className="pvg-description">{post.description}</p>}
                <div className="pvg-stats-row">
                    {post.likesCount > 0 && <span className="pvg-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="var(--fn-teal)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>{fmtCount(post.likesCount)}</span>}
                    {post.views > 0 && <span className="pvg-stat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fn-muted)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>{fmtCount(post.views)}</span>}
                </div>
            </div>
        </div>
    );
}
