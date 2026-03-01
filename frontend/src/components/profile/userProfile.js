import React, { useState, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProfile from '../../hooks/useProfile';
import { AuthContext } from '../../hooks/AuthContext';
import ProfileCover from './ProfileCover';
import ProfileAvatar from './ProfileAvatar';
import ProfileInfo from './ProfileInfo';
import ProfileTabs from './ProfileTabs';
import ProfileSidebar from './ProfileSidebar';
import ProfilePostBox from './ProfilePostBox';

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
                        firstName={profile?.firstName}
                        lastName={profile?.lastName}
                        onEditPhoto={handleEditPhoto}
                        canEdit={isOwnProfile && !uploadingAvatar}
                    />
                    <ProfileInfo
                        firstName={profile?.firstName}
                        lastName={profile?.lastName}
                        followersCount={profile?.followersCount ?? 0}
                        followingCount={profile?.followingCount ?? 0}
                        bio={profile?.bio}
                        isOwnProfile={isOwnProfile}
                        isFollowing={profile?.isFollowing}
                        onDashboard={isOwnProfile ? handleDashboard : undefined}
                        onEditProfile={isOwnProfile ? handleEditProfile : undefined}
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
                    {isOwnProfile && (
                        <ProfilePostBox profile={profile} onCompose={() => navigate('/feed')} />
                    )}
                    <section className="profile-feed-section mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold" style={{ color: 'var(--fn-text)' }}>
                                Publicaciones
                            </h2>
                            {isOwnProfile && (
                                <div className="flex gap-2">
                                    <button type="button" className="profile-tab profile-tab-active text-sm">
                                        Lista
                                    </button>
                                    <button type="button" className="profile-tab text-sm">
                                        Cuadrícula
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--fn-muted)' }}>
                            {isOwnProfile
                                ? 'Tus publicaciones aparecerán aquí. Crea una desde el feed.'
                                : 'Las publicaciones de este usuario aparecerán aquí.'}
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
}
