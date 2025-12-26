import { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { callService, CallType, CallStatus } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';

interface CallWindowProps {
  callId: string;
  callType: CallType;
  isCaller: boolean;
  otherUserId: string;
  otherUserName: string;
  onEnd: () => void;
}

export function CallWindow({
  callId,
  callType,
  isCaller,
  otherUserId,
  otherUserName,
  onEnd,
}: CallWindowProps) {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>(isCaller ? 'ringing' : 'initiated');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Set call context for signaling
      callService.setCallContext(callId, user!.id, otherUserId);
      
      // Get user media
      const localStream = await callService.getUserMedia(callType);
      
      // Set local video
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = localStream;
      }

      // Create peer connection
      const peerConnection = callService.createPeerConnection((remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      // Subscribe to signaling
      const unsubscribe = callService.subscribeToSignaling(
        callId,
        user!.id,
        handleSignal
      );

      // If caller, create and send offer
      if (isCaller) {
        await callService.createOffer(otherUserId);
      }

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize call:', error);
      setCallStatus('failed');
    }
  };

  const handleSignal = async (signal: any) => {
    try {
      switch (signal.signal_type) {
        case 'offer':
          await callService.handleOffer(signal.signal_data);
          await callService.createAnswer(signal.sender_id);
          setCallStatus('accepted');
          startDurationTimer();
          break;

        case 'answer':
          await callService.handleAnswer(signal.signal_data);
          setCallStatus('accepted');
          startDurationTimer();
          break;

        case 'ice_candidate':
          await callService.handleIceCandidate(signal.signal_data.candidate);
          break;

        case 'end':
          handleEndCall();
          break;
      }
    } catch (error) {
      console.error('Failed to handle signal:', error);
    }
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    const localStream = callService.getLocalStream();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const localStream = callService.getLocalStream();
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = async () => {
    await callService.endCall();
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="p-6 text-white">
        <h2 className="text-2xl font-bold">{otherUserName}</h2>
        <p className="text-lg text-gray-300">
          {callStatus === 'ringing' && 'Calling...'}
          {callStatus === 'accepted' && formatDuration(duration)}
          {callStatus === 'failed' && 'Call Failed'}
        </p>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) */}
        {callType === 'video' && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* Local Video (Picture-in-Picture) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-40 h-30 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'w-full h-full object-cover',
                isVideoOff && 'hidden'
              )}
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Voice Call Avatar */}
        {callType === 'voice' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl font-bold text-primary">
                  {otherUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-white">{otherUserName}</h3>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 flex items-center justify-center gap-6">
        {/* Mute Button */}
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        {/* Video Toggle (only for video calls) */}
        {callType === 'video' && (
          <Button
            variant={isVideoOff ? 'destructive' : 'secondary'}
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>
        )}

        {/* End Call Button */}
        <Button
          variant="destructive"
          size="icon"
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
          onClick={handleEndCall}
        >
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
