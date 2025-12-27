import { motion } from 'framer-motion';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
  showAvatar?: boolean;
  senderName?: string;
}

export function MessageBubble({ 
  message, 
  isOwn, 
  onDelete,
  showAvatar = false,
  senderName 
}: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // System message (like "Conversation shifted to WhatsApp")
  if (message.message_type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-4"
      >
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 max-w-[80%]">
          <p className="text-xs text-muted-foreground text-center italic">
            {message.content}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-2 group',
        isOwn && 'flex-row-reverse'
      )}
      style={{ marginBottom: '4px' }}
    >
      {showAvatar && !isOwn && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">
            {senderName?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
      )}

      <div className={cn(
        'flex flex-col max-w-[65%]',
        isOwn ? 'items-end ml-auto' : 'items-start mr-auto'
      )}>
        {showAvatar && !isOwn && senderName && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {senderName}
          </span>
        )}

        <div className={cn(
          'relative rounded-2xl px-4 py-2',
          isOwn 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-gray-100 dark:bg-gray-800'
        )}>
          {message.image_url && (
            <div className="mb-2">
              <img 
                src={message.image_url} 
                alt="Message attachment" 
                className="rounded-lg max-w-full h-auto"
                loading="lazy"
              />
            </div>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {isOwn && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6',
                    isOwn && 'text-primary-foreground hover:bg-primary-foreground/20'
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-destructive"
                >
                  Delete Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className={cn(
          'flex items-center gap-1 mt-1 px-2',
          isOwn && 'flex-row-reverse'
        )}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          
          {isOwn && (
            <span className="text-xs">
              {message.read ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
