import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PresenceStatus } from '@/hooks/useUserPresence';

interface OnlineStatusProps {
  status: PresenceStatus;
  lastSeen?: string | null;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineStatus({ 
  status, 
  lastSeen, 
  showText = false, 
  size = 'md',
  className 
}: OnlineStatusProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const statusConfig = {
    online: {
      color: 'text-green-500',
      bg: 'bg-green-500',
      label: 'Online',
    },
    away: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500',
      label: 'Away',
    },
    offline: {
      color: 'text-gray-400',
      bg: 'bg-gray-400',
      label: 'Offline',
    },
  };

  const config = statusConfig[status];

  const formatLastSeen = () => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Circle 
        className={cn(
          sizeClasses[size], 
          config.color,
          status === 'online' && 'fill-current animate-pulse'
        )} 
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {status === 'offline' && lastSeen ? formatLastSeen() : config.label}
        </span>
      )}
    </div>
  );
}
