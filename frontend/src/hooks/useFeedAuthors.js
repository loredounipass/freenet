import { useEffect, useState, useRef } from 'react';
import * as profileService from '../services/profile';

export function useFeedAuthors(postList) {
  const [authorsCache, setAuthorsCache] = useState({});
  const [followStatusCache, setFollowStatusCache] = useState({});
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const authorIds = [...new Set(
    (postList || [])
      .map(p => p?.author)
      .filter(Boolean)
  )];

  useEffect(() => {
    if (!authorIds.length || fetchedRef.current) {
      return;
    }

    fetchedRef.current = true;
    setLoading(true);

    const fetchAll = async () => {
      const newAuthors = {};
      const newStatus = {};

      try {
        await Promise.all(
          authorIds.map(async (id) => {
            try {
              const [profileRes, statusRes] = await Promise.all([
                profileService.getProfileById(id),
                profileService.getFollowStatus(id)
              ]);
              newAuthors[id] = profileRes?.data ?? profileRes;
              newStatus[id] = statusRes?.data ?? statusRes;
            } catch (err) {
              console.error(`[useFeedAuthors] Error fetching author ${id}:`, err);
              newAuthors[id] = null;
              newStatus[id] = { following: false };
            }
          })
        );

        setAuthorsCache(prev => ({ ...prev, ...newAuthors }));
        setFollowStatusCache(prev => ({ ...prev, ...newStatus }));
      } catch (err) {
        console.error('[useFeedAuthors] Error fetching authors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    return () => {
      fetchedRef.current = false;
    };
  }, [authorIds.join(',')]);

  return { 
    authorsCache, 
    followStatusCache, 
    loading 
  };
}

export default useFeedAuthors;
