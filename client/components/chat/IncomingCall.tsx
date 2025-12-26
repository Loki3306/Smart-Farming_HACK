import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallType } from '@/services/callService';
import { motion } from 'framer-motion';

interface IncomingCallProps {
  callerName: string;
  callType: CallType;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCall({
  callerName,
  callType,
  onAccept,
  onReject,
}: IncomingCallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-background rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 ring-4 ring-primary/30 animate-pulse">
            <span className="text-4xl font-bold text-primary">
              {callerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{callerName}</h2>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            {callType === 'video' ? (
              <>
                <Video className="h-4 w-4" />
                Video Call
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                Voice Call
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="destructive"
            size="lg"
            className="flex-1 rounded-full h-14"
            onClick={onReject}
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            Decline
          </Button>
          <Button
            variant="default"
            size="lg"
            className="flex-1 rounded-full h-14 bg-green-500 hover:bg-green-600"
            onClick={onAccept}
          >
            <Phone className="h-5 w-5 mr-2" />
            Accept
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
