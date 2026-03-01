import {
    get,
    post,
    postMultipart,
    profileMeApi,
    profileByIdApi,
    profileApi,
    profileUploadProfilePhotoApi,
    profileUploadCoverPhotoApi,
    profileFollowStatusApi,
    profileFollowApi,
    profileUnfollowApi,
} from '../api/http';

/**
 * Obtiene el perfil del usuario autenticado.
 */
export async function getMyProfile() {
    return await get(profileMeApi, {});
}

/**
 * Obtiene un perfil público por ID de usuario (owner).
 */
export async function getProfileById(userId) {
    return await get(profileByIdApi(userId), {});
}

/**
 * Crea o actualiza el perfil del usuario autenticado.
 * @param {Object} body - { firstName?, lastName?, links?, gender?, relationshipStatus?, interests?, bio?, likes? }
 */
export async function upsertProfile(body) {
    return await post(profileApi, body);
}

/**
 * Sube la foto de perfil (multipart/form-data con campo 'file').
 */
export async function uploadProfilePhoto(formData) {
    return await postMultipart(profileUploadProfilePhotoApi, formData);
}

/**
 * Sube la foto de portada (multipart/form-data con campo 'file').
 */
export async function uploadCoverPhoto(formData) {
    return await postMultipart(profileUploadCoverPhotoApi, formData);
}

/**
 * Obtiene si el usuario autenticado sigue al perfil con userId. Requiere sesión.
 */
export async function getFollowStatus(userId) {
    return await get(profileFollowStatusApi(userId), {});
}

/**
 * Sigue al usuario con userId. Requiere sesión.
 */
export async function followUser(userId) {
    return await post(profileFollowApi(userId), {});
}

/**
 * Deja de seguir al usuario con userId. Requiere sesión.
 */
export async function unfollowUser(userId) {
    return await post(profileUnfollowApi(userId), {});
}
