import { ArrowLeft, Phone, Video, MoreVertical, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnlineStatus } from './OnlineStatus';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  userName: string;
  userId: string;
  conversationId?: string;
  onBack: () => void;
  onClose?: () => void;
  onViewProfile?: () => void;
  onBlock?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onWhatsApp?: () => void;
}

export function ChatHeader({ 
  userName, 
  userId,
  conversationId,
  onBack,
  onClose,
  onViewProfile,
  onBlock,
  onVoiceCall,
  onVideoCall,
  onWhatsApp,
}: ChatHeaderProps) {
  const { presence, isOnline, lastSeen } = useUserPresence(userId);
  const [, forceUpdate] = useState(0);

  // Force re-render every 10 seconds to update presence status
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineStatus status={presence?.status || 'offline'} size="sm" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-none mb-1">{userName}</h3>
          {isOnline ? (
            <p className="text-xs text-green-600 dark:text-green-400">Online</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden sm:flex"
          onClick={onVoiceCall}
          disabled={!onVoiceCall}
          title="Voice Call"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden sm:flex"
          onClick={onVideoCall}
          disabled={!onVideoCall}
          title="Video Call"
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden sm:flex"
          onClick={onWhatsApp}
          disabled={!onWhatsApp}
          title="Continue on WhatsApp"
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewProfile && (
              <DropdownMenuItem onClick={onViewProfile}>
                View Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
            {onBlock && (
              <DropdownMenuItem onClick={onBlock} className="text-destructive">
                Block User
              </DropdownMenuItem>
            )}
            {onClose && (
              <DropdownMenuItem onClick={onClose}>
                Close Chat
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function formatLastSeen(lastSeen: string): string {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
