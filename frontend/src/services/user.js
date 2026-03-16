import {
    get,
    post,
    patch,
    registerApi,
    loginApi,
    logoutApi,
    userInfoApi,
    verifyTokenApi,
    changePasswordApi,
    updateTokenStatusApi,
    tokenStatusApi,
    resendTokenApi,
    updateUserProfileApi,
    sendVerificationEmailApi,
    verifyEmailApi,
    isEmailVerifiedApi,
    searchUsersApi,
} from '../api/http';

export default class User {
    static async register(body) {
        return await post(registerApi, body);
    }

    static async login(body) {
        return await post(loginApi, body);
    }

    static async verifyToken(body) {
        return await post(verifyTokenApi, body);
    }

    static async logout() {
        return await post(logoutApi, {});
    }

    static async getInfo() {
        return await get(userInfoApi, {});
    }

    static async getTokenStatus(config) {
        return await get(tokenStatusApi, {}, config);
    }

    static async changePassword(body) {
        return await post(changePasswordApi, body);
    }

    static async updateTokenStatus(body) { 
        // body should only contain { isTokenEnabled: boolean } - email comes from session
        return await patch(updateTokenStatusApi, body);
    }

    static async resendToken(email) {
        // Optional email parameter for 2FA flow - if not provided, uses session email
        const body = email ? { email } : {};
        return await post(resendTokenApi, body);
    }

    static async updateProfile(body) {
        return await post(updateUserProfileApi, body);
    }

    static async verifyEmail() {
        // No body needed - email comes from authenticated session
        return await post(verifyEmailApi, {});
    }

    static async sendVerificationEmail(body) {
        return await post(sendVerificationEmailApi, body);
    }

    static async isEmailVerified(body) {
        return await get(isEmailVerifiedApi, body);
    }

    static async searchUsers(query) {
        return await get(searchUsersApi, { q: query });
    }
}
