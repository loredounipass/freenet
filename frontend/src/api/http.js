import axios from 'axios'
axios.defaults.withCredentials = true

const baseApi = 'https://9rwc5lt0-4000.use2.devtunnels.ms/secure/api'

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




async function get(url, body, config = {}) {
    return await axios.get(url, {
        params: body || {},
        ...config
    })
}

async function post(url, body) {
    return await axios.post(url, body)
}

async function patch(url, body) {
    return await axios.patch(url, body)
}

export {
    get,
    post,
    patch,
    messagesApi,
    messagesUploadApi,
    myMessagesApi,
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
};