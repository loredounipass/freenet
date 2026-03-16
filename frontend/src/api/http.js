import axios from 'axios'
axios.defaults.withCredentials = true

const baseApi = 'http://localhost:4000/secure/api'
const apiBase = 'http://localhost:4000'

// Base origin for non-API assets (media). Derived from baseApi origin.
const apiOrigin = (() => {
    try { return new URL(baseApi).origin; } catch (_) { return 'http://localhost:4000'; }
})();
const mediaBase = `${apiOrigin}/uploads`;

// CSRF Token management - fetch token from server
async function fetchCsrfToken() {
    try {
        const response = await axios.get(`${apiBase}/csrf-token`, { withCredentials: true });
        if (response.data?.csrfToken) {
            return response.data.csrfToken;
        }
    } catch (err) {
        console.warn('Failed to fetch CSRF token:', err);
    }
    return null;
}

// Function to get CSRF token from cookie
function getCsrfTokenFromCookie() {
    try {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }
    } catch (_) {}
    return null;
}

// Initialize CSRF token on load
fetchCsrfToken().then(token => {
    if (token) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
});

// Axios interceptor to add CSRF token to every request
axios.interceptors.request.use((config) => {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    return config;
});

// Also refresh CSRF token on each page load
if (typeof window !== 'undefined') {
    window.addEventListener('focus', fetchCsrfToken);
}

// Endpoints usuario
const loginApi = `${baseApi}/user/login`
const logoutApi = `${baseApi}/user/logout`
const registerApi = `${baseApi}/user/register`
const userInfoApi = `${baseApi}/user/info`
const updateUserProfileApi = `${baseApi}/user/update-profile`
const changePasswordApi = `${baseApi}/user/change-password`;
const verifyTokenApi = `${baseApi}/user/verify-token`;
const updateTokenStatusApi = `${baseApi}/user/update-token-status`;
const tokenStatusApi = `${baseApi}/user/token-status`;
const resendTokenApi = `${baseApi}/user/resend-token`
const verifyEmailApi = `${baseApi}/user/verify-email`;
const sendVerificationEmailApi = `${baseApi}/user/send-verification-email`;
const isEmailVerifiedApi = `${baseApi}/user/is-email-verified`;
const forgotPasswordApi = `${baseApi}/user/forgot-password`;
const resetPasswordApi = `${baseApi}/user/reset-password`;



//endpoints de mensajes y multimedia
const messagesApi = `${baseApi}/messages`
const messagesUploadApi = `${baseApi}/messages/upload`
const myMessagesApi = `${baseApi}/messages/me`


// feed endpoints
const feedApi = `${baseApi}/feed`
const feedUploadApi = `${baseApi}/feed/upload`
const feedVideosApi = `${feedApi}/videos`


// builders for feed sub-resources
const feedCommentsApi = (postId) => `${feedApi}/${postId}/comments`
const feedLikesApi = (postId) => `${feedApi}/${postId}/likes`
const feedViewsApi = (postId) => `${feedApi}/${postId}/views`
const feedSharesApi = (postId) => `${feedApi}/${postId}/shares`
const feedPostApi = (postId) => `${feedApi}/${postId}`
const feedCommentByIdApi = (commentId) => `${feedApi}/comments/${commentId}`
const feedCommentLikesApi = (commentId) => `${feedApi}/comments/${commentId}/likes`


// profile endpoints
const profileApi = `${baseApi}/profile`
const profileMeApi = `${profileApi}/me`
const profileByIdApi = (id) => `${profileApi}/${id}`
const profileUploadProfilePhotoApi = `${profileApi}/upload/profile-photo`
const profileUploadCoverPhotoApi = `${profileApi}/upload/cover-photo`
const profileFollowStatusApi = (id) => `${profileApi}/${id}/follow-status`
const profileFollowApi = (id) => `${profileApi}/${id}/follow`
const profileUnfollowApi = (id) => `${profileApi}/${id}/unfollow`
const profilePostsApi = (id) => `${profileApi}/${id}/posts`


// endpoints de búsqueda de usuarios
const searchUsersApi = `${baseApi}/user/search`

// donations (wallets)
const donationsWalletsApi = `${baseApi}/donations/wallets`




async function get(url, body, config = {}) {
    return await axios.get(url, {
        params: body || {},
        ...config
    })
}

async function post(url, body) {
    return await axios.post(url, body)
}

async function postMultipart(url, formData, config = {}) {
    // Do NOT set Content-Type header manually for multipart/form-data.
    // Let the browser/axios set the correct Content-Type with boundary.
    return await axios.post(url, formData, { ...config })
}

async function patch(url, body) {
    return await axios.patch(url, body)
}

async function del(url, config = {}) {
    return await axios.delete(url, config)
}

// Convenience wrapper for global feed retrieval
async function getFeed(params = {}, config = {}) {
    return await get(feedApi, params, config)
}

// Convenience wrapper for video-only feed (GET /feed/videos)
async function getVideoFeed(params = {}, config = {}) {
    return await get(feedVideosApi, params, config)
}



async function getDonationsWallets() {
    return await get(donationsWalletsApi)
}

export {
    get,
    post,
    postMultipart,
    patch,
    del,
    getFeed,
    getVideoFeed,
    messagesApi,
    messagesUploadApi,
    myMessagesApi,
    feedApi,
    feedUploadApi,
    feedVideosApi,
    feedCommentsApi,
    feedLikesApi,
    feedViewsApi,
    feedPostApi,
    feedCommentByIdApi,
    feedCommentLikesApi,
    feedSharesApi,
    searchUsersApi,
    loginApi,
    logoutApi,
    registerApi,
    userInfoApi,
    verifyTokenApi,
    changePasswordApi,
    updateTokenStatusApi,
    tokenStatusApi,
    resendTokenApi,
    updateUserProfileApi,
    verifyEmailApi,
    sendVerificationEmailApi,
    isEmailVerifiedApi,
    forgotPasswordApi,
    resetPasswordApi,
    apiOrigin,
    mediaBase,
    profileApi,
    profileMeApi,
    profileByIdApi,
    profilePostsApi,
    profileUploadProfilePhotoApi,
    profileUploadCoverPhotoApi,
    profileFollowStatusApi,
    profileFollowApi,
    profileUnfollowApi,
    donationsWalletsApi,
    getDonationsWallets,
};