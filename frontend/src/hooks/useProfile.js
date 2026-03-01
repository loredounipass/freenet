import { useState, useEffect, useCallback } from 'react';
import * as profileService from '../services/profile';

/**
 * Hook para cargar y gestionar el perfil del usuario autenticado.
 * Opcionalmente puede cargar un perfil por ID (vista pública de otro usuario).
 * @param {{ userId?: string }} options - Si se pasa userId, se carga ese perfil (público); si no, el propio (me).
 */
export default function useProfile(options = {}) {
    const { userId: viewUserId } = options;
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = viewUserId
                ? await profileService.getProfileById(viewUserId)
                : await profileService.getMyProfile();
            const data = res?.data ?? res;
            if (viewUserId && data) {
                try {
                    const statusRes = await profileService.getFollowStatus(viewUserId);
                    const following = (statusRes?.data ?? statusRes)?.following ?? false;
                    setProfile({ ...data, isFollowing: following });
                    // load posts for viewed profile
                    try {
                        setPostsLoading(true);
                        const postsRes = await profileService.getProfilePosts(viewUserId, 50);
                        const postsData = postsRes?.data ?? postsRes;
                        setPosts(postsData || []);
                    } catch (_) {
                        setPosts([]);
                    } finally {
                        setPostsLoading(false);
                    }
                } catch (_) {
                    setProfile({ ...data, isFollowing: false });
                }
            } else {
                setProfile(data);
                // load posts for own profile (owner id included in profile doc)
                try {
                    const ownerId = data?.owner || undefined;
                    if (ownerId) {
                        setPostsLoading(true);
                        const postsRes = await profileService.getProfilePosts(ownerId, 50);
                        const postsData = postsRes?.data ?? postsRes;
                        setPosts(postsData || []);
                    } else {
                        setPosts([]);
                    }
                } catch (_) {
                    setPosts([]);
                } finally {
                    setPostsLoading(false);
                }
            }
        } catch (err) {
            setError(err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [viewUserId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    /** Actualiza el perfil (upsert) y refresca el estado local. */
    const upsertProfile = useCallback(async (body) => {
        if (viewUserId) return Promise.reject(new Error('No se puede editar el perfil de otro usuario'));
        const res = await profileService.upsertProfile(body);
        const data = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, ...data } : data));
        return data;
    }, [viewUserId]);

    /** Sube foto de perfil y actualiza profilePhotoUrl en el estado. */
    const uploadProfilePhoto = useCallback(async (file) => {
        if (viewUserId) return Promise.reject(new Error('No se puede editar el perfil de otro usuario'));
        const formData = new FormData();
        formData.append('file', file);
        const res = await profileService.uploadProfilePhoto(formData);
        const url = res?.data?.url ?? res?.url;
        if (url) setProfile((prev) => (prev ? { ...prev, profilePhotoUrl: url } : { profilePhotoUrl: url }));
        return res;
    }, [viewUserId]);

    /** Sube foto de portada y actualiza coverPhotoUrl en el estado. */
    const uploadCoverPhoto = useCallback(async (file) => {
        if (viewUserId) return Promise.reject(new Error('No se puede editar el perfil de otro usuario'));
        const formData = new FormData();
        formData.append('file', file);
        const res = await profileService.uploadCoverPhoto(formData);
        const url = res?.data?.url ?? res?.url;
        if (url) setProfile((prev) => (prev ? { ...prev, coverPhotoUrl: url } : { coverPhotoUrl: url }));
        return res;
    }, [viewUserId]);

    /** Marca al usuario visto como seguido y actualiza contador. Solo cuando no es el propio perfil. */
    const follow = useCallback(async () => {
        if (!viewUserId) return Promise.reject(new Error('No hay usuario a seguir'));
        const res = await profileService.followUser(viewUserId);
        const payload = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, isFollowing: true, followersCount: payload?.followersCount ?? (prev.followersCount + 1) } : prev));
        return payload;
    }, [viewUserId]);

    /** Marca al usuario visto como no seguido y actualiza contador. Solo cuando no es el propio perfil. */
    const unfollow = useCallback(async () => {
        if (!viewUserId) return Promise.reject(new Error('No hay usuario a dejar de seguir'));
        const res = await profileService.unfollowUser(viewUserId);
        const payload = res?.data ?? res;
        setProfile((prev) => (prev ? { ...prev, isFollowing: false, followersCount: payload?.followersCount ?? Math.max(0, (prev.followersCount || 0) - 1) } : prev));
        return payload;
    }, [viewUserId]);

    const isOwnProfile = !viewUserId;

    return {
        profile,
        posts,
        postsLoading,
        loading,
        error,
        refetch: loadProfile,
        upsertProfile,
        uploadProfilePhoto,
        uploadCoverPhoto,
        follow,
        unfollow,
        isOwnProfile,
    };
}
