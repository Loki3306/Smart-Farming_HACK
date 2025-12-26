import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Conversation } from '@/services/chatService';
import { OnlineStatus } from './OnlineStatus';
import { useUserPresence } from '@/hooks/useUserPresence';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { presence } = useUserPresence(conversation.other_user?.id);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / 3600000;

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
        isActive 
          ? 'bg-muted border border-border' 
          : 'hover:bg-muted/50',
        'focus:outline-none focus:ring-2 focus:ring-primary/50'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg font-semibold text-primary">
            {conversation.other_user?.name?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineStatus status={presence?.status || 'offline'} size="sm" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <h4 className={cn(
            'font-semibold text-sm truncate',
            conversation.unread_count && conversation.unread_count > 0 && 'font-bold'
          )}>
            {conversation.other_user?.name || 'Unknown User'}
          </h4>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className={cn(
            'text-sm truncate',
            conversation.unread_count && conversation.unread_count > 0 
              ? 'font-semibold text-foreground' 
              : 'text-muted-foreground'
          )}>
            {conversation.last_message_preview || 'No messages yet'}
          </p>

          {conversation.unread_count && conversation.unread_count > 0 && (
            <span className="shrink-0 ml-2 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
