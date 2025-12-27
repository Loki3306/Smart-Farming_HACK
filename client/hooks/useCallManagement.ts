import { useState, useEffect, useCallback } from 'react';
import { callService, CallType, Call } from '@/services/callService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useCallManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`incoming-calls:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as Call;
          if (call.status === 'ringing') {
            setIncomingCall(call);
            
            // TODO: Add ringtone audio file to /public/ringtone.mp3
            // const audio = new Audio('/ringtone.mp3');
            // audio.loop = true;
            // audio.play().catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
          callType
        );

        // Fetch call details
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .eq('id', callId)
          .single();

        if (error) throw error;

        setActiveCall(data as Call);
        setIsInCall(true);

        toast({
          title: 'Calling...',
          description: `Initiating ${callType} call`,
        });
      } catch (error) {
        console.error('Failed to initiate call:', error);
        toast({
          title: 'Call Failed',
          description: 'Could not initiate the call',
          variant: 'destructive',
        });
      }
    },
    [user?.id, toast]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user?.id) return;

    try {
      // Update call status in database
      const { error } = await supabase.rpc('update_call_status', {
        p_call_id: incomingCall.id,
        p_status: 'accepted',
      });

      if (error) throw error;
      
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setIsInCall(true);
    } catch (error) {
      console.error('Failed to accept call:', error);
      toast({
        title: 'Error',
        description: 'Could not accept the call',
        variant: 'destructive',
      });
    }
  }, [incomingCall, user?.id, toast]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const { error } = await supabase.rpc('update_call_status', {
        p_call_id: incomingCall.id,
        p_status: 'rejected',
      });

      if (error) throw error;

      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  }, [incomingCall]);

  // End active call
  const endCall = useCallback(async () => {
    console.log('useCallManagement.endCall() called');
    await callService.endCall();
    console.log('Setting activeCall to null');
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
