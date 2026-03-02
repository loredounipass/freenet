import { useState, useEffect, useCallback } from 'react';
import User from '../services/user';
import * as profileService from '../services/profile';

export default function useFindUser() {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    // Enrich the auth object with profilePhotoUrl from the profile document
    const enrichWithProfile = useCallback(async (user) => {
        if (!user) return user;
        try {
            const res = await profileService.getMyProfile();
            const profileData = res?.data ?? res;
            if (profileData?.profilePhotoUrl) {
                return { ...user, profilePhotoUrl: profileData.profilePhotoUrl };
            }
        } catch (_) { /* ignore — profile may not exist yet */ }
        return user;
    }, []);

    useEffect(() => {
        async function findUser() {
            try {
                const { data } = await User.getInfo();
                if (data && 'data' in data) {
                    const user = data.data;
                    const enriched = await enrichWithProfile(user);
                    setAuth(enriched);
                }
            } catch (_) { }
            setLoading(false);
        }
        findUser();
    }, [enrichWithProfile]);

    return {
        auth,
        loading,
        setAuth,
    };
}
