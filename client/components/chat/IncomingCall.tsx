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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div 
        className="bg-background rounded-xl shadow-2xl"
        style={{ 
          width: '85%',
          maxWidth: '300px',
          padding: '16px',
          marginLeft: '400px'
        }}
      >
        {/* Caller Info */}
        <div className="text-center" style={{ marginBottom: '16px' }}>
          <div 
            className="rounded-full bg-primary/20 animate-pulse"
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="text-2xl font-bold text-primary">
              {callerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-base font-bold truncate" style={{ marginBottom: '4px' }}>
            {callerName}
          </h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            {callType === 'video' ? (
              <>
                <Video className="h-3 w-3" />
                <span>Video Call</span>
              </>
            ) : (
              <>
                <Phone className="h-3 w-3" />
                <span>Voice Call</span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            className="flex-1 rounded-full"
            style={{ height: '40px', fontSize: '12px' }}
            onClick={onReject}
          >
            <PhoneOff className="h-4 w-4 mr-1" />
            <span>Decline</span>
          </Button>
          <Button
            className="flex-1 rounded-full bg-green-500 hover:bg-green-600"
            style={{ height: '40px', fontSize: '12px' }}
            onClick={onAccept}
          >
            <Phone className="h-4 w-4 mr-1" />
            <span>Accept</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
