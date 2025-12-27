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
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
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
      console.log('Setting call context:', { callId, userId: user!.id, otherUserId });
      callService.setCallContext(callId, user!.id, otherUserId);
      
      // Get user media
      console.log('Requesting user media for:', callType);
      const localStream = await callService.getUserMedia(callType);
      console.log('Got local stream:', localStream);
      console.log('Local audio tracks:', localStream.getAudioTracks());
      
      // Set local video
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = localStream;
      }

      // Create peer connection
      const peerConnection = callService.createPeerConnection((remoteStream) => {
        console.log('Remote stream received:', remoteStream);
        console.log('Audio tracks:', remoteStream.getAudioTracks());
        
        if (callType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(e => console.error('Video play error:', e));
        } else if (callType === 'voice' && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(e => console.error('Audio play error:', e));
        }
        setHasRemoteStream(true);
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
      alert('Failed to initialize call: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setCallStatus('failed');
      // Notify parent to close the call window
      setTimeout(() => {
        onEnd();
      }, 2000);
    }
  };

  const handleSignal = async (signal: any) => {
    console.log('Received signal:', signal.signal_type, signal);
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
          console.log('End signal received, closing call window');
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
    console.log('Ending call...');
    cleanup();
    await callService.endCall();
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ marginLeft: '400px' }}>
      {/* Header */}
      <div className="p-3 sm:p-6 pt-safe text-white flex-shrink-0">
        <h2 className="text-lg sm:text-2xl font-bold truncate">{otherUserName}</h2>
        <p className="text-xs sm:text-lg text-gray-300 mt-0.5 sm:mt-1">
          {callStatus === 'ringing' && 'Calling...'}
          {callStatus === 'accepted' && formatDuration(duration)}
          {callStatus === 'failed' && 'Call Failed'}
        </p>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Hidden Audio Element for Voice Calls */}
        {callType === 'voice' && (
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            controls={false}
            style={{ display: 'none' }}
            volume={1.0}
          />
        )}

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
          <div className="absolute top-2 right-2 w-20 h-28 sm:top-4 sm:right-4 sm:w-36 sm:h-48 md:w-40 md:h-52 bg-gray-800 rounded-md sm:rounded-lg overflow-hidden shadow-lg border border-gray-700">
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
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <VideoOff className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Voice Call Avatar */}
        {callType === 'voice' && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center px-4 w-full max-w-md">
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-4 ring-primary/30">
                <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary">
                  {otherUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white truncate px-4">{otherUserName}</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                {callStatus === 'accepted' ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 sm:p-6 md:p-8 pb-safe pb-5 sm:pb-8 flex items-center justify-center gap-3 sm:gap-5 md:gap-6 flex-shrink-0 bg-gradient-to-t from-black/80 to-transparent">
        {/* Mute Button */}
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="icon"
          className="h-14 w-14 sm:h-16 sm:w-16 md:h-14 md:w-14 rounded-full shadow-lg active:scale-95 transition-transform"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-6 w-6 sm:h-7 sm:w-7" /> : <Mic className="h-6 w-6 sm:h-7 sm:w-7" />}
        </Button>

        {/* Video Toggle (only for video calls) */}
        {callType === 'video' && (
          <Button
            variant={isVideoOff ? 'destructive' : 'secondary'}
            size="icon"
            className="h-14 w-14 sm:h-16 sm:w-16 md:h-14 md:w-14 rounded-full shadow-lg active:scale-95 transition-transform"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6 sm:h-7 sm:w-7" /> : <Video className="h-6 w-6 sm:h-7 sm:w-7" />}
          </Button>
        )}

        {/* End Call Button */}
        <Button
          variant="destructive"
          size="icon"
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-16 md:w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg active:scale-95 transition-transform"
          onClick={handleEndCall}
        >
          <PhoneOff className="h-7 w-7 sm:h-9 sm:w-9" />
        </Button>
      </div>
    </div>
  );
}
