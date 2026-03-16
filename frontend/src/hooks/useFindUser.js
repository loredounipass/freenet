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
        } catch (err) { 
            console.error('Error enriching user with profile:', err);
        }
        return user;
    }, []);

    useEffect(() => {
        let cancelled = false;
        
        async function findUser() {
            try {
                const { data } = await User.getInfo();
                if (cancelled) return;
                
                if (data && 'data' in data) {
                    const user = data.data;
                    const enriched = await enrichWithProfile(user);
                    if (!cancelled) {
                        setAuth(enriched);
                    }
                }
            } catch (err) { 
                console.error('Error finding user:', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        findUser();
        
        return () => { cancelled = true; };
    }, [enrichWithProfile]);

    return {
        auth,
        loading,
        setAuth,
    };
}
