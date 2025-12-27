import { supabase } from '@/lib/supabase';

// WebRTC configuration with STUN/TURN servers
const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
    // Add TURN servers for better connectivity (optional, requires setup)
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ],
};

export type CallType = 'voice' | 'video';
export type CallStatus = 'initiated' | 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended' | 'failed';

export interface Call {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: CallStatus;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface SignalingMessage {
  id: string;
  call_id: string;
  sender_id: string;
  receiver_id: string;
  signal_type: 'offer' | 'answer' | 'ice_candidate' | 'end';
  signal_data: any;
  created_at: string;
}

export class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private signalingChannel: any = null;
  private userId: string | null = null;
  private receiverId: string | null = null;

  // Set user ID and call ID (for receiving calls)
  setCallContext(callId: string, userId: string, receiverId: string): void {
    this.currentCallId = callId;
    this.userId = userId;
    this.receiverId = receiverId;
  }

  // Initialize a call
  async initiateCall(
    conversationId: string,
    callerId: string,
    receiverId: string,
    callType: CallType
  ): Promise<string> {
    try {
      // Store user ID and receiver ID for signaling
      this.userId = callerId;
      this.receiverId = receiverId;
      
      // Create call record
      const { data, error } = await supabase.rpc('create_call', {
        p_conversation_id: conversationId,
        p_caller_id: callerId,
        p_receiver_id: receiverId,
        p_call_type: callType,
      });

      if (error) throw error;
      
      this.currentCallId = data;
      return data;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      throw error;
    }
  }

  // Get user media (microphone/camera)
  async getUserMedia(callType: CallType): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  // Create peer connection
  createPeerConnection(onRemoteStream: (stream: MediaStream) => void): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection(rtcConfiguration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        onRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallId && this.receiverId) {
        this.sendSignal('ice_candidate', {
          candidate: event.candidate.toJSON(),
        }, this.receiverId);
      }
    };

    // Handle connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      
      if (this.peerConnection?.connectionState === 'failed') {
        this.updateCallStatus('failed');
        this.endCall();
      }
    };

    return this.peerConnection;
  }

  // Create and send offer
  async createOffer(receiverId: string): Promise<void> {
    if (!this.peerConnection || !this.currentCallId) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      await this.sendSignal('offer', {
        sdp: offer.sdp,
        type: offer.type,
      }, receiverId);
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  // Create and send answer
  async createAnswer(senderId: string): Promise<void> {
    if (!this.peerConnection || !this.currentCallId) return;

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await this.sendSignal('answer', {
        sdp: answer.sdp,
        type: answer.type,
      }, senderId);
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  // Handle received offer
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    } catch (error) {
      console.error('Failed to handle offer:', error);
      throw error;
    }
  }

  // Handle received answer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  // Send signaling message
  private async sendSignal(
    signalType: 'offer' | 'answer' | 'ice_candidate' | 'end',
    signalData: any,
    receiverId?: string
  ): Promise<void> {
    if (!this.currentCallId || !this.userId) return;

    try {
      const { error } = await supabase.from('call_signaling').insert({
        call_id: this.currentCallId,
        sender_id: this.userId,
        receiver_id: receiverId,
        signal_type: signalType,
        signal_data: signalData,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send signal:', error);
      throw error;
    }
  }

  // Subscribe to signaling messages
  subscribeToSignaling(
    callId: string,
    userId: string,
    onSignal: (signal: SignalingMessage) => void
  ): () => void {
    const channel = supabase
      .channel(`call-signaling:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signaling',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          onSignal(payload.new as SignalingMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Update call status
  async updateCallStatus(status: CallStatus): Promise<void> {
    if (!this.currentCallId) return;

    try {
      const { error } = await supabase.rpc('update_call_status', {
        p_call_id: this.currentCallId,
        p_status: status,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update call status:', error);
    }
  }

  // End call and cleanup
  async endCall(): Promise<void> {
    console.log('endCall() called, sending end signal to:', this.receiverId);
    
    // Send end signal to other party
    if (this.currentCallId && this.receiverId) {
      try {
        console.log('Sending end signal for call:', this.currentCallId);
        await this.sendSignal('end', {}, this.receiverId);
        console.log('End signal sent successfully');
      } catch (error) {
        console.error('Failed to send end signal:', error);
      }
    } else {
      console.log('Cannot send end signal - missing callId or receiverId', {
        callId: this.currentCallId,
        receiverId: this.receiverId
      });
    }

    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Update call status
    if (this.currentCallId) {
      await this.updateCallStatus('ended');
      this.currentCallId = null;
    }

    this.remoteStream = null;
    this.userId = null;
    this.receiverId = null;
  }

  // Get current call
  getCurrentCall(): string | null {
    return this.currentCallId;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

// Singleton instance
export const callService = new CallService();
