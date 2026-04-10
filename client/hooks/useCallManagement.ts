import { useState, useEffect, useCallback } from "react";
import { callService, CallType, Call } from "@/services/callService";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useCallManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit("calls:subscribe", user.id);

    const handleIncoming = (call: Call) => {
        if (call.status === "ringing") {
            setIncomingCall(call);
        }
    };

    socket.on("call:incoming", handleIncoming);

    return () => {
      socket.off("call:incoming", handleIncoming);
    };
  }, [user?.id]);

  // Initiate a call
  const initiateCall = useCallback(
    async (conversationId: string, receiverId: string, callType: CallType) => {
      if (!user?.id) return;

      try {
        const callId = await callService.initiateCall(
          conversationId,
          user.id,
          receiverId,
          callType,
        );

        // Fetch call details
        const response = await fetch(`/api/chat/calls/${callId}`);
        if (!response.ok) throw new Error("Failed to fetch call details");
        const data = await response.json();

        setActiveCall(data as Call);
        setIsInCall(true);

        toast({
          title: "Calling...",
          description: `Initiating ${callType} call`,
        });
      } catch (error) {
        console.error("Failed to initiate call:", error);
        toast({
          title: "Call Failed",
          description: "Could not initiate the call",
          variant: "destructive",
        });
      }
    },
    [user?.id, toast],
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user?.id) return;

    try {
      // Update call status in database via API
      const response = await fetch(`/api/chat/calls/${incomingCall.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" })
      });

      if (!response.ok) throw new Error("Failed to update status");

      setActiveCall(incomingCall);
      setIncomingCall(null);
      setIsInCall(true);
    } catch (error) {
      console.error("Failed to accept call:", error);
      toast({
        title: "Error",
        description: "Could not accept the call",
        variant: "destructive",
      });
    }
  }, [incomingCall, user?.id, toast]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const response = await fetch(`/api/chat/calls/${incomingCall.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" })
      });

      if (!response.ok) throw new Error("Failed to update status");

      setIncomingCall(null);
    } catch (error) {
      console.error("Failed to reject call:", error);
    }
  }, [incomingCall]);

  // End active call
  const endCall = useCallback(async () => {
    console.log("useCallManagement.endCall() called");
    await callService.endCall();
    console.log("Setting activeCall to null");
    setActiveCall(null);
    setIsInCall(false);
  }, []);

  return {
    activeCall,
    incomingCall,
    isInCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
