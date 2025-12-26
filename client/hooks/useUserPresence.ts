import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type PresenceStatus = 'online' | 'offline' | 'away';

interface UserPresence {
  user_id: string;
  status: PresenceStatus;
  last_seen: string | null;
  updated_at: string;
}

export function useUserPresence(targetUserId?: string) {
  const { user } = useAuth();
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch presence for a specific user
  const fetchPresence = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch presence:', error);
      } else if (data) {
        setPresence(data as UserPresence);
      }
    } catch (error) {
      console.error('Failed to fetch presence:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update own presence status
  const updatePresence = useCallback(async (status: PresenceStatus) => {
    if (!user?.id) return;

    try {
      // Use Supabase directly for immediate update
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to update presence:', error);
      } else {
        // Update local state
        setPresence({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [user?.id]);

  // Send heartbeat to maintain online status
  const sendHeartbeat = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Use Supabase directly
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, [user?.id]);

  // Set user online when component mounts
  useEffect(() => {
    if (user?.id && !targetUserId) {
      updatePresence('online');

      // Start heartbeat interval (every 30 seconds for better responsiveness)
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat();
      }, 30000); // 30 seconds

      // Set offline on unmount or page unload
      const handleBeforeUnload = () => {
        // Use navigator.sendBeacon for reliable cleanup
        const blob = new Blob(
          [JSON.stringify({
            user_id: user.id,
            status: 'offline',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })],
          { type: 'application/json' }
        );
        
        // Synchronous update using fetch with keepalive
        fetch(`${supabase.supabaseUrl}/rest/v1/user_presence?user_id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            status: 'offline',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }),
          keepalive: true
        }).catch(console.error);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);

      return () => {
        // Try to set offline on unmount
        updatePresence('offline');
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
      };
    }
  }, [user?.id, targetUserId, updatePresence, sendHeartbeat]);

  // Fetch target user's presence
  useEffect(() => {
    if (targetUserId) {
      fetchPresence(targetUserId);
    }
  }, [targetUserId, fetchPresence]);

  // Subscribe to presence updates for target user
  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel(`presence:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${targetUserId}`,
        },
        (payload) => {
          setPresence(payload.new as UserPresence);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  // Handle visibility change (away when tab is hidden)
  useEffect(() => {
    if (!user?.id || targetUserId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, targetUserId, updatePresence]);

  return {
    presence,
    isLoading,
    updatePresence,
    // Consider offline if status is offline OR if last update was more than 2 minutes ago
    isOnline: presence ? (
      presence.status === 'online' && 
      (new Date().getTime() - new Date(presence.updated_at).getTime()) < 120000 // 2 minutes
    ) : false,
    isAway: presence?.status === 'away',
    isOffline: presence ? (
      presence.status === 'offline' || 
      (new Date().getTime() - new Date(presence.updated_at).getTime()) >= 120000
    ) : true,
    lastSeen: presence?.last_seen,
  };
}

// Hook for bulk presence fetching (for conversation list)
export function useBulkPresence(userIds: string[]) {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userIds.length === 0) return;

    const fetchBulkPresence = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_presence')
          .select('*')
          .in('user_id', userIds);
        
        if (error) {
          console.error('Failed to fetch bulk presence:', error);
        } else if (data) {
          const map = new Map<string, UserPresence>();
          data.forEach((p: UserPresence) => {
            map.set(p.user_id, p);
          });
          setPresenceMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch bulk presence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBulkPresence();
  }, [userIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to updates for all users
  useEffect(() => {
    if (userIds.length === 0) return;

    const channels = userIds.map((userId) => {
      const channel = supabase
        .channel(`bulk-presence:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setPresenceMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(userId, payload.new as UserPresence);
              return newMap;
            });
          }
        )
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [userIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPresence = useCallback((userId: string) => {
    return presenceMap.get(userId) || { user_id: userId, status: 'offline' as PresenceStatus, last_seen: null, updated_at: new Date().toISOString() };
  }, [presenceMap]);

  return {
    presenceMap,
    getPresence,
    isLoading,
  };
}
