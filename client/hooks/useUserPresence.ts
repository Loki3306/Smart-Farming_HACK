import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

export type PresenceStatus = "online" | "offline" | "away";

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
      const response = await fetch(`/api/presence/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPresence(data as UserPresence);
      }
    } catch (error) {
      console.error("Failed to fetch presence:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update own presence status
  const updatePresence = useCallback(
    async (status: PresenceStatus) => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/presence`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, status }),
        });

        if (!response.ok) {
          console.error("Failed to update presence via API");
        } else {
          const data = await response.json();
          // Update local state
          setPresence({
            user_id: user.id,
            status,
            last_seen: data.last_seen || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          });
          
          // Also emit to socket for immediate broadcast
          getSocket().connect();
          if (status === "online") getSocket().emit("presence:online", user.id);
        }
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    },
    [user?.id],
  );

  // Send heartbeat to maintain online status
  const sendHeartbeat = useCallback(async () => {
    if (!user?.id) return;

    try {
      await fetch(`/api/presence/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id })
      });
      // Also socket heartbeat
      getSocket().emit("presence:heartbeat", user.id);
    } catch (error) {
      console.error("Failed to send heartbeat:", error);
    }
  }, [user?.id]);

  // Set user online when component mounts
  useEffect(() => {
    if (user?.id && !targetUserId) {
      updatePresence("online");

      // Start heartbeat interval (every 30 seconds for better responsiveness)
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat();
      }, 30000); // 30 seconds

      // Set offline on unmount or page unload
      const handleBeforeUnload = () => {
        // Synchronous update using fetch with keepalive
        const apiUrl = import.meta.env.VITE_API_URL || "/api";
        fetch(`${apiUrl}/presence`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            status: "offline"
          }),
          keepalive: true,
        }).catch(console.error);
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("pagehide", handleBeforeUnload);

      return () => {
        // Try to set offline on unmount
        updatePresence("offline");
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("pagehide", handleBeforeUnload);
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

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    
    // Fallback sync initial
    fetchPresence(targetUserId);

    const handler = (payload: any) => {
      if (payload.user_id === targetUserId) {
        setPresence((prev) => ({
            ...prev,
            user_id: targetUserId,
            status: payload.status,
            last_seen: payload.last_seen || prev?.last_seen || null,
            updated_at: new Date().toISOString()
        }));
      }
    };
    
    socket.on("presence:update", handler);

    return () => {
      socket.off("presence:update", handler);
    };
  }, [targetUserId]);

  // Handle visibility change (away when tab is hidden)
  useEffect(() => {
    if (!user?.id || targetUserId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence("away");
      } else {
        updatePresence("online");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, targetUserId, updatePresence]);

  return {
    presence,
    isLoading,
    updatePresence,
    // Consider offline if status is offline OR if last update was more than 2 minutes ago
    isOnline: presence
      ? presence.status === "online" &&
        new Date().getTime() - new Date(presence.updated_at).getTime() < 120000 // 2 minutes
      : false,
    isAway: presence?.status === "away",
    isOffline: presence
      ? presence.status === "offline" ||
        new Date().getTime() - new Date(presence.updated_at).getTime() >= 120000
      : true,
    lastSeen: presence?.last_seen,
  };
}

// Hook for bulk presence fetching (for conversation list)
export function useBulkPresence(userIds: string[]) {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userIds.length === 0) return;

    const fetchBulkPresence = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/presence/bulk?user_ids=${userIds.join(",")}`);

        if (response.ok) {
          const data = await response.json();
          if (data.presence) {
              const map = new Map<string, UserPresence>();
              data.presence.forEach((p: UserPresence) => {
                  map.set(p.user_id, p);
              });
              setPresenceMap(map);
          }
        }
      } catch (error) {
        console.error("Failed to fetch bulk presence:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBulkPresence();
  }, [userIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to updates for all users - OPTIMIZED: Single channel instead of one per user
  useEffect(() => {
    if (userIds.length === 0) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handler = (payload: any) => {
        if (userIds.includes(payload.user_id)) {
            setPresenceMap((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(payload.user_id);
                newMap.set(payload.user_id, {
                    user_id: payload.user_id,
                    status: payload.status,
                    last_seen: payload.last_seen || existing?.last_seen || null,
                    updated_at: new Date().toISOString()
                });
                return newMap;
            });
        }
    };

    socket.on("presence:update", handler);

    return () => {
      socket.off("presence:update", handler);
    };
  }, [userIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPresence = useCallback(
    (userId: string) => {
      return (
        presenceMap.get(userId) || {
          user_id: userId,
          status: "offline" as PresenceStatus,
          last_seen: null,
          updated_at: new Date().toISOString(),
        }
      );
    },
    [presenceMap],
  );

  return {
    presenceMap,
    getPresence,
    isLoading,
  };
}
