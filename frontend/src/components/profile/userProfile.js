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

/**
 * Página principal de perfil de usuario. Diseño tipo Facebook: portada, avatar, nombre, acciones, pestañas y dos columnas (sidebar + publicaciones).
 * Si hay userId en la ruta (/profile/:userId), muestra el perfil público de ese usuario; si no, el del usuario autenticado.
 */
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

    const handleDashboard = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleEditProfile = useCallback(() => {
        navigate('/settings');
    }, [navigate]);

    const handleEditDetails = useCallback(() => {
        navigate('/settings');
    }, [navigate]);

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
                <ProfileCover
                    coverPhotoUrl={profile?.coverPhotoUrl}
                    onEditCover={handleEditCover}
                    canEdit={isOwnProfile && !uploadingCover}
                />
                <div className="profile-header-content">
                    <ProfileAvatar
                        profilePhotoUrl={profile?.profilePhotoUrl}
                        firstName={profile?.firstName || auth?.firstName || ''}
                        lastName={profile?.lastName || auth?.lastName || ''}
                        onEditPhoto={handleEditPhoto}
                        canEdit={isOwnProfile && !uploadingAvatar}
                    />
                    <ProfileInfo
                        firstName={profile?.firstName || auth?.firstName || ''}
                        lastName={profile?.lastName || auth?.lastName || ''}
                        followersCount={profile?.followersCount ?? 0}
                        followingCount={profile?.followingCount ?? 0}
                        bio={profile?.bio}
                        isOwnProfile={isOwnProfile}
                        isFollowing={profile?.isFollowing}
                        onDashboard={isOwnProfile ? handleDashboard : undefined}
                        onFollow={!isOwnProfile ? handleFollow : undefined}
                        onUnfollow={!isOwnProfile ? handleUnfollow : undefined}
                        followLoading={followLoading}
                    />
                </div>
            </header>

            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Two columns: sidebar (left) + feed area (right) */}
            <div className="profile-layout">
                <ProfileSidebar
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    onEditDetails={handleEditDetails}
                />
                <main className="profile-main">
                    {/* Posts / Media gallery */}
                    {activeTab === 'all' || activeTab === 'photos' || activeTab === 'videos' ? (
                        <section className="profile-posts">
                            {postsLoading ? (
                                <p style={{ color: 'var(--fn-muted)' }}>Cargando publicaciones...</p>
                            ) : (() => {
                                // Filter posts according to active tab
                                const isVideoPost = (p) => {
                                    const url = p.multimediaUrl || '';
                                    return p.type === 'video' || /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url);
                                };
                                const filteredPosts = (posts || []).filter((p) => {
                                    if (activeTab === 'videos') return isVideoPost(p);
                                    if (activeTab === 'photos') return !isVideoPost(p);
                                    return true; // 'all'
                                });

                                if (filteredPosts.length === 0) {
                                    const emptyText = activeTab === 'videos' ? 'No hay videos publicados.' : activeTab === 'photos' ? 'No hay fotos publicadas.' : 'No hay fotos o videos publicados.';
                                    return <p style={{ color: 'var(--fn-muted)' }}>{emptyText}</p>;
                                }

                                return (
                                    <div className="posts-grid">
                                        {filteredPosts.map((p) => (
                                            <div key={p._id} className="post-thumb">
                                                <img
                                                    src={p.thumbnailUrl || p.multimediaUrl}
                                                    alt={p.description || ''}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </section>
                    ) : null}

                    {activeTab === 'about' ? (
                        <ProfileContactInfo
                            firstName={profile?.firstName || auth?.firstName || ''}
                            lastName={profile?.lastName || auth?.lastName || ''}
                            email={isOwnProfile ? auth?.email || profile?.email : profile?.email}
                            phone={profile?.phone || profile?.phoneNumber}
                            isOwnProfile={isOwnProfile}
                            onEditProfile={isOwnProfile ? handleEditProfile : undefined}
                        />
                    ) : null}
                </main>
            </div>
        </div>
    );
}
